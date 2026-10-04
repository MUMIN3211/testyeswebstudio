import { formatDateTime, formatMoney } from "@/components/format";
import { Alert, PageHeader, StockBadge } from "@/components/ui";
import { api, settle } from "@/lib/api";
import { categoryLabel, productMargin } from "@/lib/catalog";
import { resolveProductImageUrl } from "@/lib/image";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  const result = await settle(api.getProduct(id), "โหลดรายละเอียดสินค้าไม่สำเร็จ");

  if (result.error || !result.data) {
    return (
      <section className="page">
        <PageHeader title="รายละเอียดสินค้า" backHref="/products" backLabel="กลับไปหน้าสินค้า" />
        <Alert tone="error">{result.error}</Alert>
      </section>
    );
  }

  const product = result.data;
  const cost = Number.parseFloat(product.cost_price);
  const sell = Number.parseFloat(product.sell_price);
  const { amount: margin, percent: marginPct } = productMargin(product);

  return (
    <section className="page">
      <PageHeader title="รายละเอียดสินค้า" backHref="/products" backLabel="กลับไปหน้าสินค้า" />

      <div className="detail-layout">
        <article className="panel">
          <img className="detail-image" src={resolveProductImageUrl(product.image_url)} alt={product.name} />
        </article>

        <div className="stack">
          <article className="panel stack">
            <div className="row">
              <span className="badge">{categoryLabel(product.category)}</span>
              <span className="badge">{product.brand}</span>
              {product.is_active ? (
                <span className="status-pill active">ใช้งาน</span>
              ) : (
                <span className="status-pill inactive">ซ่อนอยู่</span>
              )}
            </div>
            <div>
              <h3 className="detail-title">{product.name}</h3>
              <span className="sku">SKU · {product.sku}</span>
            </div>
            <div className="row">
              <span className="muted">คงเหลือ</span>
              <StockBadge qty={product.stock_qty} />
            </div>
          </article>

          <article className="panel stack">
            <p className="section-title">ราคา</p>
            <div className="grid-4">
              <div className="kpi panel-inner panel tone-blue">
                <p className="kpi-label">ราคาทุน</p>
                <p className="kpi-value">{formatMoney(product.cost_price)}</p>
              </div>
              <div className="kpi panel-inner panel tone-red">
                <p className="kpi-label">ราคาขาย</p>
                <p className="kpi-value">{formatMoney(product.sell_price)}</p>
              </div>
              <div className={`kpi panel-inner panel ${margin >= 0 ? "tone-green" : "tone-danger"}`}>
                <p className="kpi-label">กำไร/ชิ้น</p>
                <p className={`kpi-value ${margin >= 0 ? "text-positive" : "text-negative"}`}>{formatMoney(margin)}</p>
                <p className="kpi-hint">มาร์จิ้น {marginPct.toFixed(1)}%</p>
              </div>
            </div>
          </article>

          <article className="panel stack">
            <p className="section-title">ข้อมูลเพิ่มเติม</p>
            <dl className="spec-list">
              <div>
                <dt>มูลค่าทุนในสต็อก</dt>
                <dd>{formatMoney(cost * product.stock_qty)}</dd>
              </div>
              <div>
                <dt>มูลค่าขายในสต็อก</dt>
                <dd>{formatMoney(sell * product.stock_qty)}</dd>
              </div>
              <div>
                <dt>สร้างเมื่อ</dt>
                <dd>{formatDateTime(product.created_at)}</dd>
              </div>
              <div>
                <dt>แก้ไขล่าสุด</dt>
                <dd>{formatDateTime(product.updated_at)}</dd>
              </div>
            </dl>
            {product.defect_note ? (
              <Alert tone="warning">ตำหนิ: {product.defect_note}</Alert>
            ) : (
              <p className="muted">ไม่มีตำหนิ</p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
