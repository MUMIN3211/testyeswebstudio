"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import type { Brand, Category } from "@/lib/types";

const categories: Category[] = ["shirt", "hat"];
const brands: Brand[] = ["Ferrari", "Mercedes-Benz", "Red Bull", "McLaren", "BMW", "Other"];

export function ProductCreateForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "shirt",
    brand: "Ferrari",
    cost_price: "0",
    sell_price: "0",
    defect_note: "",
    image_url: "",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const created = await api.createProduct({
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand,
        cost_price: Number.parseFloat(formData.cost_price),
        sell_price: Number.parseFloat(formData.sell_price),
        defect_note: formData.defect_note.trim() || null,
        image_url: formData.image_url.trim() || null,
      });
      setMessage(`สร้างสินค้าเรียบร้อย: ${created.sku}`);
      setFormData((prev) => ({ ...prev, sku: "", name: "", defect_note: "", image_url: "" }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "สร้างสินค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid-form panel" onSubmit={onSubmit}>
      <label className="field">
        SKU
        <input
          required
          value={formData.sku}
          onChange={(event) => setFormData((prev) => ({ ...prev, sku: event.target.value }))}
        />
      </label>
      <label className="field">
        ชื่อสินค้า
        <input
          required
          value={formData.name}
          onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
        />
      </label>
      <label className="field">
        หมวดหมู่
        <select
          value={formData.category}
          onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        แบรนด์
        <select value={formData.brand} onChange={(event) => setFormData((prev) => ({ ...prev, brand: event.target.value }))}>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        ราคาทุน
        <input
          required
          type="number"
          min="0"
          step="0.01"
          value={formData.cost_price}
          onChange={(event) => setFormData((prev) => ({ ...prev, cost_price: event.target.value }))}
        />
      </label>
      <label className="field">
        ราคาขาย
        <input
          required
          type="number"
          min="0"
          step="0.01"
          value={formData.sell_price}
          onChange={(event) => setFormData((prev) => ({ ...prev, sell_price: event.target.value }))}
        />
      </label>
      <label className="field">
        URL รูปสินค้า (optional)
        <input
          value={formData.image_url}
          onChange={(event) => setFormData((prev) => ({ ...prev, image_url: event.target.value }))}
        />
      </label>
      <label className="field">
        ตำหนิ (optional)
        <textarea
          rows={3}
          value={formData.defect_note}
          onChange={(event) => setFormData((prev) => ({ ...prev, defect_note: event.target.value }))}
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "สร้างสินค้า"}
      </button>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
