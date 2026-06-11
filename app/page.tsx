'use client'

import { useRouter } from 'next/navigation'
import {
  Search, Bell, Settings, Sparkles, Command,
  Zap, Star, Mail, Mic, Image as ImageIcon,
  ArrowUpRight, ArrowUp, ArrowDown,
  CircleAlert, Clock, MessageCircle, FileText,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

// ── Domain data ───────────────────────────────────────────────────────────────
// All texts and numerics mirror Figma 40000003:36247. The dashboard is a
// presentation layer over the analytics/news APIs — these constants will be
// replaced by real fetchers; keeping them inline keeps the design honest while
// we're still iterating on layout.

type Trend = 'up' | 'down'
type Stat = { label: string; value: string; change: string; trend: Trend; href: string }

const STATS: Stat[] = [
  { label: "Today's Published",  value: '18',     change: '12%',  trend: 'up',   href: '/news?status=published'    },
  { label: 'Pending Approval',   value: '4',      change: '25%',  trend: 'down', href: '/news?status=pending'      },
  { label: 'Today Subscribers',  value: '84.3k',  change: '1.8%', trend: 'up',   href: '/performance#subscribers'  },
  // Single all-caps label is per Figma — likely a visual cue for the
  // "spotlight" KPI of the day.
  { label: 'VIEWS TODAY',        value: '142.4k', change: '5.6%', trend: 'up',   href: '/performance#views'        },
]

// Each host card is a (palette, icon, copy) tuple. Hex values match Figma's
// per-host palette so titles + descriptions read in the brand colour.
type Host = {
  id: string
  label: string
  desc: string
  Icon: typeof Zap
  tint: string       // card background
  text: string       // primary text colour (title)
  sub: string        // secondary text colour (description, arrow)
  iconColor: string  // chip icon stroke colour
  badge?: string
}

const HOSTS: Host[] = [
  { id: 'rush',       label: 'Rush News',   desc: 'Publish a breaking story in under a minute',  Icon: Zap,       tint: 'bg-[#eef4ff]', text: 'text-[#3b5bdb]', sub: 'text-[#5c7cfa]', iconColor: 'text-[#3b5bdb]' },
  { id: 'big',        label: 'Big Story',   desc: 'Long-form, with hero media and pull quotes',  Icon: Star,      tint: 'bg-[#fff8eb]', text: 'text-[#b45309]', sub: 'text-[#d97706]', iconColor: 'text-[#b45309]' },
  { id: 'newsletter', label: 'Newsletter',  desc: "Draft today's edition from recent stories",   Icon: Mail,      tint: 'bg-[#ecfdf5]', text: 'text-[#047857]', sub: 'text-[#10b981]', iconColor: 'text-[#047857]' },
  { id: 'podcast',    label: 'Podcast',     desc: 'Upload audio with chapters and transcript',   Icon: Mic,       tint: 'bg-[#fef2f2]', text: 'text-[#b91c1c]', sub: 'text-[#ef4444]', iconColor: 'text-[#b91c1c]' },
  { id: 'photo',      label: 'Photo Story', desc: 'Sequenced gallery with captions',             Icon: ImageIcon, tint: 'bg-[#f5f3ff]', text: 'text-[#6d28d9]', sub: 'text-[#8b5cf6]', iconColor: 'text-[#6d28d9]', badge: 'BETA' },
]

type Activity = { name: string; initials: string; avatarBg: string; avatarFg: string; action: string; title: string; time: string; slug: string }
const ACTIVITY: Activity[] = [
  { name: 'Sagar Mehta',  initials: 'SM', avatarBg: 'bg-slate-200', avatarFg: 'text-slate-600', action: 'published',             title: 'RBI flags risk in unsecured retail lending…',           time: '2 min ago',  slug: 'rbi-flags-risk'      },
  { name: 'Riya Kapoor',  initials: 'RK', avatarBg: 'bg-slate-200', avatarFg: 'text-slate-600', action: 'scheduled',              title: 'Delhi govt outlines EV-only commercial fleet by 2027',  time: '14 min ago', slug: 'delhi-ev-fleet'      },
  { name: 'Ananya Singh', initials: 'AS', avatarBg: 'bg-slate-200', avatarFg: 'text-slate-600', action: 'edited',                 title: 'Quiet rally in semiconductor stocks…',                  time: '28 min ago', slug: 'semiconductor-rally' },
  { name: 'Dev Pillai',   initials: 'DP', avatarBg: 'bg-slate-200', avatarFg: 'text-slate-600', action: 'submitted for approval', title: 'Why the new Coastal Road tender keeps getting delayed', time: '46 min ago', slug: 'coastal-road'        },
  { name: 'Maya Gupta',   initials: 'MG', avatarBg: 'bg-slate-200', avatarFg: 'text-slate-600', action: 'published',              title: 'Inside the office that reshaped Indian indie cinema',   time: '1 hr ago',   slug: 'indie-cinema'        },
]

type Bucket = {
  id: string
  label: string
  count: number
  Icon: typeof CircleAlert
  bg: string         // pill background
  fg: string         // primary text + count colour
  href: string
}
const NEEDS_ATTENTION: Bucket[] = [
  { id: 'approval',  label: 'Awaiting approval',     count: 4,  Icon: CircleAlert,   bg: 'bg-[#fff6e8]', fg: 'text-[#b45309]', href: '/news?status=pending'   },
  { id: 'scheduled', label: 'Scheduled in next 24h', count: 5,  Icon: Clock,         bg: 'bg-[#eef6ff]', fg: 'text-[#1d4ed8]', href: '/news?status=scheduled' },
  { id: 'flagged',   label: 'Flagged comments',      count: 12, Icon: MessageCircle, bg: 'bg-[#fff0f3]', fg: 'text-[#be123c]', href: '/comments?flag=true'    },
  { id: 'stale',     label: 'Drafts stale 7+ days',  count: 7,  Icon: FileText,      bg: 'bg-[#f4f3ff]', fg: 'text-[#6d28d9]', href: '/drafts?age=stale'      },
]

type Article = { title: string; category: string; views: string; change: string; trend: Trend; author: string; slug: string }
const TOP_ARTICLES: Article[] = [
  { title: 'Why the rupee held steady despite oil price volatility', category: 'Business', views: '38.4k', change: '24%', trend: 'up', author: 'Sagar Mehta', slug: 'rupee-stable'   },
  { title: "The silent revolution in India's tier-2 startup scene",  category: 'Tech',     views: '29.1k', change: '18%', trend: 'up', author: 'Riya Kapoor', slug: 'tier2-startups' },
  { title: "ISRO's next mission: what we know so far",               category: 'Science',  views: '21.7k', change: '31%', trend: 'up', author: 'Dev Pillai',  slug: 'isro-mission'   },
]

// ── Sparkline ─────────────────────────────────────────────────────────────────
// Figma renders these as plain stroked polylines with no fill — see fig_stats
// at 40000003:36293. We keep the SVG aspect-free so cards stay flexible.
function Sparkline({ trend }: { trend: Trend }) {
  const points = trend === 'up'
    ? '0,22 15,20 30,21 45,15 60,18 75,12 90,15 105,9  120,14'
    : '0,14 15,11 30,15 45,10 60,16 75,12 90,18 105,15 120,19'
  const stroke = trend === 'up' ? '#1d4ed8' : '#ef4444'
  return (
    <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="w-full h-8" fill="none">
      <polyline
        points={points}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()
  const go = (href: string) => () => router.push(href)

  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: 'var(--font-inter)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-6 h-[60px] border-b border-slate-100 shrink-0">
          <span className="text-[16px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Dashboard
          </span>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-slate-100 rounded-[10px] px-3 py-2 w-[280px] text-left hover:bg-slate-200/70 transition-colors">
              <Search size={14} className="text-slate-400" />
              <span className="text-[13px] text-slate-400 flex-1 truncate">Search articles, authors, tags…</span>
              <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                <Command size={11} />K
              </span>
            </button>
            <button
              onClick={go('/news/new')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#0787ff] text-white text-[13px] font-medium hover:bg-[#0061d4] transition-colors shadow-[0px_1px_2px_rgba(7,135,255,0.25)]"
            >
              <Sparkles size={14} /> Rush write
              <span className="ml-1 flex items-center gap-0.5 text-[11px] opacity-80">
                <Command size={11} />R
              </span>
            </button>
            <button className="flex items-center justify-center size-9 rounded-[10px] hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell size={16} />
            </button>
            <button className="flex items-center justify-center size-9 rounded-[10px] hover:bg-slate-100 text-slate-500 transition-colors">
              <Settings size={16} />
            </button>
            <button className="size-9 rounded-full bg-[#dbeafe] flex items-center justify-center text-[12px] font-semibold text-[#1d4ed8]">
              A
            </button>
          </div>
        </header>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-9 py-6 bg-slate-50">
          {/* Greeting */}
          <section className="mb-6">
            <h1 className="text-[22px] font-semibold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Good morning, Ashish
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              Thursday, May 14 — here&apos;s what&apos;s happening across the newsroom.
            </p>
          </section>

          {/* KPI cards — Figma 40000003:36293
              Value + change indicator share the same line; sparkline sits
              below as a thin stroked polyline. */}
          <section className="grid grid-cols-4 gap-4 mb-6">
            {STATS.map(s => (
              <button
                key={s.label}
                onClick={go(s.href)}
                className="text-left bg-white rounded-[12px] border border-slate-100 px-4 pt-4 pb-3 shadow-[0px_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-200 hover:shadow-[0px_4px_12px_rgba(15,23,42,0.06)] transition-all"
              >
                <div className={`text-[13px] mb-2 ${s.label === 'VIEWS TODAY' ? 'uppercase tracking-wide text-slate-500 font-medium' : 'text-slate-500'}`}>
                  {s.label}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[26px] font-semibold text-slate-900 leading-none" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {s.value}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[12px] font-medium ${s.trend === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {s.trend === 'up' ? <ArrowUp size={11} strokeWidth={2.5} /> : <ArrowDown size={11} strokeWidth={2.5} />}
                    {s.change}
                  </span>
                </div>
                <Sparkline trend={s.trend} />
              </button>
            ))}
          </section>

          {/* Studio — Figma 40000003:36355
              Each host card uses a tinted background + a colour-matched title /
              description / arrow. Icon sits in a white chip top-left. */}
          <section className="bg-white rounded-[12px] border border-slate-100 px-5 pt-4 pb-5 mb-6 shadow-[0px_1px_2px_rgba(15,23,42,0.04)]">
            <header className="mb-4">
              <h2 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Studio
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Create something — we&apos;ll set up the structure for you.
              </p>
            </header>
            <div className="grid grid-cols-5 gap-3">
              {HOSTS.map(h => (
                <button
                  key={h.id}
                  onClick={go(`/news/new?host=${h.id}`)}
                  className={`flex flex-col gap-3 p-3.5 rounded-[12px] hover:brightness-[0.98] transition-all text-left group ${h.tint}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center justify-center size-9 rounded-[10px] bg-white shadow-[0px_1px_2px_rgba(15,23,42,0.06)]">
                      <h.Icon size={16} className={h.iconColor} strokeWidth={2} />
                    </div>
                    <ArrowUpRight size={14} className={`${h.sub} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <div>
                    <div className={`text-[13px] font-semibold flex items-center gap-1.5 ${h.text}`}>
                      {h.label}
                      {h.badge && (
                        <span className="text-[9px] font-semibold bg-white/70 text-slate-600 px-1.5 py-0.5 rounded">
                          {h.badge}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] mt-1 leading-[1.5] ${h.sub}`}>{h.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Recent activity + Needs attention */}
          <section className="grid grid-cols-[1fr_360px] gap-4 mb-6">
            {/* Recent activity — Figma 40000003:36440
                Thin border between each row, "TODAY" eyebrow above the list. */}
            <div className="bg-white rounded-[12px] border border-slate-100 px-5 pt-4 pb-2 shadow-[0px_1px_2px_rgba(15,23,42,0.04)]">
              <header className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Recent activity
                </h2>
                <button
                  onClick={go('/news')}
                  className="text-[12px] font-medium text-[#0787ff] hover:underline flex items-center gap-1"
                >
                  View all →
                </button>
              </header>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">Today</div>
              <ul className="flex flex-col divide-y divide-slate-100">
                {ACTIVITY.map((a, i) => (
                  <li key={i}>
                    <button
                      onClick={go(`/news/${a.slug}`)}
                      className="w-full text-left flex items-start gap-3 py-3 hover:bg-slate-50/60 -mx-2 px-2 rounded-[6px] transition-colors"
                    >
                      <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${a.avatarBg} ${a.avatarFg}`}>
                        {a.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-slate-700 leading-snug">
                          <span className="font-semibold text-slate-900">{a.name}</span>
                          <span className="text-slate-500"> {a.action} </span>
                          <span className="text-slate-900">{a.title}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{a.time}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Needs attention — Figma 40000003:36617
                Each row is a tinted pill with circle icon · label · count · → */}
            <div className="bg-white rounded-[12px] border border-slate-100 px-5 pt-4 pb-5 shadow-[0px_1px_2px_rgba(15,23,42,0.04)]">
              <h2 className="text-[15px] font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Needs attention
              </h2>
              <ul className="flex flex-col gap-2">
                {NEEDS_ATTENTION.map(b => (
                  <li key={b.id}>
                    <button
                      onClick={go(b.href)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[10px] hover:brightness-95 transition group ${b.bg}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`flex items-center justify-center size-6 rounded-full border ${b.fg}`} style={{ borderColor: 'currentColor' }}>
                          <b.Icon size={12} strokeWidth={2} />
                        </span>
                        <span className={`text-[13px] font-medium ${b.fg}`}>{b.label}</span>
                      </span>
                      <span className={`flex items-center gap-2 text-[14px] font-semibold ${b.fg}`}>
                        {b.count}
                        <ArrowUpRight size={13} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Top performing — Figma 40000003:36674 */}
          <section className="bg-white rounded-[12px] border border-slate-100 px-5 pt-4 pb-2 shadow-[0px_1px_2px_rgba(15,23,42,0.04)]">
            <header className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Top performing articles this week
              </h2>
              <button
                onClick={go('/performance')}
                className="text-[12px] font-medium text-[#0787ff] hover:underline"
              >
                View full analytics →
              </button>
            </header>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['TITLE', 'CATEGORY', 'VIEWS', 'CHANGE', 'AUTHOR'].map(h => (
                    <th key={h} className="text-left pb-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_ARTICLES.map((a, i) => (
                  <tr
                    key={i}
                    onClick={go(`/news/${a.slug}`)}
                    className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-4 text-slate-900 max-w-[420px] truncate">{a.title}</td>
                    <td className="py-3 pr-4 text-slate-500">{a.category}</td>
                    <td className="py-3 pr-4 text-slate-900">{a.views}</td>
                    <td className={`py-3 pr-4 font-medium flex items-center gap-1 ${a.trend === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {a.trend === 'up' ? <ArrowUp size={11} strokeWidth={2.5} /> : <ArrowDown size={11} strokeWidth={2.5} />}
                      {a.change}
                    </td>
                    <td className="py-3 text-slate-500">{a.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  )
}
