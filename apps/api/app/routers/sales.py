from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..common import sale_without_archived_products, sum_or_zero, to_money
from ..database import get_db
from ..models import Product, Sale, SaleItem, StockMovement
from ..schemas import SaleCreate, SaleItemResponse, SaleResponse, ShippingProfitResponse

router = APIRouter(prefix="/sales", tags=["sales"])

# Shipping is charged once per sale and depends on the category: (courier cost, fee charged to the customer).
# Shirts ship for 28 and the customer pays 40; hats ship for 50 and the customer pays 50.
# A sale containing any hat uses the hat rate.
SHIPPING_RATES = {"shirt": (Decimal("28.00"), Decimal("40.00")), "hat": (Decimal("50.00"), Decimal("50.00"))}
PROMOTION_DISCOUNT = Decimal("20.00")


def _sale_no() -> str:
    stamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    suffix = uuid4().hex[:6].upper()
    return f"SAL-{stamp}-{suffix}"


@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    product_ids = list({str(item.product_id) for item in payload.items})
    products = db.scalars(select(Product).where(Product.id.in_(product_ids)).with_for_update()).all()
    product_map = {product.id: product for product in products}

    missing_products = [str(pid) for pid in product_ids if pid not in product_map]
    if missing_products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {', '.join(missing_products)}",
        )

    for item in payload.items:
        product = product_map[str(item.product_id)]
        if product.stock_qty < item.qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for SKU {product.sku}. Requested {item.qty}, available {product.stock_qty}",
            )

    sale = Sale(sale_no=_sale_no(), note=payload.note)
    db.add(sale)
    db.flush()

    total_amount = Decimal("0.00")
    total_cost = Decimal("0.00")
    total_profit = Decimal("0.00")
    response_items: list[SaleItemResponse] = []

    for item in payload.items:
        product = product_map[str(item.product_id)]
        unit_cost = to_money(Decimal(product.cost_price))
        unit_sell_price = to_money(Decimal(item.unit_sell_price) if item.unit_sell_price is not None else Decimal(product.sell_price))

        line_amount = to_money(unit_sell_price * item.qty)
        line_cost = to_money(unit_cost * item.qty)
        line_profit = to_money(line_amount - line_cost)

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            qty=item.qty,
            unit_sell_price=unit_sell_price,
            unit_cost_snapshot=unit_cost,
            line_profit=line_profit,
        )
        db.add(sale_item)

        movement = StockMovement(
            product_id=product.id,
            movement_type="OUT",
            qty=item.qty,
            unit_price=unit_sell_price,
            note=f"sale_no={sale.sale_no}",
        )
        db.add(movement)

        product.stock_qty -= item.qty

        total_amount += line_amount
        total_cost += line_cost
        total_profit += line_profit
        response_items.append(
            SaleItemResponse(
                product_id=product.id,
                qty=item.qty,
                unit_sell_price=unit_sell_price,
                unit_cost_snapshot=unit_cost,
                line_profit=line_profit,
            )
        )

    sale_categories = {product_map[str(item.product_id)].category for item in payload.items}
    shipping_cost, shipping_fee = SHIPPING_RATES["hat" if "hat" in sale_categories else "shirt"]
    shipping_charged = Decimal("0.00") if payload.promotion == "FREE_SHIPPING" else shipping_fee
    # The discount comes off the goods, so it can never exceed what the goods cost the customer.
    discount_amount = min(PROMOTION_DISCOUNT, total_amount) if payload.promotion == "DISCOUNT_20" else Decimal("0.00")

    sale.total_amount = to_money(total_amount - discount_amount)
    sale.total_cost = to_money(total_cost)
    sale.total_profit = to_money(total_profit - discount_amount + shipping_charged - shipping_cost)
    sale.shipping_charged = shipping_charged
    sale.shipping_cost = shipping_cost
    sale.discount_amount = discount_amount
    sale.promotion = payload.promotion

    db.flush()
    db.refresh(sale)

    sale_response = SaleResponse(
        id=sale.id,
        sale_no=sale.sale_no,
        total_amount=sale.total_amount,
        total_cost=sale.total_cost,
        total_profit=sale.total_profit,
        shipping_charged=sale.shipping_charged,
        shipping_cost=sale.shipping_cost,
        shipping_profit=to_money(sale.shipping_charged - sale.shipping_cost),
        discount_amount=sale.discount_amount,
        promotion=sale.promotion,
        created_at=sale.created_at,
        items=response_items,
    )

    db.commit()

    return sale_response


@router.get("/shipping-profit", response_model=ShippingProfitResponse)
def get_shipping_profit(db: Session = Depends(get_db)):
    total = db.scalar(
        select(sum_or_zero(Sale.shipping_charged - Sale.shipping_cost)).where(sale_without_archived_products())
    )
    return ShippingProfitResponse(total_shipping_profit=Decimal(total or 0))
