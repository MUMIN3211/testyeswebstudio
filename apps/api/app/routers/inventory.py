from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product, StockMovement
from ..schemas import InventoryInboundRequest, InventoryInboundResponse

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _to_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@router.post("/inbound", response_model=InventoryInboundResponse)
def inbound_stock(payload: InventoryInboundRequest, db: Session = Depends(get_db)):
    product = db.get(Product, str(payload.product_id))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    old_qty = product.stock_qty
    old_cost = Decimal(product.cost_price)
    new_qty = old_qty + payload.qty
    inbound_cost = Decimal(payload.unit_cost)

    if old_qty <= 0:
        new_cost = inbound_cost
    else:
        weighted_sum = (old_cost * old_qty) + (inbound_cost * payload.qty)
        new_cost = weighted_sum / Decimal(new_qty)

    product.stock_qty = new_qty
    product.cost_price = _to_money(new_cost)

    movement = StockMovement(
        product_id=product.id,
        movement_type="IN",
        qty=payload.qty,
        unit_cost=_to_money(inbound_cost),
        note=payload.note,
    )
    db.add(movement)
    db.commit()
    db.refresh(product)

    return InventoryInboundResponse(product_id=product.id, stock_qty=product.stock_qty, cost_price=product.cost_price)
