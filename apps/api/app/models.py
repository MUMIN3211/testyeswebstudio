import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        UniqueConstraint("sku", name="uq_products_sku"),
        CheckConstraint("cost_price >= 0", name="ck_products_cost_non_negative"),
        CheckConstraint("sell_price >= 0", name="ck_products_sell_non_negative"),
        CheckConstraint("stock_qty >= 0", name="ck_products_stock_non_negative"),
    )

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    sku: Mapped[str] = mapped_column(String(120), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    brand: Mapped[str] = mapped_column(String(120), nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    sell_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    stock_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    defect_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    stock_movements: Mapped[list["StockMovement"]] = relationship(back_populates="product")
    sale_items: Mapped[list["SaleItem"]] = relationship(back_populates="product")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    __table_args__ = (
        CheckConstraint("qty > 0", name="ck_stock_movements_qty_positive"),
        CheckConstraint("movement_type in ('IN', 'OUT', 'ADJUST')", name="ck_stock_movements_valid_type"),
    )

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("products.id"), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    product: Mapped["Product"] = relationship(back_populates="stock_movements")


class Sale(Base):
    __tablename__ = "sales"

    __table_args__ = (UniqueConstraint("sale_no", name="uq_sales_sale_no"),)

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    sale_no: Mapped[str] = mapped_column(String(120), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    total_profit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    # Shipping is charged once per sale: shipping_charged is what the customer paid, shipping_cost what the courier cost.
    shipping_charged: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    shipping_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    promotion: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    items: Mapped[list["SaleItem"]] = relationship(back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    __table_args__ = (CheckConstraint("qty > 0", name="ck_sale_items_qty_positive"),)

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    sale_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("sales.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("products.id"), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_sell_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    unit_cost_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_profit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    sale: Mapped["Sale"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="sale_items")
