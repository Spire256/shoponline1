# apps/orders/services/order_service.py

from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from typing import Dict, List, Optional
import logging

from ..models import Order, OrderItem, OrderStatusHistory, OrderNote
from apps.products.models import Product
from apps.flash_sales.models import FlashSaleProduct
from .notification_service import OrderNotificationService

logger = logging.getLogger(__name__)


class OrderService:
    """Service class for order business logic"""
    
    @staticmethod
    def calculate_order_totals(items_data: List[Dict]) -> Dict:
        """Calculate order totals including flash sale discounts"""
        subtotal = Decimal('0.00')
        flash_sale_savings = Decimal('0.00')
        has_flash_sale_items = False
        
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            quantity = item_data['quantity']
            
            # Check for active flash sale
            flash_sale_product = OrderService._get_active_flash_sale(product)
            
            if flash_sale_product:
                unit_price = flash_sale_product.discounted_price
                original_price = product.price
                item_savings = (original_price - unit_price) * quantity
                flash_sale_savings += item_savings
                has_flash_sale_items = True
            else:
                unit_price = product.price
            
            subtotal += unit_price * quantity
        
        # Calculate delivery fee (can be customized based on location)
        delivery_fee = OrderService._calculate_delivery_fee(subtotal)
        
        # Calculate tax if applicable
        tax_amount = OrderService._calculate_tax(subtotal)
        
        total_amount = subtotal + delivery_fee + tax_amount
        
        return {
            'subtotal': subtotal,
            'delivery_fee': delivery_fee,
            'tax_amount': tax_amount,
            'total_amount': total_amount,
            'flash_sale_savings': flash_sale_savings,
            'has_flash_sale_items': has_flash_sale_items
        }
    
    @staticmethod
    def _get_active_flash_sale(product: Product) -> Optional['FlashSaleProduct']:
        """Get active flash sale for a product"""
        try:
            return FlashSaleProduct.objects.select_related('flash_sale').get(
                product=product,
                flash_sale__is_active=True,
                flash_sale__start_time__lte=timezone.now(),
                flash_sale__end_time__gte=timezone.now()
            )
        except FlashSaleProduct.DoesNotExist:
            return None
    
    @staticmethod
    def _calculate_delivery_fee(subtotal: Decimal) -> Decimal:
        """Calculate delivery fee based on order value"""
        # Free delivery for orders above UGX 100,000
        if subtotal >= Decimal('100000'):
            return Decimal('0.00')
        
        # Standard delivery fee for Uganda
        return Decimal('5000.00')  # UGX 5,000
    
    @staticmethod
    def _calculate_tax(subtotal: Decimal) -> Decimal:
        """Calculate tax (VAT) if applicable"""
        # Uganda VAT is 18% but might not apply to all products
        # For now, return 0 - can be customized based on product types
        return Decimal('0.00')
    
    @staticmethod
    def validate_order_items(items_data: List[Dict]) -> List[str]:
        """Validate order items and return list of errors"""
        errors = []
        
        if not items_data:
            errors.append("At least one item is required")
            return errors
        
        if len(items_data) > 50:
            errors.append("Too many items in single order (max 50)")
        
        for i, item_data in enumerate(items_data):
            try:
                product = Product.objects.get(
                    id=item_data['product_id'], 
                    is_active=True
                )
                
                quantity = item_data['quantity']
                
                if quantity <= 0:
                    errors.append(f"Item {i+1}: Quantity must be positive")
                
                if product.stock_quantity < quantity:
                    errors.append(
                        f"Item {i+1}: Insufficient stock. "
                        f"Available: {product.stock_quantity}, Requested: {quantity}"
                    )
                
                # Check if product is available for purchase
                if not product.is_available_for_purchase():
                    errors.append(f"Item {i+1}: Product '{product.name}' is not available")
                
            except Product.DoesNotExist:
                errors.append(f"Item {i+1}: Product not found")
            except KeyError as e:
                errors.append(f"Item {i+1}: Missing required field {e}")
        
        return errors
    
    @staticmethod
    @transaction.atomic
    def create_order_with_items(order_data: Dict, items_data: List[Dict], user=None) -> Order:
        """Create order with items in a single transaction"""
        
        # Validate items first
        validation_errors = OrderService.validate_order_items(items_data)
        if validation_errors:
            raise ValueError("; ".join(validation_errors))
        
        # Calculate totals
        totals = OrderService.calculate_order_totals(items_data)
        
        # Create order
        order = Order.objects.create(
            user=user,
            subtotal=totals['subtotal'],
            delivery_fee=totals['delivery_fee'],
            tax_amount=totals['tax_amount'],
            total_amount=totals['total_amount'],
            flash_sale_savings=totals['flash_sale_savings'],
            has_flash_sale_items=totals['has_flash_sale_items'],
            **order_data
        )
        
        # Create order items
        for item_data in items_data:
            OrderService._create_order_item(order, item_data)
        
        # Create COD verification if needed
        if order.is_cash_on_delivery:
            from ..models import CODVerification
            CODVerification.objects.create(order=order)
        
        # Send notifications
        try:
            notification_service = OrderNotificationService()
            notification_service.send_order_confirmation(order)
            
            if order.is_cash_on_delivery:
                notification_service.send_cod_admin_notification(order)
                
        except Exception as e:
            logger.error(f"Failed to send order notifications for {order.order_number}: {str(e)}")
        
        return order
    
    @staticmethod
    def _create_order_item(order: Order, item_data: Dict) -> OrderItem:
        """Create individual order item"""
        product = Product.objects.get(id=item_data['product_id'])
        quantity = item_data['quantity']
        
        # Check for flash sale pricing
        flash_sale_product = OrderService._get_active_flash_sale(product)
        
        if flash_sale_product:
            unit_price = flash_sale_product.discounted_price
            original_price = product.price
            is_flash_sale_item = True
            flash_sale_discount = flash_sale_product.flash_sale.discount_percentage
            flash_sale_savings = (original_price - unit_price) * quantity
        else:
            unit_price = product.price
            original_price = None
            is_flash_sale_item = False
            flash_sale_discount = 0
            flash_sale_savings = Decimal('0.00')
        
        # Create order item
        order_item = OrderItem.objects.create(
            order=order,
            product_id=product.id,
            product_name=product.name,
            product_sku=product.sku,
            product_image=product.featured_image.url if product.featured_image else '',
            unit_price=unit_price,
            quantity=quantity,
            is_flash_sale_item=is_flash_sale_item,
            original_price=original_price,
            flash_sale_discount=flash_sale_discount,
            flash_sale_savings=flash_sale_savings,
            product_category=product.category.name if product.category else '',
            product_brand=product.brand or ''
        )
        
        # Update product stock
        product.stock_quantity -= quantity
        product.save(update_fields=['stock_quantity'])
        
        return order_item
    
    @staticmethod
    def update_order_status(order: Order, new_status: str, user, notes: str = "") -> Order:
        """Update order status with proper tracking"""
        old_status = order.status
        
        if old_status == new_status:
            return order
        
        # Validate status transition
        valid_transitions = OrderService._get_valid_status_transitions(old_status)
        if new_status not in valid_transitions:
            raise ValueError(f"Cannot change status from {old_status} to {new_status}")
        
        # Update order
        order.status = new_status
        
        # Set timestamps based on status
        if new_status == 'confirmed' and not order.confirmed_at:
            order.confirmed_at = timezone.now()
        elif new_status == 'delivered' and not order.delivered_at:
            order.delivered_at = timezone.now()
            if order.is_cash_on_delivery:
                order.payment_status = 'completed'
        elif new_status == 'cancelled' and not order.cancelled_at:
            order.cancelled_at = timezone.now()
        
        order.save()
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            previous_status=old_status,
            new_status=new_status,
            changed_by=user,
            notes=notes or f"Status changed from {old_status} to {new_status}"
        )
        
        # Send notifications
        try:
            notification_service = OrderNotificationService()
            notification_service.send_status_update(order, old_status)
        except Exception as e:
            logger.error(f"Failed to send status update notification: {str(e)}")
        
        return order
    
    @staticmethod
    def _get_valid_status_transitions(current_status: str) -> List[str]:
        """Get valid status transitions from current status"""
        transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['out_for_delivery', 'cancelled'],
            'out_for_delivery': ['delivered', 'cancelled'],
            'delivered': ['refunded'],
            'cancelled': [],
            'refunded': []
        }
        return transitions.get(current_status, [])
    
    @staticmethod
    def cancel_order(order: Order, reason: str = "", user=None) -> Order:
        """Cancel an order and restore stock"""
        if not order.can_be_cancelled():
            raise ValueError("Order cannot be cancelled at this stage")
        
        with transaction.atomic():
            # Restore product stock
            for item in order.items.all():
                try:
                    product = Product.objects.get(id=item.product_id)
                    product.stock_quantity += item.quantity
                    product.save(update_fields=['stock_quantity'])
                except Product.DoesNotExist:
                    # Product might have been deleted, skip stock restoration
                    pass
            
            # Update order
            order.status = 'cancelled'
            order.cancelled_at = timezone.now()
            if reason:
                order.admin_notes += f"\nCancellation reason: {reason}"
            order.save()
            
            # Create status history
            OrderStatusHistory.objects.create(
                order=order,
                previous_status='pending',  # Assuming we can only cancel pending orders
                new_status='cancelled',
                changed_by=user,
                notes=f"Order cancelled. Reason: {reason}"
            )
            
            # Add order note
            OrderNote.objects.create(
                order=order,
                note_type='system',
                note=f"Order cancelled. Stock restored. Reason: {reason}",
                created_by=user
            )
        
        # Send cancellation notification
        try:
            notification_service = OrderNotificationService()
            notification_service.send_cancellation_notification(order)
        except Exception as e:
            logger.error(f"Failed to send cancellation notification: {str(e)}")
        
        return order
    
    @staticmethod
    def get_order_analytics(date_from=None, date_to=None) -> Dict:
        """Get comprehensive order analytics"""
        from django.db.models import Count, Sum, Avg
        from datetime import timedelta
        
        if not date_from:
            date_from = timezone.now() - timedelta(days=30)
        if not date_to:
            date_to = timezone.now()
        
        queryset = Order.objects.filter(created_at__range=[date_from, date_to])
        
        # Basic metrics
        total_orders = queryset.count()
        total_revenue = queryset.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        average_order_value = queryset.aggregate(avg=Avg('total_amount'))['avg'] or Decimal('0.00')
        
        # Status breakdown
        status_counts = dict(queryset.values_list('status').annotate(Count('id')))
        
        # Payment method breakdown
        payment_counts = dict(queryset.values_list('payment_method').annotate(Count('id')))
        
        # Flash sale metrics
        flash_sale_orders = queryset.filter(has_flash_sale_items=True).count()
        total_flash_savings = queryset.aggregate(
            savings=Sum('flash_sale_savings')
        )['savings'] or Decimal('0.00')
        
        # Geographic distribution
        district_stats = list(queryset.values('district').annotate(
            count=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('-count')[:10])
        
        # Daily trends
        daily_stats = list(queryset.extra(
            select={'day': 'date(created_at)'}
        ).values('day').annotate(
            orders=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('day'))
        
        return {
            'period': {'from': date_from, 'to': date_to},
            'totals': {
                'orders': total_orders,
                'revenue': total_revenue,
                'average_order_value': average_order_value,
            },
            'status_breakdown': status_counts,
            'payment_breakdown': payment_counts,
            'flash_sales': {
                'orders_with_flash_items': flash_sale_orders,
                'total_savings': total_flash_savings,
                'percentage_of_orders': (flash_sale_orders / total_orders * 100) if total_orders > 0 else 0
            },
            'geographic': district_stats,
            'daily_trends': daily_stats
        }

