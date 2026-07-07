import { KpiCardsSkeleton, TableSkeleton } from "@/components/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-40" />
      </div>
      <KpiCardsSkeleton count={4} />
      <Skeleton className="h-24 rounded-lg" />
      <TableSkeleton columns={5} rows={4} />
      <TableSkeleton columns={6} rows={3} />
    </main>
  );
}