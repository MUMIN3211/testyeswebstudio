import Link from "next/link";

import { formatMoney, shiftIsoDate, shopToday } from "@/components/format";
import { Alert, EmptyState, PageHeader } from "@/components/ui";
import { api, settle } from "@/lib/api";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildPresets() {
  // Presets are computed on the server, so anchor "today" to the shop's timezone, not the host's.
  const today = shopToday();
  const daysAgo = (days: number) => shiftIsoDate(today, -days);
  return [
    { label: "ทั้งหมด", start: "", end: "" },
    { label: "วันนี้", start: today, end: today },
    { label: "7 วันล่าสุด", start: daysAgo(6), end: today },
    { label: "30 วันล่าสุด", start: daysAgo(29), end: today },
    { label: "เดือนนี้", start: `${today.slice(0, 8)}01`, end: today },
  ];
}

function presetHref(start: string, end: string) {
  const query = new URLSearchParams();
  if (start) query.set("start", start);
  if (end) query.set("end", end);
  const qs = query.toString();
  return qs ? `/reports?${qs}` : "/reports";
}

function formatDay(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString("th-TH", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = searchParams ? await searchParams : {};
  const start = firstValue(params.start) ?? "";
  const end = firstValue(params.end) ?? "";
  const presets = buildPresets();

  const result = await settle(api.getProfitLoss(start || undefined, end || undefined), "โหลดรายงานไม่สำเร็จ");

  const rangeLabel = start || end ? `${start || "เริ่มต้น"} ถึง ${end || "ปัจจุบัน"}` : "ทุกช่วงเวลา";

  const filterPanel = (
    <article className="panel stack">
      <div className="chip-group">
        {presets.map((preset) => (
          <Link
            key={preset.label}
            href={presetHref(preset.start, preset.end)}
            className={`chip ${preset.start === start && preset.end === end ? "active" : ""}`}
          >
            {preset.label}
          </Link>
        ))}
      </div>
      <form className="filter-form" method="get">
        <label className="field">
          ตั้งแต่วันที่
          <input type="date" name="start" defaultValue={start} />
        </label>
        <label className="field">
          ถึงวันที่
          <input type="date" name="end" defaultValue={end} />
        </label>
        <button type="submit">ดูรายงาน</button>
        {start || end ? (
          <Link href="/reports" className="button ghost">
            ล้าง
          </Link>
        ) : null}
      </form>
    </article>
  );

  if (result.error || !result.data) {
    return (
      <section className="page">
        <PageHeader title="Profit / Loss Report" subtitle={rangeLabel} />
        {filterPanel}
        <Alert tone="error">{result.error}</Alert>
      </section>
    );
  }

  const report = result.data;
  const profit = Number.parseFloat(report.total_profit_net);
  const salesAmount = Number.parseFloat(report.total_sales_amount);
  const marginPct = salesAmount > 0 ? (profit / salesAmount) * 100 : 0;
  const maxDailySales = Math.max(1, ...report.daily.map((row) => Number.parseFloat(row.total_sales_amount) || 0));

  return (
    <section className="page">
      <PageHeader title="Profit / Loss Report" subtitle={`ช่วงเวลา: ${rangeLabel} · ${report.sales_count} บิล`} />

      {filterPanel}

      <div className="grid-4">
        <article className="panel kpi tone-red">
          <p className="kpi-label">ยอดขายรวม</p>
          <p className="kpi-value">{formatMoney(report.total_sales_amount)}</p>
          <p className="kpi-hint">{report.sales_count} บิล</p>
        </article>
        <article className="panel kpi tone-blue">
          <p className="kpi-label">ต้นทุนรวม</p>
          <p className="kpi-value">{formatMoney(report.total_cost)}</p>
          <p className="kpi-hint">ต้นทุนสินค้าที่ขายไป</p>
        </article>
        <article className={`panel kpi ${profit >= 0 ? "tone-green" : "tone-danger"}`}>
          <p className="kpi-label">กำไรสุทธิ</p>
          <p className={`kpi-value ${profit >= 0 ? "text-positive" : "text-negative"}`}>{formatMoney(report.total_profit_net)}</p>
          <p className="kpi-hint">มาร์จิ้น {marginPct.toFixed(1)}%</p>
        </article>
        <article className="panel kpi tone-amber">
          <p className="kpi-label">ขาดทุนรวม</p>
          <p className="kpi-value">{formatMoney(report.total_loss)}</p>
          <p className="kpi-hint">รายการที่ขายต่ำกว่าทุน</p>
        </article>
      </div>

      <article className="panel panel-flush">
        <div className="panel-head">
          <h3>สรุปรายวัน</h3>
          <span className="muted">{report.daily.length} วัน</span>
        </div>
        {!report.daily.length ? (
          <EmptyState icon="📅">ไม่พบข้อมูลการขายในช่วงเวลานี้</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th className="num">ยอดขายรวม</th>
                  <th className="num">กำไรสุทธิ</th>
                  <th className="num">ขาดทุนรวม</th>
                </tr>
              </thead>
              <tbody>
                {report.daily.map((row) => {
                  const daySales = Number.parseFloat(row.total_sales_amount) || 0;
                  const dayProfit = Number.parseFloat(row.total_profit_net) || 0;
                  const dayLoss = Number.parseFloat(row.total_loss) || 0;
                  return (
                    <tr key={row.day}>
                      <td>{formatDay(row.day)}</td>
                      <td className="num">
                        <div className="bar-cell">
                          <div className="bar-track" aria-hidden>
                            <div className="bar-fill" style={{ width: `${(daySales / maxDailySales) * 100}%` }} />
                          </div>
                          {formatMoney(row.total_sales_amount)}
                        </div>
                      </td>
                      <td className={`num ${dayProfit >= 0 ? "text-positive" : "text-negative"}`}>
                        {formatMoney(row.total_profit_net)}
                      </td>
                      <td className={`num ${dayLoss > 0 ? "text-negative" : "muted"}`}>{formatMoney(row.total_loss)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>รวม</td>
                  <td className="num">{formatMoney(report.total_sales_amount)}</td>
                  <td className={`num ${profit >= 0 ? "text-positive" : "text-negative"}`}>{formatMoney(report.total_profit_net)}</td>
                  <td className="num">{formatMoney(report.total_loss)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
