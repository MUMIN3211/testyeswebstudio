"use client";

import { type ChangeEvent, type DragEvent, type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatMoney } from "@/components/format";
import { Alert } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { BRANDS, CATEGORIES, categoryLabel, unitMargin } from "@/lib/catalog";

const DEFAULT_FORM = {
  name: "",
  category: "shirt",
  brand: "Ferrari",
  cost_price: "",
  sell_price: "",
  initial_stock_qty: "1",
  defect_note: "",
  image_url: "",
};

async function fileToDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("ไฟล์รูปใหญ่เกิน 2MB กรุณาเลือกรูปที่เล็กลง");
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

export function ProductCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [dragging, setDragging] = useState(false);

  async function applyImageFile(file: File | undefined) {
    if (!file) return;
    try {
      setError(null);
      const dataUrl = await fileToDataUrl(file);
      setFormData((prev) => ({ ...prev, image_url: dataUrl }));
    } catch (fileError) {
      setError(errorMessage(fileError, "อัปโหลดรูปไม่สำเร็จ"));
    }
  }

  function onImageInput(event: ChangeEvent<HTMLInputElement>) {
    void applyImageFile(event.target.files?.[0]);
  }

  function onDropImage(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void applyImageFile(event.dataTransfer.files?.[0]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setCreatedId(null);
    setError(null);
    try {
      const initialStockQty = Number.parseInt(formData.initial_stock_qty, 10);
      const costPrice = Number.parseFloat(formData.cost_price);
      const sellPrice = Number.parseFloat(formData.sell_price);

      if (Number.isNaN(initialStockQty) || initialStockQty < 1) {
        throw new Error("จำนวนสต็อกตั้งต้นต้องมีอย่างน้อย 1 ชิ้น");
      }
      if (Number.isNaN(costPrice) || costPrice < 0) {
        throw new Error("กรุณาใส่ราคาทุนให้ถูกต้อง");
      }
      if (Number.isNaN(sellPrice) || sellPrice < 0) {
        throw new Error("กรุณาใส่ราคาขายให้ถูกต้อง");
      }

      const created = await api.createProduct({
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand,
        cost_price: costPrice,
        sell_price: sellPrice,
        initial_stock_qty: initialStockQty,
        defect_note: formData.defect_note.trim() || null,
        image_url: formData.image_url.trim() || null,
      });
      setMessage(`สร้างสินค้าเรียบร้อย: ${created.name} (${created.sku})`);
      setCreatedId(created.id);
      setFormData(DEFAULT_FORM);
      setDragging(false);
      router.refresh();
    } catch (submitError) {
      setError(errorMessage(submitError, "สร้างสินค้าไม่สำเร็จ"));
    } finally {
      setLoading(false);
    }
  }

  const previewCost = Number.parseFloat(formData.cost_price);
  const previewSell = Number.parseFloat(formData.sell_price);
  const previewQty = Number.parseInt(formData.initial_stock_qty, 10);
  const hasPrices = !Number.isNaN(previewCost) && !Number.isNaN(previewSell);
  const { amount: previewMargin, percent: previewMarginPct } = hasPrices ? unitMargin(previewCost, previewSell) : { amount: 0, percent: 0 };

  return (
    <form className="form-layout" onSubmit={onSubmit}>
      <div className="stack">
        <article className="panel form-section">
          <p className="section-title">ข้อมูลสินค้า</p>
          <label className="field">
            <span className="required">ชื่อสินค้า</span>
            <input
              required
              placeholder="เช่น Ferrari Team T-Shirt 2026"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              หมวดหมู่
              <select
                value={formData.category}
                onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              แบรนด์ / ทีม
              <select value={formData.brand} onChange={(event) => setFormData((prev) => ({ ...prev, brand: event.target.value }))}>
                {BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            ตำหนิ / หมายเหตุ
            <textarea
              rows={2}
              placeholder="ไม่บังคับ เช่น มีรอยเปื้อนเล็กน้อยที่แขนเสื้อ"
              value={formData.defect_note}
              onChange={(event) => setFormData((prev) => ({ ...prev, defect_note: event.target.value }))}
            />
          </label>
        </article>

        <article className="panel form-section">
          <p className="section-title">ราคาและสต็อก</p>
          <div className="form-grid">
            <label className="field">
              <span className="required">ราคาทุน (บาท)</span>
              <div className="input-prefix">
                <span aria-hidden>฿</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost_price}
                  onChange={(event) => setFormData((prev) => ({ ...prev, cost_price: event.target.value }))}
                />
              </div>
            </label>
            <label className="field">
              <span className="required">ราคาขาย (บาท)</span>
              <div className="input-prefix">
                <span aria-hidden>฿</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.sell_price}
                  onChange={(event) => setFormData((prev) => ({ ...prev, sell_price: event.target.value }))}
                />
              </div>
            </label>
            <label className="field">
              <span className="required">สต็อกตั้งต้น (ชิ้น)</span>
              <input
                required
                type="number"
                min="1"
                step="1"
                value={formData.initial_stock_qty}
                onChange={(event) => setFormData((prev) => ({ ...prev, initial_stock_qty: event.target.value }))}
              />
            </label>
          </div>
          <div className="preview-card">
            <div className="preview-line">
              <span className="muted">กำไรต่อชิ้น</span>
              <strong className={previewMargin >= 0 ? "text-positive" : "text-negative"}>
                {hasPrices ? `${formatMoney(previewMargin)} (${previewMarginPct.toFixed(1)}%)` : "-"}
              </strong>
            </div>
            <div className="preview-line">
              <span className="muted">มูลค่าทุนของสต็อกตั้งต้น</span>
              <strong>{!Number.isNaN(previewCost) && !Number.isNaN(previewQty) ? formatMoney(previewCost * previewQty) : "-"}</strong>
            </div>
            {hasPrices && previewMargin < 0 ? <p className="error">ราคาขายต่ำกว่าราคาทุน</p> : null}
          </div>
        </article>
      </div>

      <div className="stack">
        <article className="panel form-section">
          <p className="section-title">รูปสินค้า</p>
          {formData.image_url ? (
            <div className="image-preview-wrap">
              <img className="image-preview" src={formData.image_url} alt="ตัวอย่างรูปสินค้า" />
              <div className="row">
                <label className="button secondary button-sm" style={{ position: "relative", flex: 1 }}>
                  เปลี่ยนรูป
                  <input className="dropzone-input" type="file" accept="image/*" onChange={onImageInput} />
                </label>
                <button
                  type="button"
                  className="danger-ghost button-sm"
                  style={{ flex: 1 }}
                  onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                >
                  ลบรูป
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`dropzone ${dragging ? "dropzone-active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDropImage}
            >
              <input className="dropzone-input" type="file" accept="image/*" onChange={onImageInput} aria-label="เลือกรูปสินค้า" />
              <span className="dropzone-icon" aria-hidden>
                🖼
              </span>
              <strong>ลากรูปมาวาง หรือคลิกเพื่อเลือก</strong>
              <span className="field-hint">PNG / JPG ขนาดไม่เกิน 2MB</span>
            </div>
          )}
        </article>

        <article className="panel form-section">
          <p className="field-hint">SKU จะถูกสร้างอัตโนมัติ และฟอร์มจะรีเซ็ตหลังบันทึกทุกครั้ง</p>
          {message ? (
            <Alert tone="success" onClose={() => setMessage(null)}>
              {message}
              {createdId ? (
                <>
                  {" · "}
                  <Link href={`/products/${createdId}`}>ดูสินค้า</Link>
                </>
              ) : null}
            </Alert>
          ) : null}
          {error ? (
            <Alert tone="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          ) : null}
          <div className="form-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setFormData(DEFAULT_FORM);
                setError(null);
              }}
            >
              ล้างฟอร์ม
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? "กำลังบันทึก..." : "บันทึกสินค้า"}
            </button>
          </div>
        </article>
      </div>
    </form>
  );
}
