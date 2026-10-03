from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product, Sale, SaleItem
from ..schemas import DashboardSummaryResponse, LowStockProduct, TopSellingProduct

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(low_stock_threshold: int = Query(default=5, ge=0), db: Session = Depends(get_db)):
    inventory_capital = db.scalar(select(func.coalesce(func.sum(Product.stock_qty * Product.cost_price), 0))) or Decimal("0")
    total_sales_amount = db.scalar(select(func.coalesce(func.sum(Sale.total_amount), 0))) or Decimal("0")
    total_profit_net = db.scalar(select(func.coalesce(func.sum(Sale.total_profit), 0))) or Decimal("0")
    total_loss = db.scalar(
        select(func.coalesce(func.sum(case((Sale.total_profit < 0, -Sale.total_profit), else_=0)), 0))
    ) or Decimal("0")

    top_selling_rows = db.execute(
        select(SaleItem.product_id, Product.sku, Product.name, func.sum(SaleItem.qty).label("qty_sold"))
        .join(Product, Product.id == SaleItem.product_id)
        .group_by(SaleItem.product_id, Product.sku, Product.name)
        .order_by(func.sum(SaleItem.qty).desc())
        .limit(5)
    ).all()

    low_stock_rows = db.execute(
        select(Product.id, Product.sku, Product.name, Product.stock_qty)
        .where(Product.is_active.is_(True), Product.stock_qty <= low_stock_threshold)
        .order_by(Product.stock_qty.asc(), Product.name.asc())
        .limit(10)
    ).all()

    top_selling_products = [
        TopSellingProduct(product_id=row.product_id, sku=row.sku, name=row.name, qty_sold=int(row.qty_sold))
        for row in top_selling_rows
    ]
    low_stock_products = [
        LowStockProduct(product_id=row.id, sku=row.sku, name=row.name, stock_qty=row.stock_qty) for row in low_stock_rows
    ]

    return DashboardSummaryResponse(
        inventory_capital=inventory_capital,
        total_sales_amount=total_sales_amount,
        total_profit_net=total_profit_net,
        total_loss=total_loss,
        top_selling_products=top_selling_products,
        low_stock_products=low_stock_products,
    )
