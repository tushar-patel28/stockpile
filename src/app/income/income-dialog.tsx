"use client";

import { useState, useEffect } from "react";
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

export type IncomeRow = {
  id: string;
  ticker: string | null;
  received_date: string;
  type: string;
  amount: number;
  notes: string | null;
};

type Ticker = { symbol: string };

const INCOME_TYPES = ["Dividend", "Referral Bonus", "Cash Bonus", "Interest", "Other"];

type Props = {
  mode: "add" | "edit";
  income?: IncomeRow;
  tickers: Ticker[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function IncomeDialog({
  mode,
  income,
  tickers,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [type, setType] = useState("Dividend");
  const [ticker, setTicker] = useState<string>("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (mode === "edit" && income && open) {
      setType(income.type);
      setTicker(income.ticker ?? "");
      setReceivedDate(income.received_date);
      setAmount(String(income.amount));
      setNotes(income.notes ?? "");
    } else if (mode === "add" && open) {
      setType("Dividend");
      setTicker("");
      setReceivedDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setNotes("");
    }
  }, [mode, income, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "add") {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("income").insert({
        user_id: user.id,
        ticker: ticker || null,
        received_date: receivedDate,
        type,
        amount: parseFloat(amount),
        notes: notes.trim() || null,
      });

      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`+$${amount} ${type} logged`);
    } else {
      const { error } = await supabase
        .from("income")
        .update({
          ticker: ticker || null,
          received_date: receivedDate,
          type,
          amount: parseFloat(amount),
          notes: notes.trim() || null,
        })
        .eq("id", income!.id);

      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Income updated");
    }

    setOpen(false);
    router.refresh();
  }

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === "add" ? "Log income" : "Edit income"}</DialogTitle>
        <DialogDescription>
          {mode === "add"
            ? "Dividends, bonuses, interest — anything that adds cash to your account."
            : "Update this income entry."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              {INCOME_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="received_date">Date *</Label>
            <Input
              id="received_date"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticker">Source Ticker (optional)</Label>
          <select
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">— None —</option>
            {tickers.map((t) => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Link this to a stock (for dividends) or leave blank (for bonuses).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25.00"
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Q3 dividend, referral from friend, etc."
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : mode === "add" ? "Log income" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (mode === "edit") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Add Income
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}