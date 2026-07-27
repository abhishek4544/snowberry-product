'use client'

/**
 * ContentPerformance — /performance/content
 * Article-level triage dashboard. Same shell as PerformanceOverview
 * (top bar, sidebar, outer pill tabs, glass panel, inner underline tabs,
 * Berry AI prompt row) so the two tabs feel like one product.
 *
 * Rows:
 *   A. KPI strip (6 tiles)
 *   B. Top performers  ▏  Needs attention  (leaderboards)
 *   C. Article performance table with score badges + filters
 *   D. Content lifecycle decay chart
 *   E. Berry AI recommendations strip
 */

import { useMemo, useState } from 'react'
import {
  Search, Bell, Settings, Home, Plus, MessageSquare, MessagesSquare,
  ListChecks, Gauge, ImageIcon, Users as UsersIcon, Wrench, TrendingUp,
  Sparkles, ArrowUpRight, ChevronDown, Eye, Clock, Share2,
  AlertTriangle, RefreshCw, Type, Archive, Rocket, ArrowUpDown,
} from 'lucide-react'

/* ─── Data ────────────────────────────────────────────────────────────── */

type Kpi = {
  label: string
  value: string
  delta: number
  spark: number[]
  /** For inverse metrics (e.g. Underperformers) — a fall is good, so green ↓. */
  inverse?: boolean
}

const KPIS: Kpi[] = [
  { label: 'Published',            value: '132',   delta:  18.6, spark: [12, 15, 18, 22, 21, 18, 24, 28, 26, 30, 33, 38] },
  { label: 'Total views',          value: '4.62M', delta:  24.1, spark: [30, 38, 42, 48, 56, 62, 70, 76, 82, 88, 94, 108] },
  { label: 'Median views/article', value: '34.9k', delta:   8.3, spark: [22, 24, 23, 26, 28, 27, 30, 31, 30, 33, 34, 35] },
  { label: 'Median read-through',  value: '58.1%', delta:   6.8, spark: [46, 48, 50, 52, 51, 54, 56, 55, 57, 56, 57, 58] },
  { label: 'Winners',              value: '18',    delta:  38.5, spark: [8,  9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18] },
  { label: 'Underperformers',      value: '24',    delta: -12.5, spark: [34, 32, 33, 31, 30, 28, 29, 27, 26, 25, 24, 24], inverse: true },
]

type Score = 'winning' | 'steady' | 'cooling' | 'dead'

type CategoryMeta = { name: string; color: string }
const C = {
  politics: { name: 'Politics', color: '#0787FF' },
  business: { name: 'Business', color: '#F59B25' },
  sports:   { name: 'Sports',   color: '#10B981' },
  world:    { name: 'World',    color: '#0EA5E9' },
  opinion:  { name: 'Opinion',  color: '#6366F1' },
  culture:  { name: 'Culture',  color: '#A855F7' },
  tech:     { name: 'Tech',     color: '#14B8A6' },
  weather:  { name: 'Weather',  color: '#F97316' },
} as const satisfies Record<string, CategoryMeta>
type Cat = keyof typeof C

/* Top performers — 5 articles above 2× category median */
type TopArticle = {
  title: string
  cat: Cat
  published: string
  views: number
  vsMedian: number            // × multiple
  readThrough: number         // %
  firstHour: number[]         // 12-pt sparkline
  cover: string
}
const TOP: TopArticle[] = [
  { title: 'मेस्सीको ह्याट्रिकमा साविक विजेता अर्जेन्टिनाको प्रभावशाली विजय',       cat: 'sports',   published: '4 hr ago', views: 214_800, vsMedian: 4.2, readThrough: 74, firstHour: [4, 12, 28, 46, 62, 78, 92, 108, 118, 128, 138, 148], cover: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&q=80' },
  { title: 'रास्वपा सुदूरपश्चिममा सभापतिबाहेकका पदाधिकारीका मनोनयन तयार',      cat: 'politics', published: '8 hr ago', views: 168_200, vsMedian: 3.6, readThrough: 68, firstHour: [3, 10, 22, 38, 52, 68, 82,  94, 104, 112, 120, 128], cover: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&q=80' },
  { title: 'शहरी विकास बजेटमा नयाँ प्राथमिकताहरू छनौट प्रक्रियामा',            cat: 'business', published: '1 day ago', views: 142_600, vsMedian: 2.8, readThrough: 71, firstHour: [2,  8, 18, 32, 44, 58, 72,  84,  92, 100, 108, 116], cover: 'https://images.unsplash.com/photo-1587653263995-422546a7a569?w=200&q=80' },
  { title: 'दुई दिन बिदाले देश डुब्दैन, कमजोर व्यवस्थापनले डुब्छ भन्ने बहस',   cat: 'opinion',  published: '2 days ago', views: 118_400, vsMedian: 2.4, readThrough: 66, firstHour: [2,  6, 14, 24, 34, 44, 54,  62,  70,  76,  82,  88], cover: 'https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?w=200&q=80' },
  { title: 'दक्षिण एशियाली सम्मेलनको तयारी अन्तिम चरणमा',                     cat: 'world',    published: '2 days ago', views:  96_200, vsMedian: 2.1, readThrough: 62, firstHour: [1,  5, 12, 20, 28, 36, 44,  52,  58,  64,  68,  72], cover: 'https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?w=200&q=80' },
]

/* Needs attention — 5 articles below performance floor */
type AttentionReason = 'Low read-through' | 'No shares' | 'Dead after 2h' | 'Below category floor' | 'Weak CTR'
type SuggestedAction = { label: string; icon: React.ComponentType<{ className?: string }>; tone: 'brand' | 'amber' | 'slate' | 'rose' }
type WeakArticle = {
  title: string
  cat: Cat
  published: string
  views: number
  vsMedian: number
  reason: AttentionReason
  action: SuggestedAction
  cover: string
}
const WEAK: WeakArticle[] = [
  { title: 'शैक्षिक क्षेत्रमा प्राविधिक सुधारका सम्भावनाहरू फराकिलो',        cat: 'opinion',  published: '6 hr ago',  views:  1_240, vsMedian: 0.32, reason: 'Dead after 2h',        action: { label: 'Refresh',   icon: RefreshCw, tone: 'brand' }, cover: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&q=80' },
  { title: 'मौद्रिक नीतिका छलफलहरू निरन्तरता पाउँदै',                          cat: 'business', published: '12 hr ago', views:  3_620, vsMedian: 0.41, reason: 'Low read-through',     action: { label: 'Retitle',   icon: Type,       tone: 'brand' }, cover: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200&q=80' },
  { title: 'सिनेमा हलमा दर्शक संख्या घट्दो क्रम',                              cat: 'culture',  published: '1 day ago', views:    840, vsMedian: 0.18, reason: 'No shares',            action: { label: 'Reshare',   icon: Share2,     tone: 'amber' }, cover: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=80' },
  { title: 'खेलकुद परिषदमा नयाँ पदाधिकारीको नियुक्ति पूरा',                     cat: 'sports',   published: '1 day ago', views:  2_140, vsMedian: 0.28, reason: 'Below category floor', action: { label: 'Boost',     icon: Rocket,     tone: 'brand' }, cover: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=200&q=80' },
  { title: 'हिमपात पूर्वानुमान: सप्ताहान्तमा उच्च पहाडी क्षेत्रमा',            cat: 'weather',  published: '2 days ago', views:    620, vsMedian: 0.14, reason: 'Weak CTR',             action: { label: 'Archive',   icon: Archive,    tone: 'slate' }, cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&q=80' },
]

/* Article performance table */
type Row = {
  n: number
  title: string
  cat: Cat
  author: string
  published: string
  views: number
  readThrough: number
  avgRead: string
  shares: number
  comments: number
  spark7d: number[]
  score: Score
  cover: string
}
const ROWS: Row[] = [
  { n:  1, title: 'मेस्सीको ह्याट्रिकमा साविक विजेता अर्जेन्टिनाको प्रभावशाली विजय',       cat: 'sports',   author: 'Prakash Giri',   published: '4 hr ago',  views: 214_800, readThrough: 74, avgRead: '4:12', shares: 12_480, comments: 1_820, spark7d: [40, 62, 88, 118, 148, 172, 214], score: 'winning', cover: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&q=80' },
  { n:  2, title: 'रास्वपा सुदूरपश्चिममा सभापतिबाहेकका पदाधिकारीका मनोनयन तयार',       cat: 'politics', author: 'Sagar Sharma',   published: '8 hr ago',  views: 168_200, readThrough: 68, avgRead: '3:48', shares:  8_240, comments:   924, spark7d: [30, 48, 72,  96, 118, 138, 168], score: 'winning', cover: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&q=80' },
  { n:  3, title: 'शहरी विकास बजेटमा नयाँ प्राथमिकताहरू छनौट प्रक्रियामा',            cat: 'business', author: 'Anu Rai',        published: '1 day ago', views: 142_600, readThrough: 71, avgRead: '4:02', shares:  6_120, comments:   612, spark7d: [24, 42, 62,  84, 104, 122, 142], score: 'winning', cover: 'https://images.unsplash.com/photo-1587653263995-422546a7a569?w=200&q=80' },
  { n:  4, title: 'दुई दिन बिदाले देश डुब्दैन, कमजोर व्यवस्थापनले डुब्छ भन्ने बहस',   cat: 'opinion',  author: 'Rita Adhikari',  published: '2 days ago', views: 118_400, readThrough: 66, avgRead: '3:22', shares:  4_820, comments:   402, spark7d: [22, 38, 56,  74,  92, 106, 118], score: 'steady',  cover: 'https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?w=200&q=80' },
  { n:  5, title: 'मन्त्रीको घरको पेटीमा उखु पेल्नेमाथि प्रहरी कारबाही',              cat: 'politics', author: 'Bikash KC',      published: '2 days ago', views:  92_400, readThrough: 59, avgRead: '3:04', shares:  3_640, comments:   318, spark7d: [40, 62, 76,  84,  88,  90,  92], score: 'steady',  cover: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=200&q=80' },
  { n:  6, title: 'दक्षिण एशियाली सम्मेलनको तयारी अन्तिम चरणमा',                     cat: 'world',    author: 'Sagar Sharma',   published: '2 days ago', views:  96_200, readThrough: 62, avgRead: '2:58', shares:  2_940, comments:   248, spark7d: [18, 34, 52,  68,  82,  90,  96], score: 'steady',  cover: 'https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?w=200&q=80' },
  { n:  7, title: 'नयाँ स्टार्टअपले प्रविधि क्षेत्रमा गरे उल्लेख्य लगानी',              cat: 'tech',     author: 'Anu Rai',        published: '3 days ago', views:  62_800, readThrough: 54, avgRead: '2:44', shares:  1_620, comments:   184, spark7d: [42, 56, 62,  60,  58,  60,  62], score: 'cooling', cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&q=80' },
  { n:  8, title: 'खेलकुद परिषदमा नयाँ पदाधिकारीको नियुक्ति पूरा',                     cat: 'sports',   author: 'Prakash Giri',   published: '1 day ago', views:   2_140, readThrough: 38, avgRead: '1:24', shares:    124, comments:    18, spark7d: [42, 38, 30,  24,  18,  14,  12], score: 'dead',    cover: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=200&q=80' },
  { n:  9, title: 'मौद्रिक नीतिका छलफलहरू निरन्तरता पाउँदै',                          cat: 'business', author: 'Sagar Sharma',   published: '12 hr ago', views:   3_620, readThrough: 32, avgRead: '1:08', shares:    240, comments:    32, spark7d: [22, 30, 28,  24,  20,  18,  16], score: 'dead',    cover: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200&q=80' },
  { n: 10, title: 'सिनेमा हलमा दर्शक संख्या घट्दो क्रम',                              cat: 'culture',  author: 'Rita Adhikari',  published: '1 day ago', views:     840, readThrough: 28, avgRead: '0:52', shares:     42, comments:     8, spark7d: [12, 14, 12,  10,   8,   6,   6], score: 'dead',    cover: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=80' },
  { n: 11, title: 'शैक्षिक क्षेत्रमा प्राविधिक सुधारका सम्भावनाहरू फराकिलो',        cat: 'opinion',  author: 'Bikash KC',      published: '6 hr ago',  views:   1_240, readThrough: 24, avgRead: '0:48', shares:     68, comments:    14, spark7d: [18, 16, 12,  10,   8,   6,   6], score: 'dead',    cover: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&q=80' },
  { n: 12, title: 'हिमपात पूर्वानुमान: सप्ताहान्तमा उच्च पहाडी क्षेत्रमा',            cat: 'weather',  author: 'Anu Rai',        published: '2 days ago', views:     620, readThrough: 22, avgRead: '0:42', shares:     18, comments:     4, spark7d: [10,  8,  6,   4,   4,   4,   4], score: 'dead',    cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&q=80' },
]

/* Lifecycle decay */
const LIFECYCLE_STOPS = ['0h', '1h', '3h', '6h', '12h', '24h', '3d', '7d']
const LIFECYCLE_MEDIAN = [100, 82, 62, 44, 28, 18,  8,  3]
const LIFECYCLE_BEST   = [100, 128, 158, 172, 148, 118, 76, 42]

/* Berry AI recs */
type Rec = { title: string; detail: string; count: number; icon: React.ComponentType<{ className?: string }>; tone: 'brand' | 'emerald' | 'amber' | 'rose' }
const RECS: Rec[] = [
  { title: 'Ready to republish',    detail: 'Evergreen pieces with a fresh news hook this week',        count: 3, icon: RefreshCw,      tone: 'brand'   },
  { title: 'Retitle candidates',    detail: 'CTR below 0.4% — headline change likely to lift reach',    count: 5, icon: Type,           tone: 'amber'   },
  { title: 'Category floor breached', detail: 'Weather section: 4 stories below performance floor',      count: 4, icon: AlertTriangle,  tone: 'rose'    },
  { title: 'Boost now',             detail: 'Sports story trending 320% above baseline — push social',   count: 1, icon: Rocket,         tone: 'emerald' },
]

const OUTER_TABS = ['Overview', 'Content', 'Users', 'Author'] as const
const INNER_TABS = ['Overview', 'Content', 'Users', 'Author'] as const

const SCORE_META: Record<Score, { label: string; dot: string; bg: string; text: string }> = {
  winning: { label: 'Winning', dot: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  steady:  { label: 'Steady',  dot: '#0787FF', bg: 'bg-brand-50',   text: 'text-brand-600'   },
  cooling: { label: 'Cooling', dot: '#F59B25', bg: 'bg-amber-50',   text: 'text-amber-700'   },
  dead:    { label: 'Dead',    dot: '#F43F5E', bg: 'bg-rose-50',    text: 'text-rose-700'    },
}

/* ─── Formatting ─────────────────────────────────────────────────────── */

const fmtViews = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000     ? `${(n / 1_000).toFixed(1)}k`     : String(n)

const fmtInt = (n: number) => n.toLocaleString('en-US')

/* ─── Component ──────────────────────────────────────────────────────── */

type ScoreFilter = 'all' | Score

export default function ContentPerformance() {
  const [outerTab, setOuterTab] = useState<(typeof OUTER_TABS)[number]>('Content')
  const [innerTab, setInnerTab] = useState<(typeof INNER_TABS)[number]>('Content')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')
  const [sortKey, setSortKey] = useState<'views' | 'readThrough' | 'shares'>('views')

  const filtered = useMemo(() => {
    const list = scoreFilter === 'all' ? ROWS : ROWS.filter((r) => r.score === scoreFilter)
    return [...list].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
  }, [scoreFilter, sortKey])

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
                Track individual article performance — spot the winners early, catch stalling stories before they cool off.
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

            {/* Ask Berry AI — content-tab prompts */}
            <div className="mt-4 flex flex-wrap items-center gap-2 px-3">
              <span className="text-[13px] font-medium text-slate-700">Ask Berry AI For the summary</span>
              {[
                'Which articles are losing readers fast?',
                'What should I republish this week?',
                'Which titles underperform their category median?',
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

            {/* Row B — Top performers | Needs attention */}
            <section className="mt-4 grid grid-cols-1 gap-4 px-3 lg:grid-cols-2">
              <TopPerformersCard />
              <NeedsAttentionCard />
            </section>

            {/* Row C — Article performance table */}
            <section className="mt-4 px-3">
              <ArticleTable
                rows={filtered}
                scoreFilter={scoreFilter}
                setScoreFilter={setScoreFilter}
                sortKey={sortKey}
                setSortKey={setSortKey}
              />
            </section>

            {/* Row D — Lifecycle decay */}
            <section className="mt-4 grid grid-cols-1 gap-4 px-3 lg:grid-cols-[minmax(0,1fr)_380px]">
              <LifecycleCard />
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

function CategoryChip({ cat }: { cat: Cat }) {
  const meta = C[cat]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.name}
    </span>
  )
}

function ScoreBadge({ score }: { score: Score }) {
  const m = SCORE_META[score]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${m.bg} px-2 py-0.5 text-[11px] font-semibold ${m.text}`}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
      {m.label}
    </span>
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

/* ─── Row B — Top performers ────────────────────────────────────────── */

function TopPerformersCard() {
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-brand-500">Top performers</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">Above 2× category median</p>
        </div>
        <button className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand-500 hover:text-brand-600 transition-colors">
          View all <ArrowUpRight className="size-3" />
        </button>
      </div>

      <div className="mt-4 flex flex-col">
        {TOP.map((a, i) => (
          <div
            key={i}
            className={[
              'grid grid-cols-[48px_minmax(0,1fr)_120px_88px] items-center gap-3 py-3',
              i === TOP.length - 1 ? '' : 'border-b border-slate-100',
            ].join(' ')}
          >
            <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.cover} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-slate-900 font-display">{a.title}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <CategoryChip cat={a.cat} />
                <span className="text-[11px] text-slate-500">{a.published}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-900 tabular-nums">
                <Eye className="size-3.5 text-slate-400" />
                {fmtViews(a.views)}
              </div>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700 tabular-nums">
                {a.vsMedian.toFixed(1)}× median
              </span>
            </div>
            <div className="w-[88px]">
              <TinySpark points={a.firstHour} color="#10B981" />
              <p className="mt-1 text-right text-[10px] font-medium text-slate-500">{a.readThrough}% read</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/* ─── Row B — Needs attention ───────────────────────────────────────── */

function NeedsAttentionCard() {
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-amber-600">Needs attention</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">Below 0.5× category median — act now</p>
        </div>
        <button className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand-500 hover:text-brand-600 transition-colors">
          View all <ArrowUpRight className="size-3" />
        </button>
      </div>

      <div className="mt-4 flex flex-col">
        {WEAK.map((a, i) => {
          const ActionIcon = a.action.icon
          const toneCls =
            a.action.tone === 'brand'  ? 'bg-brand-500 text-white hover:bg-brand-600' :
            a.action.tone === 'amber'  ? 'bg-amber-500 text-white hover:bg-amber-600' :
            a.action.tone === 'rose'   ? 'bg-rose-500  text-white hover:bg-rose-600'  :
                                         'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          return (
            <div
              key={i}
              className={[
                'grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 py-3',
                i === WEAK.length - 1 ? '' : 'border-b border-slate-100',
              ].join(' ')}
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.cover} alt="" className="size-full object-cover opacity-80" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-900 font-display">{a.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <CategoryChip cat={a.cat} />
                  <span className="text-[11px] text-slate-500">{a.published}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-rose-700">
                    <AlertTriangle className="size-3" />
                    {a.reason}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 tabular-nums">
                  <span className="inline-flex items-center gap-1"><Eye className="size-3" />{fmtViews(a.views)}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-rose-600 font-semibold">{a.vsMedian.toFixed(2)}× median</span>
                </div>
              </div>
              <button
                className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${toneCls}`}
              >
                <ActionIcon className="size-3.5" />
                {a.action.label}
              </button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

/* ─── Row C — Article performance table ─────────────────────────────── */

function ArticleTable({
  rows,
  scoreFilter,
  setScoreFilter,
  sortKey,
  setSortKey,
}: {
  rows: Row[]
  scoreFilter: ScoreFilter
  setScoreFilter: (s: ScoreFilter) => void
  sortKey: 'views' | 'readThrough' | 'shares'
  setSortKey: (k: 'views' | 'readThrough' | 'shares') => void
}) {
  const scoreTabs: { key: ScoreFilter; label: string; count: number }[] = [
    { key: 'all',     label: 'All',     count: ROWS.length },
    { key: 'winning', label: 'Winning', count: ROWS.filter(r => r.score === 'winning').length },
    { key: 'steady',  label: 'Steady',  count: ROWS.filter(r => r.score === 'steady').length  },
    { key: 'cooling', label: 'Cooling', count: ROWS.filter(r => r.score === 'cooling').length },
    { key: 'dead',    label: 'Dead',    count: ROWS.filter(r => r.score === 'dead').length    },
  ]

  return (
    <Panel className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-[16px] font-semibold text-brand-500">Article performance</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Sorted by <button onClick={() => setSortKey('views')} className={sortKey === 'views' ? 'font-semibold text-slate-900' : 'hover:text-slate-900'}>Views</button>
            <span className="text-slate-300"> · </span>
            <button onClick={() => setSortKey('readThrough')} className={sortKey === 'readThrough' ? 'font-semibold text-slate-900' : 'hover:text-slate-900'}>Read-through</button>
            <span className="text-slate-300"> · </span>
            <button onClick={() => setSortKey('shares')} className={sortKey === 'shares' ? 'font-semibold text-slate-900' : 'hover:text-slate-900'}>Shares</button>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter label="Category" />
          <Filter label="Author" />
          <Filter label="Age" />
          <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 hover:border-slate-300 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Score tabs (chips with counts) */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-3">
        {scoreTabs.map((t) => {
          const active = t.key === scoreFilter
          const dot =
            t.key === 'winning' ? '#10B981' :
            t.key === 'steady'  ? '#0787FF' :
            t.key === 'cooling' ? '#F59B25' :
            t.key === 'dead'    ? '#F43F5E' : ''
          return (
            <button
              key={t.key}
              onClick={() => setScoreFilter(t.key)}
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
      <div className="mt-4 grid grid-cols-[36px_minmax(260px,2.2fr)_96px_96px_88px_88px_88px_120px_100px] items-center gap-4 border-y border-slate-200 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        <span>#</span>
        <span>Article</span>
        <SortHead label="Views"       active={sortKey === 'views'}       onClick={() => setSortKey('views')} />
        <SortHead label="Read-thr"    active={sortKey === 'readThrough'} onClick={() => setSortKey('readThrough')} />
        <span className="text-right">Avg read</span>
        <SortHead label="Shares"      active={sortKey === 'shares'}      onClick={() => setSortKey('shares')} />
        <span className="text-right">Comments</span>
        <span>7-day trend</span>
        <span className="text-right">Score</span>
      </div>

      {/* Rows */}
      <div>
        {rows.map((r, i) => {
          const trendColor =
            r.score === 'winning' ? '#10B981' :
            r.score === 'dead'    ? '#F43F5E' :
            r.score === 'cooling' ? '#F59B25' : '#0787FF'
          return (
            <div
              key={r.n}
              className={[
                'grid grid-cols-[36px_minmax(260px,2.2fr)_96px_96px_88px_88px_88px_120px_100px] items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50/70',
                i === rows.length - 1 ? '' : 'border-b border-slate-100',
              ].join(' ')}
            >
              <span className="text-[12px] font-medium text-slate-400 tabular-nums">{r.n}</span>
              <div className="flex min-w-0 items-center gap-3">
                <div className="size-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.cover} alt="" className="size-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-900 font-display">{r.title}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CategoryChip cat={r.cat} />
                    <span>By {r.author}</span>
                    <span className="text-slate-300">·</span>
                    <span>{r.published}</span>
                  </div>
                </div>
              </div>
              <span className="text-right text-[13px] tabular-nums text-slate-800">{fmtViews(r.views)}</span>
              <span className="text-right text-[13px] tabular-nums text-slate-800">{r.readThrough}%</span>
              <span className="inline-flex items-center justify-end gap-1 text-right text-[12.5px] tabular-nums text-slate-700">
                <Clock className="size-3 text-slate-400" />
                {r.avgRead}
              </span>
              <span className="text-right text-[13px] tabular-nums text-slate-800">{fmtInt(r.shares)}</span>
              <span className="text-right text-[13px] tabular-nums text-slate-700">{fmtInt(r.comments)}</span>
              <div className="w-[120px]">
                <TinySpark points={r.spark7d} color={trendColor} />
              </div>
              <div className="flex justify-end">
                <ScoreBadge score={r.score} />
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

/* ─── Row D — Lifecycle chart ───────────────────────────────────────── */

function LifecycleCard() {
  const W = 640, H = 260, PAD = { l: 40, r: 16, t: 16, b: 30 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const CEILING = 180
  const step = innerW / (LIFECYCLE_STOPS.length - 1)

  const toPath = (series: number[]) => {
    const coords = series.map((v, i) => {
      const x = PAD.l + i * step
      const y = PAD.t + (1 - v / CEILING) * innerH
      return [x, y] as const
    })
    const line = coords.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
    const area = `${line} L ${PAD.l + innerW} ${PAD.t + innerH} L ${PAD.l} ${PAD.t + innerH} Z`
    return { coords, line, area }
  }

  const median = toPath(LIFECYCLE_MEDIAN)
  const best   = toPath(LIFECYCLE_BEST)

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-brand-500">Content lifecycle</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">When engagement peaks and where it dies</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-600">
            <span className="size-2 rounded-sm bg-brand-500" /> Median article
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-600">
            <span className="size-2 rounded-sm bg-emerald-500" /> Best performer
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full h-[260px]">
        <defs>
          <linearGradient id="lc-median" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#0787FF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0787FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lc-best" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#10B981" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="#E2E8F0" strokeWidth="1">
          {[45, 90, 135, 180].map((v) => {
            const y = PAD.t + (1 - v / CEILING) * innerH
            return (
              <g key={v}>
                <line x1={PAD.l} y1={y} x2={PAD.l + innerW} y2={y} strokeDasharray="2 4" />
                <text x={PAD.l - 6} y={y + 3} textAnchor="end" fill="#94A3B8" fontSize="10">{v}</text>
              </g>
            )
          })}
          <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="#CBD5E1" />
          <text x={PAD.l - 6} y={PAD.t + innerH + 3} textAnchor="end" fill="#94A3B8" fontSize="10">0</text>
        </g>

        <path d={best.area}   fill="url(#lc-best)" />
        <path d={median.area} fill="url(#lc-median)" />
        <path d={best.line}   fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={median.line} fill="none" stroke="#0787FF" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />

        {best.coords.map(([x, y], i) => (
          <circle key={`b-${i}`} cx={x} cy={y} r="3" fill="white" stroke="#10B981" strokeWidth="2" />
        ))}
        {median.coords.map(([x, y], i) => (
          <circle key={`m-${i}`} cx={x} cy={y} r="2.5" fill="white" stroke="#0787FF" strokeWidth="1.75" />
        ))}

        {LIFECYCLE_STOPS.map((d, i) => (
          <text key={d} x={PAD.l + i * step} y={H - 8} textAnchor="middle" fill="#94A3B8" fontSize="10.5">{d}</text>
        ))}
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-3 text-[12px] text-slate-600">
        <LifecycleStat label="Peak window" value="1 – 3 hours" />
        <LifecycleStat label="Median half-life" value="4.2 hours" />
        <LifecycleStat label="Intervention window closes" value="6 hours" />
      </div>
    </Panel>
  )
}

function LifecycleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 px-3 py-2">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-slate-500">{label}</p>
      <p className="mt-1 font-display text-[15px] font-semibold text-slate-950">{value}</p>
    </div>
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
          <p className="mt-0.5 text-[12px] text-slate-500">Actionable this week</p>
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
                  <span className="rounded-md bg-slate-100 px-1.5 py-0 text-[10.5px] font-semibold text-slate-600 tabular-nums">
                    {r.count}
                  </span>
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

