# testyeswebstudio

ระบบคลังสต็อกสินค้า motorsport (MVP) ตามแผนใน [plan.md](./plan.md)

## โครงสร้างโปรเจกต์

- `apps/web` - Next.js frontend
- `apps/api` - FastAPI backend

## 1) รัน Backend (FastAPI)

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

> ใส่ค่า `DATABASE_URL` ให้ชี้ไป Supabase PostgreSQL ตามไฟล์ `.env`

## 2) รัน Frontend (Next.js)

```bash
cd apps/web
copy .env.local.example .env.local
npm install
npm run dev
```

เปิดใช้งานที่ `http://localhost:3000`

## API หลักที่มีตอนนี้

- `GET /products`
- `POST /products` (ระบบสร้าง `sku` อัตโนมัติ และรองรับ `initial_stock_qty`)
- `GET /products/{id}`
- `PATCH /products/{id}`
- `POST /inventory/inbound`
- `POST /sales`
- `GET /dashboard/summary`
- `GET /reports/profit-loss`
