from uuid import uuid4
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from ..common import get_product_or_404
from ..database import get_db
from ..models import Product, StockMovement
from ..schemas import ProductCreate, ProductQueryParams, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _generate_sku(db: Session) -> str:
    alphabet = "STMRFB"
    for _ in range(10):
        seed = uuid4().hex.upper()
        first_letter = alphabet[int(seed[0], 16) % len(alphabet)]
        second_letter = alphabet[int(seed[1], 16) % len(alphabet)]
        digits = [str(int(seed[i], 16) % 10) for i in range(2, 6)]
        candidate = f"{first_letter}{digits[0]}{digits[1]} {second_letter}{digits[2]}{digits[3]}"
        exists = db.scalar(select(Product.id).where(Product.sku == candidate).limit(1))
        if not exists:
            return candidate
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate unique SKU")


@router.get("", response_model=list[ProductResponse])
def list_products(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    archived: bool = Query(default=False, description="Return only archived (hidden) products"),
    db: Session = Depends(get_db),
):
    params = ProductQueryParams(
        search=search,
        category=category,
        brand=brand,
        include_inactive=include_inactive,
        archived=archived,
    )
    query = select(Product)
    if params.archived:
        query = query.where(Product.is_active.is_(False))
    elif not params.include_inactive:
        query = query.where(Product.is_active.is_(True))
    if params.search:
        like_value = f"%{params.search}%"
        query = query.where((Product.name.ilike(like_value)) | (Product.sku.ilike(like_value)))
    if params.category:
        query = query.where(Product.category == params.category)
    if params.brand:
        query = query.where(Product.brand == params.brand)

    return list(db.scalars(query.order_by(Product.created_at.desc())).all())


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    return get_product_or_404(db, product_id)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    for _ in range(5):
        sku = _generate_sku(db)
        product = Product(
            sku=sku,
            name=payload.name.strip(),
            category=payload.category,
            brand=payload.brand,
            cost_price=payload.cost_price,
            sell_price=payload.sell_price,
            stock_qty=payload.initial_stock_qty,
            defect_note=payload.defect_note,
            image_url=payload.image_url,
        )
        db.add(product)
        try:
            db.flush()
            if payload.initial_stock_qty > 0:
                db.add(
                    StockMovement(
                        product_id=product.id,
                        movement_type="IN",
                        qty=payload.initial_stock_qty,
                        unit_cost=payload.cost_price,
                        note="initial_stock",
                    )
                )
            db.commit()
            db.refresh(product)
            return product
        except IntegrityError as exc:
            db.rollback()
            message = str(exc.orig)
            if "uq_products_sku" in message or "UNIQUE constraint failed: products.sku" in message:
                continue
            raise

    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate unique SKU")


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: UUID, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = get_product_or_404(db, product_id)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        message = str(exc.orig)
        if "uq_products_sku" in message or "UNIQUE constraint failed: products.sku" in message:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists") from exc
        raise

    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_product(product_id: UUID, db: Session = Depends(get_db)):
    product = get_product_or_404(db, product_id)
    if product.is_active:
        product.is_active = False
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{product_id}/restore", response_model=ProductResponse)
def restore_product(product_id: UUID, db: Session = Depends(get_db)):
    product = get_product_or_404(db, product_id)
    if not product.is_active:
        product.is_active = True
        db.commit()
        db.refresh(product)
    return product
