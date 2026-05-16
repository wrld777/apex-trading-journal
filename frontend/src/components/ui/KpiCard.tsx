interface KpiCardProps {
  label: string
  value: string
  delta?: string
  deltaUp?: boolean
  children?: React.ReactNode
}

export default function KpiCard({ label, value, delta, deltaUp, children }: KpiCardProps) {
  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] relative overflow-hidden hover:border-white/[0.07] transition-colors">
      <div className="text-[11px] text-zinc-600 tracking-[0.04em] mb-[14px] uppercase">{label}</div>
      <div className={`font-bold text-[26px] tracking-tight leading-none mb-1.5 ${
        deltaUp === true ? 'text-green-500' : deltaUp === false ? 'text-red-500' : 'text-white'
      }`}>
        {value}
      </div>
      {delta && (
        <div className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded mb-2 ${
          deltaUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
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