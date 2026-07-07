"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Activity,
  ArrowDownToLine,
  ShoppingCart,
  TrendingDown,
  Gift,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/deposits", label: "Deposits", icon: ArrowDownToLine },
  { href: "/buys", label: "Buys", icon: ShoppingCart },
  { href: "/sells", label: "Sells", icon: TrendingDown },
  { href: "/income", label: "Income", icon: Gift },
  { href: "/settings/tickers", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:block">
      <div className="flex h-14 items-center justify-between gap-2 border-b px-4">
        <span className="font-bold">Stockpile</span>
        <ThemeToggle />
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}