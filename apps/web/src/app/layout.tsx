import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";

import { NavLinks } from "@/components/NavLinks";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={`${rajdhani.variable} ${orbitron.variable}`}>
      <body>
        <header className="app-header">
          <div className="shell">
            <Link href="/dashboard" className="brand">
              <span className="brand-mark">F1</span>
              <span className="brand-text">
                <span className="brand-title">F1 Inventory</span>
                <span className="brand-sub">สต็อก · การขาย · กำไร/ขาดทุน</span>
              </span>
            </Link>
            <NavLinks />
          </div>
        </header>
        <main className="shell app-main">{children}</main>
      </body>
    </html>
  );
}
