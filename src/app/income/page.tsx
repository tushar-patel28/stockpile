import { createClient } from "@/lib/supabase/server";
import { IncomeDialog } from "./income-dialog";
import { RowActions } from "./row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function IncomePage() {
  const supabase = await createClient();

  const [{ data: income }, { data: tickers }] = await Promise.all([
    supabase.from("income").select("*").order("received_date", { ascending: false }),
    supabase.from("tickers").select("symbol").order("symbol"),
  ]);

  const total = income?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;

  const byType: Record<string, number> = {};
  income?.forEach((i) => {
    byType[i.type] = (byType[i.type] ?? 0) + Number(i.amount);
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income</h1>
          <p className="text-sm text-muted-foreground">
            Dividends, bonuses, referrals, and interest
          </p>
        </div>
        <IncomeDialog mode="add" tickers={tickers ?? []} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Received</p>
          <p className="text-xl font-bold text-green-600">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">By Type</p>
          {Object.keys(byType).length > 0 ? (
            <div className="space-y-0.5 text-sm">
              {Object.entries(byType).map(([type, amt]) => (
                <div key={type} className="flex justify-between">
                  <span>{type}</span>
                  <span className="font-mono">${amt.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {income && income.length > 0 ? (
              income.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.received_date}</TableCell>
                  <TableCell>{i.type}</TableCell>
                  <TableCell className="font-mono">{i.ticker || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-green-600 font-semibold">
                    +${Number(i.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{i.notes || "—"}</TableCell>
                  <TableCell>
                    <RowActions income={i} tickers={tickers ?? []} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No income yet. Log a dividend or bonus.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}