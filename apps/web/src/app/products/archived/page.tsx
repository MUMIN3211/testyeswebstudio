import { ProductsTableClient } from "@/components/ProductsTableClient";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ArchivedProductsPage() {
  return (
    <section className="page">
      <PageHeader
        title="สินค้าที่ซ่อน"
        subtitle="สินค้าที่ถูกซ่อนจากหน้าขาย ตรวจสอบแล้วกดกู้คืนเพื่อนำกลับมาขายได้"
        backHref="/products"
        backLabel="กลับไปหน้าสินค้า"
      />
      <ProductsTableClient view="archived" />
    </section>
  );
}
