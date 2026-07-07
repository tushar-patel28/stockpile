import { createClient } from "@/lib/supabase/server";
import {
  buildTickerSummary,
  computeKpis,
  buildNetWorthSeries,
  formatMoney,
} from "@/lib/portfolio";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowDownToLine, ShoppingCart, TrendingDown, Gift } from "lucide-react";
import Link from "next/link";
import { DashboardCharts } from "@/components/dashboard-charts";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: deposits },
    { data: buys },
    { data: sells },
    { data: income },
  ] = await Promise.all([
    supabase.from("deposits").select("*"),
    supabase.from("buys").select("*"),
    supabase.from("sells").select("*"),
    supabase.from("income").select("*"),
  ]);

  const tickerSummary = buildTickerSummary(buys ?? [], sells ?? []);
  const kpis = computeKpis(deposits ?? [], income ?? [], tickerSummary);
  const netWorthSeries = buildNetWorthSeries(
    deposits ?? [],
    income ?? [],
    sells ?? [],
    buys ?? []
  );

  const activity = [
    ...(deposits ?? []).map((d) => ({
      date: d.txn_date,
      label: d.type,
      amount: d.type === "Withdrawal" ? -Number(d.amount) : Number(d.amount),
      icon: ArrowDownToLine,
    })),
    ...(buys ?? []).map((b) => ({
      date: b.buy_date,
      label: `Bought ${Number(b.shares).toFixed(4)} ${b.ticker}`,
      amount: -(Number(b.shares) * Number(b.price_per_share)),
      icon: ShoppingCart,
    })),
    ...(sells ?? []).map((s) => ({
      date: s.sell_date,
      label: `Sold ${Number(s.shares).toFixed(4)} ${s.ticker}`,
      amount: Number(s.shares) * Number(s.price_per_share) - Number(s.fees),
      icon: TrendingDown,
    })),
    ...(income ?? []).map((i) => ({
      date: i.received_date,
      label: `${i.type}${i.ticker ? ` (${i.ticker})` : ""}`,
      amount: Number(i.amount),
      icon: Gift,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user?.email}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">Sign out</Button>
        </form>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Deposited</p>
          <p className="text-xl font-bold">${formatMoney(kpis.totalDeposited)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="text-xl font-bold">${formatMoney(kpis.totalInvested)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Buying Power</p>
          <p className="text-xl font-bold">${formatMoney(kpis.buyingPower)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Realized P&L</p>
          <p className={`text-xl font-bold ${kpis.realizedPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
            {kpis.realizedPnl >= 0 ? "+" : ""}${formatMoney(kpis.realizedPnl)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Overall Return</p>
          <p className={`text-xl font-bold ${kpis.overallReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
            {(kpis.overallReturn * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts
        tickerSummary={tickerSummary}
        netWorthSeries={netWorthSeries}
      />

      {/* Holdings */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Holdings</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead className="text-right">Shares Held</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Total Invested</TableHead>
                <TableHead className="text-right">Realized P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickerSummary.length > 0 ? (
                tickerSummary.map((t) => (
                  <TableRow key={t.ticker}>
                    <TableCell className="font-mono font-semibold">
                      <Link
                        href={`/positions/${t.ticker}`}
                        className="hover:underline hover:text-primary transition-colors">
                        {t.ticker}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {t.sharesHeld.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {t.sharesHeld > 0 ? `$${formatMoney(t.avgCost)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {t.sharesHeld > 0 ? `$${formatMoney(t.totalInvested)}` : "—"}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${
                      t.realizedPnl === 0
                        ? ""
                        : t.realizedPnl > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {t.realizedPnl === 0
                        ? "—"
                        : `${t.realizedPnl >= 0 ? "+" : ""}$${formatMoney(t.realizedPnl)}`}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No holdings yet. <Link href="/buys" className="text-primary underline">Log a buy</Link> to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Link href="/activity" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="rounded-lg border divide-y">
          {activity.length > 0 ? (
            activity.map((a, idx) => {
              const Icon = a.icon;
              return (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{a.label}</p>
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
            <p className="p-8 text-center text-muted-foreground">
              No activity yet. Start logging some deposits and buys.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}