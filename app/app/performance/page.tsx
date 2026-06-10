'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '../components/Sidebar'

// ── Data ──────────────────────────────────────────────────────────────────────
const RANGES = ['7 days', '30 days', '90 days'] as const
type Range = typeof RANGES[number]

const VIEWS_DATA: Record<Range, { labels: string[]; current: number[]; prev: number[] }> = {
  '7 days': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    current: [42, 38, 55, 71, 48, 63, 67],
    prev:    [36, 42, 45, 58, 55, 51, 49],
  },
  '30 days': {
    labels: ['W1', 'W2', 'W3', 'W4'],
    current: [184, 231, 198, 267],
    prev:    [162, 208, 221, 234],
  },
  '90 days': {
    labels: ['Jan', 'Feb', 'Mar'],
    current: [820, 960, 1140],
    prev:    [710, 890, 980],
  },
}

const ARTICLES = [
  { title: 'Why the rupee held steady despite oil price volatility', category: 'Business', views: '38.4k', readTime: '4m 12s', change: '+24%', up: true, author: 'Sagar Mehta', ctr: '6.2%' },
  { title: "The silent revolution in India's tier-2 startup scene",  category: 'Tech',     views: '29.1k', readTime: '5m 34s', change: '+18%', up: true, author: 'Riya Kapoor', ctr: '4.8%' },
  { title: "ISRO's next mission: what we know so far",               category: 'Science',  views: '21.7k', readTime: '3m 50s', change: '+31%', up: true, author: 'Dev Pillai',  ctr: '7.1%' },
  { title: 'Delhi EV policy: commercial fleet mandate explained',     category: 'Policy',   views: '18.2k', readTime: '3m 05s', change: '-4%',  up: false, author: 'Riya Kapoor', ctr: '3.2%' },
  { title: 'Inside the quiet rise of community radio in rural India', category: 'Society',  views: '14.8k', readTime: '6m 21s', change: '+9%',  up: true, author: 'Maya Gupta',  ctr: '5.5%' },
]

type AISuggestion = {
  id: string
  type: 'insight' | 'action' | 'gap' | 'timing'
  title: string
  body: string
  cta?: string
  badge?: string
  badgeColor?: string
}

const AI_INSIGHTS: AISuggestion[] = [
  {
    id: '1', type: 'insight',
    title: "This week's performance digest",
    body: "Views are up 14.2% vs last week. Your Science and Business stories are outperforming — 3 of your top 5 articles came from Sagar Mehta and Dev Pillai. Short-form pieces (under 4 min read) are getting 22% more completions.",
    badge: 'Summary', badgeColor: '#0787ff',
  },
  {
    id: '2', type: 'gap',
    title: 'Topics your competitors are covering',
    body: 'Crypto regulation bill, EV subsidies Q2 update, and Chandrayaan-4 preliminary data are trending in your categories. No coverage in the past 7 days. Each could drive 15–30k views based on past similar stories.',
    cta: 'Start a story', badge: 'Topic gap', badgeColor: '#8B5CF6',
  },
  {
    id: '3', type: 'action',
    title: '2 articles are underperforming their potential',
    body: '"Delhi EV policy" has high session time (4m avg) but low CTR (3.2%). The headline likely isn\'t landing in feeds. "Rural radio" has strong completions but low initial reach — it needs a better intro hook.',
    cta: 'Fix headlines', badge: 'Action needed', badgeColor: '#F59E0B',
  },
  {
    id: '4', type: 'timing',
    title: 'Best publish window for your audience',
    body: 'Your readers are most active 7–9 AM and 6–8 PM IST on weekdays. Articles published in these windows get 31% more first-day views. You have 3 drafts scheduled outside this window.',
    cta: 'Reschedule drafts', badge: 'Timing', badgeColor: '#22C55E',
  },
]

// ── SVG chart ─────────────────────────────────────────────────────────────────
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const cpX = (points[i - 1].x + points[i].x) / 2
    d += ` C ${cpX} ${points[i - 1].y} ${cpX} ${points[i].y} ${points[i].x} ${points[i].y}`
  }
  return d
}

function ViewsChart({ range }: { range: Range }) {
  const { labels, current, prev } = VIEWS_DATA[range]
  const W = 640, H = 180, padL = 44, padR = 16, padT = 12, padB = 32
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const max = Math.max(...current, ...prev)
  const ceil = Math.ceil(max / 20) * 20

  function toPoint(i: number, val: number) {
    return {
      x: padL + (i / (labels.length - 1)) * chartW,
      y: padT + (1 - val / ceil) * chartH,
    }
  }

  const currPts = current.map((v, i) => toPoint(i, v))
  const prevPts = prev.map((v, i) => toPoint(i, v))
  const currPath = smoothPath(currPts)
  const prevPath = smoothPath(prevPts)

  const areaPath = currPath + ` L ${currPts[currPts.length - 1].x} ${padT + chartH} L ${padL} ${padT + chartH} Z`

  const yTicks = [0, ceil / 4, ceil / 2, (ceil * 3) / 4, ceil].map(v => ({
    val: v,
    y: padT + (1 - v / ceil) * chartH,
  }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0787ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0787ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid lines + labels */}
      {yTicks.map(({ val, y }) => (
        <g key={val}>
          <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
          <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#a3a3a3" fontFamily="Inter, sans-serif">
            {val >= 1000 ? `${val / 1000}k` : val}
          </text>
        </g>
      ))}

      {/* X labels */}
      {labels.map((label, i) => {
        const x = padL + (i / (labels.length - 1)) * chartW
        return (
          <text key={label} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="#a3a3a3" fontFamily="Inter, sans-serif">
            {label}
          </text>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Prev period line (dashed) */}
      <path d={prevPath} stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />

      {/* Current line */}
      <path d={currPath} stroke="#0787ff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots on current */}
      {currPts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="white" stroke="#0787ff" strokeWidth="2" />
      ))}
    </svg>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, change, up, sub }: { label: string; value: string; change: string; up: boolean; sub?: string }) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-white rounded-[12px] border border-[#f0f0f0] shadow-[0px_1px_3px_rgba(0,0,0,0.04)] flex-1 min-w-0">
      <p className="text-[12px] font-medium text-[#737373] leading-none" style={{ fontFamily: 'var(--font-inter)' }}>{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-[26px] font-semibold text-[#171717] leading-none" style={{ fontFamily: 'var(--font-dm-sans)' }}>{value}</span>
        <span className={`text-[12px] font-medium leading-none pb-0.5 ${up ? 'text-[#16a34a]' : 'text-[#dc2626]'}`} style={{ fontFamily: 'var(--font-inter)' }}>
          {up ? '↑' : '↓'} {change}
        </span>
      </div>
      {sub && <p className="text-[11px] text-[#a3a3a3]" style={{ fontFamily: 'var(--font-inter)' }}>{sub}</p>}
    </div>
  )
}

// ── AI badge ──────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white leading-none"
      style={{ background: color, fontFamily: 'var(--font-inter)' }}
    >
      {label}
    </span>
  )
}

// ── AI suggestion card ────────────────────────────────────────────────────────
function AICard({ item, onAction }: { item: AISuggestion; onAction: (id: string) => void }) {
  const icons: Record<AISuggestion['type'], string> = {
    insight: '📊', gap: '🔭', action: '⚡', timing: '🕐',
  }

  return (
    <div className="flex flex-col gap-2.5 p-3.5 rounded-[10px] bg-white border border-[#f0f0f0] hover:border-[#d4d4d4] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[16px] leading-none">{icons[item.type]}</span>
          <p className="text-[13px] font-semibold text-[#171717] leading-[1.3]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {item.title}
          </p>
        </div>
        {item.badge && <Badge label={item.badge} color={item.badgeColor!} />}
      </div>
      <p className="text-[12px] leading-[1.6] text-[#525252]" style={{ fontFamily: 'var(--font-inter)' }}>
        {item.body}
      </p>
      {item.cta && (
        <button
          onClick={() => onAction(item.id)}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium text-[#0787ff] border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#dbeafe] transition-colors"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          ✨ {item.cta}
        </button>
      )}
    </div>
  )
}

// ── Massive AI panel ─────────────────────────────────────────────────────────
function MassiveAI() {
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Record<string, string>>({})
  const [prompt, setPrompt] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hi — I'm Massive AI. Ask me anything about your newsroom performance, or let me surface insights for you." }
  ])

  const QUICK_PROMPTS = [
    'Why is my top article trending?',
    'What should I write next?',
    'Summarize this week for my editor',
    'Which reporters need support?',
  ]

  function handleAction(id: string) {
    setGenerating(id)
    setTimeout(() => {
      const responses: Record<string, string> = {
        '2': "Story ideas ready: 1) 'Crypto Regulation Bill: What it means for retail investors' — high search volume, 0 coverage in your org. 2) 'EV subsidies Q2: Which states extended support' — follow-up opportunity from your March story. Start either now?",
        '3': "Revised headline for \"Delhi EV policy\": → \"Delhi mandates all-electric commercial vehicles by 2027 — here's the full breakdown\"\nThis headline has 38% higher predicted CTR based on similar stories.",
        '4': "3 drafts rescheduled to 7:30 AM slots: 'Coastal Road tender update', 'ISRO follow-up', 'Budget analysis'. All will go live within optimal engagement windows.",
      }
      setGenerated(prev => ({ ...prev, [id]: responses[id] || 'Done — check the editor.' }))
      setGenerating(null)
    }, 1400)
  }

  function handleChat(text: string) {
    if (!text.trim()) return
    const replies: Record<string, string> = {
      'why is my top article trending?': "The rupee story is trending because it intersects with two live keywords: 'RBI rate decision' and 'oil import costs'. It was published during a high-intent search window (Wed 8 AM) and the headline led with a counter-narrative ('held steady despite') which drove strong CTR from financial feeds.",
      'what should i write next?': "Based on your traffic patterns and gaps: 1) A follow-up on the ISRO story — reader session time suggests appetite for more. 2) EV policy deep-dive — you covered the Delhi mandate but not the national picture. 3) A profile piece — your long-form human-interest stories have 2× completion rate.",
      'summarize this week for my editor': "This week (Jun 3–9): 284.7k total views (+14.2% WoW), 5 articles published, avg read time 3m 24s. Standouts: rupee story (38.4k), ISRO (21.7k). Missed opportunity: EV topic gap cost ~25k estimated views. Recommendation: increase Science category output — 31% growth rate this week.",
      'which reporters need support?': "Riya Kapoor's articles have lower CTR (3.2–4.8%) compared to the team average (5.8%). Her content quality and depth scores are high — it's a headline/distribution issue. Suggest: a headline writing session and reviewing publish time. Dev Pillai is outperforming — good candidate for a Science series.",
    }
    const reply = replies[text.toLowerCase()] || "Good question. Based on your data from the last 7 days, I can see a few patterns worth discussing. Let me pull up the relevant metrics — would you like me to focus on audience, content performance, or team workload?"
    setChatHistory(prev => [...prev, { role: 'user', text }, { role: 'ai', text: reply }])
    setPrompt('')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white">
      {/* Header */}
      <div
        className="relative flex items-center gap-3 px-4 py-3.5 shrink-0"
        style={{ background: 'linear-gradient(135deg, #0050cc 0%, #0787ff 50%, #38a9ff 100%)' }}
      >
        <div className="flex items-center justify-center size-8 rounded-[8px] bg-white/20">
          <span className="text-[18px] leading-none">⚡</span>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-white leading-none" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Massive AI
          </p>
          <p className="text-[11px] text-blue-200 mt-0.5 leading-none" style={{ fontFamily: 'var(--font-inter)' }}>
            Newsroom intelligence, always on
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
          <span className="size-1.5 rounded-full bg-green-400 shrink-0" />
          <span className="text-[11px] text-white font-medium" style={{ fontFamily: 'var(--font-inter)' }}>Active</span>
        </div>
      </div>

      {/* AI Insights */}
      <div className="flex flex-col gap-2.5 p-3 overflow-y-auto flex-1">
        <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wider px-0.5" style={{ fontFamily: 'var(--font-inter)' }}>
          Insights · this period
        </p>

        {AI_INSIGHTS.map(item => (
          <div key={item.id}>
            <AICard item={item} onAction={handleAction} />
            {generating === item.id && (
              <div className="mt-1.5 px-3 py-2 rounded-[8px] bg-[#f0f8ff] border border-[#bfdbfe] text-[12px] text-[#0787ff]" style={{ fontFamily: 'var(--font-inter)' }}>
                ✨ Generating...
              </div>
            )}
            {generated[item.id] && (
              <div className="mt-1.5 px-3 py-2.5 rounded-[8px] bg-[#f0fdf4] border border-[#bbf7d0] text-[12px] text-[#166534] leading-[1.6]" style={{ fontFamily: 'var(--font-inter)' }}>
                {generated[item.id]}
              </div>
            )}
          </div>
        ))}

        {/* Divider */}
        <div className="w-full h-px bg-[#f0f0f0] my-1" />

        {/* Chat history */}
        <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wider px-0.5" style={{ fontFamily: 'var(--font-inter)' }}>
          Ask Massive AI
        </p>

        <div className="flex flex-col gap-2">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] px-3 py-2 rounded-[10px] text-[12px] leading-[1.6] ${
                  msg.role === 'user'
                    ? 'bg-[#0787ff] text-white rounded-br-[3px]'
                    : 'bg-[#f5f5f5] text-[#262626] rounded-bl-[3px]'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {QUICK_PROMPTS.map(q => (
            <button
              key={q}
              onClick={() => handleChat(q)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium text-[#525252] border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] hover:border-[#0787ff]/30 hover:text-[#0787ff] transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat input */}
      <div className="px-3 pb-3 pt-2 border-t border-[#f0f0f0] shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[10px] focus-within:border-[#0787ff]/40 focus-within:bg-white transition-colors">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleChat(prompt) }}
            placeholder="Ask about performance, topics, reporters..."
            className="flex-1 text-[12px] bg-transparent outline-none text-[#262626] placeholder:text-[#a3a3a3]"
            style={{ fontFamily: 'var(--font-inter)' }}
          />
          <button
            onClick={() => handleChat(prompt)}
            disabled={!prompt.trim()}
            className={`flex items-center justify-center size-6 rounded-[6px] transition-colors ${prompt.trim() ? 'bg-[#0787ff] text-white hover:bg-[#0061ff]' : 'bg-[#e5e5e5] text-[#a3a3a3]'}`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Article table ─────────────────────────────────────────────────────────────
type SortKey = 'views' | 'readTime' | 'change' | 'ctr'

function ArticleTable() {
  const [sort, setSort] = useState<SortKey>('views')

  const sorted = useMemo(() => {
    return [...ARTICLES].sort((a, b) => {
      const parse = (v: string) => parseFloat(v.replace(/[^0-9.]/g, ''))
      if (sort === 'views')    return parse(b.views) - parse(a.views)
      if (sort === 'readTime') return parse(b.readTime) - parse(a.readTime)
      if (sort === 'change')   return parse(b.change) - parse(a.change)
      if (sort === 'ctr')      return parse(b.ctr) - parse(a.ctr)
      return 0
    })
  }, [sort])

  const cols: { key: SortKey; label: string }[] = [
    { key: 'views', label: 'Views' },
    { key: 'ctr', label: 'CTR' },
    { key: 'readTime', label: 'Avg read' },
    { key: 'change', label: 'Change' },
  ]

  return (
    <div className="bg-white rounded-[12px] border border-[#f0f0f0] shadow-[0px_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f5f5f5]">
        <p className="text-[14px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Top articles</p>
        <div className="flex items-center gap-1">
          {cols.map(col => (
            <button
              key={col.key}
              onClick={() => setSort(col.key)}
              className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${sort === col.key ? 'bg-[#eff6ff] text-[#0787ff]' : 'text-[#737373] hover:bg-[#f5f5f5]'}`}
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {col.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid px-5 py-2 border-b border-[#f5f5f5]" style={{ gridTemplateColumns: '1fr 100px 80px 72px 72px 100px' }}>
        {['Article', 'Category', 'Views', 'CTR', 'Change', 'Author'].map(h => (
          <p key={h} className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
            {h}
          </p>
        ))}
      </div>

      {/* Rows */}
      {sorted.map((a, i) => (
        <div
          key={a.title}
          className={`grid items-center px-5 py-3 hover:bg-[#fafafa] transition-colors cursor-pointer ${i < sorted.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
          style={{ gridTemplateColumns: '1fr 100px 80px 72px 72px 100px' }}
        >
          <p className="text-[13px] font-medium text-[#262626] pr-4 truncate" style={{ fontFamily: 'var(--font-inter)' }}>
            {a.title}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#525252] w-fit" style={{ fontFamily: 'var(--font-inter)' }}>
            {a.category}
          </span>
          <p className="text-[13px] font-semibold text-[#262626]" style={{ fontFamily: 'var(--font-inter)' }}>{a.views}</p>
          <p className="text-[13px] text-[#525252]" style={{ fontFamily: 'var(--font-inter)' }}>{a.ctr}</p>
          <p className={`text-[13px] font-medium ${a.up ? 'text-[#16a34a]' : 'text-[#dc2626]'}`} style={{ fontFamily: 'var(--font-inter)' }}>
            {a.up ? '↑' : '↓'} {a.change}
          </p>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-[#dbeafe] flex items-center justify-center text-[10px] font-semibold text-[#1d4ed8] shrink-0">
              {a.author.split(' ').map(n => n[0]).join('')}
            </div>
            <p className="text-[12px] text-[#737373] truncate" style={{ fontFamily: 'var(--font-inter)' }}>{a.author.split(' ')[0]}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const [range, setRange] = useState<Range>('7 days')

  const kpis = [
    { label: 'Total views',     value: '284.7k', change: '12.4%', up: true,  sub: 'vs prev period' },
    { label: 'Unique readers',  value: '118.3k', change: '8.2%',  up: true,  sub: 'vs prev period' },
    { label: 'Avg read time',   value: '3m 24s', change: '0.3m',  up: true,  sub: 'up from 3m 09s' },
    { label: 'Article CTR',     value: '4.8%',   change: '0.3%',  up: false, sub: 'down from 5.1%' },
  ]

  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: 'var(--font-inter)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#fafafa]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-[#f0f0f0] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[16px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Performance</span>
            <span className="text-[13px] text-[#a3a3a3]">·</span>
            <span className="text-[13px] text-[#737373]">Jun 3 – Jun 9, 2026</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Range tabs */}
            <div className="flex items-center gap-0.5 bg-[#f5f5f5] rounded-[8px] p-0.5">
              {RANGES.map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${range === r ? 'bg-white text-[#171717] shadow-[0px_1px_2px_rgba(0,0,0,0.08)]' : 'text-[#737373] hover:text-[#404040]'}`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#e5e5e5] text-[13px] text-[#404040] hover:bg-[#f5f5f5] transition-colors shadow-[0px_1px_2px_rgba(0,0,0,0.04)]" style={{ fontFamily: 'var(--font-inter)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M2 4h10M2 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Export
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* KPI row */}
          <div className="flex gap-4 mb-5">
            {kpis.map(k => <KPICard key={k.label} {...k} />)}
          </div>

          {/* Main 2-column grid */}
          <div className="flex gap-4 items-start min-h-0">

            {/* Left: chart + table */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">

              {/* Views chart card */}
              <div className="bg-white rounded-[12px] border border-[#f0f0f0] shadow-[0px_1px_3px_rgba(0,0,0,0.04)] px-5 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Views over time</p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[#737373]" style={{ fontFamily: 'var(--font-inter)' }}>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-[2px] bg-[#0787ff] rounded" />
                      This period
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-[2px] bg-[#d4d4d4] rounded border-dashed" style={{ borderTop: '2px dashed #d4d4d4', background: 'none' }} />
                      Prev period
                    </span>
                  </div>
                </div>
                <ViewsChart range={range} />
              </div>

              {/* Article table */}
              <ArticleTable />
            </div>

            {/* Right: Massive AI */}
            <div className="w-[340px] shrink-0 sticky top-0" style={{ maxHeight: 'calc(100vh - 128px)' }}>
              <MassiveAI />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
