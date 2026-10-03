import { SaleCreateForm } from "@/components/SaleCreateForm";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
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
        <h2 className="page-title">บันทึกการขาย</h2>
        <p className="error">{result.error}</p>
      </section>
    );
  }

  return (
    <section className="page">
      <h2 className="page-title">บันทึกการขาย</h2>
      <SaleCreateForm products={result.data} />
    </section>
  );
}
