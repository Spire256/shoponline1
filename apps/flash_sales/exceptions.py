
# apps/flash_sales/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


class FlashSaleError(Exception):
    """Base exception for flash sale related errors"""
    pass


class FlashSaleExpiredError(FlashSaleError):
    """Raised when trying to operate on expired flash sale"""
    pass


class FlashSaleNotActiveError(FlashSaleError):
    """Raised when trying to operate on inactive flash sale"""
    pass


class ProductNotInFlashSaleError(FlashSaleError):
    """Raised when product is not in flash sale"""
    pass


class FlashSaleSoldOutError(FlashSaleError):
    """Raised when flash sale product is sold out"""
    pass


def flash_sale_exception_handler(exc, context):
    """Custom exception handler for flash sale errors"""
    response = exception_handler(exc, context)
    
    if response is not None:
        return response
    
    if isinstance(exc, FlashSaleExpiredError):
        return Response(
            {'error': 'Flash sale has expired', 'code': 'FLASH_SALE_EXPIRED'},
            status=status.HTTP_400_BAD_REQUEST
        )
    elif isinstance(exc, FlashSaleNotActiveError):
        return Response(
            {'error': 'Flash sale is not active', 'code': 'FLASH_SALE_NOT_ACTIVE'},
            status=status.HTTP_400_BAD_REQUEST
        )
    elif isinstance(exc, ProductNotInFlashSaleError):
        return Response(
            {'error': 'Product is not in flash sale', 'code': 'PRODUCT_NOT_IN_FLASH_SALE'},
            status=status.HTTP_400_BAD_REQUEST
        )
    elif isinstance(exc, FlashSaleSoldOutError):
        return Response(
            {'error': 'Flash sale product is sold out', 'code': 'FLASH_SALE_SOLD_OUT'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return None

