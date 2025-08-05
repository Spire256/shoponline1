#!/usr/bin/env python
"""
Flash sales cleanup script for ShopOnline Uganda
Handles expired flash sales and related cleanup tasks
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shoponline.settings.production')
import django
django.setup()

from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import F

# Import models
from apps.flash_sales.models import FlashSale, FlashSaleProduct
from apps.products.models import Product
from apps.notifications.models import Notification, NotificationType, NotificationPriority
from apps.accounts.models import User

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/flash_sales_cleanup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FlashSalesCleanup:
    """Handle flash sales cleanup operations"""
    
    def __init__(self):
        self.current_time = timezone.now()
        self.cleanup_stats = {
            'expired_sales': 0,
            'activated_sales': 0,
            'deactivated_products': 0,
            'notifications_sent': 0,
            'errors': 0
        }
    
    def find_expired_sales(self) -> List[FlashSale]:
        """Find flash sales that have expired"""
        expired_sales = FlashSale.objects.filter(
            end_time__lte=self.current_time,
            is_active=True
        ).exclude(
            # Exclude sales that are already marked as expired by checking properties
            end_time__lt=self.current_time
        ).filter(
            # Only get truly active sales that need to be expired
            is_active=True
        )
        
        # Filter by those that are actually expired using the model property
        expired_list = [sale for sale in expired_sales if sale.is_expired and sale.is_active]
        
        logger.info(f"Found {len(expired_list)} expired flash sales")
        return expired_list
    
    def find_sales_to_activate(self) -> List[FlashSale]:
        """Find scheduled flash sales that should be activated"""
        sales_to_activate = FlashSale.objects.filter(
            start_time__lte=self.current_time,
            end_time__gt=self.current_time,
            is_active=True
        )
        
        # Filter by those that are upcoming and should be activated
        activate_list = [sale for sale in sales_to_activate if sale.is_upcoming or (not sale.is_running and not sale.is_expired)]
        
        logger.info(f"Found {len(activate_list)} flash sales to activate")
        return activate_list
    
    def find_sales_ending_soon(self, hours_ahead: int = 2) -> List[FlashSale]:
        """Find active flash sales ending within specified hours"""
        ending_time = self.current_time + timedelta(hours=hours_ahead)
        
        ending_soon = FlashSale.objects.filter(
            end_time__lte=ending_time,
            end_time__gt=self.current_time,
            is_active=True
        )
        
        # Filter by those that are currently running
        ending_list = [sale for sale in ending_soon if sale.is_running]
        
        logger.info(f"Found {len(ending_list)} flash sales ending within {hours_ahead} hours")
        return ending_list
    
    @transaction.atomic
    def expire_flash_sale(self, flash_sale: FlashSale) -> bool:
        """Expire a single flash sale"""
        try:
            logger.info(f"Expiring flash sale: {flash_sale.name} (ID: {flash_sale.id})")
            
            # Update flash sale status - just mark as inactive since model handles expiry via property
            flash_sale.is_active = False
            flash_sale.save()
            
            # Get all products in this flash sale and deactivate them
            flash_sale_products = FlashSaleProduct.objects.filter(flash_sale=flash_sale)
            product_count = flash_sale_products.count()
            
            # Deactivate flash sale products
            flash_sale_products.update(is_active=False)
            
            logger.info(f"Expired flash sale '{flash_sale.name}' affecting {product_count} products")
            
            self.cleanup_stats['expired_sales'] += 1
            self.cleanup_stats['deactivated_products'] += product_count
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to expire flash sale {flash_sale.id}: {e}")
            self.cleanup_stats['errors'] += 1
            return False
    
    @transaction.atomic
    def activate_flash_sale(self, flash_sale: FlashSale) -> bool:
        """Activate a scheduled flash sale"""
        try:
            logger.info(f"Activating flash sale: {flash_sale.name} (ID: {flash_sale.id})")
            
            # Flash sale should already be active, just ensure products are active
            flash_sale_products = FlashSaleProduct.objects.filter(flash_sale=flash_sale)
            flash_sale_products.update(is_active=True)
            
            product_count = flash_sale_products.count()
            
            logger.info(f"Activated flash sale '{flash_sale.name}' with {product_count} products")
            
            self.cleanup_stats['activated_sales'] += 1
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to activate flash sale {flash_sale.id}: {e}")
            self.cleanup_stats['errors'] += 1
            return False
    
    def send_expiry_notification(self, flash_sale: FlashSale):
        """Send notification when flash sale expires"""
        try:
            # Get admin users
            admin_users = User.objects.filter(
                role='admin',
                is_active=True
            )
            
            for admin in admin_users:
                Notification.objects.create(
                    recipient=admin,
                    title=f"Flash Sale Expired: {flash_sale.name}",
                    message=f"The flash sale '{flash_sale.name}' has expired and been automatically deactivated.",
                    notification_type=NotificationType.FLASH_SALE_ENDING,
                    priority=NotificationPriority.MEDIUM
                )
            
            self.cleanup_stats['notifications_sent'] += admin_users.count()
            logger.info(f"Sent expiry notifications to {admin_users.count()} admins")
            
        except Exception as e:
            logger.error(f"Failed to send expiry notification: {e}")
    
    def send_activation_notification(self, flash_sale: FlashSale):
        """Send notification when flash sale activates"""
        try:
            # Get admin users
            admin_users = User.objects.filter(
                role='admin',
                is_active=True
            )
            
            for admin in admin_users:
                Notification.objects.create(
                    recipient=admin,
                    title=f"Flash Sale Started: {flash_sale.name}",
                    message=f"The flash sale '{flash_sale.name}' has started and is now active.",
                    notification_type=NotificationType.FLASH_SALE_STARTED,
                    priority=NotificationPriority.HIGH
                )
            
            self.cleanup_stats['notifications_sent'] += admin_users.count()
            logger.info(f"Sent activation notifications to {admin_users.count()} admins")
            
        except Exception as e:
            logger.error(f"Failed to send activation notification: {e}")
    
    def send_ending_soon_notification(self, flash_sale: FlashSale):
        """Send notification for flash sales ending soon"""
        try:
            # Get admin users
            admin_users = User.objects.filter(
                role='admin',
                is_active=True
            )
            
            time_left = flash_sale.end_time - self.current_time
            hours_left = int(time_left.total_seconds() / 3600)
            
            for admin in admin_users:
                Notification.objects.create(
                    recipient=admin,
                    title=f"Flash Sale Ending Soon: {flash_sale.name}",
                    message=f"The flash sale '{flash_sale.name}' will end in approximately {hours_left} hours.",
                    notification_type=NotificationType.FLASH_SALE_ENDING,
                    priority=NotificationPriority.HIGH
                )
            
            self.cleanup_stats['notifications_sent'] += admin_users.count()
            logger.info(f"Sent ending soon notifications to {admin_users.count()} admins")
            
        except Exception as e:
            logger.error(f"Failed to send ending soon notification: {e}")
    
    def cleanup_old_ended_sales(self, days_old: int = 30):
        """Clean up old ended flash sales"""
        try:
            cutoff_date = self.current_time - timedelta(days=days_old)
            
            old_sales = FlashSale.objects.filter(
                end_time__lt=cutoff_date,
                is_active=True
            )
            
            # Filter by those that are actually expired
            old_expired_sales = [sale for sale in old_sales if sale.is_expired]
            
            if old_expired_sales:
                # Mark them as inactive instead of deleting
                for sale in old_expired_sales:
                    sale.is_active = False
                    sale.save()
                
                logger.info(f"Archived {len(old_expired_sales)} old flash sales (older than {days_old} days)")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old sales: {e}")
    
    def validate_flash_sale_integrity(self):
        """Validate flash sale data integrity"""
        try:
            logger.info("Validating flash sale data integrity...")
            
            # Check for flash sales with invalid date ranges
            invalid_dates = FlashSale.objects.filter(
                start_time__gte=F('end_time')
            )
            
            if invalid_dates.exists():
                logger.warning(f"Found {invalid_dates.count()} flash sales with invalid date ranges")
                # Disable these sales
                invalid_dates.update(is_active=False)
                
            # Check for flash sale products without products
            orphaned_products = FlashSaleProduct.objects.filter(product__isnull=True)
            if orphaned_products.exists():
                count = orphaned_products.count()
                orphaned_products.delete()
                logger.info(f"Removed {count} orphaned flash sale products")
            
            # Check for products with negative flash sale prices
            invalid_prices = FlashSaleProduct.objects.filter(flash_sale_price__lt=0)
            if invalid_prices.exists():
                logger.warning(f"Found {invalid_prices.count()} products with invalid flash sale prices")
                # Recalculate prices
                for fsp in invalid_prices:
                    fsp.flash_sale_price = fsp.calculate_flash_sale_price()
                    fsp.save()
            
            # Check for products where original price doesn't match current product price
            mismatched_prices = FlashSaleProduct.objects.select_related('product').filter(
                is_active=True
            )
            
            for fsp in mismatched_prices:
                if fsp.original_price != fsp.product.price:
                    logger.info(f"Updating original price for product {fsp.product.name} in flash sale {fsp.flash_sale.name}")
                    fsp.original_price = fsp.product.price
                    fsp.flash_sale_price = fsp.calculate_flash_sale_price()
                    fsp.save()
            
            logger.info("Flash sale integrity validation completed")
            
        except Exception as e:
            logger.error(f"Integrity validation failed: {e}")
    
    def generate_cleanup_report(self) -> Dict[str, Any]:
        """Generate cleanup report"""
        # Count active sales (those that are currently running)
        active_sales = FlashSale.objects.filter(is_active=True)
        active_count = len([sale for sale in active_sales if sale.is_running])
        
        # Count upcoming sales
        upcoming_count = len([sale for sale in active_sales if sale.is_upcoming])
        
        # Count ended sales (all expired ones)
        ended_count = len([sale for sale in FlashSale.objects.all() if sale.is_expired])
        
        report = {
            'timestamp': self.current_time.isoformat(),
            'statistics': self.cleanup_stats.copy(),
            'active_sales_count': active_count,
            'scheduled_sales_count': upcoming_count,
            'ended_sales_count': ended_count
        }
        
        return report
    
    def send_cleanup_report(self, report: Dict[str, Any]):
        """Send cleanup report to admins"""
        try:
            if not any(report['statistics'].values()):
                # No changes made, skip report
                return
            
            subject = f"Flash Sales Cleanup Report - {self.current_time.strftime('%Y-%m-%d %H:%M')}"
            
            message = f"""
Flash Sales Cleanup Report
========================

Timestamp: {report['timestamp']}

Actions Taken:
- Expired Sales: {report['statistics']['expired_sales']}
- Activated Sales: {report['statistics']['activated_sales']}
- Deactivated Products: {report['statistics']['deactivated_products']}
- Notifications Sent: {report['statistics']['notifications_sent']}
- Errors: {report['statistics']['errors']}

Current Status:
- Active Sales: {report['active_sales_count']}
- Scheduled Sales: {report['scheduled_sales_count']}
- Ended Sales: {report['ended_sales_count']}

This is an automated report from ShopOnline Uganda flash sales cleanup system.
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
                logger.info("Cleanup report sent to admins")
                
        except Exception as e:
            logger.error(f"Failed to send cleanup report: {e}")
    
    def run_cleanup(self) -> bool:
        """Run complete cleanup process"""
        logger.info("=" * 50)
        logger.info("Starting Flash Sales Cleanup Process")
        logger.info("=" * 50)
        
        try:
            # Validate data integrity first
            self.validate_flash_sale_integrity()
            
            # Activate scheduled sales (though they should auto-activate via properties)
            sales_to_activate = self.find_sales_to_activate()
            for sale in sales_to_activate:
                if self.activate_flash_sale(sale):
                    self.send_activation_notification(sale)
            
            # Expire ended sales
            expired_sales = self.find_expired_sales()
            for sale in expired_sales:
                if self.expire_flash_sale(sale):
                    self.send_expiry_notification(sale)
            
            # Send notifications for sales ending soon
            ending_soon = self.find_sales_ending_soon(hours_ahead=2)
            for sale in ending_soon:
                self.send_ending_soon_notification(sale)
            
            # Cleanup old ended sales
            self.cleanup_old_ended_sales(days_old=30)
            
            # Generate and send report
            report = self.generate_cleanup_report()
            self.send_cleanup_report(report)
            
            logger.info("Flash sales cleanup completed successfully")
            logger.info(f"Summary: {self.cleanup_stats}")
            logger.info("=" * 50)
            
            return True
            
        except Exception as e:
            logger.error(f"Cleanup process failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def main():
    """Main cleanup function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='ShopOnline Uganda Flash Sales Cleanup')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--force-expire', type=str, help='Force expire flash sale by ID (UUID)')
    parser.add_argument('--force-activate', type=str, help='Force activate flash sale by ID (UUID)')
    parser.add_argument('--validate-only', action='store_true', help='Only run validation checks')
    args = parser.parse_args()
    
    cleanup = FlashSalesCleanup()
    
    if args.dry_run:
        logger.info("DRY RUN MODE - No changes will be made")
        
        # Show what would be done
        expired_sales = cleanup.find_expired_sales()
        sales_to_activate = cleanup.find_sales_to_activate()
        ending_soon = cleanup.find_sales_ending_soon()
        
        print(f"Would expire {len(expired_sales)} flash sales:")
        for sale in expired_sales:
            print(f"  - {sale.name} (ID: {sale.id})")
        
        print(f"Would activate {len(sales_to_activate)} flash sales:")
        for sale in sales_to_activate:
            print(f"  - {sale.name} (ID: {sale.id})")
        
        print(f"Would notify about {len(ending_soon)} flash sales ending soon:")
        for sale in ending_soon:
            print(f"  - {sale.name} (ID: {sale.id})")
        
        return
    
    if args.force_expire:
        try:
            sale = FlashSale.objects.get(id=args.force_expire)
            if cleanup.expire_flash_sale(sale):
                cleanup.send_expiry_notification(sale)
                print(f"Successfully expired flash sale: {sale.name}")
            else:
                print(f"Failed to expire flash sale: {sale.name}")
        except FlashSale.DoesNotExist:
            print(f"Flash sale with ID {args.force_expire} not found")
        return
    
    if args.force_activate:
        try:
            sale = FlashSale.objects.get(id=args.force_activate)
            if cleanup.activate_flash_sale(sale):
                cleanup.send_activation_notification(sale)
                print(f"Successfully activated flash sale: {sale.name}")
            else:
                print(f"Failed to activate flash sale: {sale.name}")
        except FlashSale.DoesNotExist:
            print(f"Flash sale with ID {args.force_activate} not found")
        return
    
    if args.validate_only:
        cleanup.validate_flash_sale_integrity()
        return
    
    # Run normal cleanup
    success = cleanup.run_cleanup()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()