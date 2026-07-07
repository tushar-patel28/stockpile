"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function download(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DataExport() {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  async function exportTable(table: string) {
    setLoading(table);
    const { data, error } = await supabase.from(table).select("*");
    setLoading(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast.info(`No ${table} to export`);
      return;
    }

    const csv = toCsv(data as Record<string, unknown>[]);
    const date = new Date().toISOString().split("T")[0];
    download(`stockpile-${table}-${date}.csv`, csv);
    toast.success(`${data.length} rows exported`);
  }

  async function exportAll() {
    setLoading("all");
    const tables = ["deposits", "buys", "sells", "income", "tickers"];
    const bundle: Record<string, unknown> = {};

    for (const t of tables) {
      const { data, error } = await supabase.from(t).select("*");
      if (error) {
        toast.error(`Failed to export ${t}: ${error.message}`);
        setLoading(null);
        return;
      }
      bundle[t] = data;
    }

    const date = new Date().toISOString().split("T")[0];
    download(
      `stockpile-full-backup-${date}.json`,
      JSON.stringify(bundle, null, 2),
      "application/json"
    );
    setLoading(null);
    toast.success("Full backup downloaded");
  }

  const exports = [
    { table: "deposits", label: "Deposits" },
    { table: "buys", label: "Buys" },
    { table: "sells", label: "Sells" },
    { table: "income", label: "Income" },
    { table: "tickers", label: "Tickers" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-6">
        <h3 className="font-semibold mb-1">Export individual tables (CSV)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Good for tax filing or importing into Excel
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {exports.map((e) => (
            <Button
              key={e.table}
              variant="outline"
              onClick={() => exportTable(e.table)}
              disabled={loading !== null}
            >
              <Download className="mr-2 h-4 w-4" />
              {loading === e.table ? "..." : e.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-6">
        <h3 className="font-semibold mb-1">Full backup (JSON)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Downloads everything in one file. Useful for archiving or migration.
        </p>
        <Button onClick={exportAll} disabled={loading !== null}>
          <Download className="mr-2 h-4 w-4" />
          {loading === "all" ? "Preparing..." : "Download full backup"}
        </Button>
      </section>
    </div>
  );
}