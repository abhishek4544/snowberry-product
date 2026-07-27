'use client'

/**
 * CategoryPerformance — /newsroom/categories/performance
 * Minimal shadcn version.
 */

import { useState } from 'react'
import {
  ArrowUpRight, ArrowDownRight, Flame, Zap, Rocket, Layers,
} from 'lucide-react'

import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

/* ─── Data ────────────────────────────────────────────────────────────── */

type Category = {
  id: string
  name: string
  group: 'In Nav' | 'Sub menu'
  articles: number
  views: number
  shareRate: number
  virality: number
  wow: number
  spark: number[]   // 14-point growth trace
}

const CATS: Category[] = [
  { id: 'politics',  name: 'Politics',  group: 'In Nav',   articles: 218, views: 1_240_000, shareRate: 12.4, virality: 0.82, wow:  12, spark: [42, 44, 40, 48, 52, 61, 58, 66, 72, 74, 80, 88, 96, 104] },
  { id: 'sports',    name: 'Sports',    group: 'In Nav',   articles: 143, views: 1_020_000, shareRate: 18.6, virality: 0.94, wow:  21, spark: [28, 30, 34, 38, 44, 52, 60, 68, 74, 82, 90, 98, 108, 122] },
  { id: 'business',  name: 'Business',  group: 'In Nav',   articles: 176, views:   892_000, shareRate:  9.2, virality: 0.61, wow:   6, spark: [58, 60, 55, 62, 64, 66, 62, 68, 70, 72, 74, 76, 78, 82] },
  { id: 'world',     name: 'World',     group: 'In Nav',   articles: 128, views:   720_000, shareRate:  7.8, virality: 0.55, wow:  -3, spark: [72, 70, 74, 68, 66, 64, 68, 66, 62, 60, 62, 58, 56, 60] },
  { id: 'opinion',   name: 'Opinion',   group: 'In Nav',   articles:  96, views:   512_000, shareRate: 10.4, virality: 0.71, wow:   4, spark: [40, 42, 44, 42, 46, 48, 50, 52, 50, 54, 56, 58, 60, 62] },
  { id: 'tech',      name: 'Tech',      group: 'Sub menu', articles:  61, views:   388_000, shareRate: 13.1, virality: 0.79, wow:   9, spark: [30, 32, 34, 36, 40, 42, 44, 46, 48, 52, 54, 58, 62, 66] },
  { id: 'culture',   name: 'Culture',   group: 'Sub menu', articles:  74, views:   342_000, shareRate: 11.6, virality: 0.68, wow:  18, spark: [22, 24, 26, 30, 34, 40, 46, 52, 58, 64, 70, 76, 82, 90] },
  { id: 'lifestyle', name: 'Lifestyle', group: 'Sub menu', articles:  52, views:   214_000, shareRate:  6.2, virality: 0.44, wow:  -1, spark: [48, 46, 48, 50, 46, 48, 46, 44, 46, 44, 42, 44, 42, 44] },
  { id: 'health',    name: 'Health',    group: 'Sub menu', articles:  43, views:   186_000, shareRate:  8.4, virality: 0.52, wow:   7, spark: [28, 30, 30, 32, 34, 34, 36, 38, 38, 40, 42, 44, 44, 46] },
  { id: 'weather',   name: 'Weather',   group: 'Sub menu', articles:  38, views:   128_000, shareRate:  4.8, virality: 0.38, wow:  -5, spark: [40, 38, 40, 36, 34, 36, 32, 30, 32, 28, 26, 28, 26, 24] },
]

const PERIODS = ['24h', '7 days', '30 days', '90 days'] as const

const TRENDING   = CATS.reduce((a, b) => (a.views    > b.views    ? a : b))
const MOST_VIRAL = CATS.reduce((a, b) => (a.virality > b.virality ? a : b))
const FASTEST    = CATS.reduce((a, b) => (a.wow      > b.wow      ? a : b))

const fmtViews = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
  n >= 1_000     ? `${(n / 1_000).toFixed(0)}K`     : String(n)

/* ─── Component ───────────────────────────────────────────────────────── */

export default function CategoryPerformance() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('7 days')

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-brand-100/60 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 size-[560px] rounded-full bg-teal-100/50 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 size-[440px] rounded-full bg-rose-100/40 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Newsroom · Categories</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Category performance</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            How each section is performing — reach, share velocity, and week-over-week momentum.
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof PERIODS[number])}>
          <TabsList>
            {PERIODS.map((p) => <TabsTrigger key={p} value={p}>{p}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Layers className="size-4" />}
          label="Total categories"
          value={String(CATS.length)}
          sub={`${CATS.filter(c => c.group === 'In Nav').length} in nav · ${CATS.filter(c => c.group === 'Sub menu').length} sub-menu`}
          accent="from-brand-100/70 to-transparent"
        />
        <StatCard
          icon={<Flame className="size-4" />}
          label="Trending"
          value={TRENDING.name}
          sub={`${fmtViews(TRENDING.views)} views`}
          accent="from-rose-100/70 to-transparent"
        />
        <StatCard
          icon={<Zap className="size-4" />}
          label="Most viral"
          value={MOST_VIRAL.name}
          sub={`virality ${MOST_VIRAL.virality.toFixed(2)}`}
          accent="from-emerald-100/70 to-transparent"
        />
        <StatCard
          icon={<Rocket className="size-4" />}
          label="Fastest riser"
          value={FASTEST.name}
          sub={`+${FASTEST.wow}% week over week`}
          accent="from-amber-100/70 to-transparent"
        />
      </div>

      {/* Table */}
      <Card className="mt-6 bg-white/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle>All categories</CardTitle>
          <CardDescription>Sorted by reach · {CATS.length} sections</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm">Export CSV</Button>
          </CardAction>
        </CardHeader>
        <Separator />
        <CardContent className="px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-2.5 font-medium">Section</th>
                <th className="px-4 py-2.5 text-right font-medium">Articles</th>
                <th className="px-4 py-2.5 text-right font-medium">Reach</th>
                <th className="px-4 py-2.5 text-right font-medium">Share/1k</th>
                <th className="px-4 py-2.5 text-right font-medium">Virality</th>
                <th className="px-4 py-2.5 font-medium">Growth · 14d</th>
                <th className="px-6 py-2.5 text-right font-medium">WoW</th>
              </tr>
            </thead>
            <tbody>
              {[...CATS].sort((a, b) => b.views - a.views).map((c) => {
                const up = c.wow >= 0
                return (
                  <tr key={c.id} className="border-t hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.group}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.articles}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{fmtViews(c.views)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{c.shareRate.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.virality.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Sparkline points={c.spark} up={up} />
                    </td>
                    <td className={['px-6 py-3 text-right font-medium tabular-nums', up ? 'text-emerald-600' : 'text-rose-600'].join(' ')}>
                      <span className="inline-flex items-center gap-0.5">
                        {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {up ? '+' : ''}{c.wow}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

/* ─── Sparkline ──────────────────────────────────────────────────────── */

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const W = 120, H = 32, PAD = 3
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
  const last = coords[coords.length - 1]
  const stroke = up ? '#10B981' : '#F43F5E'
  const gradId = `sg-${up ? 'up' : 'dn'}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={stroke} />
    </svg>
  )
}

/* ─── StatCard ───────────────────────────────────────────────────────── */

function StatCard({
  icon, label, value, sub, accent,
}: { icon: React.ReactNode; label: string; value: string; sub: string; accent: string }) {
  return (
    <Card className="relative gap-2 overflow-hidden bg-white/70 py-4 backdrop-blur-md">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`}
      />
      <CardHeader className="relative px-4">
        <CardDescription className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </CardDescription>
        <CardTitle className="mt-1 text-2xl font-semibold tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent className="relative px-4">
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}
