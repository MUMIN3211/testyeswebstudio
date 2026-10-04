import type { Category } from "@/lib/types";

/**
 * Must match the API (apps/api/app/routers/sales.py).
 * Shipping is charged once per sale and depends on the category:
 * shirts ship for 28 and the customer pays 40; hats ship for 50 and the customer pays 50.
 * A sale containing any hat uses the hat rate.
 */
const SHIPPING_RATES: Record<Category, { cost: number; fee: number }> = {
  shirt: { cost: 28, fee: 40 },
  hat: { cost: 50, fee: 50 },
};

export const PROMOTIONS = ["FREE_SHIPPING", "DISCOUNT_20"] as const;
export type Promotion = (typeof PROMOTIONS)[number];

const PROMOTION_DISCOUNT = 20;

const promotionLabels: Record<Promotion, string> = {
  FREE_SHIPPING: "ส่งฟรี",
  DISCOUNT_20: "ลด 20 บาท",
};

export function promotionLabel(promotion: Promotion) {
  return promotionLabels[promotion];
}

/** FREE_SHIPPING waives the fee; DISCOUNT_20 takes 20 off the goods but still charges shipping. */
export function shippingSummary(categories: Category[], promotion: Promotion | null) {
  const { cost, fee } = SHIPPING_RATES[categories.includes("hat") ? "hat" : "shirt"];
  const charged = promotion === "FREE_SHIPPING" ? 0 : fee;
  const discount = promotion === "DISCOUNT_20" ? PROMOTION_DISCOUNT : 0;
  return { cost, charged, discount, shippingProfit: charged - cost };
}
