import { toNumber } from "@/components/format";
import type { Brand, Category, Product } from "@/lib/types";

/** Must match the API's default `low_stock_threshold` (apps/api/app/routers/dashboard.py). */
export const LOW_STOCK_THRESHOLD = 5;

export const CATEGORIES: Category[] = ["shirt", "hat"];
export const BRANDS: Brand[] = ["Ferrari", "Mercedes-Benz", "Red Bull", "McLaren", "BMW", "Other"];

const categoryLabels: Record<Category, string> = {
  shirt: "เสื้อ",
  hat: "หมวก",
};

export function categoryLabel(category: string) {
  return categoryLabels[category as Category] ?? category;
}

/** Profit per unit and margin as % of sell price. */
export function unitMargin(costPrice: string | number, sellPrice: string | number) {
  const cost = toNumber(costPrice);
  const sell = toNumber(sellPrice);
  const amount = sell - cost;
  return { amount, percent: sell > 0 ? (amount / sell) * 100 : 0 };
}

export function productMargin(product: Pick<Product, "cost_price" | "sell_price">) {
  return unitMargin(product.cost_price, product.sell_price);
}

export type StockStatus = "out" | "low" | "ok";

export function stockStatus(qty: number): StockStatus {
  if (qty <= 0) return "out";
  return qty <= LOW_STOCK_THRESHOLD ? "low" : "ok";
}
