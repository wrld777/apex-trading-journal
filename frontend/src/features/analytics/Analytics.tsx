import { useState } from 'react'

/* ── DATA ── */
const KPI_BAR = [
  { label: 'Net P&L',      value: '$18,420', green: true  },
  { label: 'Win Rate',     value: '63.8%',   green: false },
  { label: 'Avg RR',       value: '2.14R',   green: false },
  { label: 'Profit Factor',value: '3.62',    green: false },
  { label: 'Max DD',       value: '-$2,140', red: true    },
  { label: 'Avg Hold',     value: '23 min',  green: false },
  { label: 'Best Streak',  value: '7W',      green: false },
]

const KEY_STATS = [
  { label: 'Avg Winner',   value: '+$641',  color: 'text-green-500' },
  { label: 'Avg Loser',    value: '-$299',  color: 'text-red-500'   },
  { label: 'Largest Win',  value: '+$3,200',color: 'text-green-500' },
  { label: 'Largest Loss', value: '-$820',  color: 'text-red-500'   },
  { label: 'Avg Hold',     value: '23 min', color: 'text-white'     },
  { label: 'Best Streak',  value: '7W',     color: 'text-white'     },
  { label: 'Worst Streak', value: '3L',     color: 'text-red-500'   },
]

const DOW_BARS = [
  { day: 'Mon', h: 80,  pos: true  },
  { day: 'Tue', h: 96,  pos: true  },
  { day: 'Wed', h: 60,  pos: true  },
  { day: 'Thu', h: 28,  pos: false },
  { day: 'Fri', h: 48,  pos: true  },
]

const PNLS: Record<number, number> = {
  5: 1200, 6: -380, 7: 840, 8: 2100, 9: 560,
  12: 1840, 13: 920, 14: -290, 15: 1680, 16: 3200,
  19: 440, 20: -820, 21: 960, 22: 1100, 23: 2840,
  27: 560, 28: 1240, 29: 780,
}

/* ── CALENDAR ── */
function Calendar() {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const cells: React.ReactNode[] = []

  // May 2025 starts on Thursday → 3 empty cells
  for (let i = 0; i < 3; i++) {
    cells.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let d = 1; d <= 31; d++) {
    const dayOfWeek = (d + 2) % 7
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
    const pnl       = PNLS[d]
    const isToday   = d === 13

    let cls = 'bg-[#141416] text-zinc-700'
    if (!isWeekend && pnl !== undefined) {
      cls = pnl > 2000
        ? 'bg-green-500/22 text-green-500 border border-green-500/25'
        : pnl > 0
        ? 'bg-green-500/12 text-green-500 border border-green-500/15'
        : 'bg-red-500/10 text-red-500 border border-red-500/12'
    }

    const pnlStr = pnl !== undefined
      ? (pnl > 0 ? `+$${(pnl / 1000).toFixed(1)}k` : `-$${(Math.abs(pnl) / 1000).toFixed(1)}k`)
      : ''

    cells.push(
      <div
        key={d}
        className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all hover:opacity-80 hover:scale-105 text-[10px] ${cls} ${isToday ? 'outline outline-1 outline-white/[0.18]' : ''}`}
        aria-label={`May ${d}${pnlStr ? ': ' + pnlStr : ''}`}
      >
        <span className="text-[9px] leading-none">{d}</span>
        {pnlStr && <span className="text-[8px] font-medium leading-none">{pnlStr}</span>}
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[9px] text-zinc-700 uppercase tracking-widest pb-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">{cells}</div>
    </div>
  )
}

/* ── MAIN ── */
export default function Analytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'trades'>('overview')

  return (
    <div className="p-7">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-[22px] tracking-tight text-white leading-none mb-1">Analytics</h1>
          <p className="text-xs text-zinc-600">Deep performance analysis · 58 trades</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">
            Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="4" y1="1" x2="4" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Date Range
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] px-6 py-4 flex items-center gap-8 mb-4 flex-wrap">
        {KPI_BAR.map((k, i) => (
          <div key={k.label} className="flex items-center gap-8">
            <div className="flex flex-col gap-0.5">
              <div className={`font-bold text-[20px] tracking-tight ${
                (k as any).green ? 'text-green-500' : (k as any).red ? 'text-red-500' : 'text-white'
              }`}>{k.value}</div>
              <div className="text-[10px] text-zinc-700 uppercase tracking-widest">{k.label}</div>
            </div>
            {i < KPI_BAR.length - 1 && (
              <div className="w-px h-9 bg-white/[0.04]" />
            )}
          </div>
        ))}
      </div>

      {/* Cumulative PNL + Drawdown */}
      <div className="grid grid-cols-2 gap-3.5 mb-3.5">

        {/* Cumulative PNL */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Cumulative P&L</div>
            <button className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded border border-white/[0.07] hover:text-zinc-400 transition-all">By Trade</button>
          </div>
          <div style={{ height: 220 }}>
            <svg viewBox="0 0 400 220" className="w-full" style={{ height: 220 }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="an-eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34,197,94,0.3)"/>
                  <stop offset="100%" stopColor="rgba(34,197,94,0)"/>
                </linearGradient>
              </defs>
              <line x1="0" y1="37"  x2="400" y2="37"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <line x1="0" y1="75"  x2="400" y2="75"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <line x1="0" y1="112" x2="400" y2="112" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <polyline points="0,140 28,130 55,122 80,128 110,112 138,95 160,88 188,102 215,86 240,72 265,60 295,52 320,42 350,34 380,26 400,20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polygon points="0,140 28,130 55,122 80,128 110,112 138,95 160,88 188,102 215,86 240,72 265,60 295,52 320,42 350,34 380,26 400,20 400,150 0,150" fill="url(#an-eq)"/>
              <text x="4" y="35"  fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">$18,420</text>
              <text x="4" y="73"  fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">$10,000</text>
              <text x="4" y="110" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">$0</text>
            </svg>
          </div>
        </div>

        {/* Drawdown */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Drawdown Analysis</div>
          <div style={{ height: 220 }}>
            <svg viewBox="0 0 400 220" className="w-full" style={{ height: 220 }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="dd-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(239,68,68,0)"/>
                  <stop offset="100%" stopColor="rgba(239,68,68,0.2)"/>
                </linearGradient>
              </defs>
              <line x1="0" y1="10"  x2="400" y2="10"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <line x1="0" y1="50"  x2="400" y2="50"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="4,3" strokeWidth="1"/>
              <text x="4" y="98" fill="rgba(239,68,68,0.4)" fontSize="8" fontFamily="monospace">-5% limit</text>
              <polyline points="0,10 40,10 60,20 80,12 110,28 140,18 160,36 195,22 220,12 250,18 280,10 310,14 340,10 380,10 400,10" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polygon points="0,10 40,10 60,20 80,12 110,28 140,18 160,36 195,22 220,12 250,18 280,10 310,14 340,10 380,10 400,10 400,10 0,10" fill="url(#dd-grad)"/>
              <circle cx="160" cy="36" r="3" fill="#ef4444"/>
              <line x1="160" y1="36" x2="160" y2="150" stroke="rgba(239,68,68,0.2)" strokeWidth="1" strokeDasharray="3,3"/>
              <text x="162" y="50" fill="rgba(239,68,68,0.6)" fontSize="8" fontFamily="monospace">-1.43%</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Day of Week + Win/Loss + Key Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-3.5">

        {/* P&L by Day */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">P&L by Day of Week</div>
          <div className="flex items-end gap-2 h-[120px] pb-1">
            {DOW_BARS.map(b => (
              <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-sm transition-opacity hover:opacity-70 ${b.pos ? 'bg-green-500/50' : 'bg-red-500/45'}`}
                  style={{ height: b.h }}
                />
                <div className="text-[9px] text-zinc-700">{b.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Win / Loss Donut */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Win / Loss Split</div>
          <div className="flex items-center justify-center py-4">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#141416" strokeWidth="18"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="18"
                strokeDasharray="150.8 238.76" strokeDashoffset="0" strokeLinecap="round"
                transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="18"
                strokeDasharray="86.3 238.76" strokeDashoffset="-150.8" strokeLinecap="round"
                transform="rotate(-90 50 50)"/>
              <text x="50" y="47" textAnchor="middle" fill="#f4f4f5" fontSize="13" fontFamily="Syne, sans-serif" fontWeight="700">63.8%</text>
              <text x="50" y="59" textAnchor="middle" fill="#3f3f46" fontSize="7" fontFamily="monospace">WIN RATE</text>
            </svg>
          </div>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />Wins 37
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />Losses 21
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Key Stats</div>
          <div className="flex flex-col">
            {KEY_STATS.map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-xs text-zinc-600">{s.label}</span>
                <span className={`text-xs font-mono ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Calendar */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-[18px] hover:border-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Monthly P&L Calendar — May 2025</div>
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] border bg-green-500/10 border-green-500/20 text-green-500">
            +$18,420 MTD
          </span>
        </div>
        <Calendar />
      </div>

    </div>
  )
}