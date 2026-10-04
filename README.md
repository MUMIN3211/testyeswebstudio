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

## Deploy ขึ้น Vercel

แอปนี้ deploy เป็น **2 project บน Vercel** จาก repo เดียวกัน: API (FastAPI) และ Web (Next.js)

### ก่อน deploy

- รัน SQL ใน `supabase/schema.sql` บน Supabase ให้ครบ (บน Vercel API จะไม่สร้างตารางเอง)
- เอา connection string แบบ **Transaction pooler** (พอร์ต `6543`) จาก Supabase → Connect
  (host `db.<ref>.supabase.co` แบบ direct ใช้บน Vercel ไม่ได้ เพราะเป็น IPv6 อย่างเดียว)

### 1) Project: API

| ตั้งค่า | ค่า |
|---|---|
| Root Directory | `apps/api` |
| Framework Preset | FastAPI (Vercel หา `app` ใน `app/main.py` ให้เอง) |
| Region | `bom1` (Mumbai ใกล้ Supabase `ap-south-1`) ตั้งไว้แล้วใน `apps/api/vercel.json` |

Environment Variables:

- `DATABASE_URL` = Transaction pooler URL (พอร์ต `6543`)
- `CORS_ORIGINS` = URL ของ Web project เช่น `https://<web-project>.vercel.app` (คั่นหลายค่าด้วย `,`)

deploy แล้วเปิด `https://<api-project>.vercel.app/health` ต้องได้ `{"status":"ok"}`

### 2) Project: Web

| ตั้งค่า | ค่า |
|---|---|
| Root Directory | `apps/web` |
| Framework Preset | Next.js |

Environment Variables:

- `NEXT_PUBLIC_API_BASE_URL` = URL ของ API project เช่น `https://<api-project>.vercel.app` (ไม่มี `/` ท้าย)

> `NEXT_PUBLIC_*` ถูกฝังตอน build: ถ้าเปลี่ยนค่า ต้อง Redeploy Web ใหม่
>
> เมื่อได้ URL ของ Web แล้ว อย่าลืมกลับไปใส่ใน `CORS_ORIGINS` ของ API แล้ว Redeploy API

### ข้อจำกัดที่ควรรู้

- Vercel Function ตอบได้ไม่เกิน **4.5MB** ต่อ request: รูปสินค้าเก็บเป็นข้อความใน DB
  (ระบบย่อรูปเหลือ ~800px ตอนอัปโหลดแล้ว) ถ้าสินค้าเยอะมากควรย้ายรูปไป Supabase Storage
