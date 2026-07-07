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

export type DepositRow = {
  id: string;
  txn_date: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  notes: string | null;
};

type Props = {
  mode: "add" | "edit";
  deposit?: DepositRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DepositDialog({ mode, deposit, open: controlledOpen, onOpenChange }: Props) {
  // Support both controlled (edit) and uncontrolled (add via trigger) modes
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [txnDate, setTxnDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Pre-fill when editing
  useEffect(() => {
    if (mode === "edit" && deposit && open) {
      setTxnDate(deposit.txn_date);
      setType(deposit.type);
      setAmount(String(deposit.amount));
      setNotes(deposit.notes ?? "");
    } else if (mode === "add" && open) {
      setTxnDate(new Date().toISOString().split("T")[0]);
      setType("Deposit");
      setAmount("");
      setNotes("");
    }
  }, [mode, deposit, open]);

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
    } else {
      const { error } = await supabase
        .from("deposits")
        .update({
          txn_date: txnDate,
          type,
          amount: parseFloat(amount),
          notes: notes.trim() || null,
        })
        .eq("id", deposit!.id);

      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Entry updated");
    }

    setOpen(false);
    router.refresh();
  }

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {mode === "add" ? "Log a deposit or withdrawal" : "Edit entry"}
        </DialogTitle>
        <DialogDescription>
          {mode === "add"
            ? "Record cash moving in or out of your brokerage account."
            : "Update the details for this transaction."}
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
            {loading ? "Saving..." : mode === "add" ? "Log entry" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (mode === "edit") {
    // Controlled dialog — parent manages open state
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  // Add mode: standalone trigger button
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Add Deposit
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}