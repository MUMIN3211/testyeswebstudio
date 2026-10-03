from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..database import get_db
from ..models import Product
from ..schemas import ProductCreate, ProductQueryParams, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def list_products(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    params = ProductQueryParams(
        search=search,
        category=category,
        brand=brand,
        include_inactive=include_inactive,
    )
    query = select(Product)
    if not params.include_inactive:
        query = query.where(Product.is_active.is_(True))
    if params.search:
        like_value = f"%{params.search}%"
        query = query.where((Product.name.ilike(like_value)) | (Product.sku.ilike(like_value)))
    if params.category:
        query = query.where(Product.category == params.category)
    if params.brand:
        query = query.where(Product.brand == params.brand)

    products = db.scalars(query.order_by(Product.created_at.desc())).all()
    return list(products)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(
        sku=payload.sku.strip(),
        name=payload.name.strip(),
        category=payload.category,
        brand=payload.brand,
        cost_price=payload.cost_price,
        sell_price=payload.sell_price,
        defect_note=payload.defect_note,
        image_url=payload.image_url,
    )
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if "uq_products_sku" in str(exc.orig):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists") from exc
        raise

    db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if "uq_products_sku" in str(exc.orig):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists") from exc
        raise

    db.refresh(product)
    return product
