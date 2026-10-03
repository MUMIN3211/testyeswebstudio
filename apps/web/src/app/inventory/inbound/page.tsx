import { StockInboundForm } from "@/components/StockInboundForm";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function InventoryInboundPage() {
  const result = await api
    .getProducts()
    .then((data) => ({ data, error: null as string | null }))
    .catch((error: unknown) => ({
      data: null,
      error: error instanceof Error ? error.message : "โหลดข้อมูลสินค้าไม่สำเร็จ",
    }));

  if (result.error || !result.data) {
    return (
      <section className="page">
        <h2 className="page-title">รับสินค้าเข้า</h2>
        <p className="error">{result.error}</p>
      </section>
    );
  }

  return (
    <section className="page">
      <h2 className="page-title">รับสินค้าเข้า</h2>
      <StockInboundForm products={result.data} />
    </section>
  );
}
