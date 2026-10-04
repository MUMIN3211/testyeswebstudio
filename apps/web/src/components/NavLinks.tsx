"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: "◧" },
  { href: "/products", label: "สินค้า", icon: "▤" },
  { href: "/products/new", label: "เพิ่มสินค้า", icon: "+" },
  { href: "/reports", label: "รายงาน", icon: "▲" },
];

function isActive(pathname: string, href: string) {
  if (href === "/products") {
    return pathname === "/products" || (pathname.startsWith("/products/") && pathname !== "/products/new");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav-links" aria-label="เมนูหลัก">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
