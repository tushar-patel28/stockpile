"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

type ImportType = "deposits" | "buys" | "sells" | "income";

type SchemaConfig = {
  label: string;
  columns: string[];
  example: string;
  dateField: string;
};

const SCHEMAS: Record<ImportType, SchemaConfig> = {
  deposits: {
    label: "Deposits",
    columns: ["date", "type", "amount", "notes"],
    example: "date,type,amount,notes\n2025-01-15,Deposit,500.00,Initial funding\n2025-02-01,Deposit,300,Monthly add",
    dateField: "date",
  },
  buys: {
    label: "Buys",
    columns: ["date", "ticker", "shares", "price", "notes"],
    example: "date,ticker,shares,price,notes\n2025-01-20,AAPL,1.5,150.00,\n2025-02-15,AAPL,0.5,155.20,Second buy",
    dateField: "date",
  },
  sells: {
    label: "Sells",
    columns: ["date", "ticker", "shares", "price", "fees", "notes"],
    example: "date,ticker,shares,price,fees,notes\n2025-04-10,AAPL,1,180.00,0,Profit taking",
    dateField: "date",
  },
  income: {
    label: "Income",
    columns: ["date", "type", "ticker", "amount", "notes"],
    example: "date,type,ticker,amount,notes\n2025-03-15,Dividend,AAPL,2.50,Q1 dividend\n2025-04-01,Referral Bonus,,10.00,Friend signup",
    dateField: "date",
  },
};

type ParsedRow = Record<string, string>;

type ValidationResult = {
  row: ParsedRow;
  rowNum: number;
  errors: string[];
};

export function ImportView({ existingTickers }: { existingTickers: string[] }) {
  const [importType, setImportType] = useState<ImportType>("deposits");
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ValidationResult[]>([]);
  const [importing, setImporting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const schema = SCHEMAS[importType];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsedRows([]);

    Papa.parse<ParsedRow>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = results.data.map((row, i) =>
          validateRow(row, i + 2, importType, existingTickers)
        );
        setParsedRows(validated);
      },
      error: (err) => {
        toast.error(`Parse error: ${err.message}`);
      },
    });
  }

  function reparseWithNewType(newType: ImportType) {
    setImportType(newType);
    if (file) {
      Papa.parse<ParsedRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validated = results.data.map((row, i) =>
            validateRow(row, i + 2, newType, existingTickers)
          );
          setParsedRows(validated);
        },
      });
    }
  }

  async function handleImport() {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setImporting(false);
      return;
    }

    if (importType === "buys" || importType === "sells" || importType === "income") {
      const neededTickers = new Set<string>();
      validRows.forEach((r) => {
        const t = r.row.ticker?.trim().toUpperCase();
        if (t && !existingTickers.includes(t)) neededTickers.add(t);
      });

      if (neededTickers.size > 0) {
        const inserts = Array.from(neededTickers).map((symbol) => ({ symbol }));
        const { error } = await supabase.from("tickers").insert(inserts);
        if (error && !error.message.includes("duplicate")) {
          toast.error(`Ticker creation failed: ${error.message}`);
          setImporting(false);
          return;
        }
      }
    }

    const payload = validRows.map((r) => mapRow(r.row, importType, user.id));

    const { error } = await supabase.from(importType).insert(payload);

    setImporting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Imported ${validRows.length} ${schema.label.toLowerCase()}`);
    setFile(null);
    setParsedRows([]);
    router.refresh();
  }

  const validCount = parsedRows.filter((r) => r.errors.length === 0).length;
  const errorCount = parsedRows.length - validCount;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-6">
        <h3 className="font-semibold mb-1">Step 1 — What are you importing?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the type first so we know what columns to expect
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(SCHEMAS).map(([key, s]) => (
            <Button
              key={key}
              variant={importType === key ? "default" : "outline"}
              onClick={() => reparseWithNewType(key as ImportType)}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 rounded-md bg-muted p-3 text-xs">
          <p className="font-semibold mb-1">Expected columns for {schema.label}:</p>
          <p className="font-mono">{schema.columns.join(", ")}</p>
          <p className="font-semibold mt-2 mb-1">Example CSV:</p>
          <pre className="font-mono whitespace-pre-wrap text-[11px]">{schema.example}</pre>
        </div>
      </section>

      <section className="rounded-lg border p-6">
        <h3 className="font-semibold mb-1">Step 2 — Upload your CSV</h3>
        <p className="text-sm text-muted-foreground mb-4">
          First row must be column headers (see expected columns above)
        </p>
        <Label htmlFor="file" className="cursor-pointer">
          <div className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 hover:bg-muted transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              {file ? file.name : "Click to select a .csv file"}
            </span>
          </div>
          <input
            id="file"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </Label>
      </section>

      {parsedRows.length > 0 && (
        <section className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Step 3 — Preview & confirm</h3>
              <p className="text-sm text-muted-foreground">
                Found {parsedRows.length} rows — {validCount} valid, {errorCount} with errors
              </p>
            </div>
            <Button onClick={handleImport} disabled={validCount === 0 || importing}>
              {importing
                ? "Importing..."
                : `Import ${validCount} ${validCount === 1 ? "row" : "rows"}`}
            </Button>
          </div>

          <div className="max-h-96 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  {schema.columns.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.map((r) => (
                  <TableRow
                    key={r.rowNum}
                    className={r.errors.length > 0 ? "bg-red-50 dark:bg-red-950/20" : ""}
                  >
                    <TableCell className="text-xs text-muted-foreground">{r.rowNum}</TableCell>
                    <TableCell>
                      {r.errors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-red-600"
                          title={r.errors.join("; ")}
                        >
                          <AlertCircle className="h-3 w-3" /> {r.errors.length} error
                          {r.errors.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </TableCell>
                    {schema.columns.map((c) => (
                      <TableCell key={c} className="font-mono text-xs">
                        {r.row[c] || "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {errorCount > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hover error rows to see details. Only valid rows will be imported.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function validateRow(
  row: ParsedRow,
  rowNum: number,
  type: ImportType,
  existingTickers: string[]
): ValidationResult {
  const errors: string[] = [];
  const schema = SCHEMAS[type];

  const dateStr = row[schema.dateField];
  if (!dateStr) {
    errors.push("Missing date");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    errors.push("Date must be YYYY-MM-DD");
  }

  if (type === "deposits" || type === "income") {
    const cleanAmount = cleanNumber(row.amount);
    if (!row.amount || isNaN(cleanAmount)) {
      errors.push("Invalid amount");
    } else if (cleanAmount <= 0) {
      errors.push("Amount must be positive");
    }
  }

  if (type === "buys" || type === "sells") {
    if (!row.shares || isNaN(cleanNumber(row.shares))) {
      errors.push("Invalid shares");
    }
    if (!row.price || isNaN(cleanNumber(row.price))) {
      errors.push("Invalid price");
    }
  }

  if (type === "buys" || type === "sells") {
    if (!row.ticker) errors.push("Missing ticker");
  }

  if (type === "deposits") {
    if (row.type !== "Deposit" && row.type !== "Withdrawal") {
      errors.push('Type must be "Deposit" or "Withdrawal"');
    }
  }
  if (type === "income") {
    if (!row.type) errors.push("Missing type");
  }

  // Suppress unused-var lint for existingTickers here — used in the parent
  void existingTickers;

  return { row, rowNum, errors };
}

function mapRow(row: ParsedRow, type: ImportType, userId: string) {
  const base = { user_id: userId };

  if (type === "deposits") {
    return {
      ...base,
      txn_date: row.date.trim(),
      type: row.type,
      amount: cleanNumber(row.amount),
      notes: row.notes?.trim() || null,
    };
  }
  if (type === "buys") {
    return {
      ...base,
      buy_date: row.date.trim(),
      ticker: row.ticker.trim().toUpperCase(),
      shares: cleanNumber(row.shares),
      price_per_share: cleanNumber(row.price),
      notes: row.notes?.trim() || null,
    };
  }
  if (type === "sells") {
    return {
      ...base,
      sell_date: row.date.trim(),
      ticker: row.ticker.trim().toUpperCase(),
      shares: cleanNumber(row.shares),
      price_per_share: cleanNumber(row.price),
      fees: row.fees ? cleanNumber(row.fees) : 0,
      notes: row.notes?.trim() || null,
    };
  }
  return {
    ...base,
    received_date: row.date.trim(),
    type: row.type,
    ticker: row.ticker?.trim().toUpperCase() || null,
    amount: cleanNumber(row.amount),
    notes: row.notes?.trim() || null,
  };
}

function cleanNumber(v: string | undefined | null): number {
  if (v === undefined || v === null) return NaN;
  // Strip currency symbols, commas, whitespace
  const cleaned = String(v).replace(/[$,\s]/g, "").trim();
  return parseFloat(cleaned);
}