export type Buy = {
  id: string;
  ticker: string;
  buy_date: string;
  shares: number;
  price_per_share: number;
};

export type Sell = {
  id: string;
  ticker: string;
  sell_date: string;
  shares: number;
  price_per_share: number;
  fees: number;
};

export type Deposit = {
  id: string;
  txn_date: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
};

export type Income = {
  id: string;
  received_date: string;
  type: string;
  ticker: string | null;
  amount: number;
};

export type TickerSummary = {
  ticker: string;
  sharesBought: number;
  totalCost: number;
  sharesSold: number;
  sharesHeld: number;
  avgCost: number;
  totalInvested: number;
  realizedPnl: number;
};

/** Round to N decimal places using banker's rounding-free math */
function round(n: number, decimals = 6) {
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

export function buildTickerSummary(
  buys: Buy[],
  sells: Sell[]
): TickerSummary[] {
  const map = new Map<string, TickerSummary>();

  buys.forEach((b) => {
    const s = Number(b.shares);
    const c = s * Number(b.price_per_share);
    const t = map.get(b.ticker) ?? {
      ticker: b.ticker,
      sharesBought: 0,
      totalCost: 0,
      sharesSold: 0,
      sharesHeld: 0,
      avgCost: 0,
      totalInvested: 0,
      realizedPnl: 0,
    };
    t.sharesBought += s;
    t.totalCost += c;
    map.set(b.ticker, t);
  });

  sells.forEach((s) => {
    const t = map.get(s.ticker);
    if (!t) return;
    const shares = Number(s.shares);
    t.sharesSold += shares;
    // Realized P&L = proceeds - fees - (shares * avg cost)
    // avg cost computed after all buys aggregated below
  });

  // Now compute derived fields
  map.forEach((t) => {
    t.sharesBought = round(t.sharesBought);
    t.sharesSold = round(t.sharesSold);
    t.sharesHeld = round(t.sharesBought - t.sharesSold);
    t.avgCost = t.sharesBought > 0 ? t.totalCost / t.sharesBought : 0;
    t.totalInvested = t.sharesHeld * t.avgCost;
  });

  // Realized P&L per ticker (needs avg cost)
  sells.forEach((s) => {
    const t = map.get(s.ticker);
    if (!t) return;
    const proceeds = Number(s.shares) * Number(s.price_per_share);
    const costBasis = Number(s.shares) * t.avgCost;
    t.realizedPnl += proceeds - Number(s.fees) - costBasis;
  });

  return Array.from(map.values()).sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function computeKpis(
  deposits: Deposit[],
  income: Income[],
  tickerSummary: TickerSummary[]
) {
  const totalDeposited = deposits
    .filter((d) => d.type === "Deposit")
    .reduce((s, d) => s + Number(d.amount), 0)
    - deposits.filter((d) => d.type === "Withdrawal")
      .reduce((s, d) => s + Number(d.amount), 0);

  const totalInvested = tickerSummary.reduce((s, t) => s + t.totalInvested, 0);
  const realizedPnl = tickerSummary.reduce((s, t) => s + t.realizedPnl, 0);
  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);
  const buyingPower = totalDeposited + realizedPnl + totalIncome - totalInvested;
  const overallReturn = totalDeposited > 0 ? (realizedPnl + totalIncome) / totalDeposited : 0;

  return {
    totalDeposited,
    totalInvested,
    buyingPower,
    realizedPnl,
    totalIncome,
    overallReturn,
  };
}

export function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildNetWorthSeries(
  deposits: Deposit[],
  income: Income[],
  sells: Sell[],
  buys: Buy[]
): { date: string; cumulative: number }[] {
  // Precompute avg cost per ticker for realized P&L on sells
  const totalsByTicker: Record<string, { shares: number; cost: number }> = {};
  buys.forEach((b) => {
    if (!totalsByTicker[b.ticker]) totalsByTicker[b.ticker] = { shares: 0, cost: 0 };
    totalsByTicker[b.ticker].shares += Number(b.shares);
    totalsByTicker[b.ticker].cost += Number(b.shares) * Number(b.price_per_share);
  });
  const avgCostByTicker: Record<string, number> = {};
  Object.entries(totalsByTicker).forEach(([t, { shares, cost }]) => {
    avgCostByTicker[t] = shares > 0 ? cost / shares : 0;
  });

  // Build event stream: each event contributes to net worth
  type Event = { date: string; delta: number };
  const events: Event[] = [];

  deposits.forEach((d) => {
    const sign = d.type === "Deposit" ? 1 : -1;
    events.push({ date: d.txn_date, delta: sign * Number(d.amount) });
  });

  income.forEach((i) => {
    events.push({ date: i.received_date, delta: Number(i.amount) });
  });

  sells.forEach((s) => {
    const proceeds = Number(s.shares) * Number(s.price_per_share);
    const cost = Number(s.shares) * (avgCostByTicker[s.ticker] ?? 0);
    const pnl = proceeds - Number(s.fees) - cost;
    events.push({ date: s.sell_date, delta: pnl });
  });

  events.sort((a, b) => a.date.localeCompare(b.date));

  // Roll into cumulative series (one point per unique date)
  const series: { date: string; cumulative: number }[] = [];
  let cumulative = 0;
  const dateMap = new Map<string, number>();

  events.forEach((e) => {
    cumulative += e.delta;
    dateMap.set(e.date, cumulative);
  });

  Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, val]) => series.push({ date, cumulative: val }));

  return series;
}