'use client'

/**
 * NewsroomDashboard — Figma frame 5125:80668 (Snowberry × उकालो command centre).
 *
 * Layout:
 *   ┌── Top bar ─────────────────────────────────────────────────┐
 *   │ [Sidebar rail] │ Hero banner (greeting + site mockup)      │
 *   │                │ Tabs · New article · Create with Berry AI │
 *   │                │ Overall analysis · 4 stat gauges          │
 *   │                │ Top-performing articles · AI Assistant    │
 *   └────────────────────────────────────────────────────────────┘
 */

import { useState } from 'react'
import {
  Search, Bell, Settings, Home, Plus, MessageSquare, MessagesSquare,
  ListChecks, Gauge, ImageIcon, Users, Wrench, ArrowUpRight, ArrowRight,
  MoreHorizontal, Sparkles, FileEdit, TrendingUp,
} from 'lucide-react'

/* ─── Data ────────────────────────────────────────────────────────────── */

type Metric = {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down'
  arcColor: string
}

const METRICS: Metric[] = [
  { label: 'Published today',   value: '23',   delta: '+ 12%', trend: 'up',   arcColor: '#22C55E' },
  { label: 'Pending approvals', value: '4',    delta: '+ 12%', trend: 'down', arcColor: '#F59B25' },
  { label: 'Total subscribers', value: '84k',  delta: '+ 12%', trend: 'up',   arcColor: '#22C55E' },
  { label: 'Views Today',       value: '142k', delta: '+ 12%', trend: 'up',   arcColor: '#22C55E' },
]

type Article = {
  title: string
  cover: string
  author: string
  when: string
  category: string
  views: string
  delta: string
}

const ARTICLES: Article[] = [
  { title: 'रास्वपा सुदूरपश्चिममा सभापतिबाहेकका पदाधिकारी सर्वसम्मत', cover: '/dashboard/article-1.jpg', author: 'Sagar Sharma', when: 'Yesterday', category: 'Politics', views: '38.4K', delta: '24%' },
  { title: 'वर्षौंदेखि विवादित वैदेशिक रोजगारीको सेवा शुल्क समाधान गर्न समिति गठन', cover: '/dashboard/article-2.jpg', author: 'Sagar Sharma', when: 'Yesterday', category: 'Business', views: '32.1K', delta: '18%' },
  { title: 'मन्त्रीको घरको पेटीमा उखु पेल्नेमाथि बुटवल नगर प्रहरीको ‘दादागिरी’', cover: '/dashboard/article-3.jpg', author: 'Sagar Sharma', when: 'Yesterday', category: 'Politics', views: '28.9K', delta: '21%' },
  { title: 'दुई दिन बिदाले देश डुब्दैन, कमजोर व्यवस्थापनले डुबाउँछ', cover: '/dashboard/article-4.jpg', author: 'Sagar Sharma', when: 'Yesterday', category: 'Opinion',  views: '24.7K', delta: '15%' },
  { title: 'मेस्सीको ह्याट्रिकमा साविक विजेता अर्जेन्टिनाको शानदार सुरुवात', cover: '/dashboard/article-5.jpg', author: 'Sagar Sharma', when: 'Yesterday', category: 'Sports',   views: '21.3K', delta: '19%' },
  { title: 'नेपाल राष्ट्र बैंकको मौद्रिक नीति समीक्षा — ब्याजदर स्थिर', cover: '/dashboard/article-6.jpg', author: 'Sagar Sharma', when: 'Yesterday', category: 'Business', views: '18.6K', delta: '12%' },
]

const TABS = ['Overview', 'Analytics', 'Drafts', 'Team', 'Activities'] as const

// 32 daily bars for the "Views Last 7 days" chart. Fri (indices 20-24) is
// highlighted orange — matches the Figma reference.
const BAR_HEIGHTS = [
  76, 76, 76, 76, 76, 76, 57, 57, 57, 128, 128, 128, 128, 128, 128, 128,
  57, 57, 57, 57, 95, 95, 95, 95, 95, 95, 95, 95, 107, 107, 107, 107,
  107, 107, 107, 107, 107, 107, 107, 107, 162, 162, 162, 162, 162, 162, 162, 162,
  154, 154, 154, 154, 154, 154, 154, 154, 154, 154, 154, 154, 154,
]

/* ─── Component ───────────────────────────────────────────────────────── */

export default function NewsroomDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview')

  return (
    <div className="relative min-h-screen w-full bg-white">
      {/* Soft ambient blobs (Figma has decorative curves top-left / mid-right) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[520px] rounded-full bg-teal-100/50 blur-[110px]" />
        <div className="absolute top-1/2 -right-40 size-[520px] rounded-full bg-blue-100/40 blur-[110px]" />
      </div>

      {/* ── Top bar ────────────────────────────────────────────── */}
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
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded bg-slate-900/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700">
              ⌘K
            </kbd>
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

      {/* ── Body: sidebar + main ────────────────────────────────── */}
      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0 px-6 pb-10 pt-4">
          <HeroBanner />

          {/* Tabs + action buttons */}
          <div className="mt-4 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center">
              {TABS.map((t) => {
                const isActive = t === activeTab
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={[
                      'relative px-6 py-3 text-[15px] font-medium transition-colors',
                      isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800',
                    ].join(' ')}
                  >
                    {t}
                    {isActive && (
                      <span aria-hidden className="absolute inset-x-4 bottom-[-1px] h-[2px] bg-slate-900 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 pb-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[13px] font-medium text-slate-800 hover:bg-slate-200 transition-colors">
                <FileEdit size={14} strokeWidth={2} />
                New article
              </button>
              <button className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-3 py-2 text-[13px] font-medium text-white shadow-[inset_0_0_8px_rgba(255,255,255,0.24)] transition-all hover:brightness-105">
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ backgroundImage: 'linear-gradient(71deg, #003399 0%, #1c72ff 100%)' }}
                />
                <Sparkles size={14} strokeWidth={2} className="relative" />
                <span className="relative">Create with Berry AI</span>
              </button>
            </div>
          </div>

          {/* Row 1: Overall analysis + 4 metric gauges */}
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_580px] gap-4">
            <OverallAnalysisCard />
            <div className="grid grid-cols-2 gap-4">
              {METRICS.map((m) => <MetricCard key={m.label} metric={m} />)}
            </div>
          </div>

          {/* Row 2: Top articles + AI assistant */}
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_449px] gap-4">
            <TopArticlesCard articles={ARTICLES} />
            <AIAssistantPanel />
          </div>
        </main>
      </div>
    </div>
  )
}

/* ─── Sidebar ─────────────────────────────────────────────────────────── */

function Sidebar() {
  const primary = [
    { icon: Home,           label: 'Home',          active: true  },
    { icon: Plus,           label: 'New',           active: false },
    { icon: MessageSquare,  label: 'Messages',      active: false },
    { icon: MessagesSquare, label: 'Chats',         active: false },
    { icon: ListChecks,     label: 'Tasks',         active: false },
    { icon: Gauge,          label: 'Performance',   active: false },
    { icon: ImageIcon,      label: 'Media',         active: false },
    { icon: Users,          label: 'Team',          active: false },
    { icon: Wrench,         label: 'Tools',         active: false },
  ]
  const bottom = [
    { icon: Users,    label: 'People' },
    { icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className="sticky top-[57px] flex h-[calc(100vh-57px)] w-[64px] shrink-0 flex-col items-center justify-between py-3">
      <nav className="flex flex-col items-center gap-2">
        {primary.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            title={label}
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
            key={label}
            title={label}
            className="flex size-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <Icon size={20} strokeWidth={1.75} />
          </button>
        ))}
      </nav>
    </aside>
  )
}

/* ─── Hero banner ─────────────────────────────────────────────────────── */

function HeroBanner() {
  return (
    <section className="relative h-[217px] overflow-hidden rounded-[10px]">
      {/* Gradient background */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, #2694a1 0%, #2eab9b 49%, #8db3ff 100%)',
        }}
      />
      {/* Decorative circular curves on the right */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute -right-4 -top-8"
          width="780"
          height="360"
          viewBox="0 0 780 360"
          fill="none"
        >
          <g stroke="white" strokeOpacity="0.15" strokeWidth="1" fill="none">
            {[80, 120, 160, 200, 240, 290, 340].map((r) => (
              <circle key={r} cx="640" cy="70" r={r} />
            ))}
          </g>
        </svg>
      </div>

      {/* Left copy */}
      <div className="relative z-10 flex h-full flex-col justify-center px-7">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={20} className="text-white" strokeWidth={2} />
          <span className="text-[18px] font-semibold text-white font-display">उकालो</span>
        </div>
        <p className="mt-6 text-[18px] text-white/85 font-medium">Good Morning, Mohan</p>
        <p className="mt-1 text-[20px] text-white font-medium max-w-[420px] leading-[1.3]">
          Tuesday, 17 June. 14 Published today across the newsroom.
        </p>
      </div>

      {/* Browser mockup preview on the right */}
      <div className="absolute right-6 top-9 z-10 h-[178px] w-[560px] overflow-hidden rounded-t-[16px] bg-white/95 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-1.5">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-green-400" />
          <div className="ml-3 flex-1 rounded bg-white px-2 py-0.5 text-[10px] text-slate-400 ring-1 ring-slate-200">
            ukalo.snowberry.news
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-teal-600" />
            <span className="text-[13px] font-semibold text-teal-700 font-display">उकालो</span>
          </div>
          <div className="flex gap-2 text-[8px] text-slate-400">
            <span>राजनीति</span><span>अर्थ</span><span>खेल</span><span>विश्व</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 pt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="aspect-[16/10] rounded bg-gradient-to-br from-slate-200 to-slate-300" />
              <div className="h-1.5 rounded bg-slate-200 w-4/5" />
              <div className="h-1 rounded bg-slate-100 w-3/5" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Overall analysis card (bar chart) ──────────────────────────────── */

function OverallAnalysisCard() {
  return (
    <div className="rounded-[10px] bg-white/70 backdrop-blur-md p-5 h-[399px] flex flex-col ring-1 ring-slate-200/50">
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-semibold text-slate-800/80">Overall analysis</p>
        <p className="text-[13px] font-semibold text-slate-800/60">Views Last 7 days</p>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <p className="text-[48px] font-normal leading-none text-slate-900">2.5M+</p>
        <p className="text-[14px] font-semibold text-emerald-600">18% vs Last Week</p>
      </div>

      {/* Chart */}
      <div className="mt-6 flex flex-1 gap-3">
        <div className="flex flex-col justify-between py-2 text-[13px] text-slate-800/80 tabular-nums">
          <span>144k</span>
          <span>138k</span>
          <span>130k</span>
          <span>124k</span>
        </div>
        <div className="flex flex-1 items-end gap-[3px] pb-6">
          {BAR_HEIGHTS.map((h, i) => {
            const isFriday = i >= 40 && i < 48
            return (
              <div
                key={i}
                className={[
                  'flex-1 rounded-t-sm bg-gradient-to-b',
                  isFriday ? 'from-[#f59b25] to-[#dbdbdb]' : 'from-[#c5c5c5] to-[#f0f0f0]',
                ].join(' ')}
                style={{ height: `${(h / 162) * 100}%` }}
              />
            )
          })}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-7 text-[13px] text-slate-800/70">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d} className="text-center">{d}</span>
        ))}
      </div>
    </div>
  )
}

/* ─── Metric card (with SVG arc gauge) ───────────────────────────────── */

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="relative h-[195px] overflow-hidden rounded-[10px] bg-white/70 backdrop-blur-md p-4 ring-1 ring-slate-200/50">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-medium text-slate-800/80">{metric.label}</p>
        <ArrowUpRight size={16} className="text-slate-500" />
      </div>

      <p className="mt-3 text-[13px] text-slate-800/60 flex items-center gap-1">
        {metric.delta}
        <span className={metric.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}>
          {metric.trend === 'up' ? '▲' : '▼'}
        </span>
      </p>
      <p className="mt-1 text-[48px] font-normal leading-none text-slate-900">{metric.value}</p>

      {/* SVG arc gauge — anchored to bottom-right, extends beyond the card */}
      <svg
        className="pointer-events-none absolute -right-6 -bottom-6"
        width="220"
        height="220"
        viewBox="0 0 220 220"
      >
        <circle
          cx="110" cy="110" r="100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <path
          d={arcPath(110, 110, 100, -180, metric.trend === 'up' ? -30 : -110)}
          fill="none"
          stroke={metric.arcColor}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle
          cx={arcEnd(110, 110, 100, metric.trend === 'up' ? -30 : -110).x}
          cy={arcEnd(110, 110, 100, metric.trend === 'up' ? -30 : -110).y}
          r="8"
          fill={metric.arcColor}
          stroke="white"
          strokeWidth="3"
        />
      </svg>
    </div>
  )
}

/* Small helpers so the gauge tip lands on the arc */
function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function arcEnd(cx: number, cy: number, r: number, endDeg: number) {
  return polar(cx, cy, r, endDeg)
}
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg)
  const e = polar(cx, cy, r, endDeg)
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

/* ─── Top articles table ─────────────────────────────────────────────── */

function TopArticlesCard({ articles }: { articles: Article[] }) {
  return (
    <div className="rounded-[10px] bg-white/70 backdrop-blur-md p-4 ring-1 ring-slate-200/50">
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-semibold text-slate-800/80">Top performing articles this week</p>
        <button className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate-800/60 hover:text-slate-900 transition-colors">
          View Performance Analytics
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="mt-6 flex flex-col">
        {articles.map((a, i) => (
          <div
            key={i}
            className={[
              'flex items-center gap-6 py-3',
              i < articles.length - 1 ? 'border-b border-[#dfdfdf]' : '',
            ].join(' ')}
          >
            <div className="flex flex-1 min-w-0 items-center gap-4">
              <div className="size-12 shrink-0 rounded bg-slate-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://images.unsplash.com/photo-${['1541701494587-cb58502866ab','1587653263995-422546a7a569','1560264280-88b68371db39','1524673450801-b5aa9b621b76','1546519638-68e109498ffc','1583912267550-d6c2ac3196c0'][i % 6]}?w=200&q=80&auto=format&fit=crop`}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex flex-col gap-1">
                <p className="truncate text-[16px] font-medium text-slate-900">{a.title}</p>
                <div className="flex items-center gap-4 text-[14px] text-slate-800/70">
                  <span>By {a.author}</span>
                  <span>{a.when}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-[88px] text-[14px] font-medium text-slate-800/70">
              <span className="min-w-[70px]">{a.category}</span>
              <span className="tabular-nums">{a.views}</span>
              <span className="inline-flex items-center gap-1 text-emerald-600">
                ▲ {a.delta}
              </span>
            </div>
            <button className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── AI Assistant panel ─────────────────────────────────────────────── */

function AIAssistantPanel() {
  return (
    <div className="relative h-[500px] overflow-hidden rounded-[10px] bg-[#1c72ff]">
      {/* Decorative background — soft rotated curves */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute -top-16 -right-24 rotate-[-22deg] opacity-[0.18]" width="740" height="580" viewBox="0 0 740 580" fill="none">
          <g stroke="white" strokeWidth="1" fill="none">
            {[100, 150, 200, 260, 320, 380, 440].map((r) => (
              <circle key={r} cx="360" cy="290" r={r} />
            ))}
          </g>
        </svg>
        {/* Berry glyph placeholder — abstract shape near the bottom */}
        <svg className="absolute inset-x-0 bottom-24 mx-auto" width="240" height="240" viewBox="0 0 240 240" fill="none">
          <ellipse cx="120" cy="120" rx="100" ry="90" fill="white" fillOpacity="0.08" />
          <path d="M60 130 Q120 190 180 130" stroke="white" strokeOpacity="0.35" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col p-5">
        <p className="text-[18px] font-medium text-white">AI Assistant</p>
        <p className="text-[14px] text-white/60">Powered by Berry AI</p>
      </div>

      {/* Bottom summary */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-4 px-4 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-medium text-white">Your next course of action</p>
          <p className="text-[14px] text-white/60">4 items</p>
        </div>

        <div className="rounded-[6px] border border-white/85 bg-white/70 backdrop-blur-xl p-4">
          <p className="text-[14px] leading-relaxed text-black/70">
            Good morning, Mohan! 14 articles published today, 7 pending your approval
            (2 urgent), and the RBI rate hike story is trending at 3× normal engagement.
            I&apos;ve also spotted 3 coverage gaps vs competitors.
          </p>
          <button className="mt-4 flex w-full items-center justify-between rounded-full border border-white/30 bg-white/30 py-1 pl-4 pr-1">
            <span className="text-[14px] font-medium text-black/50">Approve all pending articles</span>
            <span className="flex size-9 items-center justify-center rounded-full bg-amber-400 text-white">
              <ArrowRight size={16} />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
