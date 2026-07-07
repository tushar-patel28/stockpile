import { DataExport } from "./data-export";

export default function DataPage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Data</h2>
        <p className="text-sm text-muted-foreground">
          Export your data for backup or tax filing
        </p>
      </div>
      <DataExport />
    </div>
  );
}