from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..common import get_product_or_404, to_money
from ..database import get_db
from ..models import StockMovement
from ..schemas import InventoryInboundRequest, InventoryInboundResponse

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.post("/inbound", response_model=InventoryInboundResponse)
def inbound_stock(payload: InventoryInboundRequest, db: Session = Depends(get_db)):
    product = get_product_or_404(db, payload.product_id)

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
    product.cost_price = to_money(new_cost)

    movement = StockMovement(
        product_id=product.id,
        movement_type="IN",
        qty=payload.qty,
        unit_cost=to_money(inbound_cost),
        note=payload.note,
    )
    db.add(movement)
    db.commit()
    db.refresh(product)

    return InventoryInboundResponse(product_id=product.id, stock_qty=product.stock_qty, cost_price=product.cost_price)
