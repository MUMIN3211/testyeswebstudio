import type { DashboardSummary, Product, ProfitLossReport, SaleResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type HttpMethod = "GET" | "POST" | "PATCH";

async function request<T>(path: string, method: HttpMethod = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      throw new Error(payload.detail ?? fallback);
    } catch {
      throw new Error(fallback);
    }
  }

  return (await response.json()) as T;
}

export const api = {
  getProducts(params?: { search?: string; category?: string; brand?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.brand) query.set("brand", params.brand);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Product[]>(`/products${suffix}`);
  },
  getProduct(id: string): Promise<Product> {
    return request<Product>(`/products/${id}`);
  },
  createProduct(payload: {
    sku: string;
    name: string;
    category: string;
    brand: string;
    cost_price: number;
    sell_price: number;
    defect_note?: string | null;
    image_url?: string | null;
  }): Promise<Product> {
    return request<Product>("/products", "POST", payload);
  },
  inboundStock(payload: { product_id: string; qty: number; unit_cost: number; note?: string | null }) {
    return request<{ product_id: string; stock_qty: number; cost_price: string }>("/inventory/inbound", "POST", payload);
  },
  createSale(payload: {
    note?: string | null;
    items: Array<{ product_id: string; qty: number; unit_sell_price?: number | null }>;
  }): Promise<SaleResponse> {
    return request<SaleResponse>("/sales", "POST", payload);
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
};
