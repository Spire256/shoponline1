# apps/notifications/management/commands/setup_websocket.py
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from pathlib import Path

class Command(BaseCommand):
    help = 'Setup and verify WebSocket configuration for the notifications app'

    def handle(self, *args, **options):
        self.stdout.write('🔧 Setting up WebSocket configuration...')
        
        # Create necessary directories
        base_dir = Path(settings.BASE_DIR)
        
        # Ensure logs directory exists
        logs_dir = base_dir / 'logs'
        logs_dir.mkdir(exist_ok=True)
        self.stdout.write(f'✅ Ensured logs directory exists: {logs_dir}')
        
        # Ensure management directories exist
        management_dir = base_dir / 'apps' / 'notifications' / 'management'
        commands_dir = management_dir / 'commands'
        
        management_dir.mkdir(exist_ok=True)
        commands_dir.mkdir(exist_ok=True)
        
        # Create __init__.py files if they don't exist
        (management_dir / '__init__.py').touch()
        (commands_dir / '__init__.py').touch()
        
        self.stdout.write(f'✅ Ensured management directories exist: {commands_dir}')
        
        # Verify settings
        self.stdout.write('\n📊 Verifying WebSocket settings...')
        
        # Check CHANNEL_LAYERS
        if hasattr(settings, 'CHANNEL_LAYERS') and settings.CHANNEL_LAYERS:
            self.stdout.write('✅ CHANNEL_LAYERS configured')
        else:
            self.stdout.write('❌ CHANNEL_LAYERS not configured')
            self.stdout.write('   Add CHANNEL_LAYERS to your settings.py')
        
        # Check ASGI_APPLICATION
        if hasattr(settings, 'ASGI_APPLICATION') and settings.ASGI_APPLICATION:
            self.stdout.write(f'✅ ASGI_APPLICATION: {settings.ASGI_APPLICATION}')
        else:
            self.stdout.write('❌ ASGI_APPLICATION not configured')
        
        # Check Redis URL
        redis_url = getattr(settings, 'REDIS_URL', None)
        if redis_url:
            self.stdout.write(f'✅ REDIS_URL: {redis_url}')
        else:
            self.stdout.write('❌ REDIS_URL not configured')
            
        # Test Redis connection
        try:
            import redis
            r = redis.from_url(redis_url or 'redis://localhost:6379/1')
            r.ping()
            self.stdout.write('✅ Redis connection successful')
        except Exception as e:
            self.stdout.write(f'❌ Redis connection failed: {str(e)}')
            self.stdout.write('   Make sure Redis is running on the correct port')
        
        # Check if required packages are installed
        self.stdout.write('\n📦 Checking required packages...')
        
        required_packages = [
            ('channels', 'channels'),
            ('channels_redis', 'channels_redis'),
            ('redis', 'redis'),
            ('daphne', 'daphne')
        ]
        
        for package_name, import_name in required_packages:
            try:
                __import__(import_name)
                self.stdout.write(f'✅ {package_name} installed')
            except ImportError:
                self.stdout.write(f'❌ {package_name} not installed')
                self.stdout.write(f'   Run: pip install {package_name}')
        
        self.stdout.write('\n🚀 Setup complete!')
        self.stdout.write('Next steps:')
        self.stdout.write('1. Ensure Redis is running: redis-server')
        self.stdout.write('2. Run migrations: python manage.py migrate')
        self.stdout.write('3. Test WebSocket: python manage.py test_websocket')
        self.stdout.write('4. Start server: daphne -p 8000 shoponline.asgi:application')