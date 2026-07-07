import { createClient } from "@/lib/supabase/server";
import { AddBuyDialog } from "@/app/buys/add-buy-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BuysPage() {
  const supabase = await createClient();

  const [{ data: buys }, { data: tickers }] = await Promise.all([
    supabase.from("buys").select("*").order("buy_date", { ascending: false }),
    supabase.from("tickers").select("symbol").order("symbol"),
  ]);

  const totalInvested = buys?.reduce(
    (sum, b) => sum + Number(b.shares) * Number(b.price_per_share),
    0
  ) ?? 0;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Buys</h1>
          <p className="text-sm text-muted-foreground">
            Every stock purchase you&apos;ve made
          </p>
        </div>
        <AddBuyDialog tickers={tickers ?? []} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Buys</p>
          <p className="text-xl font-bold">{buys?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Invested (gross)</p>
          <p className="text-xl font-bold">
            ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Price / Share</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buys && buys.length > 0 ? (
              buys.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.buy_date}</TableCell>
                  <TableCell className="font-mono font-semibold">{b.ticker}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(b.shares).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${Number(b.price_per_share).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${(Number(b.shares) * Number(b.price_per_share)).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{b.notes || "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No buys yet. Log your first purchase.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}