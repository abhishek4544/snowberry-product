'use client'

/**
 * CommentsModeration — Snowberry /comments
 *
 * Moderation queue per docs/PRD-comments-moderation.md (phase 1 + article
 * grouping). Follows the media-library design standard: light gradient
 * canvas, white rounded-2xl cards, brand-blue primary, 400px right rail.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Search, Bell, Settings, Home, Plus, MessageSquare,
  MessagesSquare, ListChecks, Gauge, Image as ImageIcon, Users, Wrench,
  Check, X, MoreVertical, ChevronDown, ChevronUp, ArrowLeft, ArrowRight,
  Inbox, BadgeCheck, ShieldX, Timer, Sparkles, Undo2, CornerDownRight,
  Flame, PartyPopper, Newspaper, LayoutGrid, List as ListIcon,
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────────────── */

type Article = {
  id: string
  title: string
  category: string
  thumb: string
  published: string
}

const ARTICLES: Article[] = [
  { id: 'spain',    title: 'World beaters Spain draw to Cabo Verde — historic day', category: 'Sports',    thumb: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=200&q=80&auto=format&fit=crop', published: '4 weeks ago' },
  { id: 'flourish', title: 'Flourish iframe image test',                            category: 'Tech',      thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=80&auto=format&fit=crop', published: '6 months ago' },
  { id: 'speaker',  title: 'सभामुखको मनमौजी: सांसदलाई दिइएको समय चिन्दैन नियमावलीले',   category: 'Politics',  thumb: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=200&q=80&auto=format&fit=crop', published: '5 months ago' },
  { id: 'runclub',  title: 'रन क्लब: दौडमार्फत शारीरिकसँगै स्वस्थ सामाजिक सम्बन्ध',        category: 'Lifestyle', thumb: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&q=80&auto=format&fit=crop', published: '5 months ago' },
  { id: 'gallery',  title: 'Arj photo gallery',                                     category: 'Culture',   thumb: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=200&q=80&auto=format&fit=crop', published: '6 months ago' },
]

type Status = 'pending' | 'approved' | 'rejected'

type Comment = {
  id: string
  name: string
  email: string
  body: string
  articleId: string
  time: string
  status: Status
  priorApproved?: number
  replyTo?: { name: string; excerpt: string }
  spamGroup?: string
}

const INITIAL_COMMENTS: Comment[] = [
  { id: 'c1',  name: 'RAJKUMAR ROMARIO', email: 'romario1992@brazil.bafanabafana', body: 'crazy pull by vozinha. felt like i was watching gigi buffon all over again.', articleId: 'spain',    time: '4 weeks ago',  status: 'approved', priorApproved: 3 },
  { id: 'c2',  name: 'hari k.',          email: 'harik@gmail.com',                 body: 'buffon comparison is too much, but yes what a save that was',                 articleId: 'spain',    time: '3 weeks ago',  status: 'pending', replyTo: { name: 'RAJKUMAR ROMARIO', excerpt: 'crazy pull by vozinha…' } },
  { id: 'c3',  name: 'suraj thapa',      email: 'suraj@gmail.com',                 body: 'thiss is just test',                                                          articleId: 'flourish', time: '5 months ago', status: 'pending', priorApproved: 3 },
  { id: 'c4',  name: 'ma tester ho',     email: 'mailxaina@gmail.com',             body: 'this is just test for comment navbar',                                        articleId: 'flourish', time: '5 months ago', status: 'pending' },
  { id: 'c5',  name: 'just test',        email: 'tetet@gmail.com',                 body: 'this kis just tets frio ern=enebbvhjerv',                                     articleId: 'speaker',  time: '5 months ago', status: 'pending' },
  { id: 'c6',  name: 'asda',             email: 'sasdads@gmail.com',               body: 'asdadsads',                                                                   articleId: 'runclub',  time: '5 months ago', status: 'pending' },
  { id: 'c7',  name: 'hello',            email: 'jj@gmail.com',                    body: 'huhuh',                                                                       articleId: 'gallery',  time: '5 months ago', status: 'pending' },
  { id: 'c8',  name: 'nir test',         email: 'just@gmail.com',                  body: 'this is just test',                                                           articleId: 'gallery',  time: '5 months ago', status: 'pending' },
  { id: 'c9',  name: 'wqwq',             email: 'sfds@gmail.com',                  body: 'asdaddda',                                                                    articleId: 'flourish', time: '5 months ago', status: 'pending', spamGroup: 'sfds' },
  { id: 'c10', name: 'wqwq',             email: 'sfds@gmail.com',                  body: 'qweqeqeeew',                                                                  articleId: 'flourish', time: '5 months ago', status: 'pending', spamGroup: 'sfds' },
  { id: 'c11', name: 'wqwq',             email: 'sfds@gmail.com',                  body: 'qwee weeqewqe',                                                               articleId: 'flourish', time: '5 months ago', status: 'pending', spamGroup: 'sfds' },
]

const AVATAR_TINTS = [
  'bg-brand-50 text-brand-600',
  'bg-violet-50 text-violet-600',
  'bg-teal-50 text-teal-600',
  'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600',
] as const

function avatarTint(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997
  return AVATAR_TINTS[h % AVATAR_TINTS.length]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? '?'
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

const articleById = (id: string) => ARTICLES.find((a) => a.id === id)!

/* ─── Page component ───────────────────────────────────────────────── */

type Tab = 'pending' | 'approved' | 'all'
type Undo =
  | { kind: 'status'; label: string; snapshot: { id: string; status: Status }[] }
  | { kind: 'delete'; label: string; deleted: Comment[] }

export default function CommentsModeration() {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS)
  const [tab, setTab] = useState<Tab>('pending')
  const [view, setView] = useState<'article' | 'newest'>('article')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [spamOpen, setSpamOpen] = useState<Set<string>>(new Set())
  const [undo, setUndo] = useState<Undo | null>(null)
  const [query, setQuery] = useState('')
  const [allFilter, setAllFilter] = useState<'all' | Status>('all')
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q = query.trim().toLowerCase()
  const matches = (c: Comment) => {
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q) ||
      articleById(c.articleId).title.toLowerCase().includes(q)
    )
  }

  const filtered = comments.filter(matches)
  const pending = filtered.filter((c) => c.status === 'pending')
  const approved = filtered.filter((c) => c.status === 'approved')
  const rejected = filtered.filter((c) => c.status === 'rejected')

  const totals = {
    pending: comments.filter((c) => c.status === 'pending').length,
    approved: comments.filter((c) => c.status === 'approved').length,
    rejected: comments.filter((c) => c.status === 'rejected').length,
  }

  function deleteComments(ids: string[], label: string) {
    const deleted = comments.filter((c) => ids.includes(c.id))
    queueUndo({ kind: 'delete', label, deleted })
    setComments((prev) => prev.filter((c) => !ids.includes(c.id)))
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }

  function applyStatus(ids: string[], status: Status, label: string) {
    const snapshot = comments
      .filter((c) => ids.includes(c.id))
      .map((c) => ({ id: c.id, status: c.status }))
    queueUndo({ kind: 'status', label, snapshot })
    setComments((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, status } : c)),
    )
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }

  function queueUndo(u: Undo) {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndo(u)
    undoTimer.current = setTimeout(() => setUndo(null), 5000)
  }

  function runUndo() {
    if (!undo) return
    if (undo.kind === 'status') {
      setComments((prev) =>
        prev.map((c) => {
          const snap = undo.snapshot.find((s) => s.id === c.id)
          return snap ? { ...c, status: snap.status } : c
        }),
      )
    } else {
      setComments((prev) => {
        const byId = new Map(prev.map((c) => [c.id, c]))
        for (const c of undo.deleted) if (!byId.has(c.id)) byId.set(c.id, c)
        const order = new Map(INITIAL_COMMENTS.map((c, i) => [c.id, i]))
        return [...byId.values()].sort(
          (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
        )
      })
    }
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndo(null)
  }

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current) }, [])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /* group pending comments by article, spam clusters kept together */
  const groups = useMemo(() => {
    const byArticle = new Map<string, Comment[]>()
    for (const c of pending) {
      const list = byArticle.get(c.articleId) ?? []
      list.push(c)
      byArticle.set(c.articleId, list)
    }
    return ARTICLES.filter((a) => byArticle.has(a.id)).map((a) => ({
      article: a,
      items: byArticle.get(a.id)!,
    }))
  }, [pending])

  const approvalRate = comments.length
    ? Math.round((totals.approved / comments.length) * 100)
    : 0

  return (
    <div
      className="min-h-screen w-full font-sans text-slate-900"
      style={{ background: 'linear-gradient(180deg, #EEF3FA 0%, #F3F6FB 40%, #F7F9FC 100%)' }}
    >
      <TopBar />
      <div className="flex">
        <SidebarRail />
        <main className="min-w-0 flex-1 px-5 pb-12 pt-2 sm:px-8 lg:px-12 lg:pt-4">
          <div className="max-w-[1240px]">
            <h1 className="font-display text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[32px] lg:text-[36px]">
              Comments
            </h1>
            <p className="mt-1.5 max-w-[720px] text-[13.5px] text-slate-500 sm:text-[14px]">
              Reader comments, ready for a quick once-over. Approve the good stuff, sweep away the junk.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatCard
              icon={<Inbox size={19} strokeWidth={2} />}
              tint="bg-amber-50 text-amber-500"
              label="Pending review"
              value={String(totals.pending)}
              foot={<span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">oldest: 5 months</span>}
            />
            <StatCard
              icon={<BadgeCheck size={19} strokeWidth={2} />}
              tint="bg-teal-50 text-teal-500"
              label="Approved this week"
              value={String(totals.approved)}
              foot={<span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600"><TrendingUp size={11} strokeWidth={2.5} /> +33% vs last week</span>}
            />
            <StatCard
              icon={<ShieldX size={19} strokeWidth={2} />}
              tint="bg-rose-50 text-rose-500"
              label="Spam caught"
              value={String(totals.rejected + 3)}
              foot={<span className="text-[11px] text-slate-400">19% of new comments</span>}
            />
            <StatCard
              icon={<Timer size={19} strokeWidth={2} />}
              tint="bg-violet-50 text-violet-500"
              label="Avg time to review"
              value="2.1 d"
              foot={<span className="text-[11px] font-medium text-amber-600">target: same day</span>}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
            <section className="min-w-0 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="inline-flex items-center gap-0.5 rounded-full bg-slate-100/80 p-1">
                  <TabPill active={tab === 'pending'} onClick={() => setTab('pending')}>
                    Pending
                    <span className={[
                      'ml-1.5 rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums',
                      tab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700',
                    ].join(' ')}>
                      {totals.pending}
                    </span>
                  </TabPill>
                  <TabPill active={tab === 'approved'} onClick={() => setTab('approved')}>Approved</TabPill>
                  <TabPill active={tab === 'all'} onClick={() => setTab('all')}>All comments</TabPill>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 md:w-[220px] md:flex-none">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search comments..."
                      className="w-full rounded-lg bg-slate-50 py-2 pl-8 pr-8 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-brand-400 transition-all"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <X size={12} strokeWidth={2.25} />
                      </button>
                    )}
                  </div>
                  {tab === 'pending' && (
                    <div className="inline-flex items-center gap-0.5 rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
                      <button
                        onClick={() => setView('article')}
                        title="Group by article"
                        className={['flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors',
                          view === 'article' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'].join(' ')}
                      >
                        <LayoutGrid size={13} strokeWidth={2.25} /> By article
                      </button>
                      <button
                        onClick={() => setView('newest')}
                        title="Newest first"
                        className={['flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors',
                          view === 'newest' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'].join(' ')}
                      >
                        <ListIcon size={13} strokeWidth={2.25} /> Newest
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {tab === 'pending' && selected.size > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50/70 px-3 py-2 ring-1 ring-brand-100">
                  <span className="text-[12.5px] font-medium text-slate-700">{selected.size} selected</span>
                  <button
                    onClick={() => applyStatus([...selected], 'approved', `${selected.size} comments approved`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-600 transition-colors"
                  >
                    <Check size={13} strokeWidth={2.5} /> Approve
                  </button>
                  <button
                    onClick={() => applyStatus([...selected], 'rejected', `${selected.size} comments rejected`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <X size={13} strokeWidth={2.5} /> Reject
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="ml-auto text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="mt-5">
                {tab === 'pending' && (
                  pending.length === 0 ? (
                    <EmptyState />
                  ) : view === 'article' ? (
                    <div className="flex flex-col gap-4">
                      {groups.map(({ article, items }) => (
                        <ArticleGroup
                          key={article.id}
                          article={article}
                          items={items}
                          selected={selected}
                          spamOpen={spamOpen}
                          onToggleSpam={(g) =>
                            setSpamOpen((prev) => {
                              const next = new Set(prev)
                              if (next.has(g)) next.delete(g)
                              else next.add(g)
                              return next
                            })
                          }
                          onSelect={toggleSelect}
                          onAct={applyStatus}
                          onDelete={(ids) =>
                            deleteComments(ids, ids.length === 1 ? 'Comment deleted' : `${ids.length} comments deleted`)
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-slate-100">
                      {pending.map((c) => (
                        <CommentRow
                          key={c.id}
                          comment={c}
                          showArticle
                          checked={selected.has(c.id)}
                          onSelect={toggleSelect}
                          onAct={applyStatus}
                          onDelete={(ids) =>
                            deleteComments(ids, ids.length === 1 ? 'Comment deleted' : `${ids.length} comments deleted`)
                          }
                        />
                      ))}
                    </div>
                  )
                )}

                {tab === 'approved' && (
                  <div className="flex flex-col divide-y divide-slate-100">
                    {approved.length === 0 ? (
                      <p className="py-10 text-center text-[13px] text-slate-400">No approved comments yet.</p>
                    ) : (
                      approved.map((c) => (
                        <CommentRow
                          key={c.id}
                          comment={c}
                          showArticle
                          quiet
                          onSelect={toggleSelect}
                          onAct={applyStatus}
                          onDelete={(ids) =>
                            deleteComments(ids, ids.length === 1 ? 'Comment deleted' : `${ids.length} comments deleted`)
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {tab === 'all' && (
                  <AllCommentsTable
                    comments={allFilter === 'all' ? filtered : filtered.filter((c) => c.status === allFilter)}
                    totals={totals}
                    filter={allFilter}
                    onFilter={setAllFilter}
                    selected={selected}
                    onSelect={toggleSelect}
                    onSelectAll={(ids, checked) =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (checked) ids.forEach((id) => next.add(id))
                        else ids.forEach((id) => next.delete(id))
                        return next
                      })
                    }
                    onAct={applyStatus}
                    onDelete={(ids) =>
                      deleteComments(ids, ids.length === 1 ? 'Comment deleted' : `${ids.length} comments deleted`)
                    }
                  />
                )}
              </div>

              <Pagination />
            </section>

            <div className="flex flex-col gap-5">
              <QueueHealthCard
                approvalRate={approvalRate}
                approved={totals.approved}
                pending={totals.pending}
                rejected={totals.rejected}
              />
              <HotThreadsCard comments={comments} />
            </div>
          </div>
        </main>
      </div>

      {undo && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900 py-2.5 pl-5 pr-2.5 text-[13px] font-medium text-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.45)]">
        <Check size={14} strokeWidth={2.5} className="text-emerald-400" />
        {undo.label}
        <button
          onClick={runUndo}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold hover:bg-white/25 transition-colors"
        >
          <Undo2 size={12} strokeWidth={2.5} /> Undo
        </button>
        </div>
      )}
    </div>
  )
}

/* ─── Stat card ────────────────────────────────────────────────────── */

function StatCard({
  icon, tint, label, value, foot,
}: {
  icon: React.ReactNode
  tint: string
  label: string
  value: string
  foot: React.ReactNode
}) {
  return (
    <div className="flex h-[132px] flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
        <span className="text-right leading-tight">{foot}</span>
      </div>
      <div>
        <p className="font-display text-[26px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p>
        <p className="mt-1.5 text-[12.5px] font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )
}

/* ─── Tabs ─────────────────────────────────────────────────────────── */

function TabPill({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
        active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/* ─── Article group ────────────────────────────────────────────────── */

function ArticleGroup({
  article, items, selected, spamOpen, onToggleSpam, onSelect, onAct, onDelete,
}: {
  article: Article
  items: Comment[]
  selected: Set<string>
  spamOpen: Set<string>
  onToggleSpam: (group: string) => void
  onSelect: (id: string) => void
  onAct: (ids: string[], status: Status, label: string) => void
  onDelete: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(true)
  const spamGroups = new Map<string, Comment[]>()
  const normal: Comment[] = []
  for (const c of items) {
    if (c.spamGroup) {
      const list = spamGroups.get(c.spamGroup) ?? []
      list.push(c)
      spamGroups.set(c.spamGroup, list)
    } else normal.push(c)
  }
  const hasFlood = [...spamGroups.values()].some((g) => g.length >= 2)

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80">
      <div className="group/head flex items-center gap-3.5 border-b border-slate-100 bg-slate-50/70 py-3 pl-4 pr-2.5 transition-colors hover:bg-slate-50">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
        >
          <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.thumb} alt="" className="size-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-slate-900">{article.title}</p>
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {article.category} · published {article.published}
            </p>
          </div>
        </button>
        {hasFlood ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-100">
            <ShieldX size={11} strokeWidth={2.5} /> spam flood
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
            {items.length} pending
          </span>
        )}
        {normal.length > 0 && (
          <button
            onClick={() =>
              onAct(normal.map((c) => c.id), 'approved', `${normal.length === 1 ? 'Comment' : `${normal.length} comments`} approved`)
            }
            className="hidden shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-brand-600 opacity-0 transition-opacity hover:bg-brand-50 focus-visible:opacity-100 group-hover/head:opacity-100 sm:inline-flex"
          >
            <Check size={12} strokeWidth={2.5} /> Approve all
          </button>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Collapse' : 'Expand'}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
        >
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col divide-y divide-slate-100 bg-white">
          {normal.map((c) => (
            <CommentRow key={c.id} comment={c} checked={selected.has(c.id)} onSelect={onSelect} onAct={onAct} onDelete={onDelete} />
          ))}
          {[...spamGroups.entries()].map(([group, list]) => (
            <SpamCluster
              key={group}
              group={group}
              list={list}
              open={spamOpen.has(group)}
              onToggle={() => onToggleSpam(group)}
              onAct={onAct}
              onDelete={onDelete}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Spam cluster ─────────────────────────────────────────────────── */

function SpamCluster({
  group, list, open, onToggle, onAct, onDelete, selected, onSelect,
}: {
  group: string
  list: Comment[]
  open: boolean
  onToggle: () => void
  onAct: (ids: string[], status: Status, label: string) => void
  onDelete: (ids: string[]) => void
  selected: Set<string>
  onSelect: (id: string) => void
}) {
  return (
    <div className="bg-rose-50/30">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 ring-1 ring-rose-100">
          <Sparkles size={14} strokeWidth={2} />
        </span>
        <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-slate-600">
          <span className="font-semibold text-slate-800">{list.length} near-identical comments</span> from{' '}
          <span className="font-medium text-slate-800">{list[0].email}</span> within 2 minutes — Berry grouped them for you.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => onAct(list.map((c) => c.id), 'rejected', `${list.length} spam comments rejected`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 transition-colors"
          >
            <X size={12} strokeWidth={2.5} /> Reject all {list.length}
          </button>
          <button
            onClick={onToggle}
            className="text-[12px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            {open ? 'Collapse' : 'Review individually'}
          </button>
        </div>
      </div>
      {open && (
        <div className="flex flex-col divide-y divide-rose-100/60 border-t border-rose-100/60">
          {list.map((c) => (
            <CommentRow key={c.id} comment={c} checked={selected.has(c.id)} onSelect={onSelect} onAct={onAct} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Comment row ──────────────────────────────────────────────────── */

function CommentRow({
  comment, checked = false, quiet = false, showArticle = false, onSelect, onAct, onDelete,
}: {
  comment: Comment
  checked?: boolean
  quiet?: boolean
  showArticle?: boolean
  onSelect: (id: string) => void
  onAct: (ids: string[], status: Status, label: string) => void
  onDelete?: (ids: string[]) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const article = articleById(comment.articleId)
  const isPending = comment.status === 'pending'

  return (
    <div className="group/row flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-slate-50/60 sm:px-5">
      {isPending ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onSelect(comment.id)}
          className="size-4 shrink-0 accent-brand-500"
        />
      ) : (
        <span className="w-4 shrink-0" />
      )}

      {comment.replyTo ? (
        <span className="flex size-10 shrink-0 items-center justify-center text-slate-300">
          <CornerDownRight size={17} strokeWidth={2} />
        </span>
      ) : (
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${avatarTint(comment.name)}`}>
          {initials(comment.name)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {comment.replyTo && (
          <p className="mb-1.5 truncate border-l-2 border-slate-200 pl-2 text-[11.5px] leading-relaxed text-slate-400">
            Replying to <span className="font-medium text-slate-500">{comment.replyTo.name}</span> — “{comment.replyTo.excerpt}”
          </p>
        )}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[13.5px] font-semibold text-slate-900">{comment.name}</span>
          <span className="hidden text-[11.5px] text-slate-400 md:inline">{comment.email}</span>
          <span className="text-[11.5px] text-slate-400">· {comment.time}</span>
          {comment.priorApproved && (
            <span className="inline-flex translate-y-px items-center gap-1 rounded-full bg-emerald-50 px-2 py-px text-[10.5px] font-medium text-emerald-700 ring-1 ring-emerald-100">
              <BadgeCheck size={10} strokeWidth={2.5} /> {comment.priorApproved} prior approved
            </span>
          )}
          {!isPending && (
            <span className={[
              'inline-flex translate-y-px items-center rounded-full px-2 py-px text-[10.5px] font-medium ring-1',
              comment.status === 'approved'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                : 'bg-rose-50 text-rose-600 ring-rose-100',
            ].join(' ')}>
              {comment.status === 'approved' ? 'Approved' : 'Rejected'}
            </span>
          )}
        </div>
        <p className="mt-1 text-[14px] leading-relaxed text-slate-800">{comment.body}</p>
        {showArticle && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-slate-400">
            <Newspaper size={11} strokeWidth={2} />
            <span className="truncate">{article.title}</span>
          </p>
        )}
      </div>

      <div className="relative flex shrink-0 items-center gap-1.5 self-center">
        {isPending && !quiet && (
          <>
            <button
              onClick={() => onAct([comment.id], 'approved', 'Comment approved')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(7,135,255,0.35)] transition-colors hover:bg-brand-600"
            >
              <Check size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Approve</span>
            </button>
            <button
              onClick={() => onAct([comment.id], 'rejected', 'Comment rejected')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-[12.5px] font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <X size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Reject</span>
            </button>
          </>
        )}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
          aria-label="More actions"
          className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreVertical size={15} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200">
            <button className="block w-full px-3.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Edit comment
            </button>
            {comment.status !== 'pending' && (
              <button
                onClick={() => onAct([comment.id], 'pending', 'Comment moved back to pending')}
                className="block w-full px-3.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Move to pending
              </button>
            )}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onDelete?.([comment.id]); setMenuOpen(false) }}
              className="block w-full px-3.5 py-2 text-left text-[12.5px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── All comments (audit table) ───────────────────────────────────── */

function AllCommentsTable({
  comments, totals, filter, onFilter, selected, onSelect, onSelectAll, onAct, onDelete,
}: {
  comments: Comment[]
  totals: { pending: number; approved: number; rejected: number }
  filter: 'all' | Status
  onFilter: (f: 'all' | Status) => void
  selected: Set<string>
  onSelect: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
  onAct: (ids: string[], status: Status, label: string) => void
  onDelete: (ids: string[]) => void
}) {
  const ids = comments.map((c) => c.id)
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))
  const someChecked = !allChecked && ids.some((id) => selected.has(id))
  const selectedInView = ids.filter((id) => selected.has(id))
  const total = totals.pending + totals.approved + totals.rejected

  const chips: { key: 'all' | Status; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: total },
    { key: 'pending',  label: 'Pending',  count: totals.pending },
    { key: 'approved', label: 'Approved', count: totals.approved },
    { key: 'rejected', label: 'Rejected', count: totals.rejected },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => onFilter(c.key)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
              filter === c.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70',
            ].join(' ')}
          >
            {c.label}
            <span className={[
              'rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums',
              filter === c.key ? 'bg-white/20 text-white' : 'bg-white text-slate-500',
            ].join(' ')}>
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {selectedInView.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50/70 px-3 py-2 ring-1 ring-brand-100">
          <span className="text-[12.5px] font-medium text-slate-700">{selectedInView.length} selected</span>
          <button
            onClick={() => onAct(selectedInView, 'approved', `${selectedInView.length} comments approved`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            <Check size={13} strokeWidth={2.5} /> Approve
          </button>
          <button
            onClick={() => onAct(selectedInView, 'rejected', `${selectedInView.length} comments rejected`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
          >
            <X size={13} strokeWidth={2.5} /> Reject
          </button>
          <button
            onClick={() => onAct(selectedInView, 'pending', `${selectedInView.length} comments moved to pending`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Timer size={13} strokeWidth={2.25} /> Move to pending
          </button>
          <button
            onClick={() => onDelete(selectedInView)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 transition-colors"
          >
            <X size={13} strokeWidth={2.5} /> Delete
          </button>
          <button
            onClick={() => onSelectAll(ids, false)}
            className="ml-auto text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <div className="-mx-1 overflow-x-auto">
        <div className="min-w-[820px] px-1">
          <div className="grid grid-cols-[24px_1.1fr_1.6fr_1.3fr_96px_96px_36px] items-center gap-4 border-b border-slate-100 pb-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={allChecked}
              ref={(el) => { if (el) el.indeterminate = someChecked }}
              onChange={(e) => onSelectAll(ids, e.target.checked)}
              className="size-4 accent-brand-500"
            />
            <span>Commenter</span>
            <span>Comment</span>
            <span>Article</span>
            <span>Date</span>
            <span>Status</span>
            <span className="sr-only">Actions</span>
          </div>
          {comments.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-slate-400">No comments match this filter.</p>
          ) : (
            comments.map((c, i) => (
              <AllRow
                key={c.id}
                comment={c}
                last={i === comments.length - 1}
                checked={selected.has(c.id)}
                onSelect={onSelect}
                onAct={onAct}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AllRow({
  comment, last, checked, onSelect, onAct, onDelete,
}: {
  comment: Comment
  last: boolean
  checked: boolean
  onSelect: (id: string) => void
  onAct: (ids: string[], status: Status, label: string) => void
  onDelete: (ids: string[]) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const article = articleById(comment.articleId)
  return (
    <div
      className={[
        'grid grid-cols-[24px_1.1fr_1.6fr_1.3fr_96px_96px_36px] items-center gap-4 py-3 transition-colors hover:bg-slate-50/60',
        last ? '' : 'border-b border-slate-100',
        checked ? 'bg-brand-50/40' : '',
      ].join(' ')}
    >
      <input
        type="checkbox"
        aria-label={`Select ${comment.name}`}
        checked={checked}
        onChange={() => onSelect(comment.id)}
        className="size-4 accent-brand-500"
      />
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatarTint(comment.name)}`}>
          {initials(comment.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900">{comment.name}</p>
          <p className="truncate text-[11px] text-slate-400">{comment.email}</p>
        </div>
      </div>
      <p className="truncate text-[13px] text-slate-700">{comment.body}</p>
      <p className="truncate text-[12.5px] text-slate-500">{article.title}</p>
      <span className="text-[12px] text-slate-500">{comment.time}</span>
      <StatusChip status={comment.status} />
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
          aria-label="Row actions"
          className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200">
            {comment.status !== 'approved' && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onAct([comment.id], 'approved', 'Comment approved'); setMenuOpen(false) }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Check size={13} strokeWidth={2.5} className="text-emerald-600" /> Approve
              </button>
            )}
            {comment.status !== 'rejected' && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onAct([comment.id], 'rejected', 'Comment rejected'); setMenuOpen(false) }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <X size={13} strokeWidth={2.5} className="text-rose-500" /> Reject
              </button>
            )}
            {comment.status !== 'pending' && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onAct([comment.id], 'pending', 'Comment moved back to pending'); setMenuOpen(false) }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Timer size={13} strokeWidth={2.25} className="text-amber-600" /> Move to pending
              </button>
            )}
            <div className="my-1 h-px bg-slate-100" />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onDelete([comment.id]); setMenuOpen(false) }}
              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12.5px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <X size={13} strokeWidth={2.5} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: Status }) {
  const map = {
    pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 ring-amber-100' },
    approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
    rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-600 ring-rose-100' },
  }[status]
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${map.cls}`}>
      {map.label}
    </span>
  )
}

/* ─── Empty state ──────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50/60 px-6 py-14 text-center ring-1 ring-slate-100">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <PartyPopper size={26} strokeWidth={1.75} />
      </span>
      <p className="mt-4 font-display text-[18px] font-semibold text-slate-900">You’re all caught up</p>
      <p className="mt-1 max-w-[340px] text-[13px] text-slate-500">
        Every comment has been reviewed. Go grab a coffee — Berry will keep an eye on new ones.
      </p>
    </div>
  )
}

/* ─── Right rail: queue health ─────────────────────────────────────── */

function QueueHealthCard({
  approvalRate, approved, pending, rejected,
}: {
  approvalRate: number
  approved: number
  pending: number
  rejected: number
}) {
  const total = Math.max(approved + pending + rejected, 1)
  const seg = (n: number) => `${Math.round((n / total) * 100)}%`

  return (
    <section
      className="relative overflow-hidden rounded-2xl p-5 text-white sm:p-6"
      style={{ backgroundImage: 'linear-gradient(155deg, #4C8CFF 0%, #2D6BF5 55%, #1E52E0 100%)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-40 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)' }}
      />
      <div className="relative">
        <h2 className="text-[15px] font-semibold">Queue health</h2>
        <p className="text-[11.5px] text-white/75">Where every comment stands</p>
      </div>

      <div className="relative mt-5 flex items-baseline gap-2">
        <span className="font-display text-[34px] font-semibold leading-none tabular-nums">{approvalRate}%</span>
        <span className="text-[10.5px] uppercase tracking-widest text-white/70">approved</span>
      </div>

      <div className="relative mt-3.5 flex h-2.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full bg-white" style={{ width: seg(approved) }} />
        <div className="h-full bg-amber-300" style={{ width: seg(pending) }} />
        <div className="h-full bg-rose-400" style={{ width: seg(rejected) }} />
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <HealthCell dot="bg-white" label="Approved" value={approved} />
        <HealthCell dot="bg-amber-300" label="Pending" value={pending} />
        <HealthCell dot="bg-rose-400" label="Rejected" value={rejected} />
      </div>

      <div className="relative mt-5 flex items-start gap-2 rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-sm">
        <Sparkles size={13} className="mt-0.5 shrink-0 text-white/80" />
        <p className="flex-1 text-[12px] leading-snug text-white/90">
          <span className="font-semibold text-white">sfds@gmail.com</span> posted 3 near-identical comments in 2 minutes — Berry grouped them so you can clear them in one click.
        </p>
      </div>
    </section>
  )
}

function HealthCell({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/10 px-2.5 py-2 ring-1 ring-white/15">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold tabular-nums">
        <span className={`size-2 rounded-full ${dot}`} />
        {value}
      </p>
      <p className="mt-0.5 pl-[14px] text-[10.5px] text-white/75">{label}</p>
    </div>
  )
}

/* ─── Right rail: hot threads ──────────────────────────────────────── */

function HotThreadsCard({ comments }: { comments: Comment[] }) {
  const counts = ARTICLES.map((a) => ({
    article: a,
    count: comments.filter((c) => c.articleId === a.id).length,
  }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
  const max = counts[0]?.count ?? 1

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          <Flame size={16} strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Hot threads</h2>
          <p className="text-[11.5px] text-slate-500">Articles readers are talking about</p>
        </div>
      </div>

      <ol className="mt-5 flex flex-col gap-3">
        {counts.map(({ article, count }, i) => (
          <li key={article.id} className="flex items-center gap-3 rounded-lg -mx-1 px-1 py-1 transition-colors hover:bg-slate-50">
            <span className="font-display w-4 text-center text-[12px] font-semibold text-slate-400 tabular-nums">{i + 1}</span>
            <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.thumb} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-900">{article.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(count / max) * 100}%` }} />
                </div>
                <span className="text-[10.5px] font-medium text-slate-400">{article.category}</span>
              </div>
            </div>
            <p className="font-display shrink-0 text-[15px] font-semibold text-slate-900 tabular-nums">
              {count}<span className="text-[11px] font-medium text-slate-400"> cmt</span>
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50/60 p-3 ring-1 ring-brand-100/70">
        <TrendingUp size={14} className="mt-0.5 shrink-0 text-brand-500" />
        <p className="flex-1 text-[12px] leading-snug text-slate-700">
          Sports stories collect <span className="font-semibold text-slate-900">2.4×</span> more comments than any other section.
        </p>
      </div>
    </section>
  )
}

/* ─── Pagination (visual, matches media library) ───────────────────── */

function Pagination() {
  return (
    <div className="mt-5 flex flex-col items-center gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
      <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
        10 per page
        <ChevronDown size={12} strokeWidth={2.25} />
      </button>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={12} strokeWidth={2.25} /> Previous
        </button>
        <div className="flex items-center gap-1">
          {['1', '2'].map((p) => (
            <button
              key={p}
              className={[
                'flex size-8 items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors tabular-nums',
                p === '1' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
          Next <ArrowRight size={12} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}

/* ─── Chrome (top bar + rail, Comments active) ─────────────────────── */

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
    { icon: Home,           label: 'Home',        href: '/' },
    { icon: Plus,           label: 'New',         href: '/news/new-v11', primary: true },
    { icon: MessageSquare,  label: 'Comments',    href: '/comments', active: true },
    { icon: MessagesSquare, label: 'Chats',       href: '#' },
    { icon: ListChecks,     label: 'Tasks',       href: '#' },
    { icon: Gauge,          label: 'Performance', href: '#' },
    { icon: ImageIcon,      label: 'Media',       href: '/media' },
    { icon: Users,          label: 'Audience',    href: '#' },
    { icon: Wrench,         label: 'Tools',       href: '#' },
  ]
  const bottom = [
    { icon: Users,    label: 'Team',     href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
  ]

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[64px] shrink-0 flex-col items-center justify-between py-3 lg:flex">
      <nav className="flex flex-col items-center gap-1.5">
        {primary.map(({ icon: Icon, label, active, primary: isPrimary, href }) => (
          <Link
            key={label}
            href={href}
            title={label}
            className={[
              'flex size-11 items-center justify-center rounded-xl transition-colors',
              active
                ? 'bg-brand-500 text-white shadow-[0_6px_14px_-4px_rgba(7,135,255,0.55)]'
                : isPrimary
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'text-slate-500 hover:bg-white hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={18} strokeWidth={active || isPrimary ? 2.25 : 1.75} />
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
