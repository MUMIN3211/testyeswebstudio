from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import case, exists, func
from sqlalchemy.orm import Session

from .models import Product, Sale, SaleItem


def to_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_product_or_404(db: Session, product_id: UUID | str) -> Product:
    product = db.get(Product, str(product_id))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def sum_or_zero(expr):
    return func.coalesce(func.sum(expr), 0)


def loss_sum(profit_column):
    """Sum of the losses only: negative profits counted as positive amounts."""
    return sum_or_zero(case((profit_column < 0, -profit_column), else_=0))


def sale_without_archived_products():
    """Condition for sales that contain no archived product: hidden products' sales are left out of the dashboard."""
    return ~exists().where(
        SaleItem.sale_id == Sale.id,
        SaleItem.product_id == Product.id,
        Product.is_active.is_(False),
    )
