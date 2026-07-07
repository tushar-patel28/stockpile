"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/settings/tickers", label: "Tickers" },
    { href: "/settings/account", label: "Account" },
    { href: "/settings/data", label: "Data" },
    { href: "/settings/import", label: "Import" },
  ];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, tickers, and data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <nav className="flex flex-row gap-1 md:flex-col">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                pathname === l.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div>{children}</div>
      </div>
    </main>
  );
}