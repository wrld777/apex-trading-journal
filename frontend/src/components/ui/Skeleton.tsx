/** Base shimmer block. Pass sizing via className (e.g. "h-4 w-24"). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/[0.04] rounded ${className}`} />
}

/** Skeleton matching a KPI card's footprint. */
export function KpiCardSkeleton() {
  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px]">
      <Skeleton className="h-3 w-16 mb-4" />
      <Skeleton className="h-7 w-24 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Stacked rows skeleton for tables/lists. */
export function TableSkeleton({ rows = 5, rowClassName = 'h-9' }: { rows?: number; rowClassName?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${rowClassName}`} />
      ))}
    </div>
  )
}
