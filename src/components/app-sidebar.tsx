"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  ArrowDownToLine,
  ShoppingCart,
  TrendingDown,
  Gift,
  Settings,
  Menu,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/deposits", label: "Deposits", icon: ArrowDownToLine },
  { href: "/buys", label: "Buys", icon: ShoppingCart },
  { href: "/sells", label: "Sells", icon: TrendingDown },
  { href: "/income", label: "Income", icon: Gift },
  { href: "/settings/tickers", label: "Settings", icon: Settings },
];

// Bottom bar shows the 5 most useful pages on mobile
const bottomBarItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/buys", label: "Buys", icon: ShoppingCart },
  { href: "/sells", label: "Sells", icon: TrendingDown },
  { href: "/activity", label: "Activity", icon: Activity },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:block">
        <div className="flex h-14 items-center justify-between gap-2 border-b px-4">
          <span className="font-bold">Stockpile</span>
          <ThemeToggle />
        </div>
        <NavList />
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="border-b px-4 py-3 font-bold">Stockpile</SheetTitle>
            <NavList onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-bold">Stockpile</span>
        <ThemeToggle />
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ───────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background md:hidden">
        {bottomBarItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}