import { ProductCreateForm } from "@/components/ProductCreateForm";

export default function NewProductPage() {
  return (
    <section className="page">
      <h2 className="page-title">เพิ่มสินค้าใหม่</h2>
      <ProductCreateForm />
    </section>
  );
}
