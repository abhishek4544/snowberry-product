'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Search, Bell, Settings, Home, Plus, MessageSquare,
  ListChecks, Gauge, Users, Wrench, Newspaper, Layers,
  ChevronDown, ArrowLeft, ArrowRight, Check, FilePlus, X, Undo2,
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────────────── */

type Status = 'pending' | 'approved' | 'rejected'

type Comment = {
  id: string
  name: string
  email: string
  avatar: string
  body: string
  status: Status
}

type ArticleGroup = {
  articleId: string
  title: string
  thumb: string
  author: string
  words: number
  readMin: number
  variant: 'active' | 'muted'
  comments: Comment[]
}

const AVATAR =
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=80&auto=format&fit=crop&crop=faces'

const THUMB =
  'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=160&q=80&auto=format&fit=crop'

const NAME = 'Ashish Kumar'
const EMAIL = 'ashish@the-citizen.press'
const BODY = 'this is just test for comment navbar'
const TITLE = 'जातीय छुवाछूत : पीडकलाई कानुनको डर न पीडितलाई न्यायको भर'

const INITIAL_GROUPS: ArticleGroup[] = [
  {
    articleId: 'a1',
    title: TITLE,
    thumb: THUMB,
    author: 'Maya Gupta',
    words: 612,
    readMin: 3,
    variant: 'active',
    comments: [
      { id: 'a1-c1', name: NAME, email: EMAIL, avatar: AVATAR, body: BODY, status: 'pending' },
      { id: 'a1-c2', name: NAME, email: EMAIL, avatar: AVATAR, body: BODY, status: 'pending' },
      { id: 'a1-c3', name: NAME, email: EMAIL, avatar: AVATAR, body: BODY, status: 'pending' },
    ],
  },
  {
    articleId: 'a2',
    title: TITLE,
    thumb: THUMB,
    author: 'Maya Gupta',
    words: 612,
    readMin: 3,
    variant: 'muted',
    comments: [
      { id: 'a2-c1', name: NAME, email: EMAIL, avatar: AVATAR, body: BODY, status: 'pending' },
    ],
  },
  {
    articleId: 'a3',
    title: TITLE,
    thumb: THUMB,
    author: 'Maya Gupta',
    words: 612,
    readMin: 3,
    variant: 'muted',
    comments: [
      { id: 'a3-c1', name: NAME, email: EMAIL, avatar: AVATAR, body: BODY, status: 'pending' },
    ],
  },
]

type Filter = 'all' | 'pending' | 'approved' | 'rejected'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

/* ─── Page ─────────────────────────────────────────────────────────── */

export default function NewsComments() {
  const [groups, setGroups] = useState<ArticleGroup[]>(INITIAL_GROUPS)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (c: Comment) => {
      if (filter !== 'all' && c.status !== filter) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.body.toLowerCase().includes(q)
      )
    }
    return groups
      .map((g) => ({ ...g, comments: g.comments.filter(matches) }))
      .filter((g) => g.comments.length > 0 || (!q && filter === 'all'))
  }, [groups, query, filter])

  function setStatus(ids: string[], status: Status) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        comments: g.comments.map((c) =>
          ids.includes(c.id) ? { ...c, status } : c,
        ),
      })),
    )
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleGroup(ids: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) ids.forEach((id) => next.add(id))
      else ids.forEach((id) => next.delete(id))
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
          {/* Heading */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="font-display text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[32px] lg:text-[36px]">
                Comments
              </h1>
              <p className="mt-1.5 max-w-[720px] text-[13.5px] text-slate-500 sm:text-[14px]">
                Reader comments, ready for a quick once-over. Approve the good stuff, sweep away the junk.
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 self-start rounded-lg bg-brand-500 px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(7,135,255,0.35)] hover:bg-brand-600 transition-colors">
              <FilePlus size={14} strokeWidth={2.25} /> Add New Page
            </button>
          </div>

          {/* Main card */}
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-6">
            {/* Search + filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[320px]">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search comments.."
                  className="w-full rounded-xl bg-white py-2.5 pl-4 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 focus:ring-brand-400 transition-all"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setFilterOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setFilterOpen(false), 120)}
                  className="inline-flex h-10 min-w-[100px] items-center justify-between gap-6 rounded-xl bg-white px-4 text-[13px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {FILTERS.find((f) => f.key === filter)!.label}
                  <ChevronDown size={13} strokeWidth={2.25} className="text-slate-500" />
                </button>
                {filterOpen && (
                  <div className="absolute left-0 top-11 z-20 w-[140px] overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200">
                    {FILTERS.map((f) => (
                      <button
                        key={f.key}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setFilter(f.key); setFilterOpen(false) }}
                        className={[
                          'flex w-full items-center justify-between px-3.5 py-2 text-left text-[12.5px] font-medium transition-colors',
                          filter === f.key ? 'bg-brand-50 text-brand-600' : 'text-slate-700 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        {f.label}
                        {filter === f.key && <Check size={12} strokeWidth={2.75} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (() => {
              const ids = [...selected]
              const picked = groups.flatMap((g) => g.comments).filter((c) => ids.includes(c.id))
              const canApprove = picked.some((c) => c.status !== 'approved')
              const canReject = picked.some((c) => c.status !== 'rejected')
              const canReset = picked.some((c) => c.status !== 'pending')
              return (
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-full bg-[#E7F0FE] px-4 py-2 ring-1 ring-[#BFD4F5]">
                  <span className="text-[13px] font-medium text-slate-800">
                    {selected.size} Selected
                  </span>
                  <button
                    onClick={() => setStatus(ids, 'approved')}
                    disabled={!canApprove}
                    className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(7,135,255,0.35)] hover:bg-brand-600 transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    <Check size={12} strokeWidth={2.75} /> Approve
                  </button>
                  <button
                    onClick={() => setStatus(ids, 'rejected')}
                    disabled={!canReject}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    <X size={12} strokeWidth={2.75} /> Reject
                  </button>
                  <button
                    onClick={() => setStatus(ids, 'pending')}
                    disabled={!canReset}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    <Undo2 size={12} strokeWidth={2.25} /> Move to pending
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="ml-auto text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )
            })()}

            {/* Groups */}
            <div className="mt-5 flex flex-col gap-5">
              {filteredGroups.length === 0 ? (
                <p className="py-16 text-center text-[13px] text-slate-400">No comments match this view.</p>
              ) : (
                filteredGroups.map((g) => (
                  <GroupCard
                    key={g.articleId}
                    group={g}
                    selected={selected}
                    onSelect={toggleSelect}
                    onToggleGroup={toggleGroup}
                    onApprove={(ids) => setStatus(ids, 'approved')}
                    onReject={(ids) => setStatus(ids, 'rejected')}
                    onReset={(ids) => setStatus(ids, 'pending')}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
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

/* ─── Group card ───────────────────────────────────────────────────── */

function GroupCard({
  group, selected, onSelect, onToggleGroup, onApprove, onReject, onReset,
}: {
  group: ArticleGroup
  selected: Set<string>
  onSelect: (id: string) => void
  onToggleGroup: (ids: string[], checked: boolean) => void
  onApprove: (ids: string[]) => void
  onReject: (ids: string[]) => void
  onReset: (ids: string[]) => void
}) {
  const isActive = group.variant === 'active'
  const wrap = isActive
    ? 'bg-[#E7F0FE] ring-1 ring-[#BFD4F5]'
    : 'bg-slate-100/70 ring-1 ring-slate-200/70'

  const pendingIds = group.comments.filter((c) => c.status === 'pending').map((c) => c.id)
  const ids = group.comments.map((c) => c.id)
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))
  const someChecked = !allChecked && ids.some((id) => selected.has(id))

  return (
    <div className={`rounded-2xl p-4 ${wrap}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked }}
            onChange={(e) => onToggleGroup(ids, e.target.checked)}
            aria-label={`Select all comments on ${group.title}`}
            className="mt-1.5 size-4 shrink-0 accent-brand-500"
          />
          <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={group.thumb} alt="" className="size-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-slate-900">{group.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-slate-500">
              <span>By {group.author}</span>
              <span className="size-1 rounded-full bg-slate-400" />
              <span>{group.words} words</span>
              <span className="size-1 rounded-full bg-slate-400" />
              <span>{group.readMin} min read</span>
            </p>
          </div>
        </div>

        {isActive && pendingIds.length > 0 && (
          <button
            onClick={() => onApprove(pendingIds)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-800 ring-1 ring-slate-200/80 hover:bg-slate-50 transition-colors"
          >
            Approve All Comments
            <Check size={13} strokeWidth={2.5} className="text-emerald-500" />
          </button>
        )}
      </div>

      {/* Comments */}
      <div className="mt-4 flex flex-col gap-2.5">
        {group.comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            checked={selected.has(c.id)}
            onSelect={onSelect}
            onApprove={() => onApprove([c.id])}
            onReject={() => onReject([c.id])}
            onReset={() => onReset([c.id])}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Comment row ──────────────────────────────────────────────────── */

function CommentRow({
  comment, checked, onSelect, onApprove, onReject, onReset,
}: {
  comment: Comment
  checked: boolean
  onSelect: (id: string) => void
  onApprove: () => void
  onReject: () => void
  onReset: () => void
}) {
  const isApproved = comment.status === 'approved'
  const isRejected = comment.status === 'rejected'

  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onSelect(comment.id)}
        className="mt-1 size-4 shrink-0 accent-brand-500"
        aria-label={`Select comment by ${comment.name}`}
      />
      <span className="size-10 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={comment.avatar} alt="" className="size-full object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13.5px] font-semibold text-slate-900">{comment.name}</p>
          {isApproved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-px text-[10.5px] font-medium text-emerald-700 ring-1 ring-emerald-100">
              <Check size={10} strokeWidth={2.75} /> Approved
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-px text-[10.5px] font-medium text-rose-600 ring-1 ring-rose-100">
              <X size={10} strokeWidth={2.75} /> Rejected
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-slate-500">{comment.email}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-800">{comment.body}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-center">
        <button
          onClick={isApproved ? onReset : onApprove}
          aria-pressed={isApproved}
          title={isApproved ? 'Undo approval' : 'Approve'}
          className={[
            'inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[12.5px] font-semibold transition-colors',
            isApproved
              ? 'bg-brand-500 text-white shadow-[0_1px_2px_rgba(7,135,255,0.35)] hover:bg-brand-600'
              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900',
          ].join(' ')}
        >
          <Check size={13} strokeWidth={2.5} className={isApproved ? '' : 'text-emerald-500'} />
          {isApproved ? 'Approved' : 'Approve'}
        </button>
        <button
          onClick={isRejected ? onReset : onReject}
          aria-pressed={isRejected}
          title={isRejected ? 'Undo rejection' : 'Reject'}
          className={[
            'inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[12.5px] font-medium transition-colors',
            isRejected
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900',
          ].join(' ')}
        >
          <X size={13} strokeWidth={2.5} className={isRejected ? '' : 'text-rose-500'} />
          {isRejected ? 'Rejected' : 'Reject'}
        </button>
      </div>
    </div>
  )
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
    { icon: Newspaper,     label: 'News',        href: '/news' },
    { icon: MessageSquare, label: 'Chats',       href: '#' },
    { icon: ListChecks,    label: 'Tasks',       href: '#' },
    { icon: Gauge,         label: 'Performance', href: '#' },
    { icon: Layers,        label: 'Media',       href: '/media' },
    { icon: Users,         label: 'Comments',    href: '/news/comments', active: true },
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
