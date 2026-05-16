import { useEffect, useRef } from 'react'
import KpiCard from '../../components/ui/KpiCard'

/* ── HEATMAP ── */
function Heatmap() {
  const days  = ['M', 'T', 'W', 'T', 'F']
  const weeks = 13

  const seed = (n: number) => {
    const x = Math.sin(n + 1) * 10000
    return x - Math.floor(x)
  }

  const cellData: string[] = []
  for (let i = 0; i < weeks * 5; i++) {
    const r = seed(i)
    if      (r < 0.35) cellData.push('hm-0')
    else if (r < 0.50) cellData.push(`hm-n${Math.floor(seed(i * 3) * 3) + 1}`)
    else               cellData.push(`hm-${Math.floor(seed(i * 7) * 4) + 1}`)
  }

  const hmColor: Record<string, string> = {
    'hm-0':  'bg-[#141416]',
    'hm-1':  'bg-green-500/15',
    'hm-2':  'bg-green-500/30',
    'hm-3':  'bg-green-500/50',
    'hm-4':  'bg-green-500/75',
    'hm-n1': 'bg-red-500/15',
    'hm-n2': 'bg-red-500/30',
    'hm-n3': 'bg-red-500/50',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '26px repeat(13, 1fr)', gap: 2 }}>
      {days.map((day, di) => (
        <>
          <div key={`label-${di}`} className="text-[9px] text-zinc-700 flex items-center justify-end pr-1">{day}</div>
          {Array.from({ length: weeks }).map((_, w) => {
            const cls = cellData[w * 5 + di]
            return (
              <div
                key={`${di}-${w}`}
                className={`aspect-square rounded-[2px] cursor-pointer hover:opacity-80 ${hmColor[cls] ?? 'bg-[#141416]'}`}
              />
            )
          })}
        </>
      ))}
    </div>
  )
}

/* ── RECENT TRADES ── */
const TRADES = [
  { symbol: 'NQ', dir: 'Long',  entry: '18,842.00', exit: '18,904.25', rr: '2.4R',  pnl: '+$1,240', setup: 'Breaker Block', status: 'WIN'  },
  { symbol: 'NQ', dir: 'Short', entry: '18,910.50', exit: '18,876.00', rr: '1.8R',  pnl: '+$690',   setup: 'ICT OB Entry',  status: 'WIN'  },
  { symbol: 'NQ', dir: 'Long',  entry: '18,798.25', exit: '18,763.50', rr: '-0.8R', pnl: '-$290',   setup: 'FVG',           status: 'LOSS' },
  { symbol: 'NQ', dir: 'Long',  entry: '18,720.00', exit: '18,848.50', rr: '3.1R',  pnl: '+$2,570', setup: 'Silver Bullet', status: 'WIN'  },
  { symbol: 'NQ', dir: 'Short', entry: '18,955.75', exit: '18,955.75', rr: '0R',    pnl: '$0',      setup: 'VWAP Reject',   status: 'B/E'  },
]

const SETUPS = [
  { name: 'Breaker Block',   wr: 82, pnl: '+$8,240', color: 'green' },
  { name: 'ICT OB Entry',    wr: 71, pnl: '+$5,180', color: 'green' },
  { name: 'Fair Value Gap',  wr: 67, pnl: '+$3,920', color: 'green' },
  { name: 'Liquidity Sweep', wr: 58, pnl: '+$2,440', color: 'green' },
  { name: 'VWAP Rejection',  wr: 50, pnl: '-$180',   color: 'amber' },
  { name: 'Silver Bullet',   wr: 75, pnl: '+$3,460', color: 'green' },
]

const SESSIONS = [
  { name: 'London 02:00–05:00',      pnl: '+$6,280',  meta: '14 trades · 71% WR · Best session', pos: true  },
  { name: 'New York 09:30–11:00',    pnl: '+$9,840',  meta: '22 trades · 68% WR · Most active',  pos: true  },
  { name: 'Silver Bullet 10:00–11:00', pnl: '+$3,460', meta: '8 trades · 75% WR',               pos: true  },
  { name: 'Afternoon / Other',       pnl: '-$1,160',  meta: '3 trades · 33% WR · Avoid',         pos: false },
]

/* ── MAIN ── */
export default function Dashboard() {
  return (
    <div className="p-7">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-[22px] tracking-tight text-white leading-none mb-1">
            Good morning, Ahmed.
          </h1>
          <p className="text-xs text-zinc-600">
            Tuesday, 13 May 2025 · NQ Futures · Funded $150k
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">May 2025</button>
          <button className="px-3 py-1.5 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">All Time</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3.5 mb-3.5">
        <KpiCard label="Net P&L" value="$18,420" delta="+12.3% MTD" deltaUp={true}>
          <div className="h-7 mt-2">
            <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
              <defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(34,197,94,0.2)"/><stop offset="100%" stopColor="rgba(34,197,94,0)"/></linearGradient></defs>
              <polyline points="0,22 15,18 28,20 40,10 55,8 68,12 80,5 100,3" fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polygon points="0,22 15,18 28,20 40,10 55,8 68,12 80,5 100,3 100,28 0,28" fill="url(#lg1)"/>
            </svg>
          </div>
        </KpiCard>

        <KpiCard label="Win Rate" value="63.8%" delta="+4.1% vs avg" deltaUp={true}>
          <div className="h-1 bg-[#1a1a1d] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '63.8%' }} />
          </div>
          <div className="text-[10px] text-zinc-700 mt-1.5">37W / 21L</div>
        </KpiCard>

        <KpiCard label="Avg RR" value="2.14" delta="+0.3 vs target" deltaUp={true}>
          <div className="h-7 mt-2">
            <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
              <polyline points="0,18 12,20 25,14 35,16 48,10 60,7 72,9 85,5 100,4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </KpiCard>

        <KpiCard label="Max Drawdown" value="-$2,140" delta="1.43% of capital" deltaUp={false}>
          <div className="h-1 bg-[#1a1a1d] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-red-500 rounded-full" style={{ width: '14.3%' }} />
          </div>
          <div className="text-[10px] text-zinc-700 mt-1.5">Limit 5% ($7,500)</div>
        </KpiCard>

        <KpiCard label="Profit Factor" value="3.62" delta="Excellent" deltaUp={true}>
          <div className="h-7 mt-2">
            <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
              <rect x="5"  y="12" width="10" height="15" rx="1" fill="rgba(34,197,94,0.5)"/>
              <rect x="20" y="8"  width="10" height="19" rx="1" fill="rgba(34,197,94,0.5)"/>
              <rect x="35" y="15" width="10" height="12" rx="1" fill="rgba(239,68,68,0.4)"/>
              <rect x="50" y="6"  width="10" height="21" rx="1" fill="rgba(34,197,94,0.5)"/>
              <rect x="65" y="10" width="10" height="17" rx="1" fill="rgba(34,197,94,0.5)"/>
              <rect x="80" y="18" width="10" height="9"  rx="1" fill="rgba(239,68,68,0.4)"/>
            </svg>
          </div>
        </KpiCard>
      </div>

      {/* Equity Curve */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] mb-3.5 hover:border-white/[0.07] transition-colors col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Equity Curve</div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-zinc-600">Live</span>
            <div className="w-px h-3 bg-white/[0.04] mx-1" />
            {['1D','1W','1M','3M'].map(t => (
              <button key={t} className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                t === '1W' ? 'bg-[#1a1a1d] border-white/[0.07] text-white' : 'border-white/[0.07] text-zinc-600 hover:text-zinc-400'
              }`}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ height: 180 }}>
          <svg viewBox="0 0 800 180" className="w-full" style={{ height: 180 }} preserveAspectRatio="none">
            <defs><linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(34,197,94,0.25)"/><stop offset="100%" stopColor="rgba(34,197,94,0)"/></linearGradient></defs>
            <line x1="0" y1="40"  x2="800" y2="40"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="90"  x2="800" y2="90"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="140" x2="800" y2="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <polyline points="0,155 40,148 80,142 120,136 150,140 190,130 220,125 260,118 295,122 330,108 365,95 400,88 440,100 475,84 510,78 550,70 590,62 625,55 660,50 700,42 740,35 800,28" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points="0,155 40,148 80,142 120,136 150,140 190,130 220,125 260,118 295,122 330,108 365,95 400,88 440,100 475,84 510,78 550,70 590,62 625,55 660,50 700,42 740,35 800,28 800,180 0,180" fill="url(#eq-grad)"/>
            <circle cx="800" cy="28" r="4" fill="#22c55e"/>
            <circle cx="800" cy="28" r="8" fill="rgba(34,197,94,0.2)"/>
            <text x="8" y="38"  fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">$168,420</text>
            <text x="8" y="88"  fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">$160,000</text>
            <text x="8" y="138" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">$151,000</text>
          </svg>
        </div>
        <div className="flex justify-between mt-1">
          {['Apr 1','Apr 15','May 1','May 13'].map(d => (
            <span key={d} className="text-[10px] text-zinc-700">{d}</span>
          ))}
        </div>
      </div>

      {/* Sessions + Setups + Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-3.5">

        {/* Sessions */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Sessions</div>
          <div className="flex flex-col gap-2">
            {SESSIONS.map(s => (
              <div key={s.name} className="bg-[#141416] border border-white/[0.04] rounded-md px-3.5 py-3 flex flex-col gap-1.5 cursor-pointer hover:border-white/[0.11] hover:-translate-y-px transition-all">
                <div className="text-[11px] text-zinc-600 uppercase tracking-[0.05em]">{s.name}</div>
                <div className={`font-bold text-[18px] tracking-tight ${s.pos ? 'text-green-500' : 'text-red-500'}`}>{s.pnl}</div>
                <div className="text-[10px] text-zinc-700">{s.meta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Performance */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Setup Performance</div>
            <button className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded border border-white/[0.07] hover:text-zinc-400 transition-all">View All</button>
          </div>
          <div className="flex flex-col">
            {SETUPS.map(s => (
              <div key={s.name} className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
                <div className="text-xs text-zinc-400 flex-1">{s.name}</div>
                <div className="flex-[2] h-[3px] bg-[#1a1a1d] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color === 'amber' ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${s.wr}%` }}
                  />
                </div>
                <div className={`text-[11px] w-9 text-right ${s.color === 'amber' ? 'text-amber-500' : 'text-green-500'}`}>{s.wr}%</div>
                <div className={`text-[11px] w-16 text-right font-mono ${s.pnl.startsWith('-') ? 'text-zinc-600' : 'text-green-500'}`}>{s.pnl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Statistics</div>
          <div className="grid grid-cols-2">
            {[
              { label: 'Total Trades', value: '58',      color: '' },
              { label: 'Best Trade',   value: '+$3,200', color: 'text-green-500' },
              { label: 'Worst Trade',  value: '-$820',   color: 'text-red-500' },
              { label: 'Avg Win',      value: '$641',    color: '' },
              { label: 'Avg Loss',     value: '-$299',   color: 'text-red-500' },
              { label: 'Best Streak',  value: '7W',      color: '' },
            ].map((s, i) => (
              <div key={s.label} className={`py-3 border-b border-white/[0.04] ${i % 2 === 1 ? 'pl-4 border-l border-white/[0.04]' : ''} ${i >= 4 ? 'border-b-0' : ''}`}>
                <div className="text-[10px] text-zinc-700 uppercase tracking-[0.06em] mb-1">{s.label}</div>
                <div className={`font-bold text-base tracking-tight ${s.color || 'text-white'}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] mb-3.5 hover:border-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Recent Trades</div>
          <button className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded border border-white/[0.07] hover:text-zinc-400 transition-all">View All →</button>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {['Symbol','Direction','Entry','Exit','RR','P&L','Setup','Status'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[10px] text-zinc-700 uppercase tracking-widest border-b border-white/[0.04] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRADES.map((t, i) => (
              <tr key={i} className="group hover:bg-[#1a1a1d] transition-colors">
                <td className="px-3 py-2.5 border-b border-white/[0.04] group-last:border-0 font-bold text-white">{t.symbol}</td>
                <td className="px-3 py-2.5 border-b border-white/[0.04] group-last:border-0">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] border ${
                    t.dir === 'Long'
                      ? 'bg-green-500/10 border-green-500/20 text-green-500'
                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>{t.dir}</span>
                </td>
                <td className="px-3 py-2.5 border-b border-white/[0.04] group-last:border-0 text-zinc-400">{t.entry}</td>
                <td className="px-3 py-2.5 border-b border-white/[0.04] group-last:border-0 text-zinc-400">{t.exit}</td>
                <td className="px-3 py-2.5 border-b border-white/[0.04] group-last:border-0 text-zinc-400">{t.rr}</td>
                <td className={`px-3 py-2.5 border-b border-white/[0.04] group-last:border-0 font-mono ${
                  t.pnl.startsWith('+') ? 'text-green-500' : t.pnl.startsWith('-') ? 'text-red-500' : 'text-zinc-400'
                }`}>{t.pnl}</td>
                <td className="px-3 py-2.5 border-b border-white/[0.04] group-last:border-0 text-zinc-400">{t.setup}</td>
                <td className="px-3 py-2.5 border-b border-white/[0.04] group-last:border-0">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${
                    t.status === 'WIN'  ? 'bg-green-500/10 text-green-500' :
                    t.status === 'LOSS' ? 'bg-red-500/10 text-red-500' :
                    'bg-[#1a1a1d] text-zinc-600'
                  }`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Heatmap */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Activity Heatmap — Last 13 Weeks</div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-700">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-[#141416]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500/75" />
            <span>More</span>
          </div>
        </div>
        <Heatmap />
      </div>

    </div>
  )
}