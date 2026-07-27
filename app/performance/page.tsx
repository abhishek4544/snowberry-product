'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  ChevronDown,
  Command,
  Gauge,
  Home,
  Info,
  ListChecks,
  MessageSquare,
  Newspaper,
  Pin,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  Wrench,
  X,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react'

type RailItem = {
  label: string
  href: string
  Icon: LucideIcon
  active?: boolean
}

type CompareMode = 'prev period' | '90-day norm'
type ToneFilter = 'Debated' | 'Supportive' | 'Critical'
type Tab = 'Overview' | 'Content' | 'Reach' | 'Engagement' | 'Audience'
type Range = 'Last week' | '30 days' | '90 days'
type AudienceFilterKey = 'device' | 'country' | 'traffic' | 'status'
type DeskSortKey = 'name' | 'articles' | 'viewsNum' | 'completion' | 'residual' | 'cycleHours'
type ContentSortKey = 'title' | 'viewsNum' | 'completion' | 'residual' | 'ctr'
type CategoryKey = 'Business' | 'Science' | 'Tech' | 'Policy' | 'Society' | 'Culture' | 'Politics' | 'Sports'
type AuthorKey = 'Sagar Mehta' | 'Riya Kapoor' | 'Dev Pillai' | 'Maya Gupta' | 'Anil Verma'
type ContentFormat = 'Longform' | 'News brief' | 'Explainer' | 'Interview' | 'Data'

const RAIL_ITEMS: RailItem[] = [
  { label: 'Home', href: '/', Icon: Home },
  { label: 'New article', href: '/news/new', Icon: Plus },
  { label: 'News', href: '/news', Icon: Newspaper },
  { label: 'Messages', href: '/news/comments', Icon: MessageSquare },
  { label: 'Tasks', href: '#', Icon: ListChecks },
  { label: 'Performance', href: '/performance', Icon: Gauge },
  { label: 'Media', href: '/media', Icon: ImageIcon },
  { label: 'People', href: '#', Icon: Users, active: true },
  { label: 'Tools', href: '/menu', Icon: Wrench },
]

const QUESTIONS = [
  'How did Viewers find my content?',
  'Which reporters performed best?',
  'Which content needs attention?',
]

const TABS: Tab[] = ['Overview', 'Content', 'Reach', 'Engagement', 'Audience']
const RANGES: Range[] = ['Last week', '30 days', '90 days']

const audienceSeries: Record<Range, { labels: string[]; points: number[]; views: string; rawViews: number; deltaPrev: string; deltaNorm: string }> = {
  'Last week': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    points: [6100, 8400, 7800, 11200, 9600, 15100, 16800],
    views: '284.7k',
    rawViews: 284738,
    deltaPrev: '+14.2%',
    deltaNorm: '+11.8%',
  },
  '30 days': {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
    points: [12200, 14100, 16400, 15300, 17600, 18800, 19700],
    views: '1.12m',
    rawViews: 1118400,
    deltaPrev: '+9.6%',
    deltaNorm: '+7.2%',
  },
  '90 days': {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    points: [9800, 12800, 14300, 15100, 17200, 16600, 19400],
    views: '3.41m',
    rawViews: 3411200,
    deltaPrev: '+18.4%',
    deltaNorm: '+13.1%',
  },
}

const audienceFilterOptions: Record<AudienceFilterKey, string[]> = {
  device: ['Device Type', 'Mobile', 'Desktop', 'Tablet'],
  country: ['Country', 'India', 'Nepal', 'Global'],
  traffic: ['Traffic Source', 'Search', 'Social', 'Direct'],
  status: ['Status', 'Published', 'Updated', 'Evergreen'],
}

const productionMetrics = [
  { label: 'Articles published', value: '47', delta: '+6', altDelta: '+9%', spark: [3, 5, 4, 6, 7, 5, 8] },
  { label: 'Approvals cleared', value: '89', delta: '+12', altDelta: '+16%', spark: [10, 12, 9, 14, 13, 15, 16] },
  { label: 'Time-to-decision', value: '6.4h', delta: '-1.2h', altDelta: '-18%', spark: [9, 8.5, 8, 7.5, 7, 6.8, 6.4], invert: true },
  { label: 'Coverage spread', value: '9', delta: '+1 desk', altDelta: '+2 desks', spark: [7, 7, 8, 8, 8, 9, 9] },
]

const desks = [
  { name: 'Business', articles: 8, views: '68.1k', viewsNum: 68100, completion: 71, residual: 42, cycle: '4h', cycleHours: 4 },
  { name: 'Science', articles: 5, views: '54.4k', viewsNum: 54400, completion: 74, residual: 38, cycle: '3h', cycleHours: 3 },
  { name: 'Tech', articles: 7, views: '49.2k', viewsNum: 49200, completion: 64, residual: 11, cycle: '6h', cycleHours: 6 },
  { name: 'Society', articles: 6, views: '32.9k', viewsNum: 32900, completion: 66, residual: 7, cycle: '7h', cycleHours: 7 },
  { name: 'Culture', articles: 3, views: '8.0k', viewsNum: 8000, completion: 61, residual: 2, cycle: '8h', cycleHours: 8 },
  { name: 'Politics', articles: 9, views: '41.7k', viewsNum: 41700, completion: 58, residual: -4, cycle: '9h', cycleHours: 9 },
  { name: 'Sports', articles: 4, views: '10.1k', viewsNum: 10100, completion: 52, residual: -18, cycle: '11h', cycleHours: 11 },
  { name: 'Policy', articles: 5, views: '20.3k', viewsNum: 20300, completion: 47, residual: -31, cycle: '13h', cycleHours: 13 },
]

const discussionRows = [
  { article: 'Why the rupee held steady despite oil price volatility', desk: 'Business', comments: 184, tone: 'Debated' as ToneFilter, velocity: '+82 in last 6h' },
  { article: 'Delhi EV policy and the second embed problem', desk: 'Policy', comments: 143, tone: 'Critical' as ToneFilter, velocity: '+61 in last 6h' },
  { article: "ISRO's next mission: what we know so far", desk: 'Science', comments: 118, tone: 'Supportive' as ToneFilter, velocity: '+44 in last 6h' },
  { article: "The silent revolution in India's tier-2 startup scene", desk: 'Tech', comments: 97, tone: 'Debated' as ToneFilter, velocity: '+38 in last 6h' },
  { article: 'Inside the office that reshaped Indian indie cinema', desk: 'Culture', comments: 61, tone: 'Supportive' as ToneFilter, velocity: '+19 in last 6h' },
  { article: 'Crypto regulation bill: what editors missed', desk: 'Policy', comments: 54, tone: 'Critical' as ToneFilter, velocity: '+17 in last 6h' },
]

const audienceSources = [
  { label: 'Search', share: 38.4, views: '108.9k', color: '#0787ff' },
  { label: 'Direct', share: 26.7, views: '75.9k', color: '#39adfa' },
  { label: 'Social', share: 21.1, views: '60.1k', color: '#75c9f8' },
  { label: 'Newsletter', share: 13.8, views: '39.3k', color: '#b3dff4' },
]

const audienceDevices = [
  { label: 'Mobile', share: 71, views: '202.1k' },
  { label: 'Desktop', share: 24, views: '68.3k' },
  { label: 'Tablet', share: 5, views: '14.3k' },
]

function formatViews(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}m`
  return `${(value / 1000).toFixed(1)}k`
}

// ── CONTENT TAB · article-level performance ──────────────────────────────────
type ContentRow = {
  title: string
  desk: CategoryKey
  format: ContentFormat
  author: AuthorKey
  views: string
  viewsNum: number
  completion: number
  residual: number
  ctr: number
  publishedHrs: number
}
const contentRows: ContentRow[] = [
  { title: 'Why the rupee held steady despite oil price volatility', desk: 'Business', format: 'Explainer',  author: 'Sagar Mehta', views: '38.4k', viewsNum: 38400, completion: 74, residual:  42, ctr: 6.2, publishedHrs: 18 },
  { title: "The silent revolution in India's tier-2 startup scene",  desk: 'Tech',     format: 'Longform',   author: 'Riya Kapoor', views: '29.1k', viewsNum: 29100, completion: 68, residual:  22, ctr: 4.8, publishedHrs: 44 },
  { title: "ISRO's next mission: what we know so far",               desk: 'Science',  format: 'News brief', author: 'Dev Pillai',  views: '21.7k', viewsNum: 21700, completion: 71, residual:  31, ctr: 7.1, publishedHrs: 62 },
  { title: 'Delhi EV policy: commercial fleet mandate explained',    desk: 'Policy',   format: 'Explainer',  author: 'Riya Kapoor', views: '18.2k', viewsNum: 18200, completion: 47, residual: -31, ctr: 3.2, publishedHrs: 26 },
  { title: 'Inside the quiet rise of community radio in rural India', desk: 'Society', format: 'Longform',   author: 'Maya Gupta',  views: '14.8k', viewsNum: 14800, completion: 66, residual:   7, ctr: 5.5, publishedHrs: 80 },
  { title: 'Crypto regulation bill: what editors missed',             desk: 'Policy',  format: 'Data',       author: 'Anil Verma',  views: '11.4k', viewsNum: 11400, completion: 52, residual: -18, ctr: 3.9, publishedHrs: 12 },
  { title: 'How a Kerala co-op became India’s biggest EV charger', desk: 'Business', format: 'Interview', author: 'Sagar Mehta', views:  '9.8k', viewsNum:  9800, completion: 69, residual:  11, ctr: 4.4, publishedHrs: 52 },
]

const contentFormatMix: { format: ContentFormat; share: number; color: string; residual: number }[] = [
  { format: 'Longform',   share: 31, color: '#003399', residual: +18 },
  { format: 'Explainer',  share: 26, color: '#0787ff', residual: +34 },
  { format: 'News brief', share: 19, color: '#39adfa', residual:  +4 },
  { format: 'Interview',  share: 14, color: '#7cc4ff', residual: +11 },
  { format: 'Data',       share: 10, color: '#c8d5df', residual:  -7 },
]

// Hourly publish rhythm — today vs same day last week (24 buckets).
const publishRhythm: { h: number; today: number; prev: number }[] = Array.from({ length: 24 }).map((_, h) => {
  const base = 1.6 + Math.sin(h / 3.2) * 1.1 + Math.sin(h / 1.5) * 0.4
  return {
    h,
    today: Math.max(0, Math.round(base + (h === 8 || h === 18 ? 2.4 : 0.2 * Math.cos(h)))),
    prev:  Math.max(0, Math.round(base * 0.75 + (h === 9 ? 1.8 : 0.1 * Math.sin(h)))),
  }
})

// ── CATEGORY TAB · desk-level entity profile ─────────────────────────────────
const categoryProfiles: Record<CategoryKey, {
  color: string
  articles: number
  views: string
  viewsNum: number
  completion: number
  residual: number
  reachGoal: number
  reach: number
  topAuthors: { name: AuthorKey; residual: number; articles: number }[]
  weeklyTrace: number[]
  labels: string[]
  headline: string
  narrative: string
}> = {
  Business: {
    color: '#003399', articles: 8, views: '68.1k', viewsNum: 68100, completion: 71, residual: +42, reachGoal: 100000, reach: 68100,
    topAuthors: [{ name: 'Sagar Mehta', residual: +42, articles: 5 }, { name: 'Riya Kapoor', residual: +14, articles: 2 }, { name: 'Dev Pillai', residual: +8, articles: 1 }],
    weeklyTrace: [7200, 9100, 8600, 12400, 10800, 15400, 4600], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    headline: 'Business is the desk of the week',
    narrative: 'Rupee-oil explainer alone drove 38.4k views at 3.4× desk median. Short-form Business pieces are outperforming — queue two more for Monday.',
  },
  Science: {
    color: '#0787ff', articles: 5, views: '54.4k', viewsNum: 54400, completion: 74, residual: +38, reachGoal: 60000, reach: 54400,
    topAuthors: [{ name: 'Dev Pillai', residual: +38, articles: 3 }, { name: 'Maya Gupta', residual: +9, articles: 2 }],
    weeklyTrace: [6100, 7300, 8900, 8100, 9400, 8300, 6300], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    headline: 'Science over-delivered on fewer stories',
    narrative: 'ISRO and moon-mission explainers pulled a 74% median completion — highest in the newsroom.',
  },
  Tech: {
    color: '#39adfa', articles: 7, views: '49.2k', viewsNum: 49200, completion: 64, residual: +11, reachGoal: 55000, reach: 49200,
    topAuthors: [{ name: 'Riya Kapoor', residual: +22, articles: 4 }, { name: 'Anil Verma', residual: -3, articles: 3 }],
    weeklyTrace: [5200, 6100, 5800, 7300, 6800, 9100, 8900], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    headline: 'Tech is on target — startup pieces travelled',
    narrative: 'Tier-2 startup piece was the anchor. Longforms in Tech are pulling their weight; briefs are underperforming.',
  },
  Policy: {
    color: '#c2410c', articles: 5, views: '20.3k', viewsNum: 20300, completion: 47, residual: -31, reachGoal: 45000, reach: 20300,
    topAuthors: [{ name: 'Riya Kapoor', residual: -31, articles: 3 }, { name: 'Anil Verma', residual: -18, articles: 2 }],
    weeklyTrace: [2100, 3100, 2900, 4200, 3400, 2600, 2000], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    headline: 'Policy needs a headline rewrite pass',
    narrative: 'Delhi EV and crypto pieces are 31% under Policy median. Session time is fine — it is a packaging problem.',
  },
  Society: {
    color: '#7c3aed', articles: 6, views: '32.9k', viewsNum: 32900, completion: 66, residual: +7, reachGoal: 40000, reach: 32900,
    topAuthors: [{ name: 'Maya Gupta', residual: +9, articles: 4 }, { name: 'Sagar Mehta', residual: +2, articles: 2 }],
    weeklyTrace: [3400, 4100, 4600, 5200, 4900, 5800, 4900], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    headline: 'Society is quietly compounding',
    narrative: 'Longform social pieces have the highest returning-reader rate in the newsroom.',
  },
  Culture: {
    color: '#0f7a3a', articles: 3, views:  '8.0k', viewsNum:  8000, completion: 61, residual: +2, reachGoal: 12000, reach: 8000,
    topAuthors: [{ name: 'Maya Gupta', residual: +2, articles: 3 }],
    weeklyTrace: [800, 1100, 1200, 1300, 1100, 1300, 1200], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    headline: 'Culture has room to expand',
    narrative: 'Only 3 stories published — coverage spread is the ceiling. Assign a 2nd contributor.',
  },
  Politics: {
    color: '#eab308', articles: 9, views: '41.7k', viewsNum: 41700, completion: 58, residual: -4, reachGoal: 55000, reach: 41700,
    topAuthors: [{ name: 'Anil Verma', residual: -4, articles: 5 }, { name: 'Sagar Mehta', residual: -6, articles: 4 }],
    weeklyTrace: [5200, 6100, 5800, 6300, 5200, 6800, 6300], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    headline: 'Politics is holding steady, not lifting',
    narrative: 'Highest article count of the week, middle-of-the-pack per-story performance.',
  },
  Sports: {
    color: '#c8d5df', articles: 4, views: '10.1k', viewsNum: 10100, completion: 52, residual: -18, reachGoal: 18000, reach: 10100,
    topAuthors: [{ name: 'Anil Verma', residual: -18, articles: 4 }],
    weeklyTrace: [1100, 1300, 1400, 1600, 1400, 1600, 1700], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    headline: 'Sports is drifting under expectation',
    narrative: 'Completion below 55% for 3 of 4 stories. Try shorter format.',
  },
}

// ── AUTHOR TAB · reporter entity profile (coaching view, no leaderboard) ─────
const authorProfiles: Record<AuthorKey, {
  desk: CategoryKey
  articles: number
  views: string
  viewsNum: number
  completion: number
  residual: number
  ctr: number
  weeklyTrace: number[]
  labels: string[]
  strengths: string[]
  coaching: string[]
  avatar: string
  headline: string
  reachGoal: number
}> = {
  'Sagar Mehta': {
    desk: 'Business', articles: 6, views: '52.1k', viewsNum: 52100, completion: 72, residual: +34, ctr: 5.8,
    weeklyTrace: [6100, 7400, 6800, 9600, 8300, 11200, 3300], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    strengths: ['Explainer format', 'Business framing', 'Sunday cadence'],
    coaching: ['Try one Longform in the next fortnight — sample size is thin'],
    avatar: 'SM', headline: 'Reinforce Sagar’s Monday-newsletter slot', reachGoal: 70000,
  },
  'Riya Kapoor': {
    desk: 'Tech', articles: 9, views: '47.3k', viewsNum: 47300, completion: 58, residual: -12, ctr: 3.6,
    weeklyTrace: [5100, 6300, 5800, 7100, 6400, 8400, 8200], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    strengths: ['High session time', 'Depth of reporting'],
    coaching: ['CTR pattern flags a headline issue, not a content one', 'Book a 30-min headline session', 'Check mobile embed placement on Policy pieces'],
    avatar: 'RK', headline: 'Riya needs a headline workshop, not a workload cut', reachGoal: 60000,
  },
  'Dev Pillai': {
    desk: 'Science', articles: 4, views: '34.6k', viewsNum: 34600, completion: 74, residual: +38, ctr: 6.8,
    weeklyTrace: [4200, 5100, 5800, 6300, 5900, 4200, 3100], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    strengths: ['Highest completion in newsroom', 'Science explainers'],
    coaching: ['Publish more — the demand is there'],
    avatar: 'DP', headline: 'Give Dev more room — he’s under-publishing', reachGoal: 45000,
  },
  'Maya Gupta': {
    desk: 'Society', articles: 5, views: '18.7k', viewsNum: 18700, completion: 68, residual: +9, ctr: 4.3,
    weeklyTrace: [2100, 2800, 3100, 3400, 2900, 3200, 1200], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    strengths: ['Longform completion', 'Returning readers'],
    coaching: ['Society + Culture cross-post — expand reach'],
    avatar: 'MG', headline: 'Maya’s longforms compound — surface them in email', reachGoal: 25000,
  },
  'Anil Verma': {
    desk: 'Politics', articles: 8, views: '21.9k', viewsNum: 21900, completion: 55, residual: -6, ctr: 3.4,
    weeklyTrace: [2400, 2800, 2600, 3100, 3200, 4100, 3700], labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    strengths: ['Coverage breadth', 'Turnaround speed'],
    coaching: ['Volume is fine — per-story impact needs a lift', 'Try a Data piece next'],
    avatar: 'AV', headline: 'Anil is spreading thin — pick 2 desks not 4', reachGoal: 30000,
  },
}

function TopBar({
  globalSearch,
  setGlobalSearch,
}: {
  globalSearch: string
  setGlobalSearch: (value: string) => void
}) {
  const [openMenu, setOpenMenu] = useState<'notifications' | 'settings' | 'profile' | null>(null)

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#d8e6f0]/70 bg-[#f8fbfd] px-7">
      <div className="flex items-center gap-5">
        <Link href="/" className="flex items-center" aria-label="Snowberry home">
          <img src="/logo-wordmark.svg" alt="snowberry" className="h-[29px] w-[136px]" />
        </Link>
        <span className="h-8 w-px bg-[#c8d5df]" />
        <Link href="/" className="flex items-center gap-2" aria-label="Ukalo">
          <span className="relative flex h-8 w-7 items-end justify-center overflow-hidden text-[#047c86]">
            <span className="absolute bottom-0 left-0 h-8 w-2 rounded-t-full bg-[#047c86]" />
            <span className="absolute bottom-0 left-[10px] h-7 w-2 rounded-t-full bg-[#047c86] opacity-90" />
            <span className="absolute bottom-0 right-0 h-8 w-2 rounded-t-full bg-[#047c86] opacity-75" />
          </span>
          <span className="font-mukta text-[25px] font-bold leading-none text-[#047c86]">उकालो</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex h-12 w-[510px] items-center gap-3 rounded-[12px] border border-[#d9e2ea] bg-white px-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <Search size={19} strokeWidth={2.1} className="shrink-0 text-[#1f2933]" />
          <input
            type="text"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search articles, authors, tags..."
            className="min-w-0 flex-1 bg-transparent font-urbanist text-[17px] font-medium text-[#1f2933] outline-none placeholder:text-[#a3a9af]"
          />
          <kbd className="inline-flex h-6 items-center gap-1 rounded-[6px] bg-[#f2f4f7] px-2 font-urbanist text-[13px] font-semibold text-[#202936]">
            <Command size={13} strokeWidth={2.2} />K
          </kbd>
        </label>

        <button
          onClick={() => setOpenMenu((menu) => menu === 'notifications' ? null : 'notifications')}
          className="relative flex size-12 items-center justify-center rounded-full bg-[#edf6fc] text-[#202936]"
        >
          <Bell size={23} strokeWidth={2} />
          <span className="absolute right-3 top-3 size-2.5 rounded-full bg-[#ef2b2d] ring-2 ring-[#edf6fc]" />
        </button>
        <button
          onClick={() => setOpenMenu((menu) => menu === 'settings' ? null : 'settings')}
          className="flex size-12 items-center justify-center rounded-full bg-[#edf6fc] text-[#202936]"
        >
          <Settings size={23} strokeWidth={2} />
        </button>
        <button
          onClick={() => setOpenMenu((menu) => menu === 'profile' ? null : 'profile')}
          className="size-12 overflow-hidden rounded-full bg-[#d7edf7]"
        >
          <img src="/figma/avatar.png" alt="User avatar" className="size-full object-cover" />
        </button>
      </div>

      {openMenu && (
        <div className="absolute right-7 top-[62px] z-40 w-[280px] rounded-[12px] border border-[#d9e2ea] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
          {openMenu === 'notifications' && (
            <>
              <p className="font-urbanist text-[13px] font-bold uppercase tracking-[0.12em] text-[#0787ff]">Notifications</p>
              {['Weekly digest is ready', 'Delhi EV heatmap changed', '2 comments need attention'].map((item) => (
                <button key={item} className="mt-2 block w-full rounded-[8px] bg-[#f4faff] px-3 py-2 text-left font-urbanist text-[13px] font-semibold text-[#202936]">
                  {item}
                </button>
              ))}
            </>
          )}
          {openMenu === 'settings' && (
            <>
              <p className="font-urbanist text-[13px] font-bold uppercase tracking-[0.12em] text-[#0787ff]">View Settings</p>
              {['Compact density', 'Show guardrails', 'Country-only geography'].map((item) => (
                <label key={item} className="mt-3 flex items-center justify-between font-urbanist text-[13px] font-semibold text-[#202936]">
                  {item}
                  <input type="checkbox" defaultChecked className="accent-[#0787ff]" />
                </label>
              ))}
            </>
          )}
          {openMenu === 'profile' && (
            <>
              <p className="font-urbanist text-[15px] font-bold text-[#202936]">Ashish Kumar</p>
              <p className="mt-1 font-urbanist text-[13px] font-semibold text-[#6b747c]">Editor-in-chief · full access</p>
              <Link href="/settings" className="mt-3 block rounded-[8px] bg-[#eff6ff] px-3 py-2 font-urbanist text-[13px] font-bold text-[#003399]">
                Open account settings
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}

function LeftSidebar() {
  return (
    <aside className="sticky top-[72px] flex h-[calc(100vh-72px)] w-[110px] shrink-0 flex-col items-center bg-[#dff0fb] pt-[108px]">
      <nav className="flex flex-col items-center gap-[11px]">
        {RAIL_ITEMS.map(({ label, href, Icon, active }) => (
          <Link
            key={label}
            href={href}
            title={label}
            className={[
              'flex size-[58px] items-center justify-center rounded-full transition-colors',
              active
                ? 'bg-white text-[#003399]'
                : 'bg-[#edf8ff] text-[#1f2933] hover:bg-white',
            ].join(' ')}
          >
            <Icon size={26} strokeWidth={active ? 2.7 : 2.1} />
          </Link>
        ))}
      </nav>

      <nav className="mt-[98px] flex flex-col items-center gap-[11px]">
        <Link href="#" title="Team" className="flex size-[58px] items-center justify-center rounded-full bg-[#edf8ff] text-[#1f2933] hover:bg-white">
          <Users size={26} strokeWidth={2.1} />
        </Link>
        <Link href="/settings" title="Settings" className="flex size-[58px] items-center justify-center rounded-full bg-[#edf8ff] text-[#1f2933] hover:bg-white">
          <Settings size={26} strokeWidth={2.1} />
        </Link>
      </nav>
    </aside>
  )
}

function PromptBar({
  activePrompt,
  setActivePrompt,
  berryOpen,
  setBerryOpen,
}: {
  activePrompt: string
  setActivePrompt: (prompt: string) => void
  berryOpen: boolean
  setBerryOpen: (open: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2 px-[19px] pt-[18px]">
      <div className="relative min-w-0 flex-1">
        <select
          aria-label="Report question"
          value={activePrompt}
          onChange={(event) => setActivePrompt(event.target.value)}
          className="h-10 w-full appearance-none rounded-[9px] border border-[#d8e6f0] bg-[#f4f8fb] px-3 pr-9 font-urbanist text-[14px] font-semibold text-[#4f5962] outline-none transition focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20"
        >
          {QUESTIONS.map((question) => <option key={question} value={question}>{question}</option>)}
        </select>
        <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b747c]" />
      </div>
      <button
        onClick={() => setBerryOpen(!berryOpen)}
        className="flex h-10 w-[136px] shrink-0 items-center justify-center gap-2 rounded-[8px] bg-[#39adfa] font-urbanist text-[14px] font-semibold text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.34)]"
      >
        Ask Berry
        <Sparkles size={15} strokeWidth={2.3} />
      </button>
    </div>
  )
}

function ProvenanceLink({ children, href = '#' }: { children: React.ReactNode; href?: string }) {
  return (
    <Link href={href} className="text-[#003399] underline decoration-dotted decoration-[1.5px] underline-offset-[5px]">
      {children}
    </Link>
  )
}

function Digest({
  activePrompt,
  berryOpen,
  selectedDecision,
  setSelectedDecision,
}: {
  activePrompt: string
  berryOpen: boolean
  selectedDecision: string
  setSelectedDecision: (decision: string) => void
}) {
  const decisions = ['Reinforce Business', 'Coach Riya', 'Fill EV gap', 'Move to mid-week slot']
  const promptAnswer = {
    'How did Viewers find my content?': 'Search led the lift; mobile readers dropped at the second embed.',
    'Which reporters performed best?': 'Sagar and Dev are ahead of their desk baselines; Riya needs coaching.',
    'Which content needs attention?': 'Delhi EV and the crypto bill need the next editorial pass.',
  }[activePrompt]

  return (
    <section className="rounded-[8px] bg-white/60 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[19px] font-medium leading-tight text-[#202326]">
            <ProvenanceLink href="/news">47 stories</ProvenanceLink> · <ProvenanceLink href="/performance#audience">284.7k readers</ProvenanceLink>
          </p>
          <p className="mt-1 font-urbanist text-[13px] font-semibold text-[#6b747c]">
            Business and Science led growth · 2 mobile stories need attention
          </p>
        </div>
        <span className="rounded-full bg-[#eef7fd] px-3 py-1 font-urbanist text-[11px] font-bold text-[#5e6870]">Updated 4m ago</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <select aria-label="Decision focus" value={selectedDecision} onChange={(event) => setSelectedDecision(event.target.value)} className="h-9 w-full appearance-none rounded-[8px] border border-[#d8e6f0] bg-white/75 px-3 pr-8 font-urbanist text-[13px] font-semibold text-[#202936] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20">
            {decisions.map((decision) => <option key={decision} value={decision}>{decision}</option>)}
          </select>
          <ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b747c]" />
        </div>
        <span className="font-urbanist text-[12px] font-semibold text-[#7b858d]">Decision focus</span>
      </div>
      {berryOpen && (
        <div className="mt-3 rounded-[8px] border border-[#dbeafe] bg-[#f4faff] px-4 py-2.5 font-urbanist text-[13px] font-semibold text-[#202936]">
          {promptAnswer} Focus: <span className="text-[#003399]">{selectedDecision}</span>.
        </div>
      )}
    </section>
  )
}

function AudienceHero({
  compareMode,
  range,
  filters,
  setAudienceFilter,
}: {
  compareMode: CompareMode
  range: Range
  filters: Record<AudienceFilterKey, string>
  setAudienceFilter: (key: AudienceFilterKey, value: string) => void
}) {
  const series = audienceSeries[range]
  const multiplier =
    (filters.device === 'Mobile' ? 0.92 : filters.device === 'Desktop' ? 0.78 : 1) *
    (filters.country === 'Nepal' ? 0.34 : filters.country === 'Global' ? 1.18 : 1) *
    (filters.traffic === 'Social' ? 0.72 : filters.traffic === 'Direct' ? 0.56 : 1) *
    (filters.status === 'Updated' ? 0.64 : filters.status === 'Evergreen' ? 0.48 : 1)
  const chartPoints = series.points.map((point) => Math.round(point * multiplier))
  const displayViews = multiplier === 1 ? series.views : `${Math.round(series.rawViews * multiplier / 1000).toLocaleString()}k`
  const delta = compareMode === 'prev period' ? series.deltaPrev : series.deltaNorm
  const max = Math.max(20000, Math.ceil(Math.max(...chartPoints) / 5000) * 5000)
  const w = 620
  const h = 250
  const padL = 44
  const padR = 18
  const padT = 24
  const padB = 34
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const pts = chartPoints.map((value, index) => ({
    x: padL + (index / (chartPoints.length - 1)) * chartW,
    y: padT + (1 - value / max) * chartH,
  }))
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `M ${padL},${padT + chartH} L ${line} L ${w - padR},${padT + chartH} Z`

  return (
    <section className="grid min-h-[380px] grid-cols-[280px_minmax(0,1fr)] gap-5 rounded-[8px] bg-white/70 p-5">
      <aside className="flex flex-col border-r border-[#dce8f1] pr-5">
        <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Audience</p>
        <p className="mt-2 font-urbanist text-[56px] font-bold leading-none tracking-[-0.04em] text-[#16202a]">{displayViews}</p>
        <p className="mt-2 font-urbanist text-[14px] font-medium text-[#606b74]">Views · {range.toLowerCase()}</p>
        <span className="mt-4 inline-flex w-fit rounded-full bg-[#e9f8ef] px-3 py-1 font-urbanist text-[13px] font-bold text-[#219150]">{delta}</span>

        <div className="mt-auto grid gap-3">
          {[
            ['Median completion', '62%'],
            ['Engaged time', '1m 48s'],
            ['Mobile share', '71%'],
            ['Returning', '32%'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="font-urbanist text-[12px] font-semibold text-[#7b858d]">{label}</p>
              <p className="font-urbanist text-[24px] font-bold leading-tight text-[#202936]">{value}</p>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap gap-2">
          {([
            ['device', filters.device],
            ['country', filters.country],
            ['traffic', filters.traffic],
            ['status', filters.status],
          ] as [AudienceFilterKey, string][]).map(([key, filter]) => (
            <div key={key} className="relative h-9">
              <select
                aria-label={key}
                value={filter}
                onChange={(event) => setAudienceFilter(key, event.target.value)}
                className="h-full appearance-none rounded-[9px] border border-[#d2e1ec] bg-white/75 px-3 pr-8 font-urbanist text-[13px] font-semibold text-[#202936] outline-none transition focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20"
              >
                {audienceFilterOptions[key].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown aria-hidden="true" size={14} strokeWidth={2.2} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#202936]" />
            </div>
          ))}
        </div>

        <div className="relative mt-4 flex-1 overflow-hidden rounded-[8px] bg-[#f9fcff]/80">
          <svg viewBox={`0 0 ${w} ${h}`} className="h-full min-h-[250px] w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <pattern id="audience-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" x2="0" y1="0" y2="8" stroke="#0787ff" strokeOpacity="0.28" strokeWidth="2" />
              </pattern>
            </defs>
            {[0, 5000, 10000, 15000, 20000].map((tick) => {
              const y = padT + (1 - tick / max) * chartH
              return (
                <g key={tick}>
                  <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#b8c8d5" strokeDasharray="5 5" strokeOpacity="0.7" />
                  <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6b747c" fontFamily="Urbanist, sans-serif">
                    {tick === 0 ? '0' : `${tick / 1000}k`}
                  </text>
                </g>
              )
            })}
            <path d={area} fill="#0787ff" fillOpacity="0.14" />
            <path d={area} fill="url(#audience-hatch)" opacity="0.65" />
            <polyline points={line} fill="none" stroke="#0787ff" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, index) => (
              <g key={series.labels[index]}>
                <circle cx={p.x} cy={p.y} r="4" fill="#0787ff" stroke="#ffffff" strokeWidth="2" />
                <text x={p.x} y={h - 10} textAnchor="middle" fontSize="11" fill="#6b747c" fontFamily="Urbanist, sans-serif">
                  {series.labels[index]}
                </text>
              </g>
            ))}
          </svg>

          <div className="absolute left-[49%] top-[35%] w-[178px] rounded-[10px] bg-white p-3 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between gap-2">
              <p className="font-urbanist text-[20px] font-bold leading-none text-[#0787ff]">{delta}</p>
              <div className="flex gap-1 text-[#6b747c]">
                <Pin size={13} strokeWidth={2.2} />
                <X size={13} strokeWidth={2.2} />
              </div>
            </div>
            <p className="mt-1 font-urbanist text-[12px] font-semibold text-[#5e6870]">Views vs {compareMode}</p>
          </div>
        </div>

        <p className="mt-3 font-urbanist text-[12px] font-semibold text-[#6b747c]">
          Consent-gated telemetry · country code only, no IP retained
        </p>
      </div>
    </section>
  )
}

type OverviewScope = 'News' | 'Category' | 'Author'

function OverviewTrend({ compareMode, range }: { compareMode: CompareMode; range: Range }) {
  const [scope, setScope] = useState<OverviewScope>('News')
  const [category, setCategory] = useState<CategoryKey>('Business')
  const [author, setAuthor] = useState<AuthorKey>('Sagar Mehta')
  const globalSeries = audienceSeries[range]
  const rangeFactor = range === 'Last week' ? 1 : range === '30 days' ? 3.1 : 8.5
  const categoryProfile = categoryProfiles[category]
  const authorProfile = authorProfiles[author]
  const selectedProfile = scope === 'Category' ? categoryProfile : authorProfile
  const labels = globalSeries.labels
  const sourcePoints = scope === 'News' ? audienceSeries['Last week'].points : selectedProfile.weeklyTrace
  const points = sourcePoints.map((point) => Math.round(point * rangeFactor))
  const totalViews = scope === 'News' ? globalSeries.rawViews : Math.round(selectedProfile.viewsNum * rangeFactor)
  const goal = scope === 'News' ? 400000 : Math.round(selectedProfile.reachGoal * rangeFactor)
  const progress = Math.min(99, Math.round((totalViews / goal) * 100))
  const delta = scope === 'News'
    ? compareMode === 'prev period' ? globalSeries.deltaPrev : globalSeries.deltaNorm
    : `${selectedProfile.residual >= 0 ? '+' : ''}${selectedProfile.residual}%`
  const deltaCaption = scope === 'News' ? `vs ${compareMode}` : scope === 'Category' ? 'vs category norm' : `vs ${authorProfile.desk} norm`
  const stroke = scope === 'News' ? '#0787ff' : scope === 'Category' ? categoryProfile.color : categoryProfiles[authorProfile.desk].color
  const entityName = scope === 'News' ? 'News' : scope === 'Category' ? category : author
  const max = Math.max(10000, Math.ceil(Math.max(...points) / 10000) * 10000)
  const w = 700
  const h = 270
  const padL = 52
  const padR = 20
  const padT = 24
  const padB = 42
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const pts = points.map((value, index) => ({
    x: padL + (index / (points.length - 1)) * chartW,
    y: padT + (1 - value / max) * chartH,
  }))
  const line = pts.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `M ${padL},${padT + chartH} L ${line} L ${w - padR},${padT + chartH} Z`
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((step) => Math.round(max * step))
  const categories = Object.keys(categoryProfiles) as CategoryKey[]
  const authors = Object.keys(authorProfiles) as AuthorKey[]
  const topCategories = Object.entries(categoryProfiles)
    .sort(([, first], [, second]) => second.viewsNum - first.viewsNum)
    .slice(0, 3)

  return (
    <section className="rounded-[8px] bg-white/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Overview · growth trend</p>
          <h2 className="mt-2 font-urbanist text-[22px] font-bold text-[#202936]">{entityName} growth over time</h2>
          <p className="mt-1 font-urbanist text-[13px] font-semibold text-[#6b747c]">
            Views by {range === 'Last week' ? 'day' : range === '30 days' ? 'week' : 'month'} · check news, category, or author growth from one view.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <div className="relative h-10">
            <select
              aria-label="Overview scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as OverviewScope)}
              className="h-full appearance-none rounded-[9px] border border-[#cbd9e5] bg-[#f4faff] px-3 pr-9 font-urbanist text-[14px] font-semibold text-[#202936] outline-none transition focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20"
            >
              <option value="News">News</option>
              <option value="Category">Category</option>
              <option value="Author">Author</option>
            </select>
            <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#202936]" />
          </div>
          {scope === 'Category' && (
            <div className="relative h-10">
              <select aria-label="Overview category" value={category} onChange={(event) => setCategory(event.target.value as CategoryKey)} className="h-full appearance-none rounded-[9px] border border-[#cbd9e5] bg-[#f4faff] px-3 pr-9 font-urbanist text-[14px] font-semibold text-[#202936] outline-none transition focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20">
                {categories.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#202936]" />
            </div>
          )}
          {scope === 'Author' && (
            <div className="relative h-10">
              <select aria-label="Overview author" value={author} onChange={(event) => setAuthor(event.target.value as AuthorKey)} className="h-full appearance-none rounded-[9px] border border-[#cbd9e5] bg-[#f4faff] px-3 pr-9 font-urbanist text-[14px] font-semibold text-[#202936] outline-none transition focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20">
                {authors.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#202936]" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[188px_minmax(0,1fr)]">
        <aside className="border-r border-[#dce8f1] pr-5">
          <p className="font-urbanist text-[12px] font-semibold text-[#7b858d]">Reach this {range.toLowerCase()}</p>
          <p className="mt-2 font-urbanist text-[40px] font-bold leading-none tracking-[-0.04em] text-[#202936]">{formatViews(totalViews)}</p>
          <p className="mt-2 font-urbanist text-[13px] font-semibold text-[#6b747c]">{progress}% of {formatViews(goal)} goal</p>
          <span className={delta.startsWith('-') ? 'mt-4 inline-flex rounded-full bg-[#fff7ed] px-3 py-1 font-urbanist text-[12px] font-bold text-[#c2410c]' : 'mt-4 inline-flex rounded-full bg-[#e9f8ef] px-3 py-1 font-urbanist text-[12px] font-bold text-[#219150]'}>
            {delta} {deltaCaption}
          </span>

          <div className="mt-6 space-y-3">
            <div>
              <div className="flex items-center justify-between font-urbanist text-[11px] font-bold uppercase tracking-[0.08em] text-[#7b858d]"><span>Goal progress</span><span>{progress}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-[#dce8f1]"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: stroke }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="font-urbanist text-[11px] font-semibold text-[#7b858d]">Completion</p><p className="font-urbanist text-[18px] font-bold text-[#202936]">{scope === 'News' ? '62%' : `${selectedProfile.completion}%`}</p></div>
              <div><p className="font-urbanist text-[11px] font-semibold text-[#7b858d]">Stories</p><p className="font-urbanist text-[18px] font-bold text-[#202936]">{scope === 'News' ? '47' : selectedProfile.articles}</p></div>
            </div>
          </div>
        </aside>

        <div className="relative min-w-0 overflow-hidden rounded-[8px] bg-[#f9fcff]/80 px-2 py-2">
          <svg viewBox={`0 0 ${w} ${h}`} className="h-[270px] w-full" preserveAspectRatio="none" role="img" aria-label={`${entityName} views growth chart`}>
            <defs>
              <linearGradient id="overview-trend-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {ticks.map((tick) => {
              const y = padT + (1 - tick / max) * chartH
              return (
                <g key={tick}>
                  <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#b8c8d5" strokeDasharray="5 5" strokeOpacity="0.65" />
                  <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6b747c" fontFamily="Urbanist, sans-serif">{tick === 0 ? '0' : formatViews(tick)}</text>
                </g>
              )
            })}
            <path d={area} fill="url(#overview-trend-fill)" />
            <polyline points={line} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((point, index) => (
              <g key={labels[index]}>
                <circle cx={point.x} cy={point.y} r="5" fill={stroke} stroke="#ffffff" strokeWidth="2" />
                <text x={point.x} y={h - 14} textAnchor="middle" fontSize="11" fill="#6b747c" fontFamily="Urbanist, sans-serif">{labels[index]}</text>
              </g>
            ))}
          </svg>
          <div className="absolute right-5 top-4 rounded-[8px] border border-[#dce8f1] bg-white/90 px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.08em] text-[#7b858d]">Current signal</p>
            <p className="mt-1 font-urbanist text-[18px] font-bold text-[#202936]">{formatViews(points[points.length - 1])}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-[#dce8f1] pt-4">
        {scope === 'News' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-urbanist text-[12px] font-bold uppercase tracking-[0.1em] text-[#7b858d]">Category growth signals</p><p className="font-urbanist text-[12px] font-semibold text-[#6b747c]">News combines all desks · category views use each desk&apos;s own goal</p></div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">{topCategories.map(([name, item]) => <div key={name} className="flex items-center justify-between rounded-[7px] bg-white/70 px-3 py-2"><span className="flex items-center gap-2 font-urbanist text-[13px] font-semibold text-[#202936]"><span className="size-2 rounded-full" style={{ background: item.color }} />{name}</span><span className={item.residual >= 0 ? 'font-urbanist text-[12px] font-bold text-[#0787ff]' : 'font-urbanist text-[12px] font-bold text-[#c2410c]'}>{item.residual > 0 ? '+' : ''}{item.residual}%</span></div>)}</div>
          </>
        )}
        {scope === 'Category' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-urbanist text-[12px] font-bold uppercase tracking-[0.1em] text-[#7b858d]">Author growth in {category}</p><p className="font-urbanist text-[12px] font-semibold text-[#6b747c]">Top contributors by category residual</p></div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">{categoryProfile.topAuthors.map((item) => <div key={item.name} className="flex items-center justify-between rounded-[7px] bg-white/70 px-3 py-2"><span className="font-urbanist text-[13px] font-semibold text-[#202936]">{item.name} · {item.articles} stories</span><span className={item.residual >= 0 ? 'font-urbanist text-[12px] font-bold text-[#0787ff]' : 'font-urbanist text-[12px] font-bold text-[#c2410c]'}>{item.residual > 0 ? '+' : ''}{item.residual}%</span></div>)}</div>
          </>
        )}
        {scope === 'Author' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-urbanist text-[12px] font-bold uppercase tracking-[0.1em] text-[#7b858d]">Author focus · {author}</p><p className="font-urbanist text-[12px] font-semibold text-[#6b747c]">{authorProfile.desk} · CTR {authorProfile.ctr}%</p></div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">{authorProfile.strengths.slice(0, 3).map((strength) => <div key={strength} className="rounded-[7px] bg-white/70 px-3 py-2 font-urbanist text-[13px] font-semibold text-[#202936]">{strength}</div>)}</div>
            <p className="mt-3 font-urbanist text-[12px] font-semibold text-[#6b747c]">Next coaching prompt: {authorProfile.coaching[0]}</p>
          </>
        )}
      </div>
    </section>
  )
}

function ContentPanel({ range, globalSearch }: { range: Range; globalSearch: string }) {
  const [formatFilter, setFormatFilter] = useState<ContentFormat | 'All'>('All')
  const [sortKey, setSortKey] = useState<ContentSortKey>('viewsNum')
  const rangeFactor = range === 'Last week' ? 1 : range === '30 days' ? 3.1 : 8.5
  const query = globalSearch.trim().toLowerCase()
  const visibleRows = useMemo(() => {
    const filtered = contentRows.filter((row) => {
      const matchesFormat = formatFilter === 'All' || row.format === formatFilter
      const matchesSearch = !query || [row.title, row.desk, row.author, row.format].some((value) => value.toLowerCase().includes(query))
      return matchesFormat && matchesSearch
    })

    return [...filtered].sort((a, b) => {
      const aValue = sortKey === 'viewsNum' ? a.viewsNum * rangeFactor : a[sortKey]
      const bValue = sortKey === 'viewsNum' ? b.viewsNum * rangeFactor : b[sortKey]
      return Number(bValue) - Number(aValue)
    })
  }, [formatFilter, query, rangeFactor, sortKey])

  return (
    <section className="space-y-4">
      <div className="rounded-[8px] bg-white/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Content performance</p>
            <h2 className="mt-2 font-urbanist text-[24px] font-bold tracking-[-0.02em] text-[#202936]">Which stories are earning attention?</h2>
            <p className="mt-1 max-w-[58ch] font-urbanist text-[13px] font-medium text-[#6b747c]">Compare story reach, completion, and desk-relative residuals for the selected period.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select aria-label="Content format" value={formatFilter} onChange={(event) => setFormatFilter(event.target.value as ContentFormat | 'All')} className="h-9 appearance-none rounded-[9px] border border-[#d2e1ec] bg-white/75 px-3 pr-8 font-urbanist text-[13px] font-semibold text-[#202936] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20">
                <option value="All">All formats</option>
                {(['Explainer', 'Longform', 'News brief', 'Interview', 'Data'] as ContentFormat[]).map((format) => <option key={format} value={format}>{format}</option>)}
              </select>
              <ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#202936]" />
            </div>
            <div className="relative">
              <select aria-label="Content sort" value={sortKey} onChange={(event) => setSortKey(event.target.value as ContentSortKey)} className="h-9 appearance-none rounded-[9px] border border-[#d2e1ec] bg-white/75 px-3 pr-8 font-urbanist text-[13px] font-semibold text-[#202936] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20">
                <option value="viewsNum">Sort: views</option>
                <option value="completion">Sort: completion</option>
                <option value="residual">Sort: residual</option>
                <option value="ctr">Sort: CTR</option>
              </select>
              <ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#202936]" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            ['47', 'stories published'],
            ['62%', 'median completion'],
            ['5', 'stories to watch'],
            ['6.4h', 'median decision time'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-[8px] bg-white/70 px-3 py-3">
              <p className="font-urbanist text-[22px] font-bold tabular-nums text-[#202936]">{value}</p>
              <p className="mt-1 font-urbanist text-[11px] font-semibold leading-tight text-[#7b858d]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[8px] bg-white/60">
        <div className="grid grid-cols-[minmax(0,2.1fr)_100px_92px_108px_84px] border-b border-[#dce8f1] bg-white/45 px-5 py-3 font-urbanist text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b747c]">
          <span>Story</span><span>Views</span><span>Completion</span><span>Signal</span><span>CTR</span>
        </div>
        {visibleRows.length === 0 ? (
          <p className="px-5 py-10 text-center font-urbanist text-[14px] font-semibold text-[#6b747c]">No stories match this view.</p>
        ) : visibleRows.map((row) => {
          const adjustedViews = Math.round(row.viewsNum * rangeFactor)
          const needsAttention = row.residual < 0
          return (
            <Link key={row.title} href={`/news/${row.title.toLowerCase().replaceAll(' ', '-').replaceAll('’', '')}`} className="grid grid-cols-[minmax(0,2.1fr)_100px_92px_108px_84px] items-center border-b border-[#e5eef5] px-5 py-3 transition-colors last:border-b-0 hover:bg-white/55">
              <div className="min-w-0 pr-4">
                <p className="truncate font-urbanist text-[14px] font-bold text-[#202936]">{row.title}</p>
                <p className="mt-1 font-urbanist text-[11px] font-semibold text-[#7b858d]">{row.desk} · {row.format} · {row.author}</p>
              </div>
              <span className="font-urbanist text-[13px] font-bold tabular-nums text-[#202936]">{formatViews(adjustedViews)}</span>
              <span className="flex items-center gap-2 font-urbanist text-[13px] font-semibold text-[#202936]"><span className="h-1.5 w-[44px] overflow-hidden rounded-full bg-[#d8e6f0]"><span className="block h-full rounded-full bg-[#0787ff]" style={{ width: `${row.completion}%` }} /></span>{row.completion}%</span>
              <span className={needsAttention ? 'font-urbanist text-[12px] font-bold text-[#c2410c]' : 'font-urbanist text-[12px] font-bold text-[#0787ff]'}>{needsAttention ? `${row.residual}% below` : `+${row.residual} residual`}</span>
              <span className="font-urbanist text-[13px] font-semibold text-[#202936]">{row.ctr}%</span>
            </Link>
          )
        })}
      </div>
      <p className="px-1 font-urbanist text-[12px] font-semibold text-[#6b747c]">Residual is measured against each desk&apos;s trailing 90-day expectation. CTR is shown only alongside completion.</p>
    </section>
  )
}

function AudienceBreakdown({ range }: { range: Range }) {
  const [category, setCategory] = useState<CategoryKey>('Business')
  const profile = categoryProfiles[category]

  return (
    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[8px] bg-white/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Discovery mix</p>
            <h3 className="mt-2 font-urbanist text-[19px] font-bold text-[#202936]">Where readers came from</h3>
            <p className="mt-1 font-urbanist text-[12px] font-semibold text-[#7b858d]">{range} · 284.7k total views</p>
          </div>
          <span className="rounded-full bg-[#eff6ff] px-3 py-1 font-urbanist text-[11px] font-bold text-[#003399]">Consent-gated</span>
        </div>
        <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[#dbe8f2]">
          {audienceSources.map((source) => <span key={source.label} style={{ width: `${source.share}%`, background: source.color }} />)}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4">
          {audienceSources.map((source) => (
            <div key={source.label} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ background: source.color }} /><span className="truncate font-urbanist text-[13px] font-semibold text-[#202936]">{source.label}</span></div>
              <div className="text-right"><p className="font-urbanist text-[14px] font-bold text-[#202936]">{source.share}%</p><p className="font-urbanist text-[11px] font-semibold text-[#7b858d]">{source.views}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[8px] bg-white/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Audience by desk</p><h3 className="mt-2 font-urbanist text-[19px] font-bold text-[#202936]">Compare a desk profile</h3></div>
          <div className="relative"><select aria-label="Audience desk" value={category} onChange={(event) => setCategory(event.target.value as CategoryKey)} className="h-9 appearance-none rounded-[9px] border border-[#d2e1ec] bg-white/75 px-3 pr-8 font-urbanist text-[13px] font-semibold text-[#202936] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20">{Object.keys(categoryProfiles).map((name) => <option key={name} value={name}>{name}</option>)}</select><ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" /></div>
        </div>
        <p className="mt-4 font-urbanist text-[14px] font-semibold leading-relaxed text-[#4f5962]">{profile.narrative}</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[[profile.views, 'views'], [`${profile.completion}%`, 'completion'], [`${profile.residual > 0 ? '+' : ''}${profile.residual}`, 'residual']].map(([value, label]) => <div key={label} className="rounded-[8px] bg-white/70 p-3"><p className="font-urbanist text-[18px] font-bold tabular-nums text-[#202936]">{value}</p><p className="mt-1 font-urbanist text-[11px] font-semibold text-[#7b858d]">{label}</p></div>)}
        </div>
        <p className="mt-5 font-urbanist text-[12px] font-bold uppercase tracking-[0.1em] text-[#7b858d]">Top contributors</p>
        <div className="mt-2 space-y-2">{profile.topAuthors.map((author) => <div key={author.name} className="flex items-center justify-between rounded-[7px] bg-white/55 px-3 py-2"><span className="font-urbanist text-[13px] font-semibold text-[#202936]">{author.name} · {author.articles} stories</span><span className={author.residual >= 0 ? 'font-urbanist text-[12px] font-bold text-[#0787ff]' : 'font-urbanist text-[12px] font-bold text-[#c2410c]'}>{author.residual > 0 ? '+' : ''}{author.residual}</span></div>)}</div>
      </div>
      <div className="rounded-[8px] bg-white/60 p-5 lg:col-span-2">
        <div className="flex items-center justify-between"><div><p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Device mix</p><h3 className="mt-2 font-urbanist text-[19px] font-bold text-[#202936]">Mobile carries the week</h3></div><p className="font-urbanist text-[12px] font-semibold text-[#7b858d]">No IP retained · country code only</p></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{audienceDevices.map((device) => <div key={device.label}><div className="flex items-center justify-between"><span className="font-urbanist text-[13px] font-semibold text-[#202936]">{device.label}</span><span className="font-urbanist text-[13px] font-bold text-[#202936]">{device.share}%</span></div><div className="mt-2 h-2 rounded-full bg-[#dbe8f2]"><div className="h-full rounded-full bg-[#0787ff]" style={{ width: `${device.share}%` }} /></div><p className="mt-1 font-urbanist text-[11px] font-semibold text-[#7b858d]">{device.views}</p></div>)}</div>
      </div>
    </section>
  )
}

function EngagementPanel({ range }: { range: Range }) {
  const [metricKey, setMetricKey] = useState<'completion' | 'reading' | 'comments'>('completion')
  const labels = audienceSeries[range].labels
  const metrics = {
    completion: { label: 'Median completion', value: '62%', delta: '+4.6%', values: [56, 59, 58, 63, 61, 66, 62], color: '#0787ff', suffix: '%' },
    reading: { label: 'Average reading time', value: '1m 48s', delta: '+12s', values: [92, 98, 96, 104, 108, 114, 108], color: '#7c3aed', suffix: 's' },
    comments: { label: 'Comments and reactions', value: '657', delta: '+18%', values: [62, 74, 68, 91, 86, 112, 104], color: '#0f7a3a', suffix: '' },
  }[metricKey]
  const max = Math.ceil(Math.max(...metrics.values) / 10) * 10
  const w = 700
  const h = 230
  const padL = 42
  const padR = 20
  const padT = 18
  const padB = 34
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const points = metrics.values.map((value, index) => ({
    x: padL + (index / (metrics.values.length - 1)) * chartW,
    y: padT + (1 - value / max) * chartH,
  }))
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `M ${padL},${padT + chartH} L ${line} L ${w - padR},${padT + chartH} Z`

  return (
    <section className="space-y-4">
      <div className="rounded-[8px] bg-white/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Engagement</p>
            <h2 className="mt-2 font-urbanist text-[22px] font-bold text-[#202936]">How readers interacted</h2>
            <p className="mt-1 font-urbanist text-[13px] font-semibold text-[#6b747c]">One signal at a time · {range.toLowerCase()}</p>
          </div>
          <div className="relative h-9">
            <select aria-label="Engagement metric" value={metricKey} onChange={(event) => setMetricKey(event.target.value as typeof metricKey)} className="h-full appearance-none rounded-[9px] border border-[#d2e1ec] bg-white/75 px-3 pr-8 font-urbanist text-[13px] font-semibold text-[#202936] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20">
              <option value="completion">Completion</option>
              <option value="reading">Reading time</option>
              <option value="comments">Comments</option>
            </select>
            <ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#202936]" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ['62%', 'median completion'],
            ['1m 48s', 'average reading time'],
            ['657', 'comments and reactions'],
          ].map(([value, label]) => <div key={label} className="rounded-[8px] bg-white/70 px-3 py-3"><p className="font-urbanist text-[21px] font-bold tabular-nums text-[#202936]">{value}</p><p className="mt-1 font-urbanist text-[11px] font-semibold text-[#7b858d]">{label}</p></div>)}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="overflow-hidden rounded-[8px] bg-[#f9fcff]/80 px-2 py-2">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-[230px] w-full" preserveAspectRatio="none" role="img" aria-label={`${metrics.label} trend chart`}>
              {[0, 0.5, 1].map((step) => {
                const y = padT + (1 - step) * chartH
                return <line key={step} x1={padL} x2={w - padR} y1={y} y2={y} stroke="#b8c8d5" strokeDasharray="5 5" strokeOpacity="0.65" />
              })}
              <path d={area} fill={metrics.color} fillOpacity="0.1" />
              <polyline points={line} fill="none" stroke={metrics.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((point, index) => <g key={labels[index]}><circle cx={point.x} cy={point.y} r="4.5" fill={metrics.color} stroke="#fff" strokeWidth="2" /><text x={point.x} y={h - 12} textAnchor="middle" fontSize="11" fill="#6b747c" fontFamily="Urbanist, sans-serif">{labels[index]}</text></g>)}
            </svg>
          </div>
          <div className="rounded-[8px] bg-[#f4faff] p-4">
            <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.1em] text-[#0787ff]">Selected signal</p>
            <p className="mt-3 font-urbanist text-[26px] font-bold text-[#202936]">{metrics.value}</p>
            <p className="mt-1 font-urbanist text-[12px] font-semibold text-[#7b858d]">{metrics.label}</p>
            <p className="mt-4 font-urbanist text-[13px] font-bold text-[#219150]">{metrics.delta} vs prev period</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/performance/heatmap/delhi-ev" className="rounded-[8px] bg-[#fff7ed] p-4">
          <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.1em] text-[#c2410c]">Attention point</p>
          <p className="mt-2 font-urbanist text-[16px] font-bold text-[#202936]">Readers leave at the second embed</p>
          <p className="mt-1 font-urbanist text-[13px] font-semibold text-[#6b3b19]">Delhi EV · 41% drop-off</p>
        </Link>
        <Link href="/news/comments" className="rounded-[8px] bg-[#eff6ff] p-4">
          <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.1em] text-[#003399]">Conversation lift</p>
          <p className="mt-2 font-urbanist text-[16px] font-bold text-[#202936]">Rupee explainer is driving discussion</p>
          <p className="mt-1 font-urbanist text-[13px] font-semibold text-[#003399]">184 comments · +82 in 6h</p>
        </Link>
      </div>
    </section>
  )
}

function Sparkline({ data, invert = false }: { data: number[]; invert?: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((value, index) => {
    const x = 4 + (index / (data.length - 1)) * 82
    const y = 28 - ((value - min) / range) * 22
    return `${x},${invert ? 34 - y : y}`
  }).join(' ')
  return (
    <svg viewBox="0 0 90 34" className="h-[34px] w-[90px]" aria-hidden>
      <polyline points={pts} fill="none" stroke="#0787ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProductionStrip({ compareMode }: { compareMode: CompareMode }) {
  return (
    <section>
      <p className="mb-3 font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">
        Production · what the newsroom made
      </p>
      <div className="grid grid-cols-4 gap-3">
        {productionMetrics.map((metric) => (
          <div key={metric.label} className="rounded-[8px] bg-white/60 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-urbanist text-[30px] font-bold leading-none tracking-[-0.03em] text-[#202936]">{metric.value}</p>
                <p className="mt-2 min-h-[36px] font-urbanist text-[13px] font-semibold leading-tight text-[#5f6972]">{metric.label}</p>
              </div>
              <Sparkline data={metric.spark} invert={metric.invert} />
            </div>
            <p className="mt-2 font-urbanist text-[13px] font-bold text-[#219150]">
              {compareMode === 'prev period' ? metric.delta : metric.altDelta}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function WedgeAndAnomalies() {
  const blocks = [100, 92, 88, 84, 63, 55, 48, 44, 40, 38]

  return (
    <section className="grid grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)] gap-3">
      <div className="rounded-[8px] bg-white/60 p-5">
        <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">The Wedge · structural drop-off</p>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_190px] gap-4">
          <div>
            <h3 className="max-w-[44ch] font-urbanist text-[20px] font-bold leading-snug text-[#202936]">
              41% of readers leave at the second embed on Delhi EV policy
            </h3>
            <div className="mt-5 flex h-[86px] items-end gap-2">
              {blocks.map((value, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-1">
                  {index === 4 && <span className="font-urbanist text-[11px] font-bold text-[#c2410c]">63%</span>}
                  <div
                    className="w-full rounded-t-[5px]"
                    style={{
                      height: `${value * 0.68}px`,
                      background: index === 4 ? '#fdba74' : '#0787ff',
                      opacity: index === 4 ? 1 : 0.28 + value / 160,
                    }}
                  />
                </div>
              ))}
            </div>
            <Link href="/performance/heatmap/delhi-ev" className="mt-4 inline-flex font-urbanist text-[13px] font-bold text-[#0787ff]">
              Open reading heatmap →
            </Link>
          </div>
          <div className="grid content-center gap-3 border-l border-[#dce8f1] pl-4">
            {[
              ['Block 1', 'lede', '100%'],
              ['Block 5', 'second embed', '63%'],
              ['Block 10', 'conclusion', '38%'],
            ].map(([block, label, value]) => (
              <div key={block}>
                <p className="font-urbanist text-[12px] font-bold text-[#202936]">{block} <span className="font-medium text-[#6b747c]">{label}</span></p>
                <p className="font-urbanist text-[20px] font-bold text-[#202936]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <Link href="/news/delhi-ev-policy" className="rounded-[8px] bg-[#fff7ed] p-4">
          <span className="rounded-full bg-white px-2 py-1 font-urbanist text-[10px] font-bold uppercase tracking-[0.1em] text-[#c2410c]">Below expectation</span>
          <h3 className="mt-3 font-urbanist text-[15px] font-bold text-[#202936]">Delhi EV</h3>
          <p className="mt-1 font-urbanist text-[13px] font-semibold text-[#6b3b19]">-31% vs Policy median</p>
        </Link>
        <Link href="/news?topic=crypto-bill" className="rounded-[8px] bg-[#f4f3ff] p-4">
          <span className="rounded-full bg-white px-2 py-1 font-urbanist text-[10px] font-bold uppercase tracking-[0.1em] text-[#6d28d9]">Topic gap</span>
          <h3 className="mt-3 font-urbanist text-[15px] font-bold text-[#202936]">Crypto bill</h3>
          <p className="mt-1 font-urbanist text-[13px] font-semibold text-[#5b21b6]">No coverage 31d</p>
        </Link>
      </div>
    </section>
  )
}

function DesksTable({
  globalSearch,
  deskSort,
  setDeskSort,
}: {
  globalSearch: string
  deskSort: { key: DeskSortKey; dir: 'asc' | 'desc' }
  setDeskSort: (sort: { key: DeskSortKey; dir: 'asc' | 'desc' }) => void
}) {
  const sortedDesks = useMemo(() => {
    const query = globalSearch.trim().toLowerCase()
    const filtered = query
      ? desks.filter((desk) => desk.name.toLowerCase().includes(query))
      : desks
    return [...filtered].sort((a, b) => {
      const av = a[deskSort.key]
      const bv = b[deskSort.key]
      const result = typeof av === 'string' && typeof bv === 'string'
        ? av.localeCompare(bv)
        : Number(av) - Number(bv)
      return deskSort.dir === 'asc' ? result : -result
    })
  }, [deskSort, globalSearch])

  function toggleSort(key: DeskSortKey) {
    setDeskSort({
      key,
      dir: deskSort.key === key && deskSort.dir === 'desc' ? 'asc' : 'desc',
    })
  }

  const headers: { label: string; key: DeskSortKey }[] = [
    { label: 'Desk', key: 'name' },
    { label: 'Articles', key: 'articles' },
    { label: 'Views', key: 'viewsNum' },
    { label: 'Completion', key: 'completion' },
    { label: 'Residual', key: 'residual' },
    { label: 'Cycle time', key: 'cycleHours' },
  ]

  return (
    <section className="overflow-hidden rounded-[8px] bg-white/60">
      <div className="flex items-start justify-between border-b border-[#dce8f1] px-5 py-4">
        <div>
          <h3 className="font-urbanist text-[18px] font-bold text-[#202936]">Desks</h3>
          <p className="mt-1 font-urbanist text-[13px] font-medium text-[#6b747c]">Residual is percentile vs the desk&apos;s own trailing 90-day expectation.</p>
        </div>
      </div>
      <div className="grid grid-cols-[1.4fr_80px_90px_130px_150px_90px] border-b border-[#dce8f1] bg-white/45 px-5 py-2 font-urbanist text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b747c]">
        {headers.map((header) => (
          <button key={header.key} onClick={() => toggleSort(header.key)} className="text-left hover:text-[#003399]">
            {header.label}{deskSort.key === header.key ? (deskSort.dir === 'desc' ? ' ↓' : ' ↑') : ''}
          </button>
        ))}
      </div>
      {sortedDesks.map((desk) => {
        const positive = desk.residual >= 0
        const width = Math.min(50, Math.abs(desk.residual) / 2)
        return (
          <Link
            key={desk.name}
            href={`/performance/desks/${desk.name.toLowerCase()}`}
            className="grid grid-cols-[1.4fr_80px_90px_130px_150px_90px] items-center border-b border-[#e5eef5] px-5 py-3 font-urbanist text-[13px] font-semibold text-[#202936] last:border-b-0 hover:bg-white/55"
          >
            <span>{desk.name}</span>
            <span>{desk.articles}</span>
            <span>{desk.views}</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-[64px] overflow-hidden rounded-full bg-[#d8e6f0]">
                <span className="block h-full rounded-full bg-[#0787ff]" style={{ width: `${desk.completion}%` }} />
              </span>
              {desk.completion}%
            </span>
            <span className="flex items-center gap-2">
              <span className="relative h-2 w-[90px] rounded-full bg-[#d8e6f0]">
                <span className="absolute left-1/2 top-[-3px] h-4 w-px bg-[#b7c6d2]" />
                <span
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    width: `${width}%`,
                    left: positive ? '50%' : `${50 - width}%`,
                    background: positive ? '#0787ff' : '#fdba74',
                  }}
                />
              </span>
              <span className={positive ? 'text-[#0787ff]' : 'text-[#c2410c]'}>{positive ? `+${desk.residual}` : desk.residual}</span>
            </span>
            <span>{desk.cycle}</span>
          </Link>
        )
      })}
    </section>
  )
}

function ReporterPanel() {
  return (
    <section className="rounded-[8px] bg-white/60 p-5">
      <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Reporters · coaching view</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          ['Riya Kapoor', 'Coach mobile embed structure', '2 stories need attention'],
          ['Sagar Mehta', 'Reinforce Business angle', '+42 residual lift'],
          ['Dev Pillai', 'Promote Science explainer', '+38 residual lift'],
        ].map(([name, action, note]) => (
          <Link key={name} href={`/performance/reporters/${name.toLowerCase().replaceAll(' ', '-')}`} className="rounded-[8px] bg-white/70 p-4">
            <p className="font-urbanist text-[17px] font-bold text-[#202936]">{name}</p>
            <p className="mt-2 font-urbanist text-[13px] font-semibold text-[#5e6870]">{action}</p>
            <p className="mt-3 font-urbanist text-[12px] font-bold text-[#0787ff]">{note}</p>
          </Link>
        ))}
      </div>
      <p className="mt-4 rounded-[8px] bg-[#f4faff] px-4 py-3 font-urbanist text-[13px] font-semibold text-[#6b747c]">
        No raw reporter leaderboard. This view shows coaching prompts and within-desk residual context only.
      </p>
    </section>
  )
}

function ReportBody({
  compareMode,
  range,
  activeTab,
  advancedMode,
  activePrompt,
  berryOpen,
  selectedDecision,
  setSelectedDecision,
  filters,
  setAudienceFilter,
  globalSearch,
  deskSort,
  setDeskSort,
}: {
  compareMode: CompareMode
  range: Range
  activeTab: Tab
  advancedMode: boolean
  activePrompt: string
  berryOpen: boolean
  selectedDecision: string
  setSelectedDecision: (decision: string) => void
  filters: Record<AudienceFilterKey, string>
  setAudienceFilter: (key: AudienceFilterKey, value: string) => void
  globalSearch: string
  deskSort: { key: DeskSortKey; dir: 'asc' | 'desc' }
  setDeskSort: (sort: { key: DeskSortKey; dir: 'asc' | 'desc' }) => void
}) {
  if (activeTab === 'Content') {
    return (
      <div className="space-y-4 p-[19px]">
        <ContentPanel range={range} globalSearch={globalSearch} />
      </div>
    )
  }

  if (activeTab === 'Reach') {
    return (
      <div className="space-y-4 p-[19px]">
        <AudienceHero compareMode={compareMode} range={range} filters={filters} setAudienceFilter={setAudienceFilter} />
        <AudienceBreakdown range={range} />
      </div>
    )
  }

  if (activeTab === 'Engagement') {
    return (
      <div className="space-y-4 p-[19px]">
        <EngagementPanel range={range} />
      </div>
    )
  }

  if (activeTab === 'Audience') {
    return (
      <div className="space-y-4 p-[19px]">
        <AudienceBreakdown range={range} />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-[19px]">
      <Digest activePrompt={activePrompt} berryOpen={berryOpen} selectedDecision={selectedDecision} setSelectedDecision={setSelectedDecision} />
      <OverviewTrend compareMode={compareMode} range={range} />
      <ProductionStrip compareMode={compareMode} />
      {advancedMode && (
        <>
          <WedgeAndAnomalies />
          <DesksTable globalSearch={globalSearch} deskSort={deskSort} setDeskSort={setDeskSort} />
          <div className="flex items-center justify-between rounded-[8px] bg-white/45 px-4 py-2 font-urbanist text-[12px] font-semibold text-[#6b747c]">
            <span>No raw reporter leaderboard · residuals are within-desk · CTR never shown without completion</span>
            <Link href="/performance/about" className="text-[#0787ff]">About these numbers →</Link>
          </div>
        </>
      )}
    </div>
  )
}

function WorkspaceCard({
  compareMode,
  range,
  setRange,
  activeTab,
  advancedMode,
  setActiveTab,
  activePrompt,
  setActivePrompt,
  berryOpen,
  setBerryOpen,
  selectedDecision,
  setSelectedDecision,
  filters,
  setAudienceFilter,
  globalSearch,
  deskSort,
  setDeskSort,
}: {
  compareMode: CompareMode
  range: Range
  setRange: (range: Range) => void
  activeTab: Tab
  advancedMode: boolean
  setActiveTab: (tab: Tab) => void
  activePrompt: string
  setActivePrompt: (prompt: string) => void
  berryOpen: boolean
  setBerryOpen: (open: boolean) => void
  selectedDecision: string
  setSelectedDecision: (decision: string) => void
  filters: Record<AudienceFilterKey, string>
  setAudienceFilter: (key: AudienceFilterKey, value: string) => void
  globalSearch: string
  deskSort: { key: DeskSortKey; dir: 'asc' | 'desc' }
  setDeskSort: (sort: { key: DeskSortKey; dir: 'asc' | 'desc' }) => void
}) {
  return (
    <section className="overflow-hidden rounded-[8px] border border-white bg-white/70">
      <PromptBar activePrompt={activePrompt} setActivePrompt={setActivePrompt} berryOpen={berryOpen} setBerryOpen={setBerryOpen} />

      <div className="mt-9 flex items-end justify-between border-b border-[#d9e5ef] px-[19px]">
        <nav className="relative h-[50px] w-[620px]">
          {TABS.map((tab, index) => (
            <button
              key={`${tab}-${index}`}
              onClick={() => setActiveTab(tab)}
              className={[
                'absolute bottom-0 h-full pb-[21px] text-left font-urbanist text-[19px] font-semibold',
                activeTab === tab ? 'text-[#1f2933]' : 'text-[#858a90]',
              ].join(' ')}
              style={{ left: [18, 136, 254, 372, 490][index] }}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-[-2px] left-[-18px] h-[4px] w-[112px] bg-[#003399]" />}
            </button>
          ))}
        </nav>

        <div className="relative mb-[12px] h-[44px] w-[144px]">
          <select
            aria-label="Report range"
            value={range}
            onChange={(event) => setRange(event.target.value as Range)}
            className="h-full w-full appearance-none rounded-[9px] border border-[#cbd9e5] bg-[#f4faff] px-4 pr-10 font-urbanist text-[17px] font-semibold text-[#202936] outline-none transition focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20"
          >
            {RANGES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            size={18}
            strokeWidth={2.2}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#202936]"
          />
        </div>
      </div>

      <ReportBody
        compareMode={compareMode}
        range={range}
        activeTab={activeTab}
        advancedMode={advancedMode}
        activePrompt={activePrompt}
        berryOpen={berryOpen}
        selectedDecision={selectedDecision}
        setSelectedDecision={setSelectedDecision}
        filters={filters}
        setAudienceFilter={setAudienceFilter}
        globalSearch={globalSearch}
        deskSort={deskSort}
        setDeskSort={setDeskSort}
      />
    </section>
  )
}

function ReachGauge({ compareMode, range, activeTab }: { compareMode: CompareMode; range: Range; activeTab: Tab }) {
  const series = audienceSeries[range]
  const target = range === 'Last week' ? 400000 : range === '30 days' ? 1400000 : 4200000
  const periodPercent = Math.min(99, Math.round((series.rawViews / target) * 100))
  const periodDelta = compareMode === 'prev period' ? series.deltaPrev : series.deltaNorm
  const targetLabel = target >= 1000000 ? `${(target / 1000000).toFixed(1)}m` : `${Math.round(target / 1000)}k`
  const remaining = Math.max(target - series.rawViews, 0)
  const summary = {
    Overview: {
      eyebrow: 'Reach progress', primary: `${periodPercent}%`, label: `of ${targetLabel} period goal`, delta: periodDelta, deltaLabel: `vs ${compareMode}`, progress: periodPercent,
      centerValue: series.rawViews.toLocaleString(), centerLabel: 'views this period', foot: remaining > 0 ? `${remaining.toLocaleString()} views to goal` : 'Goal reached',
      stats: [['Unique viewers', '118.3k'], ['Avg. depth', '62%'], ['Returning viewers', '32%']],
    },
    Content: {
      eyebrow: 'Content output', primary: '47', label: 'stories published', delta: compareMode === 'prev period' ? '+6' : '+9%', deltaLabel: compareMode === 'prev period' ? 'vs prev period' : 'vs 90-day norm', progress: 78,
      centerValue: '47', centerLabel: 'published this period', foot: '13 stories left in the monthly plan',
      stats: [['Median completion', '62%'], ['Approvals', '89%'], ['Stories to watch', '5']],
    },
    Reach: {
      eyebrow: 'Reach', primary: series.views, label: 'views this period', delta: periodDelta, deltaLabel: `vs ${compareMode}`, progress: periodPercent,
      centerValue: '38.4%', centerLabel: 'search share', foot: 'Direct and social make up 47.8%',
      stats: [['Unique viewers', '118.3k'], ['Search', '38.4%'], ['Direct', '26.7%']],
    },
    Engagement: {
      eyebrow: 'Engagement', primary: '62%', label: 'median completion', delta: '+4.6%', deltaLabel: 'vs prev period', progress: 62,
      centerValue: '1m 48s', centerLabel: 'average reading time', foot: '657 comments and reactions',
      stats: [['Completion', '62%'], ['Reading time', '1m 48s'], ['Comments', '657']],
    },
    Audience: {
      eyebrow: 'Audience signal', primary: '62%', label: 'median completion', delta: '+4.6%', deltaLabel: 'vs previous period', progress: 62,
      centerValue: '1m 48s', centerLabel: 'engaged time', foot: '71% of views are on mobile',
      stats: [['Total views', series.views], ['Search share', '38.4%'], ['Returning', '32%']],
    },
  }[activeTab]

  return (
    <section className="h-[356px] rounded-[8px] border border-white bg-white/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">{summary.eyebrow}</p>
          <p className="mt-2 font-urbanist text-[12px] font-semibold text-[#7b858d]">{activeTab} · {range}</p>
        </div>
        <div className="text-right">
          <p className="font-urbanist text-[24px] font-bold tabular-nums text-[#0787ff]">{summary.delta}</p>
          <p className="font-urbanist text-[12px] font-semibold text-[#8a949c]">{summary.deltaLabel}</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-urbanist text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#202936]">{summary.primary}</p>
          <p className="mt-2 font-urbanist text-[13px] font-semibold text-[#6b747c]">{summary.label}</p>
        </div>
        <div className="h-2 w-[112px] overflow-hidden rounded-full bg-[#dbe8f2]"><div className="h-full rounded-full bg-[#0787ff]" style={{ width: `${summary.progress}%` }} /></div>
      </div>
      <div className="relative mt-1 h-[120px]">
        <svg viewBox="0 0 220 140" className="h-full w-full" role="img" aria-label={`${summary.progress}% progress for ${summary.eyebrow}`}>
          <path d="M 30 116 A 82 82 0 1 1 190 116" fill="none" stroke="#dbe8f2" strokeWidth="18" strokeLinecap="round" />
          <path d="M 30 116 A 82 82 0 1 1 190 116" fill="none" stroke="#0787ff" strokeWidth="18" strokeLinecap="round" pathLength="100" strokeDasharray={`${summary.progress} 100`} />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <p className="font-urbanist text-[18px] font-bold tabular-nums text-[#202936]">{summary.centerValue}</p>
          <p className="font-urbanist text-[11px] font-semibold text-[#7b858d]">{summary.centerLabel}</p>
        </div>
      </div>
      <p className="flex items-center justify-between font-urbanist text-[12px] font-semibold text-[#7b858d]"><span className="flex items-center gap-1"><Info size={14} /> {summary.foot}</span><span>Updated 4 mins ago</span></p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {summary.stats.map(([label, value]) => <div key={label} className="min-w-0 rounded-[8px] bg-white/60 p-3"><p className="font-urbanist text-[11px] font-bold leading-tight text-[#7b858d]">{label}</p><p className="mt-1 font-urbanist text-[20px] font-bold tabular-nums text-[#202936]">{value}</p></div>)}
      </div>
    </section>
  )
}

function TrendingCard() {
  const thisWeek = [320, 610, 1280, 1790, 2540, 3901, 4212, 3980]
  const lastWeek = [240, 520, 980, 1340, 1800, 2540, 2780, 2900]
  const max = 5000
  const w = 350
  const h = 150
  const padL = 34
  const padB = 22
  const chartW = w - padL - 8
  const chartH = h - 16 - padB
  const makeLine = (values: number[]) => values.map((value, index) => {
    const x = padL + (index / (values.length - 1)) * chartW
    const y = 12 + (1 - value / max) * chartH
    return `${x},${y}`
  }).join(' ')

  return (
    <section className="h-[356px] rounded-[8px] border border-white bg-white/70 p-5">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#0787ff] opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-[#0787ff]" />
        </span>
        <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Trending now · updated 2m ago</p>
      </div>
      <h3 className="mt-3 font-urbanist text-[16px] font-bold leading-snug text-[#202936]">Why the rupee held steady despite oil price volatility</h3>
      <p className="mt-1 font-urbanist text-[12px] font-semibold text-[#6b747c]">Business · Sagar Mehta · 18h old</p>
      <div className="relative mt-3 rounded-[8px] bg-white/55 p-2">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[150px] w-full" preserveAspectRatio="none" aria-hidden>
          {[0, 500, 2000, 3000, 4000, 5000].map((tick) => {
            const y = 12 + (1 - tick / max) * chartH
            return (
              <g key={tick}>
                <line x1={padL} x2={w - 8} y1={y} y2={y} stroke="#dbe8f2" strokeDasharray="3 4" />
                <text x={padL - 7} y={y + 3} textAnchor="end" fontSize="9" fill="#7b858d" fontFamily="Urbanist, sans-serif">{tick >= 1000 ? `${tick / 1000}K` : tick}</text>
              </g>
            )
          })}
          <polyline points={makeLine(lastWeek)} fill="none" stroke="#d4d4d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={makeLine(thisWeek)} fill="none" stroke="#0787ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1={padL + chartW * 0.72} x2={padL + chartW * 0.72} y1="10" y2={h - padB} stroke="#9db0bf" strokeDasharray="4 4" />
          <rect x={padL + chartW * 0.72 - 16} y={h - 20} width="32" height="16" rx="8" fill="#e8f4fc" />
          <text x={padL + chartW * 0.72} y={h - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="#202936" fontFamily="Urbanist, sans-serif">3pm</text>
        </svg>
        <div className="absolute right-6 top-8 rounded-[9px] bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
          <p className="font-urbanist text-[11px] font-bold text-[#202936]">Today at 3PM</p>
          <p className="font-urbanist text-[12px] font-bold text-[#0787ff]">This week 3,901 views</p>
          <p className="font-urbanist text-[12px] font-semibold text-[#7b858d]">Last week 2,540 views</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[8px] bg-white/60 p-3">
          <p className="font-urbanist text-[11px] font-bold text-[#7b858d]">Views last hour</p>
          <p className="font-urbanist text-[20px] font-bold text-[#202936]">4,212</p>
        </div>
        <div className="rounded-[8px] bg-white/60 p-3">
          <p className="font-urbanist text-[11px] font-bold text-[#7b858d]">Velocity</p>
          <p className="font-urbanist text-[20px] font-bold text-[#0787ff]">3.4×</p>
        </div>
      </div>
    </section>
  )
}

function ToneChip({ tone }: { tone: ToneFilter }) {
  const styles = {
    Debated: 'bg-[#eff6ff] text-[#0787ff]',
    Supportive: 'bg-[#ecfdf5] text-[#047857]',
    Critical: 'bg-[#fff7ed] text-[#c2410c]',
  }
  return <span className={`rounded-full px-2.5 py-1 font-urbanist text-[12px] font-bold ${styles[tone]}`}>{tone}</span>
}

function CommentsPanel({ globalSearch }: { globalSearch: string }) {
  const [activeTones, setActiveTones] = useState<Set<ToneFilter>>(new Set())
  const [commentSearch, setCommentSearch] = useState('')
  const rows = useMemo(() => {
    const query = `${globalSearch} ${commentSearch}`.trim().toLowerCase()
    return discussionRows.filter((row) => {
      const matchesTone = activeTones.size === 0 || activeTones.has(row.tone)
      const matchesQuery = !query || [row.article, row.desk, row.tone].some((value) => value.toLowerCase().includes(query))
      return matchesTone && matchesQuery
    })
  }, [activeTones, commentSearch, globalSearch])

  function toggleTone(tone: ToneFilter) {
    setActiveTones((prev) => {
      const next = new Set(prev)
      if (next.has(tone)) next.delete(tone)
      else next.add(tone)
      return next
    })
  }

  return (
    <section className="mt-2 rounded-[8px] border border-white bg-white/70 px-[19px] py-[19px]">
      <div className="flex items-center gap-2">
        <label className="flex h-[43px] w-[384px] items-center rounded-[9px] border border-[#dbe4ec] bg-white px-4 shadow-[0_1px_1px_rgba(15,23,42,0.02)]">
          <input
            value={commentSearch}
            onChange={(event) => setCommentSearch(event.target.value)}
            placeholder="Search comments..."
            className="w-full bg-transparent font-urbanist text-[17px] font-medium text-[#202936] outline-none placeholder:text-[#a7adb3]"
          />
        </label>
        <button
          onClick={() => setActiveTones(new Set())}
          className={[
            'flex h-[43px] w-[87px] items-center justify-center gap-2 rounded-[9px] border font-urbanist text-[17px] font-semibold',
            activeTones.size === 0
              ? 'border-[#0787ff] bg-[#eff6ff] text-[#003399]'
              : 'border-[#cbd9e5] bg-[#f4faff] text-[#202936]',
          ].join(' ')}
        >
          All
          <ChevronDown size={18} strokeWidth={2.2} />
        </button>
        {(['Debated', 'Supportive', 'Critical'] as ToneFilter[]).map((tone) => (
          <button
            key={tone}
            onClick={() => toggleTone(tone)}
            className={[
              'h-[43px] rounded-[9px] border px-4 font-urbanist text-[15px] font-bold transition-colors',
              activeTones.has(tone)
                ? 'border-[#0787ff] bg-[#eff6ff] text-[#003399]'
                : 'border-[#cbd9e5] bg-[#f4faff] text-[#5e6870]',
            ].join(' ')}
          >
            {tone}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-[8px] bg-white/55">
        <div className="grid grid-cols-[minmax(0,1.7fr)_130px_110px_120px_150px] border-b border-[#dce8f1] px-4 py-3 font-urbanist text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b747c]">
          <span>Article</span>
          <span>Desk</span>
          <span>Comments</span>
          <span>Tone</span>
          <span>Velocity</span>
        </div>
        {rows.map((row) => (
          <Link
            key={row.article}
            href={`/news/${row.article.toLowerCase().replaceAll(' ', '-').replaceAll(':', '')}/discussion`}
            className="grid grid-cols-[minmax(0,1.7fr)_130px_110px_120px_150px] items-center border-b border-[#e5eef5] px-4 py-3 font-urbanist text-[14px] font-semibold text-[#202936] last:border-b-0 hover:bg-white/55"
          >
            <span className="truncate pr-5">{row.article}</span>
            <span>{row.desk}</span>
            <span>{row.comments}</span>
            <span><ToneChip tone={row.tone} /></span>
            <span className="text-[#0787ff]">{row.velocity}</span>
          </Link>
        ))}
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center font-urbanist text-[14px] font-semibold text-[#7b858d]">
            No discussion rows match the current filters.
          </div>
        )}
      </div>
    </section>
  )
}

export default function PerformancePage() {
  const [compareMode, setCompareMode] = useState<CompareMode>('prev period')
  const [range, setRange] = useState<Range>('Last week')
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [activePrompt, setActivePrompt] = useState(QUESTIONS[0])
  const [berryOpen, setBerryOpen] = useState(false)
  const [selectedDecision, setSelectedDecision] = useState('Reinforce Business')
  const [globalSearch, setGlobalSearch] = useState('')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [deskSort, setDeskSort] = useState<{ key: DeskSortKey; dir: 'asc' | 'desc' }>({ key: 'residual', dir: 'desc' })
  const [audienceFilters, setAudienceFilters] = useState<Record<AudienceFilterKey, string>>({
    device: 'Device Type',
    country: 'Country',
    traffic: 'Traffic Source',
    status: 'Status',
  })

  function setAudienceFilter(key: AudienceFilterKey, value: string) {
    setAudienceFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#dff0fb] font-urbanist text-[#202936]" style={{ fontFamily: 'var(--font-urbanist), var(--font-inter), sans-serif' }}>
      <TopBar globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />

      <div className="flex">
        <LeftSidebar />

        <main className="min-w-0 flex-1 bg-[#dff0fb] px-[1px] pb-6 pr-[29px]">
          <div className="flex items-start justify-between pb-[34px] pt-[39px]">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-urbanist text-[40px] font-semibold leading-none tracking-[-0.02em] text-[#202326]">
                  Performance
                </h1>
                <span className="mt-1 rounded-full bg-white/75 px-3 py-1.5 font-urbanist text-[13px] font-bold text-[#003399]">
                  Editor-in-chief · full access
                </span>
              </div>
              <p className="mt-[17px] font-urbanist text-[17px] font-medium text-[#555f66]">
                News growth, category performance, and author signals.
              </p>
            </div>
            <div className="mr-0 mt-[32px] flex items-center gap-2">
              <div className="relative h-11">
                <select
                  aria-label="Compare against"
                  value={compareMode}
                  onChange={(event) => setCompareMode(event.target.value as CompareMode)}
                  className="h-full appearance-none rounded-[9px] border border-[#cbd9e5] bg-[#f4faff] px-4 pr-9 font-urbanist text-[16px] font-semibold text-[#202936] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/20"
                >
                  <option value="prev period">vs prev period</option>
                  <option value="90-day norm">vs 90-day norm</option>
                </select>
                <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={() => setAdvancedMode((value) => !value)}
                className={[
                  'h-11 rounded-[9px] px-6 font-urbanist text-[17px] font-semibold',
                  advancedMode ? 'bg-[#003399] text-white' : 'bg-white/80 text-[#202936]',
                ].join(' ')}
              >
                {advancedMode ? 'Advanced On' : 'Advance Mode'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_404px] items-start gap-2">
            <WorkspaceCard
              compareMode={compareMode}
              range={range}
              setRange={setRange}
              activeTab={activeTab}
              advancedMode={advancedMode}
              setActiveTab={setActiveTab}
              activePrompt={activePrompt}
              setActivePrompt={setActivePrompt}
              berryOpen={berryOpen}
              setBerryOpen={setBerryOpen}
              selectedDecision={selectedDecision}
              setSelectedDecision={setSelectedDecision}
              filters={audienceFilters}
              setAudienceFilter={setAudienceFilter}
              globalSearch={globalSearch}
              deskSort={deskSort}
              setDeskSort={setDeskSort}
            />
            <div className="grid gap-2">
              <ReachGauge compareMode={compareMode} range={range} activeTab={activeTab} />
              <TrendingCard />
              {advancedMode && (
                <section className="rounded-[8px] border border-white bg-white/70 p-5">
                  <p className="font-urbanist text-[11px] font-bold uppercase tracking-[0.16em] text-[#0787ff]">Advanced controls</p>
                  <div className="mt-3 grid gap-2">
                    {[
                      `Tab: ${activeTab}`,
                      `Range: ${range}`,
                      `Compare: ${compareMode}`,
                      `Decision: ${selectedDecision}`,
                    ].map((item) => (
                      <div key={item} className="rounded-[8px] bg-white/60 px-3 py-2 font-urbanist text-[13px] font-semibold text-[#202936]">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {advancedMode && <CommentsPanel globalSearch={globalSearch} />}
        </main>
      </div>
    </div>
  )
}
