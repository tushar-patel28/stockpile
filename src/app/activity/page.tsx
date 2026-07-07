import { createClient } from "@/lib/supabase/server";
import { ActivityView } from "./activity-view";

export default async function ActivityPage() {
  const supabase = await createClient();

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

  const activity = [
    ...(deposits ?? []).map((d) => ({
      id: `dep-${d.id}`,
      category: "deposit" as const,
      date: d.txn_date,
      type: d.type as string,
      ticker: null as string | null,
      description: d.notes || d.type,
      amount: d.type === "Withdrawal" ? -Number(d.amount) : Number(d.amount),
      notes: d.notes,
    })),
    ...(buys ?? []).map((b) => ({
      id: `buy-${b.id}`,
      category: "buy" as const,
      date: b.buy_date,
      type: "Buy",
      ticker: b.ticker,
      description: `Bought ${Number(b.shares).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${b.ticker} @ $${Number(b.price_per_share).toFixed(2)}`,
      amount: -(Number(b.shares) * Number(b.price_per_share)),
      notes: b.notes,
    })),
    ...(sells ?? []).map((s) => ({
      id: `sell-${s.id}`,
      category: "sell" as const,
      date: s.sell_date,
      type: "Sell",
      ticker: s.ticker,
      description: `Sold ${Number(s.shares).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${s.ticker} @ $${Number(s.price_per_share).toFixed(2)}`,
      amount: Number(s.shares) * Number(s.price_per_share) - Number(s.fees),
      notes: s.notes,
    })),
    ...(income ?? []).map((i) => ({
      id: `inc-${i.id}`,
      category: "income" as const,
      date: i.received_date,
      type: i.type,
      ticker: i.ticker,
      description: `${i.type}${i.ticker ? ` from ${i.ticker}` : ""}`,
      amount: Number(i.amount),
      notes: i.notes,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return <ActivityView activity={activity} />;
}