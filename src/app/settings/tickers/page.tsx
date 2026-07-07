import { createClient } from "@/lib/supabase/server";
import { AddTickerDialog } from "./add-ticker-dialog";
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
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tickers</h2>
          <p className="text-sm text-muted-foreground">
            Stock symbols you track
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
                  No tickers yet. Add your first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}