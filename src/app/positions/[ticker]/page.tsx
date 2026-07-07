import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildTickerSummary, formatMoney } from "@/lib/portfolio";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ShoppingCart, TrendingDown, Gift } from "lucide-react";

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker: rawTicker } = await params;
  const ticker = rawTicker.toUpperCase();
  const supabase = await createClient();

  // Fetch everything for this ticker in parallel
  const [
    { data: tickerRow },
    { data: allBuys },
    { data: allSells },
    { data: buys },
    { data: sells },
    { data: income },
  ] = await Promise.all([
    supabase.from("tickers").select("*").eq("symbol", ticker).maybeSingle(),
    supabase.from("buys").select("*"),
    supabase.from("sells").select("*"),
    supabase.from("buys").select("*").eq("ticker", ticker).order("buy_date", { ascending: false }),
    supabase.from("sells").select("*").eq("ticker", ticker).order("sell_date", { ascending: false }),
    supabase.from("income").select("*").eq("ticker", ticker).order("received_date", { ascending: false }),
  ]);

  if (!tickerRow && (!buys || buys.length === 0)) {
    notFound();
  }

  // Compute this ticker's summary using the shared helper
  const allSummary = buildTickerSummary(allBuys ?? [], allSells ?? []);
  const summary = allSummary.find((s) => s.ticker === ticker);

  const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;
  const totalGain = (summary?.realizedPnl ?? 0) + totalIncome;

  // Combined activity for this ticker
  type Item = {
    date: string;
    kind: "buy" | "sell" | "income";
    label: string;
    amount: number;
    detail: string;
  };
  const activity: Item[] = [
    ...(buys ?? []).map((b) => ({
      date: b.buy_date,
      kind: "buy" as const,
      label: "Bought",
      amount: -(Number(b.shares) * Number(b.price_per_share)),
      detail: `${Number(b.shares).toLocaleString(undefined, { maximumFractionDigits: 6 })} shares @ $${Number(b.price_per_share).toFixed(2)}`,
    })),
    ...(sells ?? []).map((s) => ({
      date: s.sell_date,
      kind: "sell" as const,
      label: "Sold",
      amount: Number(s.shares) * Number(s.price_per_share) - Number(s.fees),
      detail: `${Number(s.shares).toLocaleString(undefined, { maximumFractionDigits: 6 })} shares @ $${Number(s.price_per_share).toFixed(2)}${Number(s.fees) > 0 ? ` (fees: $${Number(s.fees).toFixed(2)})` : ""}`,
    })),
    ...(income ?? []).map((i) => ({
      date: i.received_date,
      kind: "income" as const,
      label: i.type,
      amount: Number(i.amount),
      detail: i.notes || "",
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold font-mono">{ticker}</h1>
          {tickerRow?.name && (
            <span className="text-lg text-muted-foreground">{tickerRow.name}</span>
          )}
          {tickerRow?.sector && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {tickerRow.sector}
            </span>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Shares Held</p>
          <p className="text-xl font-bold font-mono">
            {summary
              ? summary.sharesHeld.toLocaleString(undefined, { maximumFractionDigits: 6 })
              : "0"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Avg Cost / Share</p>
          <p className="text-xl font-bold font-mono">
            ${summary ? formatMoney(summary.avgCost) : "0.00"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="text-xl font-bold font-mono">
            ${summary ? formatMoney(summary.totalInvested) : "0.00"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Gain</p>
          <p className={`text-xl font-bold font-mono ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalGain >= 0 ? "+" : ""}${formatMoney(totalGain)}
          </p>
        </div>
      </div>

      {/* Realized P&L breakdown */}
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-3">P&L Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Realized P&L (from sells)</p>
            <p className={`text-lg font-semibold font-mono ${
              (summary?.realizedPnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {(summary?.realizedPnl ?? 0) >= 0 ? "+" : ""}${formatMoney(summary?.realizedPnl ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dividends & Income</p>
            <p className="text-lg font-semibold font-mono text-green-600">
              +${formatMoney(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Combined</p>
            <p className={`text-lg font-semibold font-mono ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalGain >= 0 ? "+" : ""}${formatMoney(totalGain)}
            </p>
          </div>
        </div>
      </div>

      {/* Buys */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Buys <span className="text-sm font-normal text-muted-foreground">({buys?.length ?? 0})</span>
        </h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buys && buys.length > 0 ? (
                buys.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.buy_date}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(b.shares).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">${Number(b.price_per_share).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${(Number(b.shares) * Number(b.price_per_share)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.notes || "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No buys yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Sells */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Sells <span className="text-sm font-normal text-muted-foreground">({sells?.length ?? 0})</span>
        </h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Proceeds</TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sells && sells.length > 0 ? (
                sells.map((s) => {
                  const proceeds = Number(s.shares) * Number(s.price_per_share);
                  const avgCost = summary?.avgCost ?? 0;
                  const costBasis = Number(s.shares) * avgCost;
                  const pnl = proceeds - Number(s.fees) - costBasis;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.sell_date}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(s.shares).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </TableCell>
                      <TableCell className="text-right font-mono">${Number(s.price_per_share).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">${proceeds.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">${Number(s.fees).toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No sells for this ticker.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Income */}
      {income && income.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Income <span className="text-sm font-normal text-muted-foreground">({income.length})</span>
          </h2>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {income.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.received_date}</TableCell>
                    <TableCell>{i.type}</TableCell>
                    <TableCell className="text-right font-mono text-green-600 font-semibold">
                      +${Number(i.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{i.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Full activity timeline */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Timeline</h2>
        <div className="rounded-lg border divide-y">
          {activity.length > 0 ? (
            activity.map((a, idx) => {
              const Icon =
                a.kind === "buy" ? ShoppingCart : a.kind === "sell" ? TrendingDown : Gift;
              return (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{a.label}</span>
                        {a.detail && <span className="text-muted-foreground"> — {a.detail}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.date}</p>
                    </div>
                  </div>
                  <p className={`font-mono text-sm font-semibold ${
                    a.amount >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {a.amount >= 0 ? "+" : ""}${formatMoney(Math.abs(a.amount))}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="p-6 text-center text-muted-foreground text-sm">No activity yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}