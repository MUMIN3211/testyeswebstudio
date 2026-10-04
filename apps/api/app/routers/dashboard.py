from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import loss_sum, sale_without_archived_products, sum_or_zero
from ..database import get_db
from ..models import Product, Sale, SaleItem, StockMovement
from ..schemas import DashboardSummaryResponse, LowStockProduct, TopSellingProduct

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(low_stock_threshold: int = Query(default=5, ge=0), db: Session = Depends(get_db)):
    # Inventory capital = total cost of every unit received for products on the products page
    # (in stock and already sold), excluding archived products.
    inventory_capital = db.scalar(
        select(sum_or_zero(StockMovement.qty * func.coalesce(StockMovement.unit_cost, 0)))
        .join(Product, Product.id == StockMovement.product_id)
        .where(StockMovement.movement_type == "IN", Product.is_active.is_(True))
    )

    # Money figures come from each sale's stored totals (shipping and discounts already included),
    # the same way the profit/loss report computes them; sales of archived products are left out.
    total_sales_amount, total_profit_net, total_loss, total_shipping_profit = db.execute(
        select(
            sum_or_zero(Sale.total_amount),
            sum_or_zero(Sale.total_profit),
            loss_sum(Sale.total_profit),
            sum_or_zero(Sale.shipping_charged - Sale.shipping_cost),
        ).where(sale_without_archived_products())
    ).one()

    # Rank by quantity first, then fetch product details only for the top 5 (avoids grouping by large columns).
    top_selling = (
        select(SaleItem.product_id, func.sum(SaleItem.qty).label("qty_sold"))
        .join(Product, Product.id == SaleItem.product_id)
        .where(Product.is_active.is_(True))
        .group_by(SaleItem.product_id)
        .order_by(func.sum(SaleItem.qty).desc())
        .limit(5)
        .subquery()
    )
    top_selling_rows = db.execute(
        select(Product.id, Product.sku, Product.name, Product.image_url, top_selling.c.qty_sold)
        .join(top_selling, top_selling.c.product_id == Product.id)
        .order_by(top_selling.c.qty_sold.desc())
    ).all()

    low_stock_rows = db.execute(
        select(Product.id, Product.sku, Product.name, Product.image_url, Product.stock_qty)
        .where(Product.is_active.is_(True), Product.stock_qty > 0, Product.stock_qty <= low_stock_threshold)
        .order_by(Product.stock_qty.asc(), Product.name.asc())
        .limit(10)
    ).all()

    return DashboardSummaryResponse(
        inventory_capital=Decimal(inventory_capital or 0),
        total_sales_amount=Decimal(total_sales_amount),
        total_profit_net=Decimal(total_profit_net),
        total_loss=Decimal(total_loss),
        total_shipping_profit=Decimal(total_shipping_profit),
        top_selling_products=[
            TopSellingProduct(
                product_id=row.id, sku=row.sku, name=row.name, image_url=row.image_url, qty_sold=int(row.qty_sold)
            )
            for row in top_selling_rows
        ],
        low_stock_products=[
            LowStockProduct(
                product_id=row.id, sku=row.sku, name=row.name, image_url=row.image_url, stock_qty=row.stock_qty
            )
            for row in low_stock_rows
        ],
    )
