import { formatMoney } from "@/components/format";
import { api } from "@/lib/api";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  const result = await api
    .getProduct(id)
    .then((data) => ({ data, error: null as string | null }))
    .catch((error: unknown) => ({
      data: null,
      error: error instanceof Error ? error.message : "โหลดรายละเอียดสินค้าไม่สำเร็จ",
    }));

  if (result.error || !result.data) {
    return (
      <section className="page">
        <h2 className="page-title">รายละเอียดสินค้า</h2>
        <p className="error">{result.error}</p>
      </section>
    );
  }

  const product = result.data;
  const margin = Number.parseFloat(product.sell_price) - Number.parseFloat(product.cost_price);
  return (
    <section className="page">
      <h2 className="page-title">รายละเอียดสินค้า</h2>
      <article className="panel">
        <p>
          <strong>SKU:</strong> {product.sku}
        </p>
        <p>
          <strong>ชื่อสินค้า:</strong> {product.name}
        </p>
        <p>
          <strong>หมวดหมู่:</strong> {product.category}
        </p>
        <p>
          <strong>แบรนด์:</strong> {product.brand}
        </p>
        <p>
          <strong>ราคาทุน:</strong> {formatMoney(product.cost_price)}
        </p>
        <p>
          <strong>ราคาขาย:</strong> {formatMoney(product.sell_price)}
        </p>
        <p>
          <strong>กำไร/ชิ้น:</strong> {formatMoney(margin)}
        </p>
        <p>
          <strong>คงเหลือ:</strong> {product.stock_qty}
        </p>
        <p>
          <strong>ตำหนิ:</strong> {product.defect_note || "-"}
        </p>
        <p>
          <strong>รูปสินค้า:</strong>{" "}
          {product.image_url ? (
            <a href={product.image_url} target="_blank" rel="noreferrer">
              {product.image_url}
            </a>
          ) : (
            "-"
          )}
        </p>
      </article>
    </section>
  );
}
