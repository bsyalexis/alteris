"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Patchs" },
  { href: "/simulateur", label: "Simulateur" },
  { href: "/farm", label: "Routes de farm" },
] as const;

export function NavTabs() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/patchs") : pathname.startsWith(href);
  return (
    <div className="tabs">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`tab ${isActive(tab.href) ? "active" : ""}`}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
