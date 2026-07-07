import { createClient } from "@/lib/supabase/server";
import { ImportView } from "./import-view";

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: tickers } = await supabase.from("tickers").select("symbol");

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Import from CSV</h2>
        <p className="text-sm text-muted-foreground">
          Bulk-load transactions from your Excel or Robinhood export
        </p>
      </div>
      <ImportView existingTickers={(tickers ?? []).map((t) => t.symbol)} />
    </div>
  );
}