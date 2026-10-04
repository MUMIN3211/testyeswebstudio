import Link from "next/link";
import type { ReactNode } from "react";

import { stockStatus } from "@/lib/catalog";

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({ title, subtitle, actions, backHref, backLabel = "ย้อนกลับ" }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {backHref ? (
          <Link href={backHref} className="back-link">
            ← {backLabel}
          </Link>
        ) : null}
        <h2 className="page-title">{title}</h2>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </header>
  );
}

type AlertProps = {
  tone: "success" | "error" | "warning";
  children: ReactNode;
  onClose?: () => void;
};

const alertIcons = { success: "✓", error: "!", warning: "⚠" } as const;

export function Alert({ tone, children, onClose }: AlertProps) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <span aria-hidden>{alertIcons[tone]}</span>
      <div>{children}</div>
      {onClose ? (
        <button type="button" className="alert-close" aria-label="ปิด" onClick={onClose}>
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ icon = "📦", children }: { icon?: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden>
        {icon}
      </span>
      {children}
    </div>
  );
}

const stockBadgeClass = { out: "out", low: "warn", ok: "ok" } as const;

export function StockBadge({ qty }: { qty: number }) {
  const status = stockStatus(qty);
  return <span className={`badge ${stockBadgeClass[status]} badge-dot`}>{status === "out" ? "หมด" : `${qty} ชิ้น`}</span>;
}
