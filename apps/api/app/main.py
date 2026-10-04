import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers.dashboard import router as dashboard_router
from .routers.inventory import router as inventory_router
from .routers.products import router as products_router
from .routers.reports import router as reports_router
from .routers.sales import router as sales_router


def _allowed_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Local dev creates missing tables; on Vercel the schema is managed with supabase/schema.sql,
    # so cold starts skip the extra round trips.
    if not os.getenv("VERCEL"):
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Motorsport Inventory API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(products_router)
app.include_router(inventory_router)
app.include_router(sales_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
