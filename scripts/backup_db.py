#!/usr/bin/env python
"""
Database backup script for ShopOnline Uganda
Creates automated backups with compression and rotation
"""

import os
import sys
import subprocess
import datetime
import gzip
import shutil
import logging
from pathlib import Path
from typing import Optional, List
import boto3
from botocore.exceptions import ClientError

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shoponline.settings.production')
import django
django.setup()

from django.conf import settings
from django.core.management import call_command
from django.core.mail import send_mail

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/backup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseBackup:
    """Handle database backup operations"""
    
    def __init__(self):
        self.backup_dir = Path('backups')
        self.backup_dir.mkdir(exist_ok=True)
        
        # Database configuration
        self.db_config = settings.DATABASES['default']
        
        # Backup settings
        self.max_local_backups = getattr(settings, 'MAX_LOCAL_BACKUPS', 7)
        self.use_s3 = getattr(settings, 'BACKUP_TO_S3', False)
        self.s3_bucket = getattr(settings, 'AWS_BACKUP_BUCKET_NAME', None)
        
        # Create timestamp for backup
        self.timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        self.backup_filename = f'shoponline_backup_{self.timestamp}.sql'
        self.compressed_filename = f'{self.backup_filename}.gz'
        
    def create_backup(self) -> Optional[Path]:
        """Create database backup"""
        try:
            logger.info(f"Starting database backup: {self.backup_filename}")
            
            backup_path = self.backup_dir / self.backup_filename
            
            # Create pg_dump command
            cmd = [
                'pg_dump',
                '--host', self.db_config['HOST'],
                '--port', str(self.db_config['PORT']),
                '--username', self.db_config['USER'],
                '--dbname', self.db_config['NAME'],
                '--verbose',
                '--clean',
                '--no-owner',
                '--no-privileges',
                '--file', str(backup_path)
            ]
            
            # Set password via environment variable
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_config['PASSWORD']
            
            # Execute backup
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                check=True
            )
            
            if backup_path.exists():
                logger.info(f"Database backup created successfully: {backup_path}")
                return backup_path
            else:
                logger.error("Backup file was not created")
                return None
                
        except subprocess.CalledProcessError as e:
            logger.error(f"pg_dump failed: {e}")
            logger.error(f"stdout: {e.stdout}")
            logger.error(f"stderr: {e.stderr}")
            return None
        except Exception as e:
            logger.error(f"Backup creation failed: {e}")
            return None
    
    def compress_backup(self, backup_path: Path) -> Optional[Path]:
        """Compress backup file"""
        try:
            compressed_path = self.backup_dir / self.compressed_filename
            
            with open(backup_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remove uncompressed file
            backup_path.unlink()
            
            logger.info(f"Backup compressed: {compressed_path}")
            return compressed_path
            
        except Exception as e:
            logger.error(f"Compression failed: {e}")
            return None
    
    def upload_to_s3(self, backup_path: Path) -> bool:
        """Upload backup to S3"""
        if not self.use_s3 or not self.s3_bucket:
            return True
            
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
            )
            
            s3_key = f'database-backups/{backup_path.name}'
            
            s3_client.upload_file(
                str(backup_path),
                self.s3_bucket,
                s3_key,
                ExtraArgs={
                    'ServerSideEncryption': 'AES256',
                    'StorageClass': 'STANDARD_IA'
                }
            )
            
            logger.info(f"Backup uploaded to S3: s3://{self.s3_bucket}/{s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            return False
        except Exception as e:
            logger.error(f"S3 upload error: {e}")
            return False
    
    def cleanup_old_backups(self):
        """Remove old local backups"""
        try:
            # Get all backup files
            backup_files = list(self.backup_dir.glob('shoponline_backup_*.sql.gz'))
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # Remove old backups
            for backup_file in backup_files[self.max_local_backups:]:
                backup_file.unlink()
                logger.info(f"Removed old backup: {backup_file}")
                
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
    
    def cleanup_s3_backups(self, days_to_keep: int = 30):
        """Cleanup old S3 backups"""
        if not self.use_s3 or not self.s3_bucket:
            return
            
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
            )
            
            # List objects in backup folder
            response = s3_client.list_objects_v2(
                Bucket=self.s3_bucket,
                Prefix='database-backups/'
            )
            
            if 'Contents' not in response:
                return
            
            cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days_to_keep)
            
            objects_to_delete = []
            for obj in response['Contents']:
                if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                    objects_to_delete.append({'Key': obj['Key']})
            
            if objects_to_delete:
                s3_client.delete_objects(
                    Bucket=self.s3_bucket,
                    Delete={'Objects': objects_to_delete}
                )
                logger.info(f"Deleted {len(objects_to_delete)} old S3 backups")
                
        except Exception as e:
            logger.error(f"S3 cleanup failed: {e}")
    
    def send_notification(self, success: bool, backup_path: Optional[Path] = None):
        """Send backup notification email"""
        try:
            if success and backup_path:
                subject = f"✅ Database Backup Successful - {self.timestamp}"
                
                # Calculate file size
                file_size = backup_path.stat().st_size / (1024 * 1024)  # MB
                
                message = f"""
Database backup completed successfully!

Backup Details:
- Timestamp: {self.timestamp}
- Filename: {backup_path.name}
- File Size: {file_size:.2f} MB
- Location: {backup_path}
- S3 Upload: {'✅ Success' if self.use_s3 else '❌ Disabled'}

Backup Summary:
- Database: {self.db_config['NAME']}
- Host: {self.db_config['HOST']}
- Local Backups Retained: {self.max_local_backups}

This is an automated backup notification from ShopOnline Uganda.
                """
            else:
                subject = f"❌ Database Backup Failed - {self.timestamp}"
                message = f"""
Database backup failed!

Backup Details:
- Timestamp: {self.timestamp}
- Database: {self.db_config['NAME']}
- Host: {self.db_config['HOST']}

Please check the backup logs for more details and take immediate action.

This is an automated backup notification from ShopOnline Uganda.
                """
            
            # Send to admin emails
            admin_emails = [admin[1] for admin in settings.ADMINS]
            if admin_emails:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    admin_emails,
                    fail_silently=True
                )
                logger.info("Backup notification sent")
                
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
    
    def run_backup(self) -> bool:
        """Run complete backup process"""
        logger.info("=" * 50)
        logger.info("Starting ShopOnline Uganda Database Backup")
        logger.info("=" * 50)
        
        try:
            # Create backup
            backup_path = self.create_backup()
            if not backup_path:
                self.send_notification(False)
                return False
            
            # Compress backup
            compressed_path = self.compress_backup(backup_path)
            if not compressed_path:
                self.send_notification(False)
                return False
            
            # Upload to S3
            s3_success = self.upload_to_s3(compressed_path)
            
            # Cleanup old backups
            self.cleanup_old_backups()
            self.cleanup_s3_backups()
            
            # Send notification
            self.send_notification(True, compressed_path)
            
            logger.info("Backup process completed successfully")
            logger.info("=" * 50)
            
            return True
            
        except Exception as e:
            logger.error(f"Backup process failed: {e}")
            self.send_notification(False)
            return False

class MediaBackup:
    """Handle media files backup"""
    
    def __init__(self):
        self.media_root = Path(settings.MEDIA_ROOT)
        self.backup_dir = Path('backups/media')
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        self.timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        self.archive_name = f'media_backup_{self.timestamp}.tar.gz'
    
    def create_media_backup(self) -> Optional[Path]:
        """Create compressed archive of media files"""
        try:
            archive_path = self.backup_dir / self.archive_name
            
            cmd = [
                'tar',
                '-czf',
                str(archive_path),
                '-C',
                str(self.media_root.parent),
                self.media_root.name
            ]
            
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            if archive_path.exists():
                logger.info(f"Media backup created: {archive_path}")
                return archive_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Media backup failed: {e}")
        except Exception as e:
            logger.error(f"Media backup error: {e}")
        
        return None

def main():
    """Main backup function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='ShopOnline Uganda Database Backup')
    parser.add_argument('--media', action='store_true', help='Also backup media files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    args = parser.parse_args()
    
    if args.dry_run:
        logger.info("DRY RUN MODE - No actual backup will be performed")
        return
    
    # Database backup
    db_backup = DatabaseBackup()
    db_success = db_backup.run_backup()
    
    # Media backup (optional)
    media_success = True
    if args.media:
        logger.info("Starting media files backup...")
        media_backup = MediaBackup()
        media_path = media_backup.create_media_backup()
        media_success = media_path is not None
    
    # Exit with appropriate code
    if db_success and media_success:
        logger.info("All backups completed successfully")
        sys.exit(0)
    else:
        logger.error("Some backups failed")
        sys.exit(1)

if __name__ == '__main__':
    main()