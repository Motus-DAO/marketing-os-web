"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

function sectionLabel(pathname: string) {
  if (pathname === "/") return "Project Home";
  if (pathname.startsWith("/calendar")) return "Content Calendar";
  if (pathname.startsWith("/projects")) return "Asset List";
  if (pathname.startsWith("/assets")) return "Content Review";
  return "Marketing OS";
}

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
        <nav className="app-nav" aria-label="Main">
          <Link href="/" className={pathname === "/" ? "nav-link is-active" : "nav-link"}>
            Projects
          </Link>
          <Link href="/calendar" className={pathname.startsWith("/calendar") ? "nav-link is-active" : "nav-link"}>
            Calendar
          </Link>
        </nav>
        <div className="header-meta">
          <span>{sectionLabel(pathname)}</span>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
