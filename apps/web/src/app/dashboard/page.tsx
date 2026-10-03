import { formatMoney } from "@/components/format";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await api
    .getDashboardSummary()
    .then((data) => ({ data, error: null as string | null }))
    .catch((error: unknown) => ({
      data: null,
      error: error instanceof Error ? error.message : "โหลดข้อมูล dashboard ไม่สำเร็จ",
    }));

  if (result.error || !result.data) {
    return (
      <section className="page">
        <h2 className="page-title">Dashboard</h2>
        <p className="error">{result.error}</p>
      </section>
    );
  }

  const summary = result.data;

  return (
    <section className="page">
      <h2 className="page-title">Dashboard</h2>
      <div className="grid-4">
        <article className="panel">
          <p className="kpi-label">ทุนคงคลัง</p>
          <p className="kpi-value">{formatMoney(summary.inventory_capital)}</p>
        </article>
        <article className="panel">
          <p className="kpi-label">ยอดขายรวม</p>
          <p className="kpi-value">{formatMoney(summary.total_sales_amount)}</p>
        </article>
        <article className="panel">
          <p className="kpi-label">กำไรสุทธิ</p>
          <p className="kpi-value">{formatMoney(summary.total_profit_net)}</p>
        </article>
        <article className="panel">
          <p className="kpi-label">ขาดทุนรวม</p>
          <p className="kpi-value">{formatMoney(summary.total_loss)}</p>
        </article>
      </div>

      <article className="panel">
        <h3>สินค้าขายดี</h3>
        {!summary.top_selling_products.length ? (
          <p className="muted">ยังไม่มีข้อมูลการขาย</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>ชื่อสินค้า</th>
                <th>จำนวนขาย</th>
              </tr>
            </thead>
            <tbody>
              {summary.top_selling_products.map((item) => (
                <tr key={item.product_id}>
                  <td>{item.sku}</td>
                  <td>{item.name}</td>
                  <td>{item.qty_sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>

      <article className="panel">
        <h3>สินค้าใกล้หมด</h3>
        {!summary.low_stock_products.length ? (
          <p className="muted">ไม่มีสินค้าใกล้หมด</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>ชื่อสินค้า</th>
                <th>คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {summary.low_stock_products.map((item) => (
                <tr key={item.product_id}>
                  <td>{item.sku}</td>
                  <td>{item.name}</td>
                  <td>{item.stock_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
