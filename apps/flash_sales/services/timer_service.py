
# apps/flash_sales/services/timer_service.py
from django.utils import timezone
from datetime import timedelta
import json


class TimerService:
    """Service for handling flash sale countdown timers"""
    
    @staticmethod
    def get_timer_data(flash_sale):
        """Get timer data for frontend countdown"""
        now = timezone.now()
        
        if flash_sale.is_upcoming:
            target_time = flash_sale.start_time
            timer_type = 'starts_in'
        elif flash_sale.is_running:
            target_time = flash_sale.end_time
            timer_type = 'ends_in'
        else:
            return {
                'timer_type': 'expired',
                'target_time': None,
                'time_remaining': 0,
                'display_text': 'Flash sale has ended'
            }
        
        time_remaining = int((target_time - now).total_seconds())
        
        return {
            'timer_type': timer_type,
            'target_time': target_time.isoformat(),
            'time_remaining': max(time_remaining, 0),
            'display_text': TimerService._format_time_remaining(time_remaining)
        }
    
    @staticmethod
    def _format_time_remaining(seconds):
        """Format time remaining into human readable format"""
        if seconds <= 0:
            return "Expired"
        
        days = seconds // 86400
        hours = (seconds % 86400) // 3600
        minutes = (seconds % 3600) // 60
        seconds = seconds % 60
        
        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    @staticmethod
    def get_multiple_timers(flash_sales):
        """Get timer data for multiple flash sales"""
        return [
            {
                'flash_sale_id': str(flash_sale.id),
                'flash_sale_name': flash_sale.name,
                **TimerService.get_timer_data(flash_sale)
            }
            for flash_sale in flash_sales
        ]

