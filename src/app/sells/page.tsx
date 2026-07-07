import { createClient } from "@/lib/supabase/server";
import { AddSellDialog } from "./add-sell-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SellsPage() {
  const supabase = await createClient();

  const [{ data: sells }, { data: buys }, { data: tickers }] = await Promise.all([
    supabase.from("sells").select("*").order("sell_date", { ascending: false }),
    supabase.from("buys").select("ticker, shares, price_per_share"),
    supabase.from("tickers").select("symbol").order("symbol"),
  ]);

  // Compute avg cost per ticker (weighted average from all buys)
  const avgCostByTicker: Record<string, number> = {};
  const totalsByTicker: Record<string, { shares: number; cost: number }> = {};

  buys?.forEach((b) => {
    const s = Number(b.shares);
    const c = s * Number(b.price_per_share);
    if (!totalsByTicker[b.ticker]) {
      totalsByTicker[b.ticker] = { shares: 0, cost: 0 };
    }
    totalsByTicker[b.ticker].shares += s;
    totalsByTicker[b.ticker].cost += c;
  });

  Object.entries(totalsByTicker).forEach(([t, { shares, cost }]) => {
    avgCostByTicker[t] = shares > 0 ? cost / shares : 0;
  });

  const totalRealizedPnl =
    sells?.reduce((sum, s) => {
      const proceeds = Number(s.shares) * Number(s.price_per_share);
      const costBasis = Number(s.shares) * (avgCostByTicker[s.ticker] ?? 0);
      const pnl = proceeds - Number(s.fees) - costBasis;
      return sum + pnl;
    }, 0) ?? 0;

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sells</h1>
          <p className="text-sm text-muted-foreground">
            Every sale, with fees and realized profit/loss
          </p>
        </div>
        <AddSellDialog tickers={tickers ?? []} avgCostByTicker={avgCostByTicker} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Sells</p>
          <p className="text-xl font-bold">{sells?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Realized P&L</p>
          <p className={`text-xl font-bold ${totalRealizedPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalRealizedPnl >= 0 ? "+" : ""}${totalRealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Sale Price</TableHead>
              <TableHead className="text-right">Proceeds</TableHead>
              <TableHead className="text-right">Fees</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Realized P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sells && sells.length > 0 ? (
              sells.map((s) => {
                const proceeds = Number(s.shares) * Number(s.price_per_share);
                const avgCost = avgCostByTicker[s.ticker] ?? 0;
                const costBasis = Number(s.shares) * avgCost;
                const pnl = proceeds - Number(s.fees) - costBasis;
                return (
                  <TableRow key={s.id}>
                    <TableCell>{s.sell_date}</TableCell>
                    <TableCell className="font-mono font-semibold">{s.ticker}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(s.shares).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">${Number(s.price_per_share).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">${proceeds.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">${Number(s.fees).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">${avgCost.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No sells yet. When you sell shares, log them here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}