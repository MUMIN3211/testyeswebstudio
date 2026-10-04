import { ProductCreateForm } from "@/components/ProductCreateForm";
import { PageHeader } from "@/components/ui";

export default function NewProductPage() {
  return (
    <section className="page">
      <PageHeader
        title="เพิ่มสินค้าใหม่"
        subtitle="กรอกข้อมูลให้ครบ ระบบจะสร้าง SKU ให้อัตโนมัติ"
        backHref="/products"
        backLabel="กลับไปหน้าสินค้า"
      />
      <ProductCreateForm />
    </section>
  );
}
