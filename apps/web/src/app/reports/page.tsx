import { formatMoney } from "@/components/format";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = searchParams ? await searchParams : {};
  const start = firstValue(params.start) ?? "";
  const end = firstValue(params.end) ?? "";

  const result = await api
    .getProfitLoss(start || undefined, end || undefined)
    .then((data) => ({ data, error: null as string | null }))
    .catch((error: unknown) => ({
      data: null,
      error: error instanceof Error ? error.message : "โหลดรายงานไม่สำเร็จ",
    }));

  if (result.error || !result.data) {
    return (
      <section className="page">
        <h2 className="page-title">Profit / Loss Report</h2>
        <p className="error">{result.error}</p>
      </section>
    );
  }

  const report = result.data;

  return (
    <section className="page">
      <h2 className="page-title">Profit / Loss Report</h2>

      <form className="panel row" method="get">
        <label className="field">
          Start date
          <input type="date" name="start" defaultValue={start} />
        </label>
        <label className="field">
          End date
          <input type="date" name="end" defaultValue={end} />
        </label>
        <button type="submit">Apply</button>
      </form>

      <div className="grid-4">
        <article className="panel">
          <p className="kpi-label">ยอดขายรวม</p>
          <p className="kpi-value">{formatMoney(report.total_sales_amount)}</p>
        </article>
        <article className="panel">
          <p className="kpi-label">ต้นทุนรวม</p>
          <p className="kpi-value">{formatMoney(report.total_cost)}</p>
        </article>
        <article className="panel">
          <p className="kpi-label">กำไรสุทธิ</p>
          <p className="kpi-value">{formatMoney(report.total_profit_net)}</p>
        </article>
        <article className="panel">
          <p className="kpi-label">ขาดทุนรวม</p>
          <p className="kpi-value">{formatMoney(report.total_loss)}</p>
        </article>
      </div>

      <article className="panel">
        <h3>รายวัน</h3>
        {!report.daily.length ? (
          <p className="muted">ไม่พบข้อมูลในช่วงเวลานี้</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>วัน</th>
                <th>ยอดขายรวม</th>
                <th>กำไรสุทธิ</th>
                <th>ขาดทุนรวม</th>
              </tr>
            </thead>
            <tbody>
              {report.daily.map((row) => (
                <tr key={row.day}>
                  <td>{row.day}</td>
                  <td>{formatMoney(row.total_sales_amount)}</td>
                  <td>{formatMoney(row.total_profit_net)}</td>
                  <td>{formatMoney(row.total_loss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
