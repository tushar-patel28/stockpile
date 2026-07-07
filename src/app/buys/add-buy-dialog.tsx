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

export function AddBuyDialog({ tickers }: { tickers: Ticker[] }) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState(tickers[0]?.symbol ?? "");
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split("T")[0]);
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const totalCost =
    shares && price ? (parseFloat(shares) * parseFloat(price)).toFixed(2) : "0.00";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("buys").insert({
      user_id: user.id,
      ticker,
      buy_date: buyDate,
      shares: parseFloat(shares),
      price_per_share: parseFloat(price),
      notes: notes.trim() || null,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Bought ${shares} ${ticker} @ $${price}`);
    setShares("");
    setPrice("");
    setNotes("");
    setOpen(false);
    router.refresh();
  }

  if (tickers.length === 0) {
    return (
      <Button disabled title="Add a ticker first in Settings">
        <Plus className="mr-2 h-4 w-4" /> Add Buy
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Add Buy
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a stock purchase</DialogTitle>
          <DialogDescription>
            Record a buy transaction with the exact shares and price.
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
              <Label htmlFor="buy_date">Date *</Label>
              <Input
                id="buy_date"
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
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
              <Label htmlFor="price">Price / Share ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.0001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150.00"
                required
              />
            </div>
          </div>
          <div className="rounded-md bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Total cost:</span>{" "}
            <span className="font-mono font-semibold">${totalCost}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to remember about this trade"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging..." : "Log buy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}