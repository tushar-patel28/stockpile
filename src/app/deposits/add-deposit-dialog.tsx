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

export function AddDepositDialog() {
  const [open, setOpen] = useState(false);
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("deposits").insert({
      user_id: user.id,
      txn_date: txnDate,
      type,
      amount: parseFloat(amount),
      notes: notes.trim() || null,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${type} of $${amount} logged`);
    setAmount("");
    setNotes("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Add Deposit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a deposit or withdrawal</DialogTitle>
          <DialogDescription>
            Record cash moving in or out of your brokerage account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="txn_date">Date *</Label>
            <Input
              id="txn_date"
              type="date"
              value={txnDate}
              onChange={(e) => setTxnDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "Deposit" | "Withdrawal")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              <option value="Deposit">Deposit</option>
              <option value="Withdrawal">Withdrawal</option>
            </select>
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
              placeholder="500.00"
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
              placeholder="Initial funding, monthly deposit, etc."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging..." : "Log entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}