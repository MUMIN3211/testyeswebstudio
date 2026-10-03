import Link from "next/link";

import { formatMoney } from "@/components/format";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const search = firstValue(params.search) ?? "";
  const category = firstValue(params.category) ?? "";
  const brand = firstValue(params.brand) ?? "";

  const result = await api
    .getProducts({
      search: search || undefined,
      category: category || undefined,
      brand: brand || undefined,
    })
    .then((data) => ({ data, error: null as string | null }))
    .catch((error: unknown) => ({
      data: null,
      error: error instanceof Error ? error.message : "โหลดรายการสินค้าไม่สำเร็จ",
    }));

  if (result.error || !result.data) {
    return (
      <section className="page">
        <h2 className="page-title">Products</h2>
        <p className="error">{result.error}</p>
      </section>
    );
  }

  const products = result.data;

  return (
    <section className="page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 className="page-title">Products</h2>
        <Link href="/products/new">
          <button>เพิ่มสินค้า</button>
        </Link>
      </div>

      <form className="panel row" method="get">
        <input name="search" placeholder="ค้นหา SKU/ชื่อสินค้า" defaultValue={search} />
        <select name="category" defaultValue={category}>
          <option value="">ทุกหมวดหมู่</option>
          <option value="shirt">shirt</option>
          <option value="hat">hat</option>
        </select>
        <select name="brand" defaultValue={brand}>
          <option value="">ทุกแบรนด์</option>
          <option value="Ferrari">Ferrari</option>
          <option value="Mercedes-Benz">Mercedes-Benz</option>
          <option value="Red Bull">Red Bull</option>
          <option value="McLaren">McLaren</option>
          <option value="BMW">BMW</option>
          <option value="Other">Other</option>
        </select>
        <button type="submit">Filter</button>
      </form>

      <article className="panel">
        {!products.length ? (
          <p className="muted">ยังไม่มีสินค้า</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>สินค้า</th>
                <th>หมวดหมู่</th>
                <th>แบรนด์</th>
                <th>ทุน</th>
                <th>ขาย</th>
                <th>กำไร/ชิ้น</th>
                <th>สต็อก</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const margin = Number.parseFloat(product.sell_price) - Number.parseFloat(product.cost_price);
                return (
                  <tr key={product.id}>
                    <td>{product.sku}</td>
                    <td>
                      <Link href={`/products/${product.id}`}>{product.name}</Link>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td>{formatMoney(product.cost_price)}</td>
                    <td>{formatMoney(product.sell_price)}</td>
                    <td>{formatMoney(margin)}</td>
                    <td>{product.stock_qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </article>
    </section>
  );
}
