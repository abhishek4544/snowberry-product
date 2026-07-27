'use client'

/**
 * UsersPerformance — /performance/users
 * Writer-level triage dashboard. Same shell as PerformanceOverview /
 * ContentPerformance so the four tabs feel like one product.
 *
 * Rows:
 *   A. KPI strip (6 tiles) — writer-scoped
 *   B. Top contributors  ▏  Needs support  (leaderboards)
 *   C. Writers table with status badges + filters
 *   D. Weekly rhythm heatmap (writer × day-of-week)
 *   E. Berry AI recommendations
 */

import { Fragment, useMemo, useState } from 'react'
import {
  Search, Bell, Settings, Home, Plus, MessageSquare, MessagesSquare,
  ListChecks, Gauge, ImageIcon, Users as UsersIcon, Wrench, TrendingUp,
  Sparkles, ArrowUpRight, ChevronDown, Eye, Send,
  UserPlus, Calendar, ArrowUpDown,
} from 'lucide-react'

/* ─── Data ────────────────────────────────────────────────────────────── */

type Kpi = {
  label: string
  value: string
  delta: number
  spark: number[]
  inverse?: boolean
}

const KPIS: Kpi[] = [
  { label: 'Active writers',        value: '18',    delta:  12.5, spark: [12, 13, 14, 14, 15, 16, 16, 17, 17, 18, 18, 18] },
  { label: 'Articles this week',    value: '132',   delta:  18.6, spark: [12, 15, 18, 22, 21, 18, 24, 28, 26, 30, 33, 38] },
  { label: 'Avg articles/writer',   value: '7.3',   delta:   3.4, spark: [5.2, 5.4, 5.6, 5.9, 6.1, 6.2, 6.4, 6.6, 6.8, 7.0, 7.1, 7.3] },
  { label: 'Median views/article',  value: '34.9k', delta:   8.3, spark: [22, 24, 23, 26, 28, 27, 30, 31, 30, 33, 34, 35] },
  { label: 'New contributors',      value: '3',     delta:  50.0, spark: [1,  1,  1,  1,  2,  2,  2,  2,  3,  3,  3,  3] },
  { label: 'Silent 7d+',            value: '6',     delta: -33.3, spark: [10, 9, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6], inverse: true },
]

type Status = 'prolific' | 'steady' | 'slowing' | 'silent'

type Role = 'Reporter' | 'Editor' | 'Sub-editor' | 'Freelancer'
type Beat = 'Politics' | 'Business' | 'Sports' | 'World' | 'Opinion' | 'Culture' | 'Tech' | 'Weather'

/* Top contributors — 5 writers with highest weekly output */
type TopWriter = {
  name: string
  role: Role
  beat: Beat
  beatColor: string
  articles: number
  totalViews: number
  weekSpark: number[]
  delta: number
  avatar: string
}
const TOP: TopWriter[] = [
  { name: 'Sagar Sharma',   role: 'Reporter',   beat: 'Politics', beatColor: '#0787FF', articles: 14, totalViews: 486_400, weekSpark: [1, 2, 2, 3, 2, 2, 2], delta: 32.4, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop' },
  { name: 'Anu Rai',        role: 'Reporter',   beat: 'Business', beatColor: '#F59B25', articles: 11, totalViews: 342_200, weekSpark: [1, 1, 2, 2, 2, 2, 1], delta: 24.6, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&auto=format&fit=crop' },
  { name: 'Prakash Giri',   role: 'Reporter',   beat: 'Sports',   beatColor: '#10B981', articles: 10, totalViews: 412_800, weekSpark: [0, 1, 2, 2, 2, 2, 1], delta: 41.2, avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80&auto=format&fit=crop' },
  { name: 'Rita Adhikari',  role: 'Editor',     beat: 'Opinion',  beatColor: '#6366F1', articles:  9, totalViews: 218_400, weekSpark: [1, 1, 1, 2, 2, 1, 1], delta: 12.8, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop' },
  { name: 'Bikash KC',      role: 'Reporter',   beat: 'World',    beatColor: '#0EA5E9', articles:  8, totalViews: 186_200, weekSpark: [1, 1, 2, 1, 1, 1, 1], delta:  6.4, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop' },
]

/* Needs support — writers silent or declining */
type NeedType = 'Silent 5d' | 'Silent 8d' | 'Output halved' | 'Reads dropping' | 'New — no filing'
type SupportAction = { label: string; icon: React.ComponentType<{ className?: string }>; tone: 'brand' | 'amber' | 'slate' }
type WeakWriter = {
  name: string
  role: Role
  beat: Beat
  beatColor: string
  lastFiled: string
  reason: NeedType
  action: SupportAction
  avatar: string
}
const WEAK: WeakWriter[] = [
  { name: 'Sunita Poudel',  role: 'Reporter',   beat: 'Weather',  beatColor: '#F97316', lastFiled: '8 days ago', reason: 'Silent 8d',       action: { label: 'Nudge',        icon: Send,     tone: 'brand' }, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop' },
  { name: 'Ramesh Thapa',   role: 'Reporter',   beat: 'Tech',     beatColor: '#14B8A6', lastFiled: '5 days ago', reason: 'Output halved',   action: { label: 'Schedule 1:1', icon: Calendar, tone: 'brand' }, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80&auto=format&fit=crop' },
  { name: 'Nisha Karki',    role: 'Freelancer', beat: 'Culture',  beatColor: '#A855F7', lastFiled: '5 days ago', reason: 'Silent 5d',       action: { label: 'Nudge',        icon: Send,     tone: 'brand' }, avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80&auto=format&fit=crop' },
  { name: 'Deepak Rana',    role: 'Reporter',   beat: 'Weather',  beatColor: '#F97316', lastFiled: '3 days ago', reason: 'Reads dropping',  action: { label: 'Reassign',     icon: UsersIcon, tone: 'amber' }, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&q=80&auto=format&fit=crop' },
  { name: 'Prabin Basnet',  role: 'Freelancer', beat: 'Opinion',  beatColor: '#6366F1', lastFiled: '—',           reason: 'New — no filing', action: { label: 'Assign beat',  icon: UserPlus, tone: 'slate' }, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80&auto=format&fit=crop' },
]

/* Writers table */
type Row = {
  n: number
  name: string
  role: Role
  beat: Beat
  beatColor: string
  articles: number
  totalViews: number
  medianReadThrough: number
  shares: number
  weekSpark: number[]
  status: Status
  avatar: string
}
const ROWS: Row[] = [
  { n:  1, name: 'Sagar Sharma',   role: 'Reporter',   beat: 'Politics', beatColor: '#0787FF', articles: 14, totalViews: 486_400, medianReadThrough: 68, shares: 18_240, weekSpark: [1, 2, 2, 3, 2, 2, 2], status: 'prolific', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop' },
  { n:  2, name: 'Anu Rai',        role: 'Reporter',   beat: 'Business', beatColor: '#F59B25', articles: 11, totalViews: 342_200, medianReadThrough: 62, shares: 12_820, weekSpark: [1, 1, 2, 2, 2, 2, 1], status: 'prolific', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&auto=format&fit=crop' },
  { n:  3, name: 'Prakash Giri',   role: 'Reporter',   beat: 'Sports',   beatColor: '#10B981', articles: 10, totalViews: 412_800, medianReadThrough: 71, shares: 16_420, weekSpark: [0, 1, 2, 2, 2, 2, 1], status: 'prolific', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80&auto=format&fit=crop' },
  { n:  4, name: 'Rita Adhikari',  role: 'Editor',     beat: 'Opinion',  beatColor: '#6366F1', articles:  9, totalViews: 218_400, medianReadThrough: 58, shares:  6_120, weekSpark: [1, 1, 1, 2, 2, 1, 1], status: 'steady',   avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop' },
  { n:  5, name: 'Bikash KC',      role: 'Reporter',   beat: 'World',    beatColor: '#0EA5E9', articles:  8, totalViews: 186_200, medianReadThrough: 54, shares:  4_820, weekSpark: [1, 1, 2, 1, 1, 1, 1], status: 'steady',   avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop' },
  { n:  6, name: 'Mira Shrestha',  role: 'Reporter',   beat: 'Politics', beatColor: '#0787FF', articles:  7, totalViews: 142_800, medianReadThrough: 61, shares:  3_620, weekSpark: [1, 1, 1, 1, 1, 1, 1], status: 'steady',   avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&auto=format&fit=crop' },
  { n:  7, name: 'Kabin Tamang',   role: 'Sub-editor', beat: 'Culture',  beatColor: '#A855F7', articles:  6, totalViews:  98_400, medianReadThrough: 52, shares:  2_140, weekSpark: [1, 1, 1, 1, 1, 0, 1], status: 'steady',   avatar: 'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=200&q=80&auto=format&fit=crop' },
  { n:  8, name: 'Ramesh Thapa',   role: 'Reporter',   beat: 'Tech',     beatColor: '#14B8A6', articles:  3, totalViews:  42_600, medianReadThrough: 44, shares:    820, weekSpark: [1, 1, 1, 0, 0, 0, 0], status: 'slowing',  avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80&auto=format&fit=crop' },
  { n:  9, name: 'Deepak Rana',    role: 'Reporter',   beat: 'Weather',  beatColor: '#F97316', articles:  2, totalViews:  18_200, medianReadThrough: 38, shares:    340, weekSpark: [1, 0, 1, 0, 0, 0, 0], status: 'slowing',  avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&q=80&auto=format&fit=crop' },
  { n: 10, name: 'Nisha Karki',    role: 'Freelancer', beat: 'Culture',  beatColor: '#A855F7', articles:  0, totalViews:       0, medianReadThrough:  0, shares:      0, weekSpark: [0, 0, 0, 0, 0, 0, 0], status: 'silent',   avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80&auto=format&fit=crop' },
  { n: 11, name: 'Sunita Poudel',  role: 'Reporter',   beat: 'Weather',  beatColor: '#F97316', articles:  0, totalViews:       0, medianReadThrough:  0, shares:      0, weekSpark: [0, 0, 0, 0, 0, 0, 0], status: 'silent',   avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop' },
  { n: 12, name: 'Prabin Basnet',  role: 'Freelancer', beat: 'Opinion',  beatColor: '#6366F1', articles:  0, totalViews:       0, medianReadThrough:  0, shares:      0, weekSpark: [0, 0, 0, 0, 0, 0, 0], status: 'silent',   avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80&auto=format&fit=crop' },
]

/* Weekly rhythm — filings per writer per day-of-week (top 8) */
const RHYTHM_WRITERS = ROWS.slice(0, 8)
const RHYTHM_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const RHYTHM: number[][] = [
  [2, 3, 3, 2, 2, 1, 1], // Sagar
  [1, 2, 2, 2, 2, 1, 1], // Anu
  [1, 1, 2, 2, 2, 1, 1], // Prakash
  [1, 1, 2, 2, 1, 1, 1], // Rita
  [1, 1, 1, 2, 1, 1, 1], // Bikash
  [1, 1, 1, 1, 1, 1, 1], // Mira
  [0, 1, 1, 1, 1, 1, 1], // Kabin
  [1, 1, 1, 0, 0, 0, 0], // Ramesh
]

/* Berry AI recs */
type Rec = { title: string; detail: string; count?: number; icon: React.ComponentType<{ className?: string }>; tone: 'brand' | 'emerald' | 'amber' | 'rose' }
const RECS: Rec[] = [
  { title: 'Overdue check-ins',         detail: '3 writers silent 5+ days — schedule a 1:1',            count: 3, icon: Calendar,  tone: 'rose'    },
  { title: 'New talent to watch',       detail: '2 first-time contributors landed above 2× median',      count: 2, icon: UserPlus,  tone: 'emerald' },
  { title: 'Redistribute Weather beat', detail: '1 writer carrying 80% of the beat this month',          count: 1, icon: UsersIcon, tone: 'amber'   },
  { title: 'Best day to file',          detail: 'Wednesday hits peak reach — encourage mid-week filing',            icon: TrendingUp, tone: 'brand'  },
]

const OUTER_TABS = ['Overview', 'Content', 'Users', 'Author'] as const
const INNER_TABS = ['Overview', 'Content', 'Users', 'Author'] as const

const STATUS_META: Record<Status, { label: string; dot: string; bg: string; text: string }> = {
  prolific: { label: 'Prolific', dot: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  steady:   { label: 'Steady',   dot: '#0787FF', bg: 'bg-brand-50',   text: 'text-brand-600'   },
  slowing:  { label: 'Slowing',  dot: '#F59B25', bg: 'bg-amber-50',   text: 'text-amber-700'   },
  silent:   { label: 'Silent',   dot: '#94A3B8', bg: 'bg-slate-100',  text: 'text-slate-600'   },
}

/* ─── Formatting ─────────────────────────────────────────────────────── */

const fmtViews = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000     ? `${(n / 1_000).toFixed(1)}k`     : String(n)

const fmtInt = (n: number) => n.toLocaleString('en-US')

/* ─── Component ──────────────────────────────────────────────────────── */

type StatusFilter = 'all' | Status

export default function UsersPerformance() {
  const [outerTab, setOuterTab] = useState<(typeof OUTER_TABS)[number]>('Users')
  const [innerTab, setInnerTab] = useState<(typeof INNER_TABS)[number]>('Users')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<'articles' | 'totalViews' | 'shares'>('articles')

  const filtered = useMemo(() => {
    const list = statusFilter === 'all' ? ROWS : ROWS.filter((r) => r.status === statusFilter)
    return [...list].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
  }, [statusFilter, sortKey])

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
                See what each writer filed this week — who's productive, who's slipping, and where the beat needs backup.
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
            {/* Inner tabs + period + download */}
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

            {/* Ask Berry AI — user-tab prompts */}
            <div className="mt-4 flex flex-wrap items-center gap-2 px-3">
              <span className="text-[13px] font-medium text-slate-700">Ask Berry AI For the summary</span>
              {[
                'Which writers went silent this week?',
                "Who's my most consistent performer?",
                'Which authors need support?',
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

            {/* Row A — KPI strip */}
            <section className="mt-4 px-3">
              <KpiStrip />
            </section>

            {/* Row B — Top contributors | Needs support */}
            <section className="mt-4 grid grid-cols-1 gap-4 px-3 lg:grid-cols-2">
              <TopContributorsCard />
              <NeedsSupportCard />
            </section>

            {/* Row C — Writers table */}
            <section className="mt-4 px-3">
              <WritersTable
                rows={filtered}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortKey={sortKey}
                setSortKey={setSortKey}
              />
            </section>

            {/* Row D + E — Rhythm heatmap + AI recs */}
            <section className="mt-4 grid grid-cols-1 gap-4 px-3 lg:grid-cols-[minmax(0,1fr)_380px]">
              <WeeklyRhythmCard />
              <RecommendationsCard />
            </section>
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

/* ─── Sidebar ────────────────────────────────────────────────────────── */

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

/* ─── Shared bits ────────────────────────────────────────────────────── */

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-[14px] bg-white p-5 ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${className}`}>
      {children}
    </section>
  )
}

function Delta({ value, small = false, inverse = false }: { value: number; small?: boolean; inverse?: boolean }) {
  const up = value >= 0
  const good = inverse ? !up : up
  const cls = small ? 'text-[10.5px] px-1.5 py-0.5' : 'text-[11.5px] px-2 py-0.5'
  return (
    <span
      className={[
        'inline-flex items-center gap-0.5 rounded-md font-semibold tabular-nums',
        cls,
        good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
      ].join(' ')}
    >
      {up ? '↑' : '↓'}{Math.abs(value).toFixed(1)}%
    </span>
  )
}

function BeatChip({ beat, color }: { beat: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {beat}
    </span>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${m.bg} px-2 py-0.5 text-[11px] font-semibold ${m.text}`}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
      {m.label}
    </span>
  )
}

function Avatar({ src, size = 36 }: { src: string; size?: number }) {
  return (
    <div className="shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
    </div>
  )
}

function TinySpark({ points, color }: { points: number[]; color: string }) {
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
  const gid = `sp-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-[34px] w-full">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Row A — KPI strip ─────────────────────────────────────────────── */

function KpiStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {KPIS.map((k) => {
        const up = k.delta >= 0
        const good = k.inverse ? !up : up
        return (
          <div key={k.label} className="rounded-[14px] bg-white p-4 ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[11px] font-medium text-slate-500">{k.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-[22px] font-semibold leading-none text-slate-950 tabular-nums">
                {k.value}
              </span>
              <Delta value={k.delta} small inverse={k.inverse} />
            </div>
            <div className="mt-3">
              <TinySpark points={k.spark} color={good ? '#10B981' : '#F43F5E'} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Row B — Top contributors ──────────────────────────────────────── */

function TopContributorsCard() {
  const totalArticles = TOP.reduce((s, w) => s + w.articles, 0)
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-brand-500">Top contributors</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            <span className="font-semibold text-slate-800 tabular-nums">{totalArticles}</span> articles written this week · top 5
          </p>
        </div>
        <button className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand-500 hover:text-brand-600 transition-colors">
          View all <ArrowUpRight className="size-3" />
        </button>
      </div>

      <ul className="mt-4 flex flex-col">
        {TOP.map((w, i) => {
          const rank = i + 1
          const isTop = rank === 1
          const peakDayIdx = w.weekSpark.indexOf(Math.max(...w.weekSpark))
          return (
            <li
              key={w.name}
              className={[
                'group grid grid-cols-[20px_auto_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-lg px-2 py-3.5 -mx-2 transition-colors hover:bg-slate-50/70',
                i === TOP.length - 1 ? '' : 'border-b border-slate-100',
              ].join(' ')}
            >
              {/* Rank — quiet numeral, brand accent for #1 */}
              <span
                className={[
                  'text-right font-display text-[13px] font-semibold tabular-nums',
                  isTop ? 'text-brand-500' : 'text-slate-400',
                ].join(' ')}
              >
                {rank}
              </span>

              {/* Avatar — subtle brand ring for #1 */}
              <div
                className={[
                  'relative shrink-0 rounded-full',
                  isTop ? 'p-[2px] bg-gradient-to-br from-brand-400 to-brand-600' : '',
                ].join(' ')}
              >
                <Avatar src={w.avatar} size={44} />
              </div>

              {/* Identity */}
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-slate-950 font-display">{w.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <BeatChip beat={w.beat} color={w.beatColor} />
                  <span className="text-[11.5px] text-slate-500">{w.role}</span>
                </div>
              </div>

              {/* Daily filing rhythm — Mon-Sun bars, peak day highlighted */}
              <DailyFilingBars data={w.weekSpark} color={w.beatColor} peakIdx={peakDayIdx} />

              {/* HERO metric — articles written */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[28px] font-semibold leading-none text-slate-950 tabular-nums">
                    {w.articles}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    articles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Delta value={w.delta} small />
                  <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-slate-500">
                    <Eye className="size-3 text-slate-400" />
                    {fmtViews(w.totalViews)}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/* Mon–Sun bar chart showing daily article count. Peak day gets full colour,
   other filed days get a muted tint, empty days get a hairline placeholder. */
function DailyFilingBars({ data, color, peakIdx }: { data: number[]; color: string; peakIdx: number }) {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[3px]" title={`Peak: ${labels[peakIdx]} · ${data[peakIdx]} filed`}>
      {data.map((v, i) => {
        const h = v === 0 ? 2 : Math.max((v / max) * 28, 6)
        const isPeak = i === peakIdx && v > 0
        const bg = v === 0 ? '#E2E8F0' : isPeak ? color : `${color}55`
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-[10px] rounded-[2px] transition-all group-hover:opacity-90"
              style={{ height: `${h}px`, backgroundColor: bg }}
            />
            <span
              className={[
                'text-[9px] font-medium tabular-nums leading-none',
                isPeak ? 'text-slate-700' : 'text-slate-400',
              ].join(' ')}
            >
              {labels[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Row B — Needs support ─────────────────────────────────────────── */

function NeedsSupportCard() {
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-amber-600">Needs support</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">Silent or slowing — check in this week</p>
        </div>
        <button className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand-500 hover:text-brand-600 transition-colors">
          View all <ArrowUpRight className="size-3" />
        </button>
      </div>

      <div className="mt-4 flex flex-col">
        {WEAK.map((w, i) => {
          const ActionIcon = w.action.icon
          const toneCls =
            w.action.tone === 'brand'  ? 'bg-brand-500 text-white hover:bg-brand-600' :
            w.action.tone === 'amber'  ? 'bg-amber-500 text-white hover:bg-amber-600' :
                                         'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          return (
            <div
              key={w.name}
              className={[
                'grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 py-3',
                i === WEAK.length - 1 ? '' : 'border-b border-slate-100',
              ].join(' ')}
            >
              <Avatar src={w.avatar} size={40} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-slate-900 font-display">{w.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <BeatChip beat={w.beat} color={w.beatColor} />
                  <span className="text-[11px] text-slate-500">{w.role}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-rose-700">
                    {w.reason}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Last filed: {w.lastFiled}</p>
              </div>
              <button
                className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${toneCls}`}
              >
                <ActionIcon className="size-3.5" />
                {w.action.label}
              </button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

/* ─── Row C — Writers table ─────────────────────────────────────────── */

function WritersTable({
  rows,
  statusFilter,
  setStatusFilter,
  sortKey,
  setSortKey,
}: {
  rows: Row[]
  statusFilter: StatusFilter
  setStatusFilter: (s: StatusFilter) => void
  sortKey: 'articles' | 'totalViews' | 'shares'
  setSortKey: (k: 'articles' | 'totalViews' | 'shares') => void
}) {
  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all',       label: 'All',      count: ROWS.length },
    { key: 'prolific',  label: 'Prolific', count: ROWS.filter(r => r.status === 'prolific').length },
    { key: 'steady',    label: 'Steady',   count: ROWS.filter(r => r.status === 'steady').length   },
    { key: 'slowing',   label: 'Slowing',  count: ROWS.filter(r => r.status === 'slowing').length  },
    { key: 'silent',    label: 'Silent',   count: ROWS.filter(r => r.status === 'silent').length   },
  ]

  return (
    <Panel className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-[16px] font-semibold text-brand-500">All writers</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Sorted by <button onClick={() => setSortKey('articles')}   className={sortKey === 'articles'   ? 'font-semibold text-slate-900' : 'hover:text-slate-900'}>Articles</button>
            <span className="text-slate-300"> · </span>
            <button onClick={() => setSortKey('totalViews')} className={sortKey === 'totalViews' ? 'font-semibold text-slate-900' : 'hover:text-slate-900'}>Total views</button>
            <span className="text-slate-300"> · </span>
            <button onClick={() => setSortKey('shares')}     className={sortKey === 'shares'     ? 'font-semibold text-slate-900' : 'hover:text-slate-900'}>Shares</button>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter label="Role" />
          <Filter label="Beat" />
          <Filter label="Team" />
          <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 hover:border-slate-300 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-3">
        {statusTabs.map((t) => {
          const active = t.key === statusFilter
          const dot =
            t.key === 'prolific' ? '#10B981' :
            t.key === 'steady'   ? '#0787FF' :
            t.key === 'slowing'  ? '#F59B25' :
            t.key === 'silent'   ? '#94A3B8' : ''
          return (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors',
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-600 font-semibold'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              ].join(' ')}
            >
              {dot && <span className="size-1.5 rounded-full" style={{ backgroundColor: dot }} />}
              {t.label}
              <span className="tabular-nums text-slate-400">{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* Header */}
      <div className="mt-4 grid grid-cols-[36px_minmax(220px,2fr)_100px_100px_100px_88px_120px_100px] items-center gap-4 border-y border-slate-200 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        <span>#</span>
        <span>Writer</span>
        <SortHead label="Articles"     active={sortKey === 'articles'}   onClick={() => setSortKey('articles')} />
        <SortHead label="Total views"  active={sortKey === 'totalViews'} onClick={() => setSortKey('totalViews')} />
        <span className="text-right">Read-thr</span>
        <SortHead label="Shares"       active={sortKey === 'shares'}     onClick={() => setSortKey('shares')} />
        <span>Weekly output</span>
        <span className="text-right">Status</span>
      </div>

      {/* Rows */}
      <div>
        {rows.map((r, i) => {
          const trendColor =
            r.status === 'prolific' ? '#10B981' :
            r.status === 'silent'   ? '#94A3B8' :
            r.status === 'slowing'  ? '#F59B25' : '#0787FF'
          return (
            <div
              key={r.n}
              className={[
                'grid grid-cols-[36px_minmax(220px,2fr)_100px_100px_100px_88px_120px_100px] items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50/70',
                i === rows.length - 1 ? '' : 'border-b border-slate-100',
              ].join(' ')}
            >
              <span className="text-[12px] font-medium text-slate-400 tabular-nums">{r.n}</span>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={r.avatar} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-900 font-display">{r.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <BeatChip beat={r.beat} color={r.beatColor} />
                    <span>{r.role}</span>
                  </div>
                </div>
              </div>
              <span className="text-right text-[13px] tabular-nums text-slate-800">{r.articles}</span>
              <span className="text-right text-[13px] tabular-nums text-slate-800">{fmtViews(r.totalViews)}</span>
              <span className="text-right text-[13px] tabular-nums text-slate-700">
                {r.medianReadThrough > 0 ? `${r.medianReadThrough}%` : '—'}
              </span>
              <span className="text-right text-[13px] tabular-nums text-slate-700">{fmtInt(r.shares)}</span>
              <div className="w-[120px]">
                <TinySpark points={r.weekSpark.length ? r.weekSpark : [0, 0, 0, 0, 0, 0, 0]} color={trendColor} />
              </div>
              <div className="flex justify-end">
                <StatusBadge status={r.status} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3">
        <p className="text-[12px] text-slate-500 tabular-nums">Showing {rows.length} of {ROWS.length}</p>
        <div className="flex items-center gap-1">
          <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] text-slate-500 hover:border-slate-300 transition-colors">Prev</button>
          <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] text-slate-700">1</button>
          <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] text-slate-500 hover:border-slate-300 transition-colors">2</button>
          <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] text-slate-500 hover:border-slate-300 transition-colors">Next</button>
        </div>
      </div>
    </Panel>
  )
}

function SortHead({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center justify-end gap-1 text-right',
        active ? 'text-brand-500' : 'hover:text-slate-800',
      ].join(' ')}
    >
      {label}
      <ArrowUpDown className="size-3 opacity-60" />
    </button>
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

/* ─── Row D — Weekly rhythm heatmap ─────────────────────────────────── */

function WeeklyRhythmCard() {
  const max = Math.max(...RHYTHM.flat())
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-brand-500">Weekly rhythm</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">Filings per writer per day of week</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <span>Low</span>
          <span className="ml-1 flex items-center gap-0.5">
            {[0.15, 0.35, 0.55, 0.75, 1].map((o, i) => (
              <span key={i} className="size-3 rounded-[3px]" style={{ backgroundColor: `rgba(7, 135, 255, ${o})` }} />
            ))}
          </span>
          <span className="ml-1">High</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(120px,180px)_repeat(7,minmax(0,1fr))_60px] gap-1.5">
        <span />
        {RHYTHM_DAYS.map((d) => (
          <span key={d} className="text-center text-[10.5px] font-medium text-slate-500">{d}</span>
        ))}
        <span className="text-right text-[10.5px] font-medium text-slate-500">Total</span>

        {RHYTHM_WRITERS.map((w, wi) => {
          const rowTotal = RHYTHM[wi].reduce((s, n) => s + n, 0)
          return (
            <Fragment key={w.n}>
              <div className="flex items-center gap-2 min-w-0">
                <Avatar src={w.avatar} size={22} />
                <span className="truncate text-[12px] text-slate-700">{w.name}</span>
              </div>
              {RHYTHM[wi].map((v, di) => {
                const intensity = v / (max || 1)
                const bg = v === 0 ? '#F1F5F9' : `rgba(7, 135, 255, ${0.15 + intensity * 0.75})`
                return (
                  <div
                    key={di}
                    className="aspect-[7/5] rounded-md ring-1 ring-slate-900/[0.03] transition-transform hover:scale-105"
                    style={{ backgroundColor: bg }}
                    title={`${w.name} · ${RHYTHM_DAYS[di]} · ${v} article${v === 1 ? '' : 's'}`}
                  />
                )
              })}
              <div className="flex items-center justify-end text-[12px] font-semibold text-slate-800 tabular-nums">
                {rowTotal}
              </div>
            </Fragment>
          )
        })}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 text-[11.5px] text-slate-500">
        <span className="font-semibold text-slate-700">Peak filing day:</span> Wednesday
        <span className="mx-2 text-slate-300">·</span>
        <span className="font-semibold text-slate-700">Weekend dip:</span> ~35% below weekday median
      </div>
    </Panel>
  )
}

/* ─── Row E — Berry AI recommendations ──────────────────────────────── */

function RecommendationsCard() {
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-brand-500">
            <Sparkles className="size-4" />
            Berry AI recommends
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">People moves worth making this week</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {RECS.map((r) => {
          const Icon = r.icon
          const iconCls =
            r.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
            r.tone === 'amber'   ? 'bg-amber-50 text-amber-600'     :
            r.tone === 'rose'    ? 'bg-rose-50 text-rose-600'       :
                                   'bg-brand-50 text-brand-500'
          return (
            <button
              key={r.title}
              className="group flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white p-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50/50"
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${iconCls}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="truncate text-[13px] font-semibold text-slate-900 font-display">{r.title}</p>
                  {r.count != null && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0 text-[10.5px] font-semibold text-slate-600 tabular-nums">
                      {r.count}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{r.detail}</p>
              </div>
              <ArrowUpRight className="mt-1 size-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-500" />
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
