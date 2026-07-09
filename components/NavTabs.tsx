"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/patchs", label: "Patchs" },
  { href: "/simulateur", label: "Simulateur" },
  { href: "/farm", label: "Routes de farm" },
] as const;

export function NavTabs() {
  const pathname = usePathname();
  return (
    <div className="ml-auto flex flex-wrap gap-1.5">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`tab ${pathname.startsWith(tab.href) ? "active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
