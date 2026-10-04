"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AnimatedMoney } from "@/components/AnimatedMoney";
import { formatMoney } from "@/components/format";
import { Alert, EmptyState, StockBadge } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import { resolveProductImageUrl } from "@/lib/image";
import type { DashboardSummary } from "@/lib/types";

export function DashboardSummaryClient() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Repeated clicks on refresh can overlap; only the newest request may write state.
  const requestSeq = useRef(0);

  async function loadSummary() {
    const seq = ++requestSeq.current;
    setError(null);
    setRefreshing(true);
    try {
      const data = await api.getDashboardSummary();
      if (seq !== requestSeq.current) return;
      setSummary(data);
      setLastUpdated(new Date().toLocaleTimeString("th-TH"));
    } catch (requestError) {
      if (seq !== requestSeq.current) return;
      setError(errorMessage(requestError, "โหลดข้อมูล dashboard ไม่สำเร็จ"));
    } finally {
      if (seq === requestSeq.current) setRefreshing(false);
    }
  }

  // Load once on open; after that the dashboard only refreshes when the user clicks "รีเฟรช".
  // (Deferred a tick so the first setState doesn't run synchronously inside the effect.)
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => clearTimeout(initialTimer);
  }, []);

  if (!summary && !error) {
    return (
      <div className="grid-4" aria-busy="true">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="panel kpi">
            <div className="skeleton" style={{ height: 14, width: "50%" }} />
            <div className="skeleton" style={{ height: 26, width: "75%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <Alert tone="error">
        {error}{" "}
        <button type="button" className="secondary button-sm" onClick={loadSummary}>
          ลองอีกครั้ง
        </button>
      </Alert>
    );
  }

  const profit = Number.parseFloat(summary.total_profit_net);

  return (
    <>
      <div className="row">
        <span className="muted">อัปเดตล่าสุด {lastUpdated ?? "-"} · กดรีเฟรชเพื่อดูข้อมูลใหม่</span>
        <span className="spacer" />
        <button type="button" className="secondary button-sm" onClick={loadSummary} disabled={refreshing}>
          {refreshing ? "กำลังรีเฟรช..." : "↻ รีเฟรช"}
        </button>
      </div>

      {error ? <Alert tone="warning">รีเฟรชล่าสุดไม่สำเร็จ: {error}</Alert> : null}

      <div className="grid-4">
        <article className="panel kpi tone-blue">
          <div className="kpi-head">
            <p className="kpi-label">ทุนคงคลัง</p>
            <span className="kpi-icon" aria-hidden>
              ▣
            </span>
          </div>
          <p className="kpi-value"><AnimatedMoney value={summary.inventory_capital} /></p>
          <p className="kpi-hint">ทุนรับเข้ารวมของสินค้าทั้งที่ยังอยู่และขายแล้ว (ไม่รวมที่ซ่อน)</p>
        </article>
        <article className="panel kpi tone-red">
          <div className="kpi-head">
            <p className="kpi-label">ยอดขายรวม</p>
            <span className="kpi-icon" aria-hidden>
              ฿
            </span>
          </div>
          <p className="kpi-value"><AnimatedMoney value={summary.total_sales_amount} /></p>
          <p className="kpi-hint">รายได้จากการขาย (หักส่วนลดแล้ว)</p>
        </article>
        <article className={`panel kpi ${profit >= 0 ? "tone-green" : "tone-danger"}`}>
          <div className="kpi-head">
            <p className="kpi-label">กำไรสุทธิ</p>
            <span className="kpi-icon" aria-hidden>
              {profit >= 0 ? "▲" : "▼"}
            </span>
          </div>
          <p className={`kpi-value ${profit >= 0 ? "text-positive" : "text-negative"}`}>
            <AnimatedMoney value={summary.total_profit_net} />
          </p>
          <p className="kpi-hint">ยอดขาย − ต้นทุน − ส่วนลด + กำไรค่าส่ง {formatMoney(summary.total_shipping_profit)}</p>
        </article>
        <article className="panel kpi tone-amber">
          <div className="kpi-head">
            <p className="kpi-label">ขาดทุนรวม</p>
            <span className="kpi-icon" aria-hidden>
              !
            </span>
          </div>
          <p className="kpi-value"><AnimatedMoney value={summary.total_loss} /></p>
          <p className="kpi-hint">รวมบิลที่ขาดทุน (รวมค่าส่งและส่วนลด)</p>
        </article>
      </div>

      <div className="grid-2">
        <article className="panel panel-flush">
          <div className="panel-head">
            <h3>🏆 สินค้าขายดี</h3>
            <span className="muted">Top {summary.top_selling_products.length}</span>
          </div>
          {!summary.top_selling_products.length ? (
            <EmptyState icon="🛒">ยังไม่มีข้อมูลการขาย</EmptyState>
          ) : (
            <ol className="item-list">
              {summary.top_selling_products.map((item, index) => (
                <li key={item.product_id}>
                  <Link href={`/products/${item.product_id}`} className="item-row">
                    <span className="item-rank">{index + 1}</span>
                    <img className="thumb" src={resolveProductImageUrl(item.image_url)} alt="" />
                    <span className="item-main">
                      <span className="item-name">{item.name}</span>
                      <span className="sku">{item.sku}</span>
                    </span>
                    <span className="badge info">ขายแล้ว {item.qty_sold}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="panel panel-flush">
          <div className="panel-head">
            <h3>⚠ สินค้าใกล้หมด</h3>
            {summary.low_stock_products.length ? (
              <span className="muted">เหลือ ≤ {LOW_STOCK_THRESHOLD} ชิ้น · {summary.low_stock_products.length} รายการ</span>
            ) : null}
          </div>
          {!summary.low_stock_products.length ? (
            <EmptyState icon="✅">ไม่มีสินค้าใกล้หมด</EmptyState>
          ) : (
            <ul className="item-list">
              {summary.low_stock_products.map((item, index) => (
                <li key={item.product_id}>
                  <Link href={`/products/${item.product_id}`} className="item-row">
                    <span className="item-rank">{index + 1}</span>
                    <img className="thumb" src={resolveProductImageUrl(item.image_url)} alt="" />
                    <span className="item-main">
                      <span className="item-name">{item.name}</span>
                      <span className="sku">{item.sku}</span>
                    </span>
                    <StockBadge qty={item.stock_qty} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </>
  );
}
