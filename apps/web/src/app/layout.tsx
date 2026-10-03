import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Motorsport Inventory",
  description: "Inventory, sales, and profit dashboard",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="app-header">
          <div className="shell">
            <h1>Motorsport Inventory</h1>
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
