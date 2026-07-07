"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type Ticker = { symbol: string };

export function AddSellDialog({
  tickers,
  avgCostByTicker,
}: {
  tickers: Ticker[];
  avgCostByTicker: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState(tickers[0]?.symbol ?? "");
  const [sellDate, setSellDate] = useState(new Date().toISOString().split("T")[0]);
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const avgCost = avgCostByTicker[ticker] ?? 0;
  const sharesNum = parseFloat(shares) || 0;
  const priceNum = parseFloat(price) || 0;
  const feesNum = parseFloat(fees) || 0;
  const proceeds = sharesNum * priceNum;
  const costBasis = sharesNum * avgCost;
  const pnl = proceeds - feesNum - costBasis;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("sells").insert({
      user_id: user.id,
      ticker,
      sell_date: sellDate,
      shares: parseFloat(shares),
      price_per_share: parseFloat(price),
      fees: parseFloat(fees) || 0,
      notes: notes.trim() || null,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Sold ${shares} ${ticker} @ $${price}`);
    setShares("");
    setPrice("");
    setFees("0");
    setNotes("");
    setOpen(false);
    router.refresh();
  }

  if (tickers.length === 0) {
    return (
      <Button disabled title="Add a ticker first in Settings">
        <Plus className="mr-2 h-4 w-4" /> Add Sell
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Add Sell
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a stock sale</DialogTitle>
          <DialogDescription>
            Record a sell transaction. Realized P&L is calculated live.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker *</Label>
              <select
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                {tickers.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sell_date">Date *</Label>
              <Input
                id="sell_date"
                type="date"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shares"># of Shares *</Label>
              <Input
                id="shares"
                type="number"
                step="0.000001"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="1.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Sale Price / Share ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.0001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="180.00"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fees">Fees ($)</Label>
            <Input
              id="fees"
              type="number"
              step="0.01"
              min="0"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proceeds:</span>
              <span className="font-mono">${proceeds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg cost basis ({ticker}):</span>
              <span className="font-mono">${costBasis.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fees:</span>
              <span className="font-mono">-${feesNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1 font-semibold">
              <span>Realized P&L:</span>
              <span className={`font-mono ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for the sale, etc."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging..." : "Log sell"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}