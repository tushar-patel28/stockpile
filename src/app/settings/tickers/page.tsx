import { createClient } from "@/lib/supabase/server";
import { AddTickerDialog } from "@/app/settings/tickers/add-ticker-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TickersPage() {
  const supabase = await createClient();
  const { data: tickers } = await supabase
    .from("tickers")
    .select("*")
    .order("symbol");

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tickers</h1>
          <p className="text-sm text-muted-foreground">
            Manage the stock symbols you track
          </p>
        </div>
        <AddTickerDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Sector</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickers && tickers.length > 0 ? (
              tickers.map((t) => (
                <TableRow key={t.symbol}>
                  <TableCell className="font-mono font-semibold">{t.symbol}</TableCell>
                  <TableCell>{t.name || "—"}</TableCell>
                  <TableCell>{t.sector || "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No tickers yet. Add your first one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}