import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Formula 1 Inventory",
  description: "Formula 1 merch inventory, sales, and profit dashboard",
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/products/new", label: "New Product" },
  { href: "/inventory/inbound", label: "Stock In" },
  { href: "/sales/new", label: "New Sale" },
  { href: "/reports", label: "Reports" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${orbitron.variable}`}>
      <body>
        <header className="app-header">
          <div className="shell">
            <h1>Formula 1 Inventory · Stock &amp; P/L</h1>
            <nav className="nav-links">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="shell app-main">{children}</main>
      </body>
    </html>
  );
}
