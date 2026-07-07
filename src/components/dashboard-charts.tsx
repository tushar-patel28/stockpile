"use client";

import {
  Pie,
  PieChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TickerSummary } from "@/lib/portfolio";
import { formatMoney } from "@/lib/portfolio";

// Color palette — pleasant, distinguishable, works in dark/light
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

type NetWorthPoint = {
  date: string;
  cumulative: number;
};

type Props = {
  tickerSummary: TickerSummary[];
  netWorthSeries: NetWorthPoint[];
  overallGain: number;
};

export function DashboardCharts({ tickerSummary, netWorthSeries, overallGain }: Props) {  // Allocation pie — only holdings with > 0 shares
  const allocationData = tickerSummary
    .filter((t) => t.totalInvested > 0)
    .map((t) => ({ name: t.ticker, value: t.totalInvested }));

  // Realized P&L bar — only tickers with any P&L
  const pnlData = tickerSummary
    .filter((t) => t.realizedPnl !== 0)
    .map((t) => ({ ticker: t.ticker, pnl: t.realizedPnl }));

  const hasAllocation = allocationData.length > 0;
  const hasPnl = pnlData.length > 0;
  const hasNetWorth = netWorthSeries.length > 1;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── Portfolio Allocation ─────────────────────────── */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-1">Portfolio Allocation</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Where your invested money sits, by ticker
        </p>
        {hasAllocation ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={allocationData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={({ name, percent }) =>
                  `${name} ${(percent! * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {allocationData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
               <Tooltip
                formatter={(value) => [`$${formatMoney(Number(value))}`, "Invested"]}
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No open positions to display." />
        )}
      </div>

      {/* ── Realized P&L by Ticker ───────────────────────── */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-1">Realized P&L by Ticker</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Profit or loss on closed positions
        </p>
        {hasPnl ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="ticker" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 12 }}
              />
             <Tooltip
                formatter={(value) => {
                  const n = Number(value);
                  return [`${n >= 0 ? "+" : ""}$${formatMoney(n)}`, "P&L"];
                }}
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="pnl">
                {pnlData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.pnl >= 0 ? "#10b981" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No closed positions yet." />
        )}
      </div>

      {/* ── Net Worth Over Time ──────────────────────────── */}
      <div className="rounded-lg border p-4 lg:col-span-2">
        <h3 className="font-semibold mb-1">Net Worth Over Time</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Cumulative deposits + income + realized P&L
        </p>
        {hasNetWorth ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={netWorthSeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                minTickGap={30}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => {
                  const n = Number(value);
                  return [`${n >= 0 ? "+" : ""}$${formatMoney(n)}`, "P&L"];
                }}
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke={overallGain >= 0 ? "#10b981" : "#ef4444"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Log a few deposits and trades to see this chart." />
        )}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-65 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}