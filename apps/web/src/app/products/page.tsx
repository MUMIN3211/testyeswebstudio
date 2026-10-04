import Link from "next/link";

import { ProductsTableClient } from "@/components/ProductsTableClient";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <section className="page">
      <PageHeader
        title="Products"
        subtitle="ค้นหา ขายด่วน และจัดการสินค้าทั้งหมดได้จากหน้านี้"
        actions={
          <>
            <Link href="/products/archived" className="button secondary">
              สินค้าที่ซ่อน
            </Link>
            <Link href="/products/new" className="button">
              + เพิ่มสินค้า
            </Link>
          </>
        }
      />
      <ProductsTableClient />
    </section>
  );
}
