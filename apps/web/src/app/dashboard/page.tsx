import Link from "next/link";

import { DashboardSummaryClient } from "@/components/DashboardSummaryClient";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <section className="page">
      <PageHeader
        title="Dashboard"
        subtitle="ภาพรวมทุนคงคลัง ยอดขาย และสินค้าที่ต้องจับตา"
        actions={
          <>
            <Link href="/products" className="button secondary">
              ไปหน้าขายสินค้า
            </Link>
            <Link href="/products/new" className="button">
              + เพิ่มสินค้า
            </Link>
          </>
        }
      />
      <DashboardSummaryClient />
    </section>
  );
}
