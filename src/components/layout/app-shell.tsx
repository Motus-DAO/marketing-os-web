"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">MotusDAO OS</p>
          <Link href="/" className="app-title">
            Marketing OS
          </Link>
        </div>
        <div className="header-meta">
          <span>{pathname === "/" ? "Project Home" : pathname.startsWith("/projects") ? "Asset List" : "Asset Review"}</span>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
