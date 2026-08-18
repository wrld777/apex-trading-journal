interface KpiCardProps {
  label: string
  value: string
  delta?: string
  deltaUp?: boolean
  children?: React.ReactNode
}

export default function KpiCard({ label, value, delta, deltaUp, children }: KpiCardProps) {
  return (
    <div className="bg-surface border border-line rounded-[10px] p-[18px] relative overflow-hidden hover:border-line-2 transition-colors">
      <div className="text-[11px] text-content-muted tracking-[0.04em] mb-[14px] uppercase">{label}</div>
      <div className={`font-mono font-medium text-[26px] tracking-tight leading-none mb-1.5 ${
        deltaUp === true ? 'text-pos' : deltaUp === false ? 'text-neg' : 'text-content-strong'
      }`}>
        {value}
      </div>
      {delta && (
        <div className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded mb-2 ${
          deltaUp ? 'bg-pos/10 text-pos' : 'bg-neg/10 text-neg'
        }`}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <polyline
              points={deltaUp ? '2,7 5,3 8,7' : '2,3 5,7 8,3'}
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          {delta}
        </div>
      )}
      {children}
    </div>
  )
}