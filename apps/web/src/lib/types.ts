export type Category = "shirt" | "hat";
export type Brand = "Ferrari" | "Mercedes-Benz" | "Red Bull" | "McLaren" | "BMW" | "Other";

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: Category;
  brand: Brand;
  cost_price: string;
  sell_price: string;
  stock_qty: number;
  defect_note: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DashboardSummary = {
  inventory_capital: string;
  total_sales_amount: string;
  total_profit_net: string;
  total_loss: string;
  total_shipping_profit: string;
  top_selling_products: Array<{
    product_id: string;
    sku: string;
    name: string;
    image_url: string | null;
    qty_sold: number;
  }>;
  low_stock_products: Array<{
    product_id: string;
    sku: string;
    name: string;
    image_url: string | null;
    stock_qty: number;
  }>;
};

export type ProfitLossReport = {
  start_date: string | null;
  end_date: string | null;
  sales_count: number;
  total_sales_amount: string;
  total_cost: string;
  total_profit_net: string;
  total_loss: string;
  daily: Array<{
    day: string;
    total_sales_amount: string;
    total_profit_net: string;
    total_loss: string;
  }>;
};

export type SaleResponse = {
  id: string;
  sale_no: string;
  total_amount: string;
  total_cost: string;
  total_profit: string;
  shipping_charged: string;
  shipping_cost: string;
  shipping_profit: string;
  discount_amount: string;
  promotion: string | null;
  created_at: string;
  items: Array<{
    product_id: string;
    qty: number;
    unit_sell_price: string;
    unit_cost_snapshot: string;
    line_profit: string;
  }>;
};
