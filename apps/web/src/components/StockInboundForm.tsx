"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

type Props = {
  products: Product[];
};

export function StockInboundForm({ products }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  const [note, setNote] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await api.inboundStock({
        product_id: productId,
        qty: Number.parseInt(qty, 10),
        unit_cost: Number.parseFloat(unitCost),
        note: note.trim() || null,
      });
      setMessage(`เติมสต็อกสำเร็จ สต็อกใหม่ ${result.stock_qty} ชิ้น`);
      setQty("1");
      setNote("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เติมสต็อกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  if (!products.length) {
    return <p className="error">ยังไม่มีสินค้าในระบบ ให้สร้างสินค้าก่อน</p>;
  }

  return (
    <form className="grid-form panel" onSubmit={onSubmit}>
      <label className="field">
        สินค้า
        <select value={productId} onChange={(event) => setProductId(event.target.value)}>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.sku} - {product.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        จำนวนที่รับเข้า
        <input type="number" min="1" required value={qty} onChange={(event) => setQty(event.target.value)} />
      </label>
      <label className="field">
        ราคาทุนต่อชิ้น
        <input type="number" min="0.01" step="0.01" required value={unitCost} onChange={(event) => setUnitCost(event.target.value)} />
      </label>
      <label className="field">
        หมายเหตุ
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "บันทึกรับสินค้าเข้า"}
      </button>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
