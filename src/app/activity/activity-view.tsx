"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/portfolio";
import { Search } from "lucide-react";

type ActivityItem = {
  id: string;
  category: "deposit" | "buy" | "sell" | "income";
  date: string;
  type: string;
  ticker: string | null;
  description: string;
  amount: number;
  notes: string | null;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "deposit", label: "Deposits" },
  { key: "buy", label: "Buys" },
  { key: "sell", label: "Sells" },
  { key: "income", label: "Income" },
] as const;

export function ActivityView({ activity }: { activity: ActivityItem[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return activity.filter((a) => {
      if (filter !== "all" && a.category !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.ticker?.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.notes?.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activity, filter, search]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Every transaction, in one place
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ticker or notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">{a.date}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell className="font-mono">{a.ticker || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.description}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${
                    a.amount >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {a.amount >= 0 ? "+" : ""}${formatMoney(Math.abs(a.amount))}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {activity.length === 0
                    ? "No activity yet. Start logging some transactions."
                    : "No results match your filter."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Showing {filtered.length} of {activity.length} transactions
      </p>
    </main>
  );
}