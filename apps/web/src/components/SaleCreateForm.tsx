"use client";

import { type FormEvent, useState } from "react";

import { api } from "@/lib/api";
import { formatMoney } from "@/components/format";
import type { Product } from "@/lib/types";

type Props = {
  products: Product[];
};

type SaleLine = {
  product_id: string;
  qty: string;
  unit_sell_price: string;
};

export function SaleCreateForm({ products }: Props) {
  const initialProductId = products[0]?.id ?? "";
  const [lines, setLines] = useState<SaleLine[]>([{ product_id: initialProductId, qty: "1", unit_sell_price: "" }]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<SaleLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { product_id: initialProductId, qty: "1", unit_sell_price: "" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const selectedById = new Map(products.map((product) => [product.id, product]));
      const aggregateQty = new Map<string, number>();
      for (const line of lines) {
        const qty = Number.parseInt(line.qty, 10);
        if (!line.product_id || Number.isNaN(qty) || qty <= 0) {
          throw new Error("กรุณาเลือกสินค้าและระบุจำนวนให้ถูกต้อง");
        }
        aggregateQty.set(line.product_id, (aggregateQty.get(line.product_id) ?? 0) + qty);
      }

      for (const [productId, qty] of aggregateQty.entries()) {
        const product = selectedById.get(productId);
        if (!product) {
          throw new Error("ไม่พบข้อมูลสินค้าที่เลือก");
        }
        if (qty > product.stock_qty) {
          throw new Error(`สต็อกไม่พอสำหรับ ${product.sku} (ขอ ${qty}, คงเหลือ ${product.stock_qty})`);
        }
      }

      const payload = {
        note: note.trim() || null,
        items: lines.map((line) => ({
          product_id: line.product_id,
          qty: Number.parseInt(line.qty, 10),
          unit_sell_price: line.unit_sell_price ? Number.parseFloat(line.unit_sell_price) : null,
        })),
      };
      const sale = await api.createSale(payload);
      setSuccess(`ขายสำเร็จ เลขที่ ${sale.sale_no} | กำไรสุทธิ ${formatMoney(sale.total_profit)}`);
      setLines([{ product_id: initialProductId, qty: "1", unit_sell_price: "" }]);
      setNote("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "บันทึกการขายไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  if (!products.length) {
    return <p className="error">ยังไม่มีสินค้าในระบบ ให้สร้างสินค้าและรับของเข้าก่อน</p>;
  }

  return (
    <form className="grid-form panel" onSubmit={onSubmit}>
      {lines.map((line, index) => (
        <div className="panel panel-inner" key={`${line.product_id}-${index}`}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>รายการที่ {index + 1}</strong>
            <button type="button" className="secondary" onClick={() => removeLine(index)}>
              ลบรายการ
            </button>
          </div>
          <label className="field">
            สินค้า
            <select
              value={line.product_id}
              onChange={(event) => updateLine(index, { product_id: event.target.value })}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name} (คงเหลือ {product.stock_qty})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            จำนวน
            <input
              type="number"
              min="1"
              required
              value={line.qty}
              onChange={(event) => updateLine(index, { qty: event.target.value })}
            />
          </label>
          <label className="field">
            ราคาขายต่อชิ้น (ถ้าไม่ใส่จะใช้ราคาขายตั้งต้นของสินค้า)
            <input
              type="number"
              min="0"
              step="0.01"
              value={line.unit_sell_price}
              onChange={(event) => updateLine(index, { unit_sell_price: event.target.value })}
            />
          </label>
        </div>
      ))}
      <div className="row">
        <button type="button" className="secondary" onClick={addLine}>
          เพิ่มรายการสินค้า
        </button>
      </div>
      <label className="field">
        หมายเหตุบิล
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "บันทึกการขาย"}
      </button>
      {success ? <p className="success">{success}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
