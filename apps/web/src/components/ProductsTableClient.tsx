"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatMoney, toNumber } from "@/components/format";
import { Alert, EmptyState, StockBadge } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import {
  BRANDS,
  CATEGORIES,
  LOW_STOCK_THRESHOLD,
  categoryLabel,
  productMargin,
  stockStatus,
} from "@/lib/catalog";
import { resolveProductImageUrl } from "@/lib/image";
import {
  PROMOTIONS,
  type Promotion,
  promotionLabel,
  shippingSummary,
} from "@/lib/shipping";
import type { Brand, Category, Product } from "@/lib/types";

const brandOptions: Array<Brand | ""> = ["", ...BRANDS];
const categoryOptions: Array<Category | ""> = ["", ...CATEGORIES];
const SEARCH_DEBOUNCE_MS = 300;

type SaleDraft = {
  qty: string;
  unitSellPrice: string;
  promotion: Promotion | "";
};

const defaultSaleDraft: SaleDraft = {
  qty: "1",
  unitSellPrice: "",
  promotion: "",
};

type ProductsTableProps = {
  /** "active" = products on sale; "archived" = hidden products that can be restored. */
  view?: "active" | "archived";
};

export function ProductsTableClient({ view = "active" }: ProductsTableProps) {
  const archivedView = view === "archived";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [brand, setBrand] = useState<Brand | "">("");
  const [saleDrafts, setSaleDrafts] = useState<Record<string, SaleDraft>>({});
  const [shippingProfit, setShippingProfit] = useState<number | null>(null);

  useEffect(() => {
    if (archivedView) return;
    api
      .getShippingProfit()
      .then((data) => setShippingProfit(toNumber(data.total_shipping_profit)))
      .catch(() => {
        // The KPI is informational; the products table still works without it.
      });
  }, [archivedView]);

  // Wait for typing to pause before searching, so each keystroke doesn't fire a request.
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === debouncedSearch) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setDebouncedSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: category || undefined,
      brand: brand || undefined,
      archived: archivedView,
    }),
    [debouncedSearch, category, brand, archivedView],
  );

  const hasFilters = Boolean(search || category || brand);

  const { inStockProducts, outOfStockProducts, stats } = useMemo(() => {
    const inStock = products.filter((product) => product.stock_qty > 0);
    return {
      inStockProducts: inStock,
      outOfStockProducts: products.filter((product) => product.stock_qty <= 0),
      stats: {
        units: inStock.reduce((sum, product) => sum + product.stock_qty, 0),
        low: inStock.filter((product) => stockStatus(product.stock_qty) === "low").length,
      },
    };
  }, [products]);

  // Every product fetch takes a sequence number; only the latest one may write state,
  // so a slow response can never overwrite results for newer filters.
  const requestSeq = useRef(0);

  useEffect(() => {
    const seq = ++requestSeq.current;
    api
      .getProducts(filters)
      .then((data) => {
        if (seq === requestSeq.current) setProducts(data);
      })
      .catch((requestError: unknown) => {
        if (seq === requestSeq.current) setError(errorMessage(requestError, "โหลดรายการสินค้าไม่สำเร็จ"));
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  }, [filters]);

  function startFilterChange() {
    setLoading(true);
    setError(null);
  }

  function resetFilters() {
    // Only show loading if a request will actually go out; otherwise nothing would clear it.
    if (debouncedSearch || category || brand) setLoading(true);
    setError(null);
    setNotice(null);
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
    setBrand("");
  }

  function getSaleDraft(productId: string) {
    return saleDrafts[productId] ?? defaultSaleDraft;
  }

  function updateSaleDraft(productId: string, patch: Partial<SaleDraft>) {
    setSaleDrafts((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? defaultSaleDraft), ...patch },
    }));
  }

  /** Archive from the main list, or restore from the archived list; either way the row leaves this view. */
  async function toggleArchive(product: Product) {
    if (
      !archivedView &&
      !window.confirm(`ต้องการซ่อนสินค้า "${product.name}" (${product.sku}) ใช่ไหม?\nสามารถกู้คืนได้ภายหลัง`)
    ) {
      return;
    }
    setBusyProductId(product.id);
    setError(null);
    setNotice(null);
    try {
      await (archivedView ? api.restoreProduct(product.id) : api.archiveProduct(product.id));
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      setNotice(
        archivedView
          ? `กู้คืนสินค้า ${product.sku} แล้ว · กลับไปแสดงในหน้าสินค้า`
          : `ซ่อนสินค้า ${product.sku} แล้ว · ดูได้ที่หน้า "สินค้าที่ซ่อน"`,
      );
    } catch (requestError) {
      setError(errorMessage(requestError, archivedView ? "กู้คืนสินค้าไม่สำเร็จ" : "ซ่อนสินค้าไม่สำเร็จ"));
    } finally {
      setBusyProductId(null);
    }
  }

  async function sellProduct(product: Product) {
    const draft = getSaleDraft(product.id);
    const qty = Number.parseInt(draft.qty, 10);
    const unitSellPrice = draft.unitSellPrice ? Number.parseFloat(draft.unitSellPrice) : null;

    if (Number.isNaN(qty) || qty <= 0) {
      setError("จำนวนขายต้องมากกว่า 0");
      return;
    }
    if (qty > product.stock_qty) {
      setError(`สต็อกไม่พอสำหรับ ${product.sku} (ขอ ${qty}, คงเหลือ ${product.stock_qty})`);
      return;
    }
    if (unitSellPrice !== null && (Number.isNaN(unitSellPrice) || unitSellPrice < 0)) {
      setError("ราคาขายต้องไม่ติดลบ");
      return;
    }

    setBusyProductId(product.id);
    setError(null);
    setNotice(null);
    try {
      const sale = await api.createSale({
        note: `quick-sale:${product.sku}`,
        items: [{ product_id: product.id, qty, unit_sell_price: unitSellPrice }],
        promotion: draft.promotion || null,
      });
      // Apply the sale locally instead of refetching the whole list and the KPI.
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, stock_qty: item.stock_qty - qty } : item)),
      );
      setShippingProfit((prev) => (prev === null ? prev : prev + toNumber(sale.shipping_profit)));
      setSaleDrafts((prev) => ({ ...prev, [product.id]: defaultSaleDraft }));
      setNotice(
        `ขายสำเร็จ ${product.name} × ${qty} · เลขที่ ${sale.sale_no} · กำไร ${formatMoney(sale.total_profit)} (กำไรค่าส่ง ${formatMoney(sale.shipping_profit)})`,
      );
    } catch (requestError) {
      setError(errorMessage(requestError, "บันทึกการขายไม่สำเร็จ"));
    } finally {
      setBusyProductId(null);
    }
  }

  function renderSaleCell(product: Product, busy: boolean) {
    const draft = getSaleDraft(product.id);
    const shipping = shippingSummary([product.category], draft.promotion || null);
    return (
      <td>
        <div className="inline-sale">
          <input
            type="number"
            min="1"
            max={product.stock_qty}
            aria-label={`จำนวนขาย ${product.sku}`}
            value={draft.qty}
            onChange={(event) => updateSaleDraft(product.id, { qty: event.target.value })}
            className="tiny-input"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            aria-label={`ราคาขายต่อชิ้น ${product.sku}`}
            placeholder={toNumber(product.sell_price).toString()}
            title="เว้นว่างเพื่อใช้ราคาขายตั้งต้น"
            value={draft.unitSellPrice}
            onChange={(event) => updateSaleDraft(product.id, { unitSellPrice: event.target.value })}
            className="tiny-input"
          />
          <button type="button" className="button-sm success" disabled={busy} onClick={() => sellProduct(product)}>
            {busy ? "..." : "ขาย"}
          </button>
          <div className="inline-sale-ship">
            <select
              className="tiny-input"
              aria-label={`โปรโมชั่น ${product.sku}`}
              title="โปรโมชั่น"
              value={draft.promotion}
              onChange={(event) => updateSaleDraft(product.id, { promotion: event.target.value as Promotion | "" })}
            >
              <option value="">ไม่มีโปรฯ</option>
              {PROMOTIONS.map((promotion) => (
                <option key={promotion} value={promotion}>
                  {promotionLabel(promotion)}
                </option>
              ))}
            </select>
          </div>
          <span className={`inline-sale-hint ${shipping.shippingProfit >= 0 ? "text-positive" : "text-negative"}`}>
            ค่าส่ง {formatMoney(shipping.cost)} · เก็บ {formatMoney(shipping.charged)} · กำไรค่าส่ง{" "}
            {formatMoney(shipping.shippingProfit)}
            {shipping.discount ? ` · ลด ${formatMoney(shipping.discount)}` : ""}
          </span>
        </div>
      </td>
    );
  }

  function renderTable(rows: Product[], { showSale }: { showSale: boolean }) {
    return (
      <div className="table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
        <table>
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>หมวด / แบรนด์</th>
              <th className="num">ทุน</th>
              <th className="num">ขาย</th>
              <th className="num">กำไร/ชิ้น</th>
              <th>สต็อก</th>
              {showSale ? <th>ขายด่วน (จำนวน · ราคา · โปรฯ)</th> : null}
              <th className="num">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const margin = productMargin(product).amount;
              const busy = busyProductId === product.id;
              return (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      <img className="thumb" src={resolveProductImageUrl(product.image_url)} alt="" />
                      <div className="item-main">
                        <Link href={`/products/${product.id}`}>{product.name}</Link>
                        <span className="sku">{product.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="item-main">
                      <span>{categoryLabel(product.category)}</span>
                      <span className="item-meta">{product.brand}</span>
                    </div>
                  </td>
                  <td className="num muted">{formatMoney(product.cost_price)}</td>
                  <td className="num">{formatMoney(product.sell_price)}</td>
                  <td className={`num ${margin >= 0 ? "text-positive" : "text-negative"}`}>{formatMoney(margin)}</td>
                  <td>
                    <StockBadge qty={product.stock_qty} />
                  </td>
                  {showSale ? renderSaleCell(product, busy) : null}
                  <td className="num">
                    <button
                      type="button"
                      className={archivedView ? "button-sm" : "danger-ghost button-sm"}
                      disabled={busy}
                      onClick={() => toggleArchive(product)}
                    >
                      {busy ? "..." : archivedView ? "กู้คืน" : "ซ่อน"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderProducts() {
    if (!products.length) {
      return (
        <article className="panel panel-flush">
          {loading ? (
            <div className="panel-body stack">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="skeleton" style={{ height: 44 }} />
              ))}
            </div>
          ) : (
            <EmptyState>
              {hasFilters ? (
                <>
                  ไม่พบสินค้าที่ตรงกับตัวกรอง
                  <button type="button" className="secondary button-sm" onClick={resetFilters}>
                    ล้างตัวกรอง
                  </button>
                </>
              ) : archivedView ? (
                "ไม่มีสินค้าที่ซ่อนอยู่"
              ) : (
                <>
                  ยังไม่มีสินค้าในระบบ
                  <Link href="/products/new" className="button button-sm">
                    + เพิ่มสินค้าแรก
                  </Link>
                </>
              )}
            </EmptyState>
          )}
        </article>
      );
    }

    if (archivedView) {
      return <article className="panel panel-flush">{renderTable(products, { showSale: false })}</article>;
    }

    return (
      <>
        <article className="panel panel-flush">
          <div className="panel-head">
            <h3>สินค้าที่ยังมีอยู่</h3>
            <span className="muted">{inStockProducts.length} รายการ</span>
          </div>
          {inStockProducts.length ? (
            renderTable(inStockProducts, { showSale: true })
          ) : (
            <EmptyState icon="📦">ไม่มีสินค้าที่ยังมีสต็อก</EmptyState>
          )}
        </article>
        <article className="panel panel-flush">
          <div className="panel-head">
            <h3>สินค้าหมด</h3>
            <span className="muted">{outOfStockProducts.length} รายการ</span>
          </div>
          {outOfStockProducts.length ? (
            renderTable(outOfStockProducts, { showSale: false })
          ) : (
            <EmptyState icon="✅">ไม่มีสินค้าที่หมดสต็อก</EmptyState>
          )}
        </article>
      </>
    );
  }

  return (
    <>
      {archivedView ? null : (
        <div className="grid-4">
          <article className="panel kpi tone-blue">
            <p className="kpi-label">สินค้าที่ใช้งาน</p>
            <p className="kpi-value">{products.length}</p>
            <p className="kpi-hint">รายการตามตัวกรองปัจจุบัน</p>
          </article>
          <article className="panel kpi tone-green">
            <p className="kpi-label">จำนวนในสต็อก</p>
            <p className="kpi-value">{stats.units.toLocaleString("th-TH")}</p>
            <p className="kpi-hint">ชิ้นรวมทุกรายการ</p>
          </article>
          <article className="panel kpi tone-amber">
            <p className="kpi-label">ใกล้หมด</p>
            <p className="kpi-value">{stats.low}</p>
            <p className="kpi-hint">เหลือ ≤ {LOW_STOCK_THRESHOLD} ชิ้น</p>
          </article>
          <article className="panel kpi tone-danger">
            <p className="kpi-label">สินค้าหมด</p>
            <p className="kpi-value">{outOfStockProducts.length}</p>
            <p className="kpi-hint">ขายหมดแล้ว</p>
          </article>
          <article className="panel kpi tone-green">
            <p className="kpi-label">กำไรค่าส่ง</p>
            <p className="kpi-value">{shippingProfit === null ? "-" : formatMoney(shippingProfit)}</p>
            <p className="kpi-hint">ค่าส่งที่เก็บลูกค้า − ค่าส่งจริง</p>
          </article>
        </div>
      )}

      <article className="panel">
        <div className="toolbar">
          <div className="input-prefix">
            <span aria-hidden>⌕</span>
            <input
              type="search"
              value={search}
              placeholder="ค้นหาด้วย SKU หรือชื่อสินค้า"
              aria-label="ค้นหาสินค้า"
              onChange={(event) => {
                setError(null);
                setSearch(event.target.value);
              }}
            />
          </div>
          <select
            value={category}
            aria-label="หมวดหมู่"
            onChange={(event) => {
              startFilterChange();
              setCategory(event.target.value as Category | "");
            }}
          >
            {categoryOptions.map((item) => (
              <option key={item || "all-category"} value={item}>
                {item ? categoryLabel(item) : "ทุกหมวดหมู่"}
              </option>
            ))}
          </select>
          <select
            value={brand}
            aria-label="แบรนด์"
            onChange={(event) => {
              startFilterChange();
              setBrand(event.target.value as Brand | "");
            }}
          >
            {brandOptions.map((item) => (
              <option key={item || "all-brand"} value={item}>
                {item || "ทุกแบรนด์"}
              </option>
            ))}
          </select>
          <button type="button" className="ghost" onClick={resetFilters} disabled={!hasFilters}>
            ล้างตัวกรอง
          </button>
        </div>
        <div className="toolbar-foot">
          {archivedView ? (
            <span className="muted">สินค้าที่ซ่อนจะไม่แสดงในหน้าขายและไม่ถูกนับใน Dashboard</span>
          ) : (
            <Link href="/products/archived" className="toggle">
              ดูสินค้าที่ซ่อนอยู่ →
            </Link>
          )}
          <span className="muted">{loading ? "กำลังโหลด..." : `พบ ${products.length} รายการ`}</span>
        </div>
      </article>

      {notice ? (
        <Alert tone="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {renderProducts()}
    </>
  );
}
