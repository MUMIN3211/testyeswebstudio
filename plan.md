# plan.md (draft by human in ~30 mins)

> เป้าหมาย: ทำเว็บสต็อกสินค้า motorsport เอาไว้ดูของเข้า/ของออก + กำไร ขาดทุน ทุน แบบใช้งานได้จริงก่อน

---

## 1) สรุปไอเดียระบบแบบเร็ว
- เว็บนี้ใช้เก็บสินค้า (เสื้อ/หมวกเป็นหลัก)
- ต้องเพิ่มสินค้าได้, ดู list ได้, ขายได้, เติมสต็อกได้
- ต้องเห็น dashboard รวมว่า:
  - ตอนนี้มีทุนในสต็อกเท่าไหร่
  - ขายไปเท่าไหร่
  - กำไรเท่าไหร่
  - ขาดทุนเท่าไหร่

---

## 2) Tech ที่จะใช้ (ตาม requirement)

### Frontend
- Next.js (main UI)
- CSS (Tailwind หรือ CSS module ค่อยตัดสินใจ)
- Vue: อาจใช้ทำ component ย่อยถ้าจำเป็น (ยังไม่ชัวร์)

### Backend
- FastAPI เป็น main API
- Node.js เป็น worker/cron (ถ้าต้องใช้)
- Supabase:
  - PostgreSQL (DB)
  - Storage (รูปสินค้า)
  - Auth (ถ้าจะล็อกอิน)

### หมายเหตุ
- มีคำว่า Java มาใน requirement ด้วย แต่ในแผนนี้ยังไม่ใช้ Java ก่อน

---

## 3) ประเภทสินค้า/หมวดหมู่/แบรนด์

### หมวดหมู่สินค้า
- เสื้อ
- หมวก

### แบรนด์ที่ต้องมี
- Ferrari
- Mercedes-Benz
- Red Bull
- McLaren
- BMW
- Other

---

## 4) ข้อมูลที่ต้องเก็บต่อสินค้า
- รหัสสินค้า (SKU) [required]
- ชื่อสินค้า [required]
- หมวดหมู่ [required]
- แบรนด์ [required]
- ราคาทุน [required]
- ราคาขาย [required]
- กำไร (คำนวณจากราคาขาย - ราคาทุน)
- รูปสินค้า [optional แต่ควรมี]
- ตำหนิ [optional]

---

## 5) DB draft (ยังไม่ final แต่พอเริ่มโค้ดได้)

## table: products
- id (uuid, pk)
- sku (text, unique)
- name (text)
- category (text)  // shirt, hat
- brand (text)     // Ferrari, etc.
- cost_price (numeric)
- sell_price (numeric)
- defect_note (text, nullable)
- image_url (text, nullable)
- created_at
- updated_at

## table: stock_movements
- id (uuid, pk)
- product_id (uuid, fk products.id)
- type (text) // IN, OUT, ADJUST
- qty (int)
- unit_cost (numeric, nullable)   // ใช้ตอน IN
- unit_price (numeric, nullable)  // ใช้ตอน OUT
- note (text, nullable)
- created_at

## table: sales
- id (uuid, pk)
- sale_no (text, unique)
- created_at
- total_amount (numeric)
- total_cost (numeric)
- total_profit (numeric)

## table: sale_items
- id (uuid, pk)
- sale_id (uuid, fk sales.id)
- product_id (uuid, fk products.id)
- qty (int)
- unit_sell_price (numeric)
- unit_cost_snapshot (numeric)
- line_profit (numeric)

> ตอนเริ่มจริงอาจแยก brands/categories เป็น master tables เพิ่มทีหลัง

---

## 6) Logic หลักที่ต้องทำให้ถูก

1. เพิ่มสินค้าใหม่
   - SKU ต้องไม่ซ้ำ
2. รับสินค้าเข้า
   - เพิ่ม movement type=IN
3. ขายสินค้า
   - เช็คก่อนว่าสต็อกพอไหม
   - ถ้าไม่พอห้ามขาย
   - ถ้าพอ: ลดสต็อก + บันทึก sales + sale_items + movement OUT
4. กำไร
   - ต่อรายการ: (ราคาขาย - ต้นทุน) * จำนวน
5. ขาดทุน
   - ถ้ากำไรติดลบให้แสดงเป็นขาดทุน

---

## 7) หน้า Frontend ที่อยากมี (MVP)

## /dashboard
- card: ทุนคงเหลือ
- card: ยอดขายรวม
- card: กำไรรวม
- card: ขาดทุนรวม
- ตารางสินค้าขายล่าสุด
- สินค้าใกล้หมด

## /products
- ตารางสินค้า
- filter: category, brand
- search: sku/name
- ปุ่มเพิ่มสินค้า

## /products/new
- ฟอร์มเพิ่มสินค้า + upload รูป

## /inventory/inbound
- ฟอร์มรับของเข้า

## /sales/new
- เลือกสินค้า + จำนวน + ราคาขายจริง

## /reports
- filter วันที่
- สรุปกำไร/ขาดทุนตามช่วงเวลา

---

## 8) API Draft (FastAPI)
- GET /products
- POST /products
- PATCH /products/{id}
- POST /inventory/inbound
- POST /sales
- GET /dashboard/summary
- GET /reports/profit-loss

error code คร่าวๆ:
- 400 bad request
- 404 not found
- 409 duplicate sku
- 422 validation error

---

## 9) สิ่งที่ต้องตัดสินใจเร็วๆ
- จะใช้ Next.js อย่างเดียวไหม (น่าจะใช่)
- จะเปิด auth ตั้งแต่แรกไหม (ถ้าเดโมคนเดียวอาจยังไม่เปิด)
- วิธีคำนวณต้นทุน: average cost หรือ fifo (เริ่ม average ก่อน)

---

## 10) TODO checklist เริ่มงาน

## Phase 1 setup
- [ ] init next.js app
- [ ] init fastapi app
- [ ] connect supabase db
- [ ] setup env

## Phase 2 product + stock in
- [ ] ทำ table products + stock_movements
- [ ] ทำ API เพิ่มสินค้า
- [ ] ทำ API รับของเข้า
- [ ] ทำหน้า list + add product

## Phase 3 sales + profit
- [ ] ทำ API ขายสินค้า
- [ ] เช็ค/ตัดสต็อก
- [ ] คำนวณกำไร
- [ ] ทำหน้า create sale

## Phase 4 dashboard/report
- [ ] endpoint summary
- [ ] dashboard ui
- [ ] report ตามช่วงเวลา

## Phase 5 polish
- [ ] validation ให้ครบ
- [ ] loading/error states หน้า frontend
- [ ] test จุดคำนวณกำไรและตัดสต็อก

---

## 11) Done criteria (แบบง่าย)
- เพิ่มสินค้าได้ครบฟิลด์
- ซื้อเข้า/ขายออกแล้วสต็อกถูก
- dashboard ตัวเลขรวมตรง
- แยกหมวดหมู่/แบรนด์ได้
- มีข้อมูลกำไร/ขาดทุนดูได้จริง

---

## 12) Notes ท้ายแผน
- แผนนี้เป็น draft เร็วภายใน 30 นาที เน้นให้เริ่มพัฒนาได้ก่อน
- ตอนเริ่ม implement จริงให้ล็อก schema final อีกครั้งก่อนยิง production
