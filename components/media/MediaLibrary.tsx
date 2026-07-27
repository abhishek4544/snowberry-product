'use client'

/**
 * MediaLibrary — Snowberry /media
 *
 * Source of truth: Figma frame 6131:73535 (Snowberry Web-app · Media library).
 * Chrome (top bar + sidebar rail) lives in MediaShell so it is shared with
 * folder-detail routes at /media/[slug].
 */

import { useState } from 'react'
import {
  ArrowUpRight, MoreHorizontal, MoreVertical, ChevronDown,
  ArrowLeft, ArrowRight, Filter, List, LayoutGrid, TrendingUp,
  Image as ImageIcon, Video, BarChart3, Mic, Hash, Film, Music, Folder,
  Flame, Search,
} from 'lucide-react'
import { MediaShell } from './MediaShell'
import { FOLDERS, type MediaFolder } from './folders'
import FolderDrawer from './FolderDrawer'

/* ─── Data ─────────────────────────────────────────────────────────── */

type MediaKind = 'Image' | 'Video' | 'Audio' | 'Document'

type FileRow = {
  title: string
  thumb: string
  size: string
  kind: string
  type: MediaKind
  uploader: string
  avatar: string
  date: string
}

const FILES: FileRow[] = [
  { title: 'PM Oli — press briefing 2025-05-18', thumb: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&q=80&auto=format&fit=crop', size: '4.2 MB', kind: 'JPEG',  type: 'Image',    uploader: 'Sagar Sharma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', date: '18 May 2025' },
  { title: 'Parliament exterior wide shot',      thumb: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=200&q=80&auto=format&fit=crop', size: '3.8 MB', kind: 'JPEG',  type: 'Image',    uploader: 'Mohan Bhatta', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80&auto=format&fit=crop', date: '16 May 2025' },
  { title: 'NRB rate decision B-roll',           thumb: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=200&q=80&auto=format&fit=crop', size: '86 MB',  kind: 'MP4',   type: 'Video',    uploader: 'Liam Johnson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', date: '16 May 2025' },
  { title: 'Podcast: Monsoon Watch — Ep. 14',    thumb: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80&auto=format&fit=crop', size: '42 MB',  kind: 'MP3',   type: 'Audio',    uploader: 'Mason Smith',  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80&auto=format&fit=crop', date: '11 May 2025' },
  { title: 'FX reserves — Q2 chart',             thumb: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&q=80&auto=format&fit=crop', size: '780 KB', kind: 'PNG',   type: 'Image',    uploader: 'Sophia Brown', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&auto=format&fit=crop', date: '12 May 2025' },
  { title: 'Election 2025 — press kit',          thumb: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=200&q=80&auto=format&fit=crop', size: '2.1 MB', kind: 'PDF',   type: 'Document', uploader: 'Sagar Sharma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', date: '05 May 2025' },
  { title: 'Kathmandu street scene — dawn',      thumb: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80&auto=format&fit=crop', size: '5.1 MB', kind: 'JPEG',  type: 'Image',    uploader: 'Olivia Davis', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&q=80&auto=format&fit=crop', date: '08 May 2025' },
]

/* ─── Component ─────────────────────────────────────────────────────── */

export default function MediaLibrary() {
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [openFolder, setOpenFolder] = useState<string | null>(null)

  return (
    <MediaShell>
      <div className="max-w-[1240px]">
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[32px] lg:text-[36px]">
          Media library
        </h1>
        <p className="mt-1.5 max-w-[720px] text-[13.5px] text-slate-500 sm:text-[14px]">
          Organize news articles in one place. Track their progress from creation to publishing.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {FOLDERS.map((f) => (
              <FolderCard
                key={f.slug}
                folder={f}
                onOpen={
                  f.slug === 'article-images'
                    ? () => setOpenFolder(f.slug)
                    : undefined
                }
              />
            ))}
          </div>
          <RecentFilesCard view={view} setView={setView} />
        </div>

        <div className="flex flex-col gap-5">
          <MostReusedAssetsCard />
          <ContentMixCard />
        </div>
      </div>

      <FolderDrawer
        slug={openFolder}
        open={openFolder !== null}
        onClose={() => setOpenFolder(null)}
      />
    </MediaShell>
  )
}

/* ─── Folder card (KPI) — now a Link ─────────────────────────────────── */

const FOLDER_TINT = {
  blue:   { bg: 'bg-brand-50',   fg: 'text-brand-500'  },
  violet: { bg: 'bg-violet-50',  fg: 'text-violet-500' },
  amber:  { bg: 'bg-amber-50',   fg: 'text-amber-500'  },
  teal:   { bg: 'bg-teal-50',    fg: 'text-teal-500'   },
} as const

function FolderCard({ folder, onOpen }: { folder: MediaFolder; onOpen?: () => void }) {
  const tint = FOLDER_TINT[folder.tint]
  const Icon = folder.icon === 'image' ? ImageIcon : folder.icon === 'video' ? Film : folder.icon === 'audio' ? Music : Folder
  const interactive = typeof onOpen === 'function'

  return (
    <button
      onClick={onOpen}
      disabled={!interactive}
      className={[
        'group flex h-[132px] flex-col justify-between rounded-2xl bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 transition-all',
        interactive
          ? 'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] hover:ring-slate-300'
          : 'cursor-not-allowed opacity-60',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <span className={`flex size-10 items-center justify-center rounded-lg ${tint.bg} ${tint.fg}`}>
          <Icon size={19} strokeWidth={2} />
        </span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover:bg-slate-900 group-hover:text-white">
          <ArrowUpRight size={15} strokeWidth={2.25} />
        </span>
      </div>
      <div>
        <p className="truncate text-[14px] font-semibold text-slate-900">{folder.name}</p>
        <p className="mt-1 text-[12px] text-slate-500 tabular-nums">
          {folder.files.toLocaleString()} files · {folder.size}
        </p>
      </div>
    </button>
  )
}

/* ─── Recent Files card ────────────────────────────────────────────────── */

function RecentFilesCard({
  view,
  setView,
}: {
  view: 'list' | 'grid'
  setView: (v: 'list' | 'grid') => void
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-[17px] font-semibold text-slate-900">Recent Files</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 md:w-[240px] md:flex-none">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full rounded-lg bg-slate-50 py-2 pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-brand-400 transition-all"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
            <Filter size={13} strokeWidth={2.25} className="text-slate-500" />
            Filter
          </button>
          <ViewToggle view={view} setView={setView} />
        </div>
      </div>

      <div className="mt-5 -mx-1 overflow-x-auto">
        <div className="min-w-[820px] px-1">
          <div className="grid grid-cols-[minmax(220px,1.7fr)_90px_100px_110px_1.1fr_110px_36px] items-center gap-4 border-b border-slate-100 pb-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <HeaderCell>Title</HeaderCell>
            <HeaderCell>Size</HeaderCell>
            <HeaderCell>Kind</HeaderCell>
            <HeaderCell>Type</HeaderCell>
            <HeaderCell>Uploaded by</HeaderCell>
            <HeaderCell>Date</HeaderCell>
            <span />
          </div>

          {FILES.map((row, i) => (
            <div
              key={row.title}
              className={[
                'grid grid-cols-[minmax(220px,1.7fr)_90px_100px_110px_1.1fr_110px_36px] items-center gap-4 py-3 transition-colors hover:bg-slate-50/60',
                i < FILES.length - 1 ? 'border-b border-slate-100' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.thumb} alt="" className="size-full object-cover" />
                </div>
                <span className="truncate text-[13.5px] font-semibold text-slate-900">{row.title}</span>
              </div>

              <span className="text-[13px] text-slate-500 tabular-nums">{row.size}</span>
              <span className="text-[13px] text-slate-500">{row.kind}</span>

              <TypeChip kind={row.type} />

              <div className="flex items-center gap-2 min-w-0">
                <div className="size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.avatar} alt="" className="size-full object-cover" />
                </div>
                <span className="truncate text-[13px] text-slate-700">{row.uploader}</span>
              </div>

              <span className="text-[13px] text-slate-500 tabular-nums">{row.date}</span>

              <button className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <MoreVertical size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Pagination />
    </section>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1 text-left transition-colors hover:text-slate-600">
      {children}
      <ChevronDown size={11} className="text-slate-400" />
    </button>
  )
}

function TypeChip({ kind }: { kind: MediaKind }) {
  const map = {
    Image:    { icon: <ImageIcon size={11} strokeWidth={2} />, bg: 'bg-brand-50',   fg: 'text-brand-600'  },
    Video:    { icon: <Film      size={11} strokeWidth={2} />, bg: 'bg-violet-50',  fg: 'text-violet-600' },
    Audio:    { icon: <Music     size={11} strokeWidth={2} />, bg: 'bg-amber-50',   fg: 'text-amber-600'  },
    Document: { icon: <Folder    size={11} strokeWidth={2} />, bg: 'bg-slate-100',  fg: 'text-slate-600'  },
  }[kind]
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium ${map.bg} ${map.fg}`}>
      {map.icon}
      {kind}
    </span>
  )
}

function ViewToggle({
  view,
  setView,
}: {
  view: 'list' | 'grid'
  setView: (v: 'list' | 'grid') => void
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
      <button
        onClick={() => setView('list')}
        className={[
          'flex size-8 items-center justify-center rounded-md transition-colors',
          view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800',
        ].join(' ')}
      >
        <List size={13} strokeWidth={2.25} />
      </button>
      <button
        onClick={() => setView('grid')}
        className={[
          'flex size-8 items-center justify-center rounded-md transition-colors',
          view === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800',
        ].join(' ')}
      >
        <LayoutGrid size={13} strokeWidth={2.25} />
      </button>
    </div>
  )
}

function Pagination() {
  return (
    <div className="mt-5 flex flex-col items-center gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
      <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
        10 per page
        <ChevronDown size={12} strokeWidth={2.25} />
      </button>

      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={12} strokeWidth={2.25} />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {['1', '2', '3', '4', '…'].map((p) => {
            const active = p === '1'
            return (
              <button
                key={p}
                className={[
                  'flex size-8 items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors tabular-nums',
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                ].join(' ')}
              >
                {p}
              </button>
            )
          })}
        </div>

        <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
          Next
          <ArrowRight size={12} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}

/* ─── Most Reused Assets ──────────────────────────────────────────────── */

type ReusedAsset = {
  title: string
  category: string
  cover: string
  used: number
  bar: number
  kind: 'Image' | 'Video' | 'Chart'
  delta: string
}

const REUSED: ReusedAsset[] = [
  { title: 'PM Oli — press briefing',  category: 'Politics', cover: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&q=80&auto=format&fit=crop', used: 47, bar: 100, kind: 'Image', delta: '+12' },
  { title: 'Parliament exterior wide', category: 'Politics', cover: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=200&q=80&auto=format&fit=crop', used: 34, bar: 72,  kind: 'Image', delta: '+6'  },
  { title: 'NRB rate decision B-roll', category: 'Business', cover: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=200&q=80&auto=format&fit=crop', used: 22, bar: 47,  kind: 'Video', delta: '+9'  },
  { title: 'FX reserves chart Q2',     category: 'Business', cover: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&q=80&auto=format&fit=crop', used: 18, bar: 38,  kind: 'Chart', delta: '+3'  },
]

const KIND_BAR = {
  Image: 'bg-brand-500',
  Video: 'bg-violet-500',
  Chart: 'bg-teal-500',
} as const

function MostReusedAssetsCard() {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Flame size={16} strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Most Reused Assets</h2>
            <p className="text-[11.5px] text-slate-500">Embedded across most stories · 30d</p>
          </div>
        </div>
        <button className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <ol className="mt-5 flex flex-col gap-3">
        {REUSED.map((a, i) => (
          <li key={a.title} className="flex items-center gap-3 rounded-lg -mx-1 px-1 py-1 transition-colors hover:bg-slate-50">
            <span className="font-display w-4 text-center text-[12px] font-semibold text-slate-400 tabular-nums">
              {i + 1}
            </span>
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.cover} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-900">{a.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${KIND_BAR[a.kind]}`} style={{ width: `${a.bar}%` }} />
                </div>
                <span className="text-[10.5px] font-medium text-slate-400">{a.category}</span>
              </div>
            </div>
            <div className="shrink-0 text-right leading-tight">
              <p className="font-display text-[15px] font-semibold text-slate-900 tabular-nums">
                {a.used}<span className="text-[11px] font-medium text-slate-400">×</span>
              </p>
              <p className="text-[10.5px] font-medium text-emerald-600 tabular-nums">▲ {a.delta}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50/60 p-3 ring-1 ring-brand-100/70">
        <TrendingUp size={14} className="mt-0.5 shrink-0 text-brand-500" />
        <p className="flex-1 text-[12px] leading-snug text-slate-700">
          Politics assets are reused <span className="font-semibold text-slate-900">3.2×</span> more than Sports.
        </p>
      </div>
    </section>
  )
}

/* ─── Content Mix ─────────────────────────────────────────────────────── */

type MixSlice = { label: string; pct: number; count: number; icon: React.ReactNode; color: string }

const MIX: MixSlice[] = [
  { label: 'Photos',        pct: 58, count: 1420, icon: <ImageIcon size={11} strokeWidth={2} />, color: '#FFFFFF' },
  { label: 'Video',         pct: 22, count: 540,  icon: <Video     size={11} strokeWidth={2} />, color: '#BFD5FF' },
  { label: 'Data & Charts', pct: 13, count: 318,  icon: <BarChart3 size={11} strokeWidth={2} />, color: '#7FAAFF' },
  { label: 'Audio',         pct: 7,  count: 172,  icon: <Mic       size={11} strokeWidth={2} />, color: '#4C8CFF' },
]

const TRENDING_TAGS = [
  { tag: 'election2025',   stories: 89 },
  { tag: 'monsoon-floods', stories: 54 },
  { tag: 'nrb-rate',       stories: 31 },
]

function ContentMixCard() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl p-5 text-white sm:p-6"
      style={{
        backgroundImage:
          'linear-gradient(155deg, #4C8CFF 0%, #2D6BF5 55%, #1E52E0 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-40 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)' }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <h2 className="text-[15px] font-semibold">Content Mix</h2>
          <p className="text-[11.5px] text-white/75">Media types used in stories · 30d</p>
        </div>
        <button className="flex size-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="relative mt-5 flex items-center gap-5">
        <MixDonut slices={MIX} />
        <div className="grid flex-1 grid-cols-2 gap-2">
          {MIX.map((s) => <MixRow key={s.label} slice={s} />)}
        </div>
      </div>

      <div className="relative mt-5 rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-sm">
        <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/75">
          <TrendingUp size={11} strokeWidth={2.5} />
          Trending tags this week
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {TRENDING_TAGS.map((t) => (
            <span
              key={t.tag}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 py-1 pl-2 pr-2.5 text-[11.5px] font-medium ring-1 ring-white/20"
            >
              <Hash size={10} strokeWidth={2.5} className="text-white/70" />
              {t.tag}
              <span className="text-white/60">· {t.stories}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function MixDonut({ slices }: { slices: MixSlice[] }) {
  const size = 124
  const stroke = 12
  const r = (size - stroke) / 2 - 2
  const c = 2 * Math.PI * r
  let offset = 0
  const dominant = slices[0]

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} />
        {slices.map((s) => {
          const length = (s.pct / 100) * c
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${c - length}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
          offset += length
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <p className="font-display text-[22px] font-semibold">{dominant.pct}%</p>
        <p className="mt-1 text-[9.5px] uppercase tracking-widest text-white/75">{dominant.label}</p>
      </div>
    </div>
  )
}

function MixRow({ slice }: { slice: MixSlice }) {
  return (
    <div className="rounded-lg bg-white/10 px-2.5 py-2 ring-1 ring-white/15">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold leading-tight">
        <span
          className="flex size-4 items-center justify-center rounded-[4px]"
          style={{ background: 'rgba(255,255,255,0.18)', color: slice.color }}
        >
          {slice.icon}
        </span>
        {slice.pct}%
      </p>
      <p className="mt-0.5 pl-[22px] text-[10.5px] text-white/75">{slice.label}</p>
    </div>
  )
}
