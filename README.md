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
>
> ตัวอย่าง:
> `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
>
> ถ้ารหัสผ่านมีอักขระพิเศษ ให้ทำ percent-encode ก่อนใส่ใน URL

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
- `DELETE /products/{id}` (soft delete: ซ่อนสินค้า)
- `POST /products/{id}/restore` (กู้คืนสินค้าที่ซ่อน)
- `POST /inventory/inbound`
- `POST /sales`
- `GET /dashboard/summary`
- `GET /reports/profit-loss`

## การใช้งานล่าสุด

- หน้า Products filter แบบ dynamic แล้ว (ไม่ต้องกดปุ่มค้นหา)
- ปุ่ม `รีเซต` ใช้ล้างเงื่อนไข filter ได้ทันที
- หน้า New Product รองรับอัปโหลด/ลากรูป แล้วบันทึกภาพเข้า `image_url`
- ตาราง Products และ Dashboard แสดงรูปสินค้าได้ทันที

## Optional: Supabase Agent Skills

```bash
npx skills add supabase/agent-skills
```
