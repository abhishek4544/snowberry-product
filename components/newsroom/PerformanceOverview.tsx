'use client'

/**
 * PerformanceOverview — /performance/overview
 * Pixel-faithful rebuild of the Figma with only the confirmed surgical fixes:
 * - Berry (not Bery), United States (not United state)
 * - Total categories math: 10 = 5 In Nav + 5 Sub menu
 * - Varied realistic numbers (no repeated 4.8k / 1.2M / 24%)
 * - Audience Y-axis in uniform 5k steps (0, 5, 10, 15, 20)
 * - Distribution donut colours match legend 1:1 + numeric %/counts
 * - Sidebar Gauge active
 * - Small-N countries drop their delta (— instead)
 * - Sports = Trending: its sparkline is now positive
 * Layout, tab structure, spacing, ordering, and tile shapes match the Figma.
 */

import { useState } from 'react'
import {
  Search, Bell, Settings, Home, Plus, MessageSquare, MessagesSquare,
  ListChecks, Gauge, ImageIcon, Users as UsersIcon, Wrench, TrendingUp,
  Sparkles, ArrowUpRight, ChevronDown, Globe,
} from 'lucide-react'

/* ─── Data ────────────────────────────────────────────────────────────── */

type Category = {
  id: string
  name: string
  group: 'Menu' | 'Sub menu'
  accent: string
  articles: number
  views: number
  spark: number[]
  up: boolean
}

const CATS: Category[] = [
  { id: 'politics',  name: 'Politics',  group: 'Menu',     accent: '#0787FF', articles: 4_820, views: 1_240_000, up: true,  spark: [42, 44, 40, 48, 52, 61, 58, 66, 72, 74, 80, 88, 96, 104] },
  { id: 'business',  name: 'Business',  group: 'Menu',     accent: '#F59B25', articles: 3_140, views:   892_000, up: true,  spark: [58, 60, 55, 62, 64, 66, 62, 68, 70, 72, 74, 76, 78, 82] },
  { id: 'tech',      name: 'Tech',      group: 'Sub menu', accent: '#14B8A6', articles: 1_260, views:   388_000, up: false, spark: [66, 64, 62, 58, 56, 54, 52, 50, 48, 46, 42, 40, 38, 34] },
  { id: 'culture',   name: 'Culture',   group: 'Menu',     accent: '#A855F7', articles: 1_840, views:   342_000, up: true,  spark: [22, 24, 26, 30, 34, 40, 46, 52, 58, 64, 70, 76, 82, 90] },
  { id: 'world',     name: 'World',     group: 'Menu',     accent: '#0EA5E9', articles: 2_960, views:   720_000, up: true,  spark: [40, 42, 44, 42, 46, 48, 50, 52, 50, 54, 56, 58, 60, 62] },
  { id: 'sports',    name: 'Sports',    group: 'Menu',     accent: '#10B981', articles: 3_540, views: 1_020_000, up: true,  spark: [28, 30, 34, 38, 44, 52, 60, 68, 74, 82, 90, 98, 108, 122] },
  { id: 'opinion',   name: 'Opinion',   group: 'Sub menu', accent: '#6366F1', articles: 1_620, views:   512_000, up: true,  spark: [40, 42, 44, 42, 46, 48, 50, 52, 50, 54, 56, 58, 60, 62] },
  { id: 'lifestyle', name: 'Lifestyle', group: 'Sub menu', accent: '#EC4899', articles: 1_040, views:   214_000, up: false, spark: [48, 46, 48, 50, 46, 48, 46, 44, 46, 44, 42, 44, 42, 44] },
  { id: 'health',    name: 'Health',    group: 'Sub menu', accent: '#84CC16', articles:   860, views:   186_000, up: true,  spark: [28, 30, 30, 32, 34, 34, 36, 38, 38, 40, 42, 44, 44, 46] },
  { id: 'weather',   name: 'Weather',   group: 'Sub menu', accent: '#F97316', articles:   760, views:   128_000, up: false, spark: [40, 38, 40, 36, 34, 36, 32, 30, 32, 28, 26, 28, 26, 24] },
]

// Audience — Y-axis in uniform 5k steps
const AUDIENCE = {
  total: 284_700,
  delta: 14.2,
  medianCompletion: 62,
  mobileShare: 71,
  returning: 32,
  daily: [4.2, 5.8, 4.9, 6.4, 15.2, 13.1, 20.4], // Mon–Sun, k
}

// Countries — top 5, small-N deltas suppressed
type Country = { name: string; visitors: number; delta: number | null }
const COUNTRIES: Country[] = [
  { name: 'Nepal',           visitors: 214_820, delta:  18.4 },
  { name: 'India',           visitors:  38_140, delta:  12.6 },
  { name: 'United States',   visitors:  24_680, delta:   4.1 },
  { name: 'United Kingdom',  visitors:   9_240, delta:  -2.8 },
  { name: 'Australia',       visitors:   4_120, delta:   6.3 },
]

// Distribution — colours match legend 1:1
const DISTRIBUTION = {
  subscribed: 34_240,
  nonSubscribed: 250_460,
}

// Top articles — varied categories & deltas
type Article = { title: string; author: string; when: string; category: string; categoryColor: string; delta: number; cover: string }
const ARTICLES: Article[] = [
  { title: 'रास्वपा सुदूरपश्चिममा सभापतिबाहेकका पदाधिकारीका…',       author: 'Sagar Sharma', when: 'Yesterday', category: 'Politics', categoryColor: '#0787FF', delta: 24, cover: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&q=80' },
  { title: 'वर्षौंदेखि विवादित वैदेशिक रोजगारीको…',                 author: 'Anu Rai',      when: 'Yesterday', category: 'Business', categoryColor: '#F59B25', delta: 18, cover: 'https://images.unsplash.com/photo-1587653263995-422546a7a569?w=200&q=80' },
  { title: 'मन्त्रीको घरको पेटीमा उखु पेल्नेमाथि…',                 author: 'Bikash KC',    when: '2 days ago', category: 'Politics', categoryColor: '#0787FF', delta: 21, cover: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=200&q=80' },
  { title: 'दुई दिन बिदाले देश डुब्दैन, कमजोर व्यवस्थापनले…',        author: 'Rita Adhikari', when: '3 days ago', category: 'Opinion',  categoryColor: '#6366F1', delta: 15, cover: 'https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?w=200&q=80' },
  { title: 'मेस्सीको ह्याट्रिकमा साविक विजेता अर्जेन्टिनाको…',      author: 'Prakash Giri',  when: '4 days ago', category: 'Sports',   categoryColor: '#10B981', delta: 32, cover: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&q=80' },
]

const OUTER_TABS = ['Overview', 'Content', 'Users', 'Author'] as const
const INNER_TABS = ['Overview', 'Content', 'Users', 'Author'] as const

/* ─── Formatting ─────────────────────────────────────────────────────── */

const fmtViewsShort = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000     ? `${(n / 1_000).toFixed(1)}k`     : String(n)

const fmtArticles = (n: number) =>
  n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n)

const fmtInt = (n: number) => n.toLocaleString('en-US')

/* ─── Component ──────────────────────────────────────────────────────── */

export default function PerformanceOverview() {
  const [outerTab, setOuterTab] = useState<(typeof OUTER_TABS)[number]>('Overview')
  const [innerTab, setInnerTab] = useState<(typeof INNER_TABS)[number]>('Overview')

  return (
    <div className="relative min-h-screen w-full bg-[#EEF4FE]">
      <TopBar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0 px-6 pb-14 pt-4">
          {/* Header row — title + outer pill tabs */}
          <section className="flex flex-wrap items-start justify-between gap-4 px-2">
            <div>
              <h1 className="font-display text-[36px] font-semibold leading-none tracking-[-0.01em] text-slate-950">
                Performance
              </h1>
              <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-slate-600">
                Monday&apos;s report covers newsroom actions, reader engagement, and four key decisions for the week.
              </p>
            </div>
            <div className="inline-flex rounded-full bg-white/70 p-1 ring-1 ring-slate-200/70 backdrop-blur-md">
              {OUTER_TABS.map((t) => {
                const active = t === outerTab
                return (
                  <button
                    key={t}
                    onClick={() => setOuterTab(t)}
                    className={[
                      'rounded-full px-5 py-2 text-[13px] font-medium transition-colors',
                      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                    ].join(' ')}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Panel container */}
          <div className="mt-4 rounded-[20px] bg-white/60 p-4 ring-1 ring-white/80 backdrop-blur-md">
            {/* Row: inner underline tabs + period + download */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-3">
              <div className="flex items-center">
                {INNER_TABS.map((t) => {
                  const active = t === innerTab
                  return (
                    <button
                      key={t}
                      onClick={() => setInnerTab(t)}
                      className={[
                        'relative px-5 py-3 text-[14px] font-medium transition-colors',
                        active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800',
                      ].join(' ')}
                    >
                      {t}
                      {active && (
                        <span aria-hidden className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-brand-500" />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 pb-2">
                <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] text-slate-700 hover:border-slate-300 transition-colors">
                  Last week
                  <ChevronDown className="size-3.5 opacity-60" />
                </button>
                <button className="inline-flex items-center gap-1 rounded-md bg-brand-500 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand-600 transition-colors">
                  Download as
                  <ChevronDown className="size-3.5 opacity-80" />
                </button>
              </div>
            </div>

            {/* Ask Berry AI — inline row */}
            <div className="mt-4 flex flex-wrap items-center gap-2 px-3">
              <span className="text-[13px] font-medium text-slate-700">Ask Berry AI For the summary</span>
              {[
                'How did Viewers find my content?',
                'Which reporters performed best?',
                'Which content needs attention?',
              ].map((p) => (
                <button
                  key={p}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <ArrowUpRight className="size-3.5 text-slate-400" />
                  {p}
                </button>
              ))}
              <button className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand-600 transition-colors">
                Ask Berry AI
                <Sparkles className="size-3.5" />
              </button>
            </div>

            {/* Two-column layout */}
            <div className="mt-4 grid grid-cols-1 gap-4 px-3 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex flex-col gap-4">
                <AudienceCard />
                <CategoryCard />
              </div>
              <aside className="flex flex-col gap-4">
                <CountriesCard />
                <DistributionCard />
                <TopArticlesCard />
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ─── Top bar ────────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/70 backdrop-blur-md px-6 py-2.5">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-[22px] font-bold tracking-tight text-brand-500">snowberry</span>
          <sup className="text-[9px] font-semibold text-brand-400">TM</sup>
        </div>
        <span className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <TrendingUp size={16} className="text-teal-600" strokeWidth={2.25} />
          <span className="text-[16px] font-semibold text-teal-700 font-display">उकालो</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-[420px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles, authors, tags…"
            className="w-full rounded-lg border border-black/10 bg-white/70 py-2.5 pl-9 pr-14 text-[14px] text-slate-800 placeholder:text-black/40 outline-none focus:border-slate-300 transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded bg-slate-900/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700">⌘K</kbd>
        </div>
        <button className="flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell size={18} strokeWidth={1.75} />
        </button>
        <button className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          <Settings size={18} strokeWidth={1.75} />
        </button>
        <div className="size-10 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&auto=format&fit=crop"
            alt="Mohan"
            className="size-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}

/* ─── Sidebar (Gauge is active) ──────────────────────────────────────── */

function Sidebar() {
  const primary = [
    { icon: Home,           label: 'Home',        active: false },
    { icon: Plus,           label: 'New',         active: false },
    { icon: MessageSquare,  label: 'Messages',    active: false },
    { icon: MessagesSquare, label: 'Chats',       active: false },
    { icon: ListChecks,     label: 'Tasks',       active: false },
    { icon: Gauge,          label: 'Performance', active: true  },
    { icon: ImageIcon,      label: 'Media',       active: false },
    { icon: UsersIcon,      label: 'Team',        active: false },
    { icon: Wrench,         label: 'Tools',       active: false },
  ]
  const bottom = [
    { icon: UsersIcon, label: 'People' },
    { icon: Settings,  label: 'Settings' },
  ]
  return (
    <aside className="sticky top-[57px] flex h-[calc(100vh-57px)] w-[64px] shrink-0 flex-col items-center justify-between py-3">
      <nav className="flex flex-col items-center gap-2">
        {primary.map(({ icon: Icon, label, active }) => (
          <button
            key={label} title={label}
            className={[
              'flex size-11 items-center justify-center rounded-full transition-colors',
              active
                ? 'bg-brand-50 text-brand-500 shadow-[0_0_0_1px_rgba(7,135,255,0.15)]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={20} strokeWidth={1.75} />
          </button>
        ))}
      </nav>
      <nav className="flex flex-col items-center gap-2">
        {bottom.map(({ icon: Icon, label }) => (
          <button
            key={label} title={label}
            className="flex size-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <Icon size={20} strokeWidth={1.75} />
          </button>
        ))}
      </nav>
    </aside>
  )
}

/* ─── Delta pill (compact) ──────────────────────────────────────────── */

function Delta({ value, small = false }: { value: number; small?: boolean }) {
  const up = value >= 0
  const cls = small ? 'text-[10.5px] px-1.5 py-0.5' : 'text-[11.5px] px-2 py-0.5'
  return (
    <span
      className={[
        'inline-flex items-center gap-0.5 rounded-md font-semibold tabular-nums',
        cls,
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
      ].join(' ')}
    >
      {up ? '↑' : '↓'}{Math.abs(value).toFixed(1)}%
    </span>
  )
}

/* ─── Card wrapper ──────────────────────────────────────────────────── */

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-[14px] bg-white p-5 ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${className}`}>
      {children}
    </section>
  )
}

/* ─── Audience card ─────────────────────────────────────────────────── */

function AudienceCard() {
  const CEILING = 22
  const W = 720, H = 260, PAD = { l: 40, r: 16, t: 12, b: 26 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const step = innerW / (AUDIENCE.daily.length - 1)
  const coords = AUDIENCE.daily.map((v, i) => {
    const x = PAD.l + i * step
    const y = PAD.t + (1 - v / CEILING) * innerH
    return [x, y] as const
  })
  const line = coords.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
  const area = `${line} L ${PAD.l + innerW} ${PAD.t + innerH} L ${PAD.l} ${PAD.t + innerH} Z`

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[16px] font-semibold text-brand-500">Audience</h2>
        <div className="inline-flex items-center gap-2">
          <Filter label="Device Type" />
          <Filter label="Traffic Source" />
          <Filter label="Status" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[200px_minmax(0,1fr)] gap-6">
        {/* Left: number + inline sub-stats (matches Figma exactly) */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[34px] font-semibold leading-none text-slate-950 tabular-nums">
              {fmtViewsShort(AUDIENCE.total)}
            </span>
            <Delta value={AUDIENCE.delta} />
          </div>
          <p className="mt-1.5 text-[12px] text-slate-500">Views · last week</p>

          <div className="mt-6 flex flex-col gap-5">
            <SubStatInline label="Median completion" value={`${AUDIENCE.medianCompletion}%`} />
            <SubStatInline label="Mobile share"      value={`${AUDIENCE.mobileShare}%`} />
            <SubStatInline label="Returning"         value={`${AUDIENCE.returning}%`} />
          </div>
        </div>

        {/* Right: chart, uniform 5k Y-axis */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[260px]">
          <defs>
            <linearGradient id="aud-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor="#0787FF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0787FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g stroke="#E2E8F0" strokeWidth="1">
            {[5, 10, 15, 20].map((v) => {
              const y = PAD.t + (1 - v / CEILING) * innerH
              return (
                <g key={v}>
                  <line x1={PAD.l} y1={y} x2={PAD.l + innerW} y2={y} strokeDasharray="2 4" />
                  <text x={PAD.l - 6} y={y + 3} textAnchor="end" fill="#94A3B8" fontSize="10">{v}k</text>
                </g>
              )
            })}
            <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="#CBD5E1" />
            <text x={PAD.l - 6} y={PAD.t + innerH + 3} textAnchor="end" fill="#94A3B8" fontSize="10">0</text>
          </g>
          <path d={area} fill="url(#aud-fill)" />
          <path d={line} fill="none" stroke="#0787FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#0787FF" strokeWidth="2" />
          ))}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
            <text key={d} x={PAD.l + i * step} y={H - 6} textAnchor="middle" fill="#94A3B8" fontSize="10.5">{d}</text>
          ))}
        </svg>
      </div>
    </Panel>
  )
}

function SubStatInline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-slate-500">{label}</p>
      <p className="mt-1 font-display text-[20px] font-semibold text-slate-950 tabular-nums">{value}</p>
    </div>
  )
}

function Filter({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 hover:border-slate-300 transition-colors">
      {label}
      <ChevronDown className="size-3 opacity-60" />
    </button>
  )
}

/* ─── Category card ─────────────────────────────────────────────────── */

function CategoryCard() {
  // Anchors derived from data — Sports (best week-over-week momentum) is Trending
  // and Politics (highest views) is Most viral. Sports' spark is positive so
  // there's no contradiction between the tile label and the row spark.
  const trending = CATS.reduce((a, b) => (a.spark[a.spark.length - 1] - a.spark[0] > b.spark[b.spark.length - 1] - b.spark[0] ? a : b))
  const mostViral = CATS.reduce((a, b) => (a.views > b.views ? a : b))
  const inNav = CATS.filter(c => c.group === 'Menu').length
  const subMenu = CATS.filter(c => c.group === 'Sub menu').length

  const rows = [...CATS].sort((a, b) => b.views - a.views).slice(0, 6)

  return (
    <Panel>
      <h2 className="text-[16px] font-semibold text-brand-500">Category</h2>

      {/* 3 summary tiles */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <SummaryTile
          label="Most Viral"
          value={mostViral.name}
          chip={<Chip color={mostViral.accent}>{mostViral.name}</Chip>}
        />
        <SummaryTile
          label="Trending"
          value={trending.name}
          chip={<Chip color={trending.accent}>{fmtViewsShort(trending.views)} views</Chip>}
        />
        <SummaryTile
          label="Total Categories"
          value={String(CATS.length)}
          chip={
            <div className="flex w-full items-center justify-between text-[11px] text-slate-500">
              <span>{inNav} in Nav</span>
              <span>{subMenu} sub menu</span>
            </div>
          }
        />
      </div>

      {/* Table */}
      <div className="mt-5">
        <div className="grid grid-cols-[minmax(200px,1.4fr)_100px_120px_140px] items-center gap-4 border-b border-slate-200 py-2 text-[12px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">Title</span>
          <span className="text-right">Articles</span>
          <span className="text-right">Views count</span>
          <span>Growth</span>
        </div>
        {rows.map((c, i) => (
          <div
            key={c.id}
            className={[
              'grid grid-cols-[minmax(200px,1.4fr)_100px_120px_140px] items-center gap-4 py-3.5',
              i === rows.length - 1 ? '' : 'border-b border-slate-100',
            ].join(' ')}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white"
                style={{ backgroundColor: c.accent }}
              >
                {c.name.charAt(0)}
              </span>
              <span className="truncate text-[13.5px] font-medium text-slate-900">{c.name}</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">
                <Globe className="size-3" />
                {c.group}
              </span>
            </div>
            <span className="text-right text-[13px] tabular-nums text-slate-700">{fmtArticles(c.articles)}</span>
            <span className="text-right text-[13px] tabular-nums text-slate-700">{fmtViewsShort(c.views)} views</span>
            <Sparkline points={c.spark} up={c.up} />
          </div>
        ))}
      </div>
    </Panel>
  )
}

function SummaryTile({ label, value, chip }: { label: string; value: string; chip: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-white p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1.5 font-display text-[22px] font-semibold leading-tight text-slate-950">{value}</p>
      <div className="mt-2.5">{chip}</div>
    </div>
  )
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  )
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const W = 130, H = 34, PAD = 3
  const min = Math.min(...points), max = Math.max(...points)
  const rng = max - min || 1
  const step = (W - PAD * 2) / (points.length - 1)
  const coords = points.map((v, i) => {
    const x = PAD + i * step
    const y = PAD + (1 - (v - min) / rng) * (H - PAD * 2)
    return [x, y] as const
  })
  const line = coords.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
  const area = `${line} L ${W - PAD} ${H - PAD} L ${PAD} ${H - PAD} Z`
  const stroke = up ? '#10B981' : '#F43F5E'
  const gid = `spg-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Countries card ────────────────────────────────────────────────── */

function CountriesCard() {
  const max = Math.max(...COUNTRIES.map(c => c.visitors))
  return (
    <Panel>
      <h2 className="text-[16px] font-semibold text-brand-500">Countries visitor</h2>
      <div className="mt-4 flex flex-col gap-4">
        {COUNTRIES.map((c) => {
          const pct = (c.visitors / max) * 100
          const showDelta = c.visitors >= 100
          return (
            <div key={c.name}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-slate-800">{c.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] tabular-nums text-slate-700">{fmtInt(c.visitors)}</span>
                  {showDelta && c.delta != null
                    ? <Delta value={c.delta} small />
                    : <span className="text-[11px] text-slate-400">—</span>}
                </div>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        <button className="inline-flex items-center gap-1 text-[12px] text-slate-600 hover:text-slate-900 transition-colors">
          Last 7 days
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
        <button className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-500 hover:text-brand-600 transition-colors">
          View countries <ArrowUpRight className="size-3" />
        </button>
      </div>
    </Panel>
  )
}

/* ─── Users distribution — colours match legend + numeric labels ─────── */

function DistributionCard() {
  const total = DISTRIBUTION.subscribed + DISTRIBUTION.nonSubscribed
  const subPct = (DISTRIBUTION.subscribed / total) * 100
  const nonPct = 100 - subPct

  const R = 52, C = 2 * Math.PI * R
  const subLen = (subPct / 100) * C

  return (
    <Panel>
      <h2 className="text-[16px] font-semibold text-brand-500">Users<br />Distribution</h2>
      <div className="mt-2 flex items-center gap-4">
        <svg viewBox="0 0 140 140" className="size-[140px] shrink-0 -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#F5C842" strokeWidth="20" />
          <circle
            cx="70" cy="70" r={R}
            fill="none"
            stroke="#0787FF"
            strokeWidth="20"
            strokeDasharray={`${subLen} ${C - subLen}`}
            strokeLinecap="butt"
          />
        </svg>
        <div className="flex-1">
          <LegendRow color="#0787FF" label="Subscribed Users"     value={fmtInt(DISTRIBUTION.subscribed)}    pct={subPct} />
          <LegendRow color="#F5C842" label="Non-Subscribed Users" value={fmtInt(DISTRIBUTION.nonSubscribed)} pct={nonPct} />
        </div>
      </div>
    </Panel>
  )
}

function LegendRow({ color, label, value, pct }: { color: string; label: string; value: string; pct: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-[12px] text-slate-700">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-[12px] font-semibold text-slate-900 tabular-nums">{pct.toFixed(1)}%</p>
        <p className="text-[10.5px] text-slate-500 tabular-nums">{value}</p>
      </div>
    </div>
  )
}

/* ─── Top articles card ─────────────────────────────────────────────── */

function TopArticlesCard() {
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <h2 className="text-[16px] font-semibold text-brand-500">Top performing<br />articles this week</h2>
        <button className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand-500 hover:text-brand-600 transition-colors">
          View more <ArrowUpRight className="size-3" />
        </button>
      </div>
      <div className="mt-3 flex flex-col">
        {ARTICLES.map((a, i) => (
          <div
            key={i}
            className={[
              'flex items-center gap-3 py-2.5',
              i === ARTICLES.length - 1 ? '' : 'border-b border-slate-100',
            ].join(' ')}
          >
            <div className="size-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.cover} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-slate-900 font-display">{a.title}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="truncate">By {a.author}</span>
                <span className="text-slate-300">·</span>
                <span className="truncate">{a.when}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: `${a.categoryColor}18`, color: a.categoryColor }}
              >
                {a.category}
              </span>
              <Delta value={a.delta} small />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
