from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


CategoryType = Literal["shirt", "hat"]
BrandType = Literal["Ferrari", "Mercedes-Benz", "Red Bull", "McLaren", "BMW", "Other"]


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: CategoryType
    brand: BrandType
    cost_price: Decimal = Field(ge=0)
    sell_price: Decimal = Field(ge=0)
    initial_stock_qty: int = Field(default=0, ge=0)
    defect_note: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=2000)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: CategoryType | None = None
    brand: BrandType | None = None
    cost_price: Decimal | None = Field(default=None, ge=0)
    sell_price: Decimal | None = Field(default=None, ge=0)
    defect_note: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    sku: str
    name: str
    category: str
    brand: str
    cost_price: Decimal
    sell_price: Decimal
    stock_qty: int
    defect_note: str | None
    image_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class InventoryInboundRequest(BaseModel):
    product_id: UUID
    qty: int = Field(gt=0)
    unit_cost: Decimal = Field(gt=0)
    note: str | None = Field(default=None, max_length=2000)


class InventoryInboundResponse(BaseModel):
    product_id: UUID
    stock_qty: int
    cost_price: Decimal


class SaleItemCreate(BaseModel):
    product_id: UUID
    qty: int = Field(gt=0)
    unit_sell_price: Decimal | None = Field(default=None, ge=0)


class SaleCreate(BaseModel):
    note: str | None = Field(default=None, max_length=2000)
    items: list[SaleItemCreate] = Field(min_length=1)


class SaleItemResponse(BaseModel):
    product_id: UUID
    qty: int
    unit_sell_price: Decimal
    unit_cost_snapshot: Decimal
    line_profit: Decimal


class SaleResponse(BaseModel):
    id: UUID
    sale_no: str
    total_amount: Decimal
    total_cost: Decimal
    total_profit: Decimal
    created_at: datetime
    items: list[SaleItemResponse]


class TopSellingProduct(BaseModel):
    product_id: UUID
    sku: str
    name: str
    qty_sold: int


class LowStockProduct(BaseModel):
    product_id: UUID
    sku: str
    name: str
    stock_qty: int


class DashboardSummaryResponse(BaseModel):
    inventory_capital: Decimal
    total_sales_amount: Decimal
    total_profit_net: Decimal
    total_loss: Decimal
    top_selling_products: list[TopSellingProduct]
    low_stock_products: list[LowStockProduct]


class DailyProfitLoss(BaseModel):
    day: date
    total_sales_amount: Decimal
    total_profit_net: Decimal
    total_loss: Decimal


class ProfitLossReportResponse(BaseModel):
    start_date: date | None
    end_date: date | None
    sales_count: int
    total_sales_amount: Decimal
    total_cost: Decimal
    total_profit_net: Decimal
    total_loss: Decimal
    daily: list[DailyProfitLoss]


class ProductQueryParams(BaseModel):
    search: str | None = None
    category: CategoryType | None = None
    brand: BrandType | None = None
    include_inactive: bool = False

    @model_validator(mode="after")
    def strip_search(self) -> "ProductQueryParams":
        if self.search is not None:
            self.search = self.search.strip() or None
        return self
