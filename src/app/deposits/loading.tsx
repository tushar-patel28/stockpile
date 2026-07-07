import { KpiCardsSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/table-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <PageHeaderSkeleton />
      <div className="mb-6"><KpiCardsSkeleton count={3} /></div>
      <TableSkeleton columns={5} rows={6} />
    </main>
  );
}