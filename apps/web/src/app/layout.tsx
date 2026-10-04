import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

// Fonts load straight from Google Fonts: next/font/google fails to build on Vercel with Turbopack in this setup.
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700&family=Rajdhani:wght@400;500;600;700&display=swap";

export const metadata: Metadata = {
  title: "Formula 1 Inventory",
  description: "Formula 1 merch inventory, sales, and profit dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
      </head>
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
