import { KpiCardsSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/table-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <PageHeaderSkeleton />
      <div className="mb-6"><KpiCardsSkeleton count={2} /></div>
      <TableSkeleton columns={9} rows={6} />
    </main>
  );
}