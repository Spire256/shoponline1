# apps/flash_sales/webhooks.py
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views import View
import json
import logging
from .services.flash_sale_service import FlashSaleService


logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(require_POST, name='dispatch')
class FlashSaleWebhookView(View):
    """Handle flash sale related webhooks"""
    
    def post(self, request):
        """Handle webhook POST requests"""
        try:
            data = json.loads(request.body)
            event_type = data.get('event_type')
            
            if event_type == 'flash_sale_started':
                return self.handle_flash_sale_started(data)
            elif event_type == 'flash_sale_ended':
                return self.handle_flash_sale_ended(data)
            elif event_type == 'product_sold_out':
                return self.handle_product_sold_out(data)
            else:
                logger.warning(f"Unknown webhook event type: {event_type}")
                return HttpResponseBadRequest("Unknown event type")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON in webhook request")
            return HttpResponseBadRequest("Invalid JSON")
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return HttpResponseBadRequest("Processing error")
    
    def handle_flash_sale_started(self, data):
        """Handle flash sale started event"""
        flash_sale_id = data.get('flash_sale_id')
        # Add any additional logic for flash sale start
        logger.info(f"Flash sale {flash_sale_id} started via webhook")
        return HttpResponse("OK")
    
    def handle_flash_sale_ended(self, data):
        """Handle flash sale ended event"""
        flash_sale_id = data.get('flash_sale_id')
        # Add any additional logic for flash sale end
        logger.info(f"Flash sale {flash_sale_id} ended via webhook")
        return HttpResponse("OK")
    
    def handle_product_sold_out(self, data):
        """Handle product sold out event"""
        product_id = data.get('product_id')
        flash_sale_id = data.get('flash_sale_id')
        logger.info(f"Product {product_id} sold out in flash sale {flash_sale_id}")
        return HttpResponse("OK")

