'use client'

/**
 * FolderDrawer — Snowberry /media
 *
 * Source of truth: Figma frame 6178:29707 (Article Images drawer).
 *
 * Floating right-side panel:
 *   · 810 px wide on desktop with 16 px inset top / right / bottom
 *   · rounded-2xl white surface with shadow, backdrop dims library behind
 *   · Header 83 px · Filter row 54 px · Table row 74 px · Header row 56 px · Pagination 66 px
 *
 * Layout is a table (not an image grid) — matches Figma exactly.
 */

import { useEffect, useState } from 'react'
import {
  X, Search, ChevronDown, ChevronUp, LayoutGrid, List, Plus,
  MoreVertical, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { getFolder, ARTICLE_IMAGES, type ImageAsset } from './folders'

type Sort = 'recent' | 'used' | 'name'
const SORT_LABELS: Record<Sort, string> = {
  recent: 'Most recent',
  used:   'Most used',
  name:   'Name (A→Z)',
}

export default function FolderDrawer({
  slug,
  open,
  onClose,
}: {
  slug: string | null
  open: boolean
  onClose: () => void
}) {
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [sort, setSort] = useState<Sort>('recent')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const folder = slug ? getFolder(slug) : null
  const items = folder && slug === 'article-images' ? sortItems(ARTICLE_IMAGES, sort) : []

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={[
          'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      {/* Floating panel — 810px wide, 16px inset from top/right/bottom */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={folder?.name ?? 'Folder'}
        className={[
          'fixed z-50 flex flex-col overflow-hidden bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] transition-transform duration-300 ease-out',
          // Mobile: edge-to-edge
          'inset-0 rounded-none',
          // Desktop: floating window, 16px inset
          'md:inset-y-4 md:right-4 md:left-auto md:rounded-2xl md:ring-1 md:ring-slate-200/70',
          // Width
          'md:w-[810px] md:max-w-[calc(100vw-32px)]',
          // Slide-in transform
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {folder && (
          <>
            {/* ── Header (83px) ────────────────────────────────── */}
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[22px] font-semibold tracking-tight text-slate-900">
                  {folder.name}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                  <span className="tabular-nums">{folder.files.toLocaleString()} files</span>
                  <span className="size-1 rounded-full bg-slate-300" />
                  <span className="tabular-nums">{folder.size}</span>
                  <span className="size-1 rounded-full bg-slate-300" />
                  <span>Last upload {folder.updated}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_6px_14px_-4px_rgba(7,135,255,0.55)] hover:bg-brand-600 transition-colors">
                  <Plus size={13} strokeWidth={2.5} />
                  Add to article
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <X size={13} strokeWidth={2.25} />
                  Close
                </button>
              </div>
            </header>

            {/* ── Filter row (54px) ────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-2.5">
              <div className="relative w-full sm:w-[316px]">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search images..."
                  className="h-9 w-full rounded-lg bg-slate-50 pl-10 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-brand-400 transition-all"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <SortMenu sort={sort} setSort={setSort} />
                <ViewToggle view={view} setView={setView} />
              </div>
            </div>

            {/* ── Table (scrollable) ─────────────────────────── */}
            <div className="flex-1 overflow-auto">
              {items.length === 0 ? (
                <EmptyRow folderName={folder.name} />
              ) : (
                <AssetsTable items={items} />
              )}
            </div>

            {/* ── Pagination (66px) ─────────────────────────── */}
            <footer className="flex flex-col items-center gap-3 border-t border-slate-100 px-6 py-3 sm:flex-row sm:justify-between">
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
                  {['1', '2', '3', '4', '…'].map((p, i) => {
                    const active = p === '1'
                    return (
                      <button
                        key={i}
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
            </footer>
          </>
        )}
      </aside>
    </>
  )
}

/* ─── Table ────────────────────────────────────────────────────────── */

const COL_TEMPLATE =
  'grid grid-cols-[minmax(220px,1fr)_100px_100px_140px_100px_44px] items-center gap-3'

function AssetsTable({ items }: { items: ImageAsset[] }) {
  return (
    <div className="min-w-[720px] px-6 py-2">
      {/* Header row */}
      <div className={`${COL_TEMPLATE} border-b border-slate-100 pb-3 pt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400`}>
        <SortHead sortable>Title</SortHead>
        <SortHead sortable>File ID</SortHead>
        <SortHead>Used in</SortHead>
        <SortHead sortable>Uploaded by</SortHead>
        <SortHead>Date</SortHead>
        <span />
      </div>

      {/* Data rows */}
      {items.map((img, i) => (
        <div
          key={img.title}
          className={[
            COL_TEMPLATE,
            'group py-2.5 transition-colors hover:bg-slate-50/60',
            i < items.length - 1 ? 'border-b border-slate-100' : '',
          ].join(' ')}
        >
          {/* Title cell — 46x46 thumb + filename */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-[46px] shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-slate-900">{img.title}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-slate-500 tabular-nums">
                {img.dims} · {img.size}
              </p>
            </div>
          </div>

          {/* File ID */}
          <span className="text-[13px] text-slate-500 tabular-nums">#{2034200 + i}</span>

          {/* Used in */}
          <span className="inline-flex items-center gap-1 text-[13px] text-slate-800 tabular-nums">
            <span className="font-semibold">{img.usedIn}</span>
            <span className="text-[11px] font-normal text-slate-400">stories</span>
          </span>

          {/* Uploaded by — 18x18 avatar + name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-[18px] shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.avatar} alt="" className="size-full object-cover" />
            </div>
            <span className="truncate text-[13px] text-slate-700">{img.uploader}</span>
          </div>

          {/* Date */}
          <span className="text-[13px] text-slate-500 tabular-nums">{img.date}</span>

          {/* Kebab */}
          <button className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <MoreVertical size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}

function SortHead({ children, sortable }: { children: React.ReactNode; sortable?: boolean }) {
  return (
    <button className="inline-flex items-center gap-1 text-left transition-colors hover:text-slate-600">
      {children}
      {sortable && (
        <span className="flex flex-col leading-none">
          <ChevronUp size={9} className="text-slate-300" />
          <ChevronDown size={9} className="-mt-0.5 text-slate-400" />
        </span>
      )}
    </button>
  )
}

/* ─── Sort menu ────────────────────────────────────────────────────── */

function SortMenu({ sort, setSort }: { sort: Sort; setSort: (s: Sort) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
      >
        <span className="text-slate-500">Sort by</span>
        <span className="text-slate-900">{SORT_LABELS[sort]}</span>
        <ChevronDown size={12} strokeWidth={2.25} className="text-slate-500" />
      </button>
      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 top-full z-20 mt-1.5 w-[180px] overflow-hidden rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
            {(['recent', 'used', 'name'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setSort(opt)
                  setOpen(false)
                }}
                className={[
                  'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[12.5px] transition-colors',
                  sort === opt ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                {SORT_LABELS[opt]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── View toggle ──────────────────────────────────────────────────── */

function ViewToggle({
  view,
  setView,
}: {
  view: 'list' | 'grid'
  setView: (v: 'list' | 'grid') => void
}) {
  return (
    <div className="inline-flex h-9 items-center gap-0.5 rounded-lg bg-white p-1 ring-1 ring-slate-200">
      <button
        onClick={() => setView('list')}
        className={[
          'flex size-7 items-center justify-center rounded-md transition-colors',
          view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800',
        ].join(' ')}
      >
        <List size={12} strokeWidth={2.25} />
      </button>
      <button
        onClick={() => setView('grid')}
        className={[
          'flex size-7 items-center justify-center rounded-md transition-colors',
          view === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800',
        ].join(' ')}
      >
        <LayoutGrid size={12} strokeWidth={2.25} />
      </button>
    </div>
  )
}

/* ─── Empty state (fallback) ───────────────────────────────────────── */

function EmptyRow({ folderName }: { folderName: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-[13px] text-slate-500">No files in {folderName} yet.</p>
    </div>
  )
}

/* ─── Utility ──────────────────────────────────────────────────────── */

function sortItems(items: ImageAsset[], sort: Sort): ImageAsset[] {
  const copy = [...items]
  if (sort === 'used') return copy.sort((a, b) => b.usedIn - a.usedIn)
  if (sort === 'name') return copy.sort((a, b) => a.title.localeCompare(b.title))
  return copy
}
