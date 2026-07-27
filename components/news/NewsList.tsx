'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Search, Bell, Settings, Home, Plus, MessageSquare,
  ListChecks, Gauge, Users, Wrench, Newspaper, Layers,
  ChevronDown, ChevronsUpDown, ArrowLeft, ArrowRight, MoreVertical,
  RefreshCw, FilePlus2, Sparkles, Filter, List as ListIcon, LayoutGrid,
  Check, Archive, Trash2, Download, X,
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────────────── */

type Status = 'draft' | 'published' | 'awaiting' | 'scheduled'

type Article = {
  id: number
  title: string
  thumb: string
  category: string | null
  publishedBy: string | null
  status: Status
  author: string
  authorAvatar: string
  views: number | null
}

const AUTHOR_AVATAR =
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&q=80&auto=format&fit=crop&crop=faces'

const THUMB =
  'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=160&q=80&auto=format&fit=crop'

const ARTICLES: Article[] = [
  { id: 1, title: 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर', thumb: THUMB, category: null,     publishedBy: null, status: 'draft', author: 'अर्जुन पौडेल', authorAvatar: AUTHOR_AVATAR, views: null },
  { id: 2, title: 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर', thumb: THUMB, category: 'विचार', publishedBy: null, status: 'draft', author: 'अर्जुन पौडेल', authorAvatar: AUTHOR_AVATAR, views: null },
  { id: 3, title: 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर', thumb: THUMB, category: null,     publishedBy: null, status: 'draft', author: 'अर्जुन पौडेल', authorAvatar: AUTHOR_AVATAR, views: null },
  { id: 4, title: 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर', thumb: THUMB, category: 'विचार', publishedBy: null, status: 'draft', author: 'अर्जुन पौडेल', authorAvatar: AUTHOR_AVATAR, views: null },
  { id: 5, title: 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर', thumb: THUMB, category: null,     publishedBy: null, status: 'draft', author: 'अर्जुन पौडेल', authorAvatar: AUTHOR_AVATAR, views: null },
  { id: 6, title: 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर', thumb: THUMB, category: 'विचार', publishedBy: null, status: 'draft', author: 'अर्जुन पौडेल', authorAvatar: AUTHOR_AVATAR, views: null },
  { id: 7, title: 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर', thumb: THUMB, category: 'विचार', publishedBy: null, status: 'draft', author: 'अर्जुन पौडेल', authorAvatar: AUTHOR_AVATAR, views: null },
  { id: 8, title: 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर', thumb: THUMB, category: 'विचार', publishedBy: null, status: 'draft', author: 'अर्जुन पौडेल', authorAvatar: AUTHOR_AVATAR, views: null },
]

type Tab = { key: Status | 'all'; label: string; count: string }
const TABS: Tab[] = [
  { key: 'all',       label: 'All',               count: '12k' },
  { key: 'published', label: 'Published',         count: '12k' },
  { key: 'draft',     label: 'Drafts',            count: '12' },
  { key: 'awaiting',  label: 'Awaiting approval', count: '32' },
  { key: 'scheduled', label: 'Scheduled',         count: '8'  },
]

type HeaderTab = 'news' | 'category' | 'archived' | 'pages'
const HEADER_TABS: { key: HeaderTab; label: string }[] = [
  { key: 'news',     label: 'News' },
  { key: 'category', label: 'Category' },
  { key: 'archived', label: 'Archived News' },
  { key: 'pages',    label: 'Pages' },
]

/* ─── Page ─────────────────────────────────────────────────────────── */

export default function NewsList() {
  const [headerTab, setHeaderTab] = useState<HeaderTab>('news')
  const [tab, setTab] = useState<Tab['key']>('draft')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ARTICLES.filter((a) => {
      if (tab !== 'all' && a.status !== tab) return false
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) ||
        (a.category?.toLowerCase().includes(q) ?? false) ||
        a.author.toLowerCase().includes(q)
      )
    })
  }, [tab, query])

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someChecked = !allChecked && rows.some((r) => selected.has(r.id))

  function toggleAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) rows.forEach((r) => next.add(r.id))
      else rows.forEach((r) => next.delete(r.id))
      return next
    })
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      className="min-h-screen w-full font-sans text-slate-900"
      style={{ background: 'linear-gradient(180deg, #EEF3FA 0%, #F3F6FB 40%, #F7F9FC 100%)' }}
    >
      <TopBar />
      <div className="flex">
        <SidebarRail />
        <main className="min-w-0 flex-1 px-5 pb-12 pt-2 sm:px-8 lg:px-10 lg:pt-4">
          {/* Page heading + segmented control */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="font-display text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[32px] lg:text-[36px]">
                News
              </h1>
              <p className="mt-1.5 max-w-[560px] text-[13.5px] text-slate-500 sm:text-[14px]">
                Organize news articles in one place. Track their progress from creation to publishing.
              </p>
            </div>
            <div className="inline-flex items-center gap-0.5 rounded-full bg-white/70 p-1 ring-1 ring-slate-200/70 backdrop-blur">
              {HEADER_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setHeaderTab(t.key)}
                  className={[
                    'inline-flex items-center whitespace-nowrap rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors',
                    headerTab === t.key
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70'
                      : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main card */}
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-6">
            {/* Tab strip + top actions */}
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {TABS.map((t) => {
                  const active = tab === t.key
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={[
                        'group relative inline-flex items-center gap-1.5 pb-3 text-[13.5px] transition-colors',
                        active ? 'font-semibold text-slate-900' : 'font-medium text-slate-500 hover:text-slate-800',
                      ].join(' ')}
                    >
                      {t.label}
                      <span className={[
                        'rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums',
                        active ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500',
                      ].join(' ')}>
                        {t.count}
                      </span>
                      {active && (
                        <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-brand-500" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <RefreshCw size={13} strokeWidth={2} /> Purge cache
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                  <FilePlus2 size={13} strokeWidth={2} /> New article
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(7,135,255,0.35)] hover:bg-brand-600 transition-colors">
                  <Sparkles size={13} strokeWidth={2.25} /> Create with Berry AI
                </button>
              </div>
            </div>

            {/* Filter row */}
            <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-[240px]">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search news.."
                    className="w-full rounded-lg bg-white py-2 pl-3 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 focus:ring-brand-400 transition-all"
                  />
                </div>
                <FilterSelect label="Add author" />
                <FilterSelect label="News types" />
                <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter size={13} strokeWidth={2} /> More filter
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex items-center rounded-lg bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                  Export CSV
                </button>
                <div className="inline-flex items-center rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
                  <button
                    onClick={() => setView('list')}
                    aria-label="List view"
                    className={['flex size-8 items-center justify-center rounded-md transition-colors',
                      view === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'].join(' ')}
                  >
                    <ListIcon size={14} strokeWidth={2.25} />
                  </button>
                  <button
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    className={['flex size-8 items-center justify-center rounded-md transition-colors',
                      view === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'].join(' ')}
                  >
                    <LayoutGrid size={13} strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50/70 px-3 py-2 ring-1 ring-brand-100">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-700">
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {selected.size} selected
                </span>
                <span className="mx-1 hidden h-4 w-px bg-brand-200 sm:block" />
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-600 transition-colors">
                  <Sparkles size={12} strokeWidth={2.5} /> Publish
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                  <Archive size={12} strokeWidth={2.25} /> Archive
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                  <Download size={12} strokeWidth={2.25} /> Export
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 transition-colors">
                  <Trash2 size={12} strokeWidth={2.25} /> Delete
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X size={12} strokeWidth={2.25} /> Clear
                </button>
              </div>
            )}

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="grid grid-cols-[28px_36px_minmax(280px,1.4fr)_120px_140px_100px_180px_120px_140px] items-center gap-4 border-b border-slate-100 pb-3 text-[11.5px] font-medium text-slate-500">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked }}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="size-4 accent-brand-500"
                    aria-label="Select all"
                  />
                  <span>#</span>
                  <SortHeader label="Title" />
                  <SortHeader label="Category" />
                  <SortHeader label="Published by" />
                  <span>Status</span>
                  <span>Author</span>
                  <SortHeader label="Total Views" />
                  <span>Actions</span>
                </div>

                {rows.length === 0 ? (
                  <p className="py-16 text-center text-[13px] text-slate-400">No articles match this view.</p>
                ) : (
                  rows.map((a) => {
                    const isSelected = selected.has(a.id)
                    return (
                      <div
                        key={a.id}
                        className={[
                          'group grid grid-cols-[28px_36px_minmax(280px,1.4fr)_120px_140px_100px_180px_120px_140px] items-center gap-4 border-b border-slate-100 py-3 transition-colors',
                          isSelected ? 'bg-brand-50/40' : 'hover:bg-slate-50/60',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(a.id)}
                          className="size-4 accent-brand-500"
                          aria-label={`Select article ${a.id}`}
                        />
                        <span className="text-[13px] font-medium text-slate-500 tabular-nums">{a.id}</span>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.thumb} alt="" className="size-full object-cover" />
                          </div>
                          <p className="truncate text-[13.5px] font-medium text-slate-800">{a.title}</p>
                        </div>
                        <span className="text-[13px] text-slate-500">{a.category ?? '--'}</span>
                        <span className="text-[13px] text-slate-500">{a.publishedBy ?? '--'}</span>
                        <StatusPill status={a.status} />
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.authorAvatar} alt="" className="size-full object-cover" />
                          </span>
                          <span className="truncate text-[13px] text-slate-600">{a.author}</span>
                        </div>
                        <span className="text-[13px] text-slate-500 tabular-nums">
                          {a.views == null ? '--' : a.views.toLocaleString()}
                        </span>
                        <div className="relative flex items-center gap-1.5">
                          {a.category ? (
                            <button className="inline-flex h-8 items-center rounded-lg bg-brand-500 px-4 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(7,135,255,0.35)] hover:bg-brand-600 transition-colors">
                              Publish
                            </button>
                          ) : (
                            <button className="inline-flex h-8 items-center rounded-lg bg-white px-4 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => setOpenMenu((m) => (m === a.id ? null : a.id))}
                            onBlur={() => setTimeout(() => setOpenMenu((m) => (m === a.id ? null : m)), 120)}
                            aria-label="Row actions"
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <MoreVertical size={15} />
                          </button>
                          {openMenu === a.id && (
                            <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200">
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                className="block w-full px-3.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Preview
                              </button>
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                className="block w-full px-3.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Duplicate
                              </button>
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                className="block w-full px-3.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Archive
                              </button>
                              <div className="my-1 h-px bg-slate-100" />
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                className="block w-full px-3.5 py-2 text-left text-[12.5px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                <ArrowLeft size={12} strokeWidth={2.25} /> Previous
              </button>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                  10 per page
                  <ChevronDown size={12} strokeWidth={2.25} />
                </button>
                <div className="flex items-center gap-1">
                  {['1', '2', '3', '4'].map((p) => (
                    <button
                      key={p}
                      className={[
                        'flex size-8 items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors tabular-nums',
                        p === '2' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                  <span className="px-1 text-[12.5px] font-medium text-slate-400">...</span>
                </div>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                Next <ArrowRight size={12} strokeWidth={2.25} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

/* ─── Bits ─────────────────────────────────────────────────────────── */

function SortHeader({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1 text-left text-[11.5px] font-medium text-slate-500 hover:text-slate-700 transition-colors">
      {label}
      <ChevronsUpDown size={11} strokeWidth={2} className="text-slate-400" />
    </button>
  )
}

function FilterSelect({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
      {label}
      <ChevronDown size={12} strokeWidth={2.25} className="text-slate-500" />
    </button>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    draft:     'Draft',
    published: 'Published',
    awaiting:  'Awaiting',
    scheduled: 'Scheduled',
  }
  return <span className="text-[13px] text-slate-600">{map[status]}</span>
}

/* ─── Chrome ───────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4 px-5 pt-4 sm:px-8 sm:pt-5 lg:px-10">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-display text-[20px] font-bold tracking-tight text-brand-500 sm:text-[22px]">
            snowberry
          </span>
          <sup className="text-[9px] font-semibold text-brand-400">TM</sup>
        </Link>
        <span className="hidden h-6 w-px bg-slate-300 sm:block" />
        <div className="hidden items-center gap-1.5 sm:flex">
          <TrendingUp size={15} className="text-teal-600" strokeWidth={2.25} />
          <span className="font-display text-[16px] font-semibold text-teal-700">उकालो</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden w-[280px] md:block lg:w-[420px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles, authors, tags…"
            className="w-full rounded-full bg-white/80 py-2.5 pl-10 pr-14 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none ring-1 ring-slate-200/80 focus:bg-white focus:ring-brand-400 transition-all"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">
            ⌘K
          </kbd>
        </div>

        <button className="relative flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-white transition-colors">
          <Bell size={17} strokeWidth={1.75} />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-[#EEF3FA]" />
        </button>
        <button className="hidden size-10 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors sm:flex">
          <Settings size={17} strokeWidth={1.75} />
        </button>
        <div className="size-10 overflow-hidden rounded-full ring-2 ring-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80&auto=format&fit=crop"
            alt="Anna D."
            className="size-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}

function SidebarRail() {
  const primary = [
    { icon: Home,          label: 'Home',        href: '/' },
    { icon: Plus,          label: 'New',         href: '/news/new-v11' },
    { icon: Newspaper,     label: 'News',        href: '/news', active: true },
    { icon: MessageSquare, label: 'Comments',    href: '/comments' },
    { icon: ListChecks,    label: 'Tasks',       href: '#' },
    { icon: Gauge,         label: 'Performance', href: '#' },
    { icon: Layers,        label: 'Media',       href: '/media' },
    { icon: Users,         label: 'Audience',    href: '#' },
    { icon: Wrench,        label: 'Tools',       href: '#' },
  ]
  const bottom = [
    { icon: Users,    label: 'Team',     href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
  ]

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[64px] shrink-0 flex-col items-center justify-between py-3 lg:flex">
      <nav className="flex flex-col items-center gap-1.5">
        {primary.map(({ icon: Icon, label, active, href }) => (
          <Link
            key={label}
            href={href}
            title={label}
            className={[
              'flex size-11 items-center justify-center rounded-xl transition-colors',
              active
                ? 'bg-brand-500 text-white shadow-[0_6px_14px_-4px_rgba(7,135,255,0.55)]'
                : 'text-slate-500 hover:bg-white hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
          </Link>
        ))}
      </nav>
      <nav className="flex flex-col items-center gap-1.5">
        {bottom.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            title={label}
            className="flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
          >
            <Icon size={18} strokeWidth={1.75} />
          </Link>
        ))}
      </nav>
    </aside>
  )
}
