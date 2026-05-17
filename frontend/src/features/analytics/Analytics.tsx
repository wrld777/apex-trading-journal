import React from 'react'

const KPI_BAR = [
  { label: 'Net P&L',       value: '$18,420', color: 'text-green-500' },
  { label: 'Win Rate',      value: '63.8%',   color: 'text-white'     },
  { label: 'Avg RR',        value: '2.14R',   color: 'text-white'     },
  { label: 'Profit Factor', value: '3.62',    color: 'text-white'     },
  { label: 'Max DD',        value: '-$2,140', color: 'text-red-500'   },
  { label: 'Avg Hold',      value: '23 min',  color: 'text-white'     },
  { label: 'Best Streak',   value: '7W',      color: 'text-white'     },
]

const KEY_STATS = [
  { label: 'Avg Winner',   value: '+$641',   color: 'text-green-500' },
  { label: 'Avg Loser',    value: '-$299',   color: 'text-red-500'   },
  { label: 'Largest Win',  value: '+$3,200', color: 'text-green-500' },
  { label: 'Largest Loss', value: '-$820',   color: 'text-red-500'   },
  { label: 'Avg Hold',     value: '23 min',  color: 'text-white'     },
  { label: 'Best Streak',  value: '7W',      color: 'text-white'     },
  { label: 'Worst Streak', value: '3L',      color: 'text-red-500'   },
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

function Calendar() {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const cells: React.ReactNode[] = []

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
        className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all hover:opacity-80 hover:scale-105 ${cls} ${isToday ? 'outline outline-1 outline-white/[0.18]' : ''}`}
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

export default function Analytics() {
  return (
    <div className="p-4 lg:p-7">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">Analytics</h1>
          <p className="text-xs text-zinc-600">Deep performance analysis · 58 trades</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">Export CSV</button>
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

      {/* KPI Bar — scrollable on mobile, grid on desktop */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 mb-4">
        {/* Mobile: 2x grid */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {KPI_BAR.map(k => (
            <div key={k.label} className="flex flex-col gap-0.5">
              <div className={`font-display font-bold text-lg tracking-tight ${k.color}`}>{k.value}</div>
              <div className="text-[10px] text-zinc-700 uppercase tracking-widest">{k.label}</div>
            </div>
          ))}
        </div>
        {/* Desktop: horizontal row */}
        <div className="hidden sm:flex items-center flex-wrap gap-6 lg:gap-8">
          {KPI_BAR.map((k, i) => (
            <div key={k.label} className="flex items-center gap-6 lg:gap-8">
              <div className="flex flex-col gap-0.5">
                <div className={`font-display font-bold text-lg lg:text-[20px] tracking-tight ${k.color}`}>{k.value}</div>
                <div className="text-[10px] text-zinc-700 uppercase tracking-widest">{k.label}</div>
              </div>
              {i < KPI_BAR.length - 1 && <div className="w-px h-9 bg-white/[0.04]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative PNL + Drawdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">

        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Cumulative P&L</div>
            <button className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded border border-white/[0.07] hover:text-zinc-400 transition-all">By Trade</button>
          </div>
          <svg viewBox="0 0 400 180" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <defs><linearGradient id="an-eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(34,197,94,0.3)"/><stop offset="100%" stopColor="rgba(34,197,94,0)"/></linearGradient></defs>
            <line x1="0" y1="45"  x2="400" y2="45"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="90"  x2="400" y2="90"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="135" x2="400" y2="135" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <polyline points="0,165 28,152 55,142 80,148 110,132 138,112 160,104 188,120 215,100 240,84 265,70 295,60 320,48 350,38 380,28 400,20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points="0,165 28,152 55,142 80,148 110,132 138,112 160,104 188,120 215,100 240,84 265,70 295,60 320,48 350,38 380,28 400,20 400,180 0,180" fill="url(#an-eq)"/>
            <text x="4" y="42"  fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">$18,420</text>
            <text x="4" y="87"  fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">$10,000</text>
            <text x="4" y="132" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">$0</text>
          </svg>
        </div>

        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Drawdown Analysis</div>
          <svg viewBox="0 0 400 180" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <defs><linearGradient id="dd-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(239,68,68,0)"/><stop offset="100%" stopColor="rgba(239,68,68,0.2)"/></linearGradient></defs>
            <line x1="0" y1="20"  x2="400" y2="20"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="80"  x2="400" y2="80"  stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="4,3" strokeWidth="1"/>
            <text x="4" y="136" fill="rgba(239,68,68,0.4)" fontSize="9" fontFamily="monospace">-5% limit</text>
            <polyline points="0,20 40,20 60,38 80,24 110,52 140,34 160,68 195,42 220,24 250,34 280,20 310,26 340,20 380,20 400,20" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points="0,20 40,20 60,38 80,24 110,52 140,34 160,68 195,42 220,24 250,34 280,20 310,26 340,20 380,20 400,20 400,20 0,20" fill="url(#dd-grad)"/>
            <circle cx="160" cy="68" r="3" fill="#ef4444"/>
            <line x1="160" y1="68" x2="160" y2="180" stroke="rgba(239,68,68,0.2)" strokeWidth="1" strokeDasharray="3,3"/>
            <text x="162" y="86" fill="rgba(239,68,68,0.6)" fontSize="9" fontFamily="monospace">-1.43%</text>
          </svg>
        </div>
      </div>

      {/* Day of Week + Win/Loss + Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-3.5">

        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">P&L by Day of Week</div>
          <div className="flex items-end gap-2 h-[100px] pb-1">
            {DOW_BARS.map(b => (
              <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t-sm ${b.pos ? 'bg-green-500/50' : 'bg-red-500/45'}`} style={{ height: b.h * 0.9 }} />
                <div className="text-[9px] text-zinc-700">{b.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-2">Win / Loss Split</div>
          <div className="flex items-center justify-center py-2">
            <svg width="90" height="90" viewBox="0 0 100 100">
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
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600"><div className="w-1.5 h-1.5 rounded-full bg-green-500" />Wins 37</div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600"><div className="w-1.5 h-1.5 rounded-full bg-red-500" />Losses 21</div>
          </div>
        </div>

        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors sm:col-span-2 lg:col-span-1">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3">Key Stats</div>
          <div className="flex flex-col">
            {KEY_STATS.map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-xs text-zinc-500">{s.label}</span>
                <span className={`text-xs font-mono font-medium ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Calendar */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Monthly P&L Calendar — May 2025</div>
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] border bg-green-500/10 border-green-500/20 text-green-500">+$18,420 MTD</span>
        </div>
        <Calendar />
      </div>

    </div>
  )
}