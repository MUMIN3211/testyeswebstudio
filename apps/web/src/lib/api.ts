import type { Promotion } from "./shipping";
import type { DashboardSummary, Product, ProfitLossReport, SaleResponse } from "./types";

// Trailing slashes are dropped so `${API_BASE_URL}/path` never becomes "//path".
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").trim().replace(/\/+$/, "");

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null && "msg" in first) {
      const msg = (first as { msg?: unknown }).msg;
      if (typeof msg === "string") return msg;
    }
    return fallback;
  }
  if (typeof payload === "object" && payload !== null) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const first = detail[0];
      if (typeof first === "string") return first;
      if (typeof first === "object" && first !== null && "msg" in first) {
        const msg = (first as { msg?: unknown }).msg;
        if (typeof msg === "string") return msg;
      }
    }
  }
  return fallback;
}

async function request<T>(path: string, method: HttpMethod = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const responseText = await response.text();
  let parsed: unknown = null;
  if (responseText) {
    try {
      parsed = JSON.parse(responseText) as unknown;
    } catch {
      parsed = responseText;
    }
  }

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    throw new Error(getErrorMessage(parsed, fallback));
  }

  return (parsed ?? {}) as T;
}

/** The message to show for a failed request or action. */
export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** Run a request for a server component: never throws, returns either data or an error message. */
export function settle<T>(promise: Promise<T>, fallback: string) {
  return promise
    .then((data) => ({ data, error: null as string | null }))
    .catch((error: unknown) => ({ data: null, error: errorMessage(error, fallback) }));
}

export const api = {
  getProducts(params?: {
    search?: string;
    category?: string;
    brand?: string;
    include_inactive?: boolean;
    archived?: boolean;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.brand) query.set("brand", params.brand);
    if (params?.include_inactive) query.set("include_inactive", "true");
    if (params?.archived) query.set("archived", "true");
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Product[]>(`/products${suffix}`);
  },
  getProduct(id: string): Promise<Product> {
    return request<Product>(`/products/${id}`);
  },
  createProduct(payload: {
    name: string;
    category: string;
    brand: string;
    cost_price: number;
    sell_price: number;
    initial_stock_qty: number;
    defect_note?: string | null;
    image_url?: string | null;
  }): Promise<Product> {
    return request<Product>("/products", "POST", payload);
  },
  createSale(payload: {
    note?: string | null;
    items: Array<{ product_id: string; qty: number; unit_sell_price?: number | null }>;
    promotion?: Promotion | null;
  }): Promise<SaleResponse> {
    return request<SaleResponse>("/sales", "POST", payload);
  },
  getShippingProfit(): Promise<{ total_shipping_profit: string }> {
    return request<{ total_shipping_profit: string }>("/sales/shipping-profit");
  },
  getDashboardSummary(): Promise<DashboardSummary> {
    return request<DashboardSummary>("/dashboard/summary");
  },
  getProfitLoss(start?: string, end?: string): Promise<ProfitLossReport> {
    const query = new URLSearchParams();
    if (start) query.set("start", start);
    if (end) query.set("end", end);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ProfitLossReport>(`/reports/profit-loss${suffix}`);
  },
  archiveProduct(id: string): Promise<void> {
    return request<void>(`/products/${id}`, "DELETE");
  },
  restoreProduct(id: string): Promise<Product> {
    return request<Product>(`/products/${id}/restore`, "POST");
  },
};
