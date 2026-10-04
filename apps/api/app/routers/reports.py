from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..common import loss_sum
from ..database import get_db
from ..models import Sale
from ..schemas import DailyProfitLoss, ProfitLossReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])

# Report days follow the shop's local time (Thailand, UTC+7, no DST), not the server's.
SHOP_TZ = timezone(timedelta(hours=7))
SHOP_TZ_NAME = "Asia/Bangkok"


@router.get("/profit-loss", response_model=ProfitLossReportResponse)
def get_profit_loss_report(
    start: date | None = Query(default=None),
    end: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if start and end and start > end:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start date must be before end date")

    where_clauses = []
    if start:
        where_clauses.append(Sale.created_at >= datetime.combine(start, time.min, tzinfo=SHOP_TZ))
    if end:
        where_clauses.append(Sale.created_at < datetime.combine(end + timedelta(days=1), time.min, tzinfo=SHOP_TZ))

    sales_count_stmt = select(func.count(Sale.id))
    totals_stmt = select(
        func.coalesce(func.sum(Sale.total_amount), 0),
        func.coalesce(func.sum(Sale.total_cost), 0),
        func.coalesce(func.sum(Sale.total_profit), 0),
        loss_sum(Sale.total_profit),
    )
    local_day = func.date(func.timezone(SHOP_TZ_NAME, Sale.created_at))
    daily_stmt = select(
        local_day.label("day"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("total_sales_amount"),
        func.coalesce(func.sum(Sale.total_profit), 0).label("total_profit_net"),
        loss_sum(Sale.total_profit).label("total_loss"),
    )

    if where_clauses:
        sales_count_stmt = sales_count_stmt.where(*where_clauses)
        totals_stmt = totals_stmt.where(*where_clauses)
        daily_stmt = daily_stmt.where(*where_clauses)

    sales_count = db.scalar(sales_count_stmt) or 0
    totals = db.execute(totals_stmt).one()
    daily_rows = db.execute(daily_stmt.group_by(local_day).order_by(local_day)).all()

    daily = [
        DailyProfitLoss(
            day=row.day,
            total_sales_amount=Decimal(row.total_sales_amount),
            total_profit_net=Decimal(row.total_profit_net),
            total_loss=Decimal(row.total_loss),
        )
        for row in daily_rows
    ]

    return ProfitLossReportResponse(
        start_date=start,
        end_date=end,
        sales_count=sales_count,
        total_sales_amount=Decimal(totals[0]),
        total_cost=Decimal(totals[1]),
        total_profit_net=Decimal(totals[2]),
        total_loss=Decimal(totals[3]),
        daily=daily,
    )
