import { createClient } from "@/lib/supabase/server";
import { AddDepositDialog } from "@/app/deposits/add-deposit-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DepositsPage() {
  const supabase = await createClient();
  const { data: deposits } = await supabase
    .from("deposits")
    .select("*")
    .order("txn_date", { ascending: false });

  const totalDeposits = deposits
    ?.filter((d) => d.type === "Deposit")
    .reduce((sum, d) => sum + Number(d.amount), 0) ?? 0;
  const totalWithdrawals = deposits
    ?.filter((d) => d.type === "Withdrawal")
    .reduce((sum, d) => sum + Number(d.amount), 0) ?? 0;
  const netCash = totalDeposits - totalWithdrawals;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deposits</h1>
          <p className="text-sm text-muted-foreground">
            Track cash moving in and out of your brokerage
          </p>
        </div>
        <AddDepositDialog />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Deposited</p>
          <p className="text-xl font-bold text-green-600">
            ${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Withdrawn</p>
          <p className="text-xl font-bold text-red-600">
            ${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Net Cash</p>
          <p className="text-xl font-bold">
            ${netCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits && deposits.length > 0 ? (
              deposits.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.txn_date}</TableCell>
                  <TableCell>
                    <span className={d.type === "Deposit" ? "text-green-600" : "text-red-600"}>
                      {d.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.notes || "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No deposits yet. Add your first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}