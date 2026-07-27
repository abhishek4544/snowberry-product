'use client'

/**
 * RolesPermissions — Snowberry newsroom / Users & permissions.
 * Enterprise CMS pattern (Linear / GitHub Enterprise / Contentful):
 *  - Dense data table with a single accent, no decorative gradients
 *  - Contextual bulk-action bar when rows are selected
 *  - Right-anchored inspector drawer with a Danger zone for status changes
 *  - Type-to-confirm on destructive transitions
 *  - Optimistic status change with an in-app Undo toast (10s window)
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, Bell, Settings, Home, Plus, MessageSquare, MessagesSquare,
  ListChecks, Gauge, Image as ImageIcon, Users, Wrench, TrendingUp,
  ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, X, MoreHorizontal, MoreVertical,
  ChevronLeft, ChevronRight, AlertTriangle,
  Check, Ban, RotateCcw, Send,
  Download, UserCog, Filter, SlidersHorizontal, Info, ArrowUpRight,
} from 'lucide-react'

/* ─── Data ────────────────────────────────────────────────────────────── */

type Status = 'Active' | 'Invited' | 'Pending Approval' | 'Deactivated'

type Member = {
  id: number
  name: string
  email: string
  avatar: string
  status: Status
  role: string
  lastActive: string
  articles: number
  joinedAt: string
}

const ROLES = [
  'Editor-in-Chief',
  'Managing Editor',
  'Editor',
  'Copy Editor',
  'Reporter',
  'Ad Manager',
]

const MEMBERS: Member[] = [
  { id: 1, name: 'Ashish Kumar',       email: 'ashish@the-citizen.press',   avatar: 'https://i.pravatar.cc/80?img=12', status: 'Active',           role: 'Editor-in-Chief', lastActive: 'Active now',   articles: 214, joinedAt: 'Jan 12, 2024' },
  { id: 2, name: 'Bidhya Shrestha',    email: 'bidhya@the-citizen.press',   avatar: 'https://i.pravatar.cc/80?img=32', status: 'Invited',          role: 'Editor',          lastActive: '12 min ago',   articles: 321, joinedAt: 'Jul 08, 2026' },
  { id: 3, name: 'Rohan Karki',        email: 'rohan@the-citizen.press',    avatar: 'https://i.pravatar.cc/80?img=15', status: 'Deactivated',      role: 'Reporter',        lastActive: '1 hr ago',     articles: 87,  joinedAt: 'Mar 04, 2025' },
  { id: 4, name: 'Puja Adhikari',      email: 'puja@the-citizen.press',     avatar: 'https://i.pravatar.cc/80?img=47', status: 'Active',           role: 'Reporter',        lastActive: '3 hr ago',     articles: 142, joinedAt: 'Sep 22, 2024' },
  { id: 5, name: 'Suresh Bhattarai',   email: 'suresh@the-citizen.press',   avatar: 'https://i.pravatar.cc/80?img=53', status: 'Active',           role: 'Managing Editor', lastActive: 'Yesterday',    articles: 96,  joinedAt: 'Feb 18, 2024' },
  { id: 6, name: 'Anisha Rajbhandari', email: 'anisha@the-citizen.press',   avatar: 'https://i.pravatar.cc/80?img=64', status: 'Pending Approval', role: 'Copy Editor',     lastActive: '5 days ago',   articles: 41,  joinedAt: 'Jul 05, 2026' },
  { id: 7, name: 'Nabin Thapa',        email: 'nabin@the-citizen.press',    avatar: 'https://i.pravatar.cc/80?img=68', status: 'Active',           role: 'Ad Manager',      lastActive: '2 days ago',   articles: 156, joinedAt: 'Nov 30, 2024' },
  { id: 8, name: 'Sabina Ghimire',     email: 'sabina@the-citizen.press',   avatar: 'https://i.pravatar.cc/80?img=25', status: 'Deactivated',      role: 'Reporter',        lastActive: '3 months ago', articles: 62,  joinedAt: 'Jul 14, 2023' },
]

/* Status → dot color (used in filter chips + drawer). */
const STATUS_DOTS: Record<Status, string> = {
  Active:             'bg-emerald-500',
  Invited:            'bg-amber-500',
  'Pending Approval': 'bg-amber-500',
  Deactivated:        'bg-rose-500',
}

/* Pill badge colors — match Figma frame 40000172:919 exactly. */
const STATUS_PILL: Record<Status, { bg: string; text: string }> = {
  Active:             { bg: '#dcfce7', text: '#14532d' },
  Invited:            { bg: '#fef9c3', text: '#713f12' },
  'Pending Approval': { bg: '#fef3c7', text: '#92400e' },
  Deactivated:        { bg: '#ffe2e2', text: '#7f1d1d' },
}

const STATUS_SOFT: Record<Status, string> = {
  Active:             'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Invited:            'bg-amber-50 text-amber-800 ring-amber-600/20',
  'Pending Approval': 'bg-amber-50 text-amber-800 ring-amber-600/20',
  Deactivated:        'bg-rose-50 text-rose-700 ring-rose-600/20',
}

type Transition = {
  to: Status
  label: string
  intent: 'primary' | 'neutral' | 'danger'
  destructive: boolean
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const TRANSITIONS: Record<Status, Transition[]> = {
  Invited: [
    { to: 'Active',      label: 'Resend invite',   intent: 'neutral', destructive: false, icon: Send },
    { to: 'Deactivated', label: 'Revoke invite',   intent: 'danger',  destructive: true,  icon: Ban  },
  ],
  'Pending Approval': [
    { to: 'Active',      label: 'Approve',         intent: 'primary', destructive: false, icon: Check },
    { to: 'Deactivated', label: 'Reject',          intent: 'danger',  destructive: true,  icon: Ban   },
  ],
  Active: [
    { to: 'Deactivated', label: 'Deactivate',      intent: 'danger',  destructive: true,  icon: Ban },
  ],
  Deactivated: [
    { to: 'Active',      label: 'Reactivate',      intent: 'primary', destructive: false, icon: RotateCcw },
  ],
}

const REASON_CATEGORIES: Record<Status, string[]> = {
  Deactivated: ['Left the organisation', 'Contract ended', 'Policy violation', 'Duplicate account', 'Other'],
  Invited:            [],
  'Pending Approval': [],
  Active:             [],
}

type SortKey = 'name' | 'status' | 'role' | 'lastActive' | 'articles'

type Toast = {
  id: number
  title: string
  description?: string
  undo?: () => void
}

/* ─── Component ───────────────────────────────────────────────────────── */

export default function RolesPermissions() {
  const [members, setMembers]     = useState<Member[]>(MEMBERS)
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [query, setQuery]         = useState('')
  const [roleFilter, setRoleFilter]     = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [sortKey, setSortKey]     = useState<SortKey>('name')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toasts, setToasts]       = useState<Toast[]>([])

  const editing = editingId != null ? members.find((m) => m.id === editingId) ?? null : null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const arr = members.filter((m) => {
      if (roleFilter !== 'all'   && m.role   !== roleFilter)   return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      )
    })
    arr.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [members, query, roleFilter, statusFilter, sortKey, sortDir])

  const counts = useMemo(() => {
    const c = { total: members.length } as Record<string, number>
    for (const m of members) c[m.status] = (c[m.status] ?? 0) + 1
    return c
  }, [members])

  const toggleRow = (id: number) => {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    setSelected((s) => s.size === filtered.length ? new Set() : new Set(filtered.map((m) => m.id)))
  }
  const clearSelection = () => setSelected(new Set())

  const pushToast = (t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, ...t }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 10000)
  }

  const setMemberStatus = (id: number, next: Status, meta?: { reason?: string; note?: string }) => {
    const prev = members.find((m) => m.id === id)
    if (!prev) return
    const previousStatus = prev.status
    setMembers((list) => list.map((m) => m.id === id ? { ...m, status: next } : m))
    pushToast({
      title: `${prev.name} → ${next}`,
      description: meta?.reason ? `Reason: ${meta.reason}` : undefined,
      undo: () => setMembers((list) => list.map((m) => m.id === id ? { ...m, status: previousStatus } : m)),
    })
  }

  const updateMember = (id: number, patch: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m))
  }

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/40">
      <TopBar />

      <div className="flex">
        <IconRail />

        <main className="flex-1 min-w-0">
          {/* ── Page header ── */}
          <div className="border-b border-slate-100 bg-white">
            <div className="mx-auto max-w-[1400px] px-8 pt-8 pb-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-slate-950">
                      Users &amp; permissions
                    </h1>
                    <span className="text-[13.5px] text-slate-500 tabular-nums">{counts.total} members</span>
                  </div>
                  <p className="mt-2 text-[14px] leading-[22px] text-slate-500 max-w-[640px]">
                    Add people, assign roles and fine-tune what each user can do
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-[13.5px] font-medium text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                    <UserCog size={15} />
                    Role and permission
                  </button>
                  <button className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0787ff] px-4 text-[13.5px] font-semibold text-white shadow-[0_1px_2px_rgba(7,135,255,0.30)] hover:bg-[#0670d8] transition-colors">
                    <Plus size={15} strokeWidth={2.5} />
                    Invite User
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ── Toolbar / bulk actions ── */}
          <div className="mx-auto max-w-[1400px] px-8 pt-5">
            {selected.size > 0 ? (
              <BulkActionBar
                count={selected.size}
                total={filtered.length}
                onClear={clearSelection}
                onChangeRole={() => {}}
                onDeactivate={() => {}}
                onExport={() => {}}
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="relative w-[486px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search people, role, active…"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0787ff]/20 focus:border-[#0787ff]/40 transition-all"
                  />
                </div>
                <FilterSelect
                  label="Role"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={[{ v: 'all', label: 'All roles' }, ...ROLES.map((r) => ({ v: r, label: r }))]}
                />
                <FilterSelect
                  label="Status"
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as Status | 'all')}
                  options={[
                    { v: 'all',              label: 'All statuses' },
                    { v: 'Active',           label: 'Active' },
                    { v: 'Invited',          label: 'Invited' },
                    { v: 'Pending Approval', label: 'Pending Approval' },
                    { v: 'Deactivated',      label: 'Deactivated' },
                  ]}
                />
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="mx-auto max-w-[1400px] px-8 pt-5 pb-10">
            <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
              <table className="w-full text-left">
                <colgroup>
                  <col style={{ width: 44 }} />
                  <col style={{ width: 40 }} />
                  <col />
                  <col style={{ width: 165 }} />
                  <col style={{ width: 165 }} />
                  <col style={{ width: 148 }} />
                  <col style={{ width: 101 }} />
                  <col style={{ width: 78 }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f8fafc]">
                    <th className="h-14 pl-5 pr-1">
                      <Checkbox
                        checked={selected.size === filtered.length && filtered.length > 0}
                        indeterminate={selected.size > 0 && selected.size < filtered.length}
                        onChange={toggleAll}
                      />
                    </th>
                    <ThPlain>#</ThPlain>
                    <ThSort  label="Member"      k="name"       sortKey={sortKey} sortDir={sortDir} onSort={sortBy} />
                    <ThSort  label="Status"      k="status"     sortKey={sortKey} sortDir={sortDir} onSort={sortBy} />
                    <ThSort  label="Role"        k="role"       sortKey={sortKey} sortDir={sortDir} onSort={sortBy} />
                    <ThSort  label="Last active" k="lastActive" sortKey={sortKey} sortDir={sortDir} onSort={sortBy} />
                    <ThSort  label="Articles"    k="articles"   sortKey={sortKey} sortDir={sortDir} onSort={sortBy} />
                    <ThPlain>Actions</ThPlain>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-20 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Users size={18} />
                          </div>
                          <p className="text-[14.5px] font-medium text-slate-800">No members match your filters</p>
                          <p className="text-[13px] text-slate-500">Clear filters or invite a new user to get started.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map((m, i) => {
                    const active = editing?.id === m.id
                    return (
                      <tr
                        key={m.id}
                        className={[
                          'group border-b border-slate-100 last:border-b-0 transition-colors',
                          active ? 'bg-[#ebf6ff]/60' : 'hover:bg-slate-50/70',
                        ].join(' ')}
                      >
                        <td className="h-[74px] pl-5 pr-1" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(m.id)}
                            onChange={() => toggleRow(m.id)}
                          />
                        </td>
                        <td className="text-[13px] text-slate-500 tabular-nums">{i + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.avatar}
                              alt=""
                              className="size-[42px] shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <div className="min-w-0">
                              <p className={[
                                'truncate text-[14.5px] font-medium leading-5',
                                m.status === 'Deactivated' ? 'text-slate-500 line-through' : 'text-slate-950',
                              ].join(' ')}>
                                {m.name}
                              </p>
                              <p className="mt-0.5 truncate text-[13px] text-slate-500 leading-5">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="pr-4">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="pr-4 text-[13.5px] text-slate-800">{m.role}</td>
                        <td className="pr-4 text-[13.5px] text-slate-600">{m.lastActive}</td>
                        <td className="pr-4 text-[13.5px] text-slate-800 tabular-nums">{m.articles.toLocaleString()}</td>
                        <td className="pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <RowMenu onEdit={() => setEditingId(m.id)} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Table footer / pagination */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
                <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                  <ChevronLeft size={13} /> Previous
                </button>
                <div className="flex items-center gap-3">
                  <button className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    10 per page <ChevronDown size={13} />
                  </button>
                  <div className="flex items-center gap-0.5">
                    <PageBtn>1</PageBtn>
                    <PageBtn active>2</PageBtn>
                    <PageBtn>3</PageBtn>
                    <PageBtn>4</PageBtn>
                    <span className="px-1 text-[13px] text-slate-400">…</span>
                    <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {editing && (
          <EditMemberDrawer
            member={editing}
            onClose={() => setEditingId(null)}
            onChange={(patch) => updateMember(editing.id, patch)}
            onStatusChange={(next, meta) => setMemberStatus(editing.id, next, meta)}
          />
        )}
      </div>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex min-w-[320px] items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-900 px-4 py-2.5 shadow-[0_16px_32px_-12px_rgba(15,23,42,0.4)]"
          >
            <div className="flex-1">
              <p className="text-[13px] font-medium text-white">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[12px] text-slate-300">{t.description}</p>}
            </div>
            {t.undo && (
              <button
                onClick={() => { t.undo!(); setToasts((prev) => prev.filter((x) => x.id !== t.id)) }}
                className="rounded-md px-2 py-1 text-[12.5px] font-semibold text-[#4dabff] hover:bg-white/10 transition-colors"
              >
                Undo
              </button>
            )}
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Toolbar bits ────────────────────────────────────────────────────── */

function StatusChip({
  label, count, active, onClick, tone,
}: { label: string; count: number; active: boolean; onClick: () => void; tone?: Status }) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-all',
        active
          ? 'bg-slate-900 text-white shadow-[0_1px_2px_rgba(15,23,42,0.15)]'
          : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900',
      ].join(' ')}
    >
      {tone && <span className={['size-1.5 rounded-full', STATUS_DOTS[tone]].join(' ')} />}
      {label}
      <span className={[
        'tabular-nums text-[11.5px] rounded-full px-1.5 py-[1.5px]',
        active ? 'bg-white/15 text-white/90' : 'bg-white text-slate-500 ring-1 ring-slate-200',
      ].join(' ')}>{count}</span>
    </button>
  )
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { v: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-9 text-[13.5px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 outline-none focus:ring-2 focus:ring-[#0787ff]/20 focus:border-[#0787ff]/40 transition-all"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.v === 'all' ? o.label : `${label}: ${o.label}`}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  )
}

function BulkActionBar({
  count, total, onClear, onChangeRole, onDeactivate, onExport,
}: {
  count: number
  total: number
  onClear: () => void
  onChangeRole: () => void
  onDeactivate: () => void
  onExport: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-900/10 bg-slate-900 px-3 py-1.5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.15)]">
      <span className="text-[13px] font-medium">
        {count} selected <span className="text-slate-400 tabular-nums">of {total}</span>
      </span>
      <span className="h-4 w-px bg-white/15" />
      <button onClick={onChangeRole} className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-[12.5px] font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors">
        <UserCog size={13} /> Change role
      </button>
      <button onClick={onDeactivate} className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-[12.5px] font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors">
        <Ban size={13} /> Deactivate
      </button>
      <button onClick={onExport} className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-[12.5px] font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors">
        <Download size={13} /> Export
      </button>
      <span className="flex-1" />
      <button onClick={onClear} className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-[12.5px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
        <X size={13} /> Clear
      </button>
    </div>
  )
}

/* ─── Table primitives ───────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_PILL[status]
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-[3px] text-[12.5px] font-medium leading-[18px]"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  )
}

function ThPlain({ children }: { children?: React.ReactNode }) {
  return (
    <th className="h-14 px-2 text-left text-[13px] font-medium text-slate-500">
      {children}
    </th>
  )
}

function ThSort<K extends string>({
  label, k, sortKey, sortDir, onSort, align,
}: {
  label: string
  k: K
  sortKey: string
  sortDir: 'asc' | 'desc'
  onSort: (k: K) => void
  align?: 'right'
}) {
  const isActive = sortKey === k
  const Icon = !isActive ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th className={['h-14 pr-4', align === 'right' ? 'text-right' : 'text-left'].join(' ')}>
      <button
        onClick={() => onSort(k)}
        className={[
          'inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors',
          align === 'right' ? 'flex-row-reverse' : '',
          isActive ? 'text-slate-800' : 'text-slate-500 hover:text-slate-800',
        ].join(' ')}
      >
        {label}
        <Icon size={13} strokeWidth={2.25} className={isActive ? 'text-slate-500' : 'text-slate-300'} />
      </button>
    </th>
  )
}

function PageBtn({
  children, active, disabled,
}: { children: React.ReactNode; active?: boolean; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      className={[
        'flex h-9 min-w-[36px] items-center justify-center rounded-md px-2.5 text-[13px] font-medium transition-colors',
        active
          ? 'bg-[#0787ff] text-white'
          : disabled
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Checkbox({
  checked, indeterminate, onChange,
}: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={[
        'flex size-[18px] items-center justify-center rounded-[5px] border transition-all',
        checked || indeterminate
          ? 'border-[#0787ff] bg-[#0787ff] text-white'
          : 'border-slate-300 bg-white hover:border-slate-400',
      ].join(' ')}
      aria-checked={checked}
      role="checkbox"
    >
      {indeterminate ? (
        <span className="block h-0.5 w-2.5 rounded bg-white" />
      ) : checked ? (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5l2.5 2.5L9 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  )
}

function RowMenu({ onEdit }: { onEdit?: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Row actions"
        className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-[0_4px_8px_-2px_rgba(15,23,42,0.06),0_16px_32px_-12px_rgba(15,23,42,0.14)]">
          <MenuItem label="Edit member" onClick={() => { setOpen(false); onEdit?.() }} />
          <MenuItem label="Copy email" />
          <MenuItem label="Reset password" />
          <div className="my-1 h-px bg-slate-100" />
          <MenuItem label="Deactivate" danger />
        </div>
      )}
    </div>
  )
}
function MenuItem({ label, danger, onClick }: { label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center px-3 py-1.5 text-left text-[12.5px] hover:bg-slate-50 transition-colors',
        danger ? 'text-red-600' : 'text-slate-700',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

/* ─── Edit Member drawer ─────────────────────────────────────────────── */

function EditMemberDrawer({
  member, onClose, onChange, onStatusChange,
}: {
  member: Member
  onClose: () => void
  onChange: (patch: Partial<Member>) => void
  onStatusChange: (next: Status, meta?: { reason?: string; note?: string }) => void
}) {
  const [fullName, setFullName] = useState(member.name)
  const [email, setEmail]       = useState(member.email)
  const [role, setRole]         = useState(member.role)
  const [confirming, setConfirming] = useState<Transition | null>(null)

  useEffect(() => {
    setFullName(member.name); setEmail(member.email); setRole(member.role)
  }, [member.id])

  const allowed = TRANSITIONS[member.status]
  const dirty = fullName !== member.name || email !== member.email || role !== member.role

  return (
    <>
      {/* Non-modal inspector drawer (Linear pattern) */}
      <aside className="fixed right-0 top-[68px] bottom-0 z-30 w-[480px] max-w-[calc(100vw-32px)] border-l border-slate-200 bg-white shadow-[-8px_0_24px_-16px_rgba(15,23,42,0.14)]">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[17px] font-semibold text-slate-950">Edit Member</h2>
              <StatusBadge status={member.status} />
            </div>
            <button
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Identity */}
          <div className="flex items-center gap-3.5 border-b border-slate-100 px-6 py-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={member.avatar} alt="" className="size-12 rounded-full object-cover ring-1 ring-slate-200" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-slate-950 leading-[22px]">{member.name}</p>
              <p className="mt-0.5 truncate text-[13.5px] text-slate-500 leading-[20px]">{member.email}</p>
              <p className="mt-1 text-[12.5px] text-slate-400">Joined {member.joinedAt} · {member.articles} articles</p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <Section title="Profile">
              <div className="flex flex-col gap-3">
                <Field label="Full name">
                  <TextInput value={fullName} onChange={setFullName} />
                </Field>
                <Field label="Email">
                  <TextInput value={email} onChange={setEmail} type="email" />
                </Field>
                <Field label="Role" hint="Determines default permissions in every desk.">
                  <SelectInput value={role} onChange={setRole} options={ROLES} />
                </Field>
              </div>
            </Section>

            <Section title="Access & permissions">
              <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-3">
                <PermRow label="Can log in"          allowed={member.status === 'Active'} />
                <PermRow label="Receives emails"     allowed={member.status !== 'Deactivated'} />
                <PermRow label="Can publish"         allowed={member.status === 'Active'} />
                <PermRow label="Receives assignments" allowed={member.status === 'Active'} />
                <PermRow label="Byline attribution"   allowed={true} note={member.status === 'Deactivated' ? 'Shown as "Former contributor"' : undefined} />
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11.5px] text-slate-500">
                <Info size={11} />
                Derived from status × role. Change role or status to modify.
              </p>
            </Section>

            <Section title="Account status">
              <StatusField
                status={member.status}
                allowed={allowed}
                onSelect={(t) => {
                  if (t.destructive) setConfirming(t)
                  else onStatusChange(t.to)
                }}
              />
            </Section>

            <Section title="Recent activity">
              <ul className="flex flex-col gap-2.5 text-[12.5px]">
                <ActivityRow when="2 days ago"   who="Bidhya Shrestha" what={<>Changed role from <em>Reporter</em> to <em>{member.role}</em></>} />
                <ActivityRow when="Aug 12, 2025" who="System"          what="Password reset email delivered" />
                <ActivityRow when="Jul 30, 2025" who="Aashish R."      what="Approved account" />
              </ul>
              <button className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#0787ff] hover:underline">
                View full audit log <ArrowUpRight size={12} />
              </button>
            </Section>
          </div>

          {/* Footer */}
          <div className="flex h-16 items-center justify-between border-t border-slate-200 bg-slate-50/60 px-6">
            {dirty ? (
              <span className="text-[13px] text-amber-700">Unsaved changes</span>
            ) : (
              <span className="text-[13px] text-slate-400">All changes saved</span>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="inline-flex h-10 items-center rounded-lg px-4 text-[13.5px] font-medium text-slate-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!dirty}
                onClick={() => { onChange({ name: fullName, email, role }); onClose() }}
                className={[
                  'inline-flex h-10 items-center rounded-lg px-4 text-[13.5px] font-semibold transition-colors',
                  dirty
                    ? 'bg-[#0787ff] text-white shadow-[0_1px_2px_rgba(7,135,255,0.30)] hover:bg-[#0670d8]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                ].join(' ')}
              >
                Update Changes
              </button>
            </div>
          </div>
        </div>
      </aside>

      {confirming && (
        <ConfirmTransitionDialog
          member={member}
          transition={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={(reason, note) => { onStatusChange(confirming.to, { reason, note }); setConfirming(null) }}
        />
      )}
    </>
  )
}

function Section({
  title, children, tone,
}: { title: string; children: React.ReactNode; tone?: 'danger' }) {
  return (
    <section className="border-b border-slate-100 px-6 py-5">
      <p className={[
        'mb-3.5 text-[11.5px] font-semibold uppercase tracking-[0.08em]',
        tone === 'danger' ? 'text-red-600' : 'text-slate-500',
      ].join(' ')}>
        {title}
      </p>
      {children}
    </section>
  )
}

function Field({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-slate-800 leading-5">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-slate-500">{hint}</span>}
    </label>
  )
}

function TextInput({
  value, onChange, type = 'text',
}: { value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-950 outline-none focus:ring-2 focus:ring-[#0787ff]/20 focus:border-[#0787ff]/40 transition-all"
    />
  )
}

function SelectInput({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-[14px] text-slate-950 outline-none focus:ring-2 focus:ring-[#0787ff]/20 focus:border-[#0787ff]/40 transition-all"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  )
}

function PermRow({ label, allowed, note }: { label: string; allowed: boolean; note?: string }) {
  return (
    <div className="flex items-center justify-between text-[13.5px]">
      <span className="text-slate-800">{label}</span>
      <span className={[
        'inline-flex items-center gap-2',
        allowed ? 'text-emerald-700' : 'text-slate-400',
      ].join(' ')}>
        <span className={['size-2 rounded-full', allowed ? 'bg-emerald-500' : 'bg-slate-300'].join(' ')} />
        {allowed ? 'Allowed' : 'Denied'}
        {note && <span className="text-slate-400">· {note}</span>}
      </span>
    </div>
  )
}

function ActivityRow({ when, who, what }: { when: string; who: string; what: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-slate-300" />
      <div className="min-w-0 flex-1">
        <p className="text-slate-700">{what}</p>
        <p className="mt-0.5 text-[11.5px] text-slate-400">{who} · {when}</p>
      </div>
    </li>
  )
}

/* Two-column split card.
 * Left: metadata identity — big status label, hint, since/actor grounding.
 * Right: full-width stacked action buttons — every valid transition is a
 *        real button, not hidden behind a menu or popover.
 * Pattern: GitHub Enterprise repo settings, Contentful entry-status widget,
 *          Atlassian project-state manager. Trade-off: takes more vertical
 *          space than prior variations, but maximum discoverability +
 *          zero-click access to every state change. */

const STATUS_HINTS: Record<Status, string> = {
  Active:             'Full access',
  Invited:            'Awaiting acceptance',
  'Pending Approval': 'Awaiting admin approval',
  Deactivated:        'No access',
}

const TRANSITION_HINT: Record<string, string> = {
  'Deactivate':      'Close account, 30-day grace',
  'Reactivate':      'Restore full access',
  'Approve':         'Grant access to the newsroom',
  'Reject':          'Decline the request',
  'Resend invite':   'Send the invitation again',
  'Revoke invite':   'Cancel the pending invite',
}

/* Colored left-rail per status accent — feeds the peripheral vision
 * for scannability. GitHub deployment cards, Vercel build cards, Linear
 * issue side-rails all use this pattern. */
const STATUS_RAIL: Record<Status, string> = {
  Active:             'bg-emerald-500',
  Invited:            'bg-amber-500',
  'Pending Approval': 'bg-amber-500',
  Deactivated:        'bg-rose-500',
}

function StatusField({
  status, allowed, onSelect,
}: {
  status: Status
  allowed: Transition[]
  onSelect: (t: Transition) => void
}) {
  /* Consistent slot pattern across every state:
   *   header  — status + metadata + History link (always present)
   *   footer  — LEFT slot = positive action button (0 or 1)
   *             RIGHT slot = quiet destructive text-link (0 or 1)
   * Container is invariant; contents adapt to state. Every drawer looks the
   * same shape whether the user is Active, Invited, Pending, or Deactivated. */
  const positive    = allowed.find((t) => !t.destructive) ?? null
  const destructive = allowed.find((t) =>  t.destructive) ?? null

  return (
    <div className="relative flex overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className={['w-1 shrink-0', STATUS_RAIL[status]].join(' ')} aria-hidden />

      <div className="flex-1 min-w-0">
        {/* Header — status + metadata */}
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-[15.5px] font-semibold text-slate-950 leading-5">{status}</p>
              <span className="text-[12.5px] text-slate-500">{STATUS_HINTS[status]}</span>
            </div>
            <p className="mt-1 text-[12px] text-slate-500 leading-[18px]">
              Since <span className="font-medium text-slate-700">Aug 12, 2025</span>
              {' '}· by <span className="font-medium text-slate-700">Aashish Rajbhandari</span>
            </p>
          </div>
          <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0">
            History <ArrowUpRight size={11} />
          </button>
        </div>

        {/* Footer — same container every time */}
        <div className="flex min-h-[46px] items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
          {/* Left slot — primary positive action */}
          <div className="flex items-center gap-2 min-w-0">
            {positive ? (
              <>
                <button
                  onClick={() => onSelect(positive)}
                  title={TRANSITION_HINT[positive.label] ?? positive.label}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0787ff] px-3 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(7,135,255,0.25)] hover:bg-[#0670d8] transition-colors"
                >
                  {(() => { const I = positive.icon; return <I size={13} strokeWidth={2} /> })()}
                  {positive.label}
                </button>
                <span className="text-[11.5px] text-slate-500 truncate">
                  {TRANSITION_HINT[positive.label]}
                </span>
              </>
            ) : (
              <span className="text-[11.5px] text-slate-400">
                {status === 'Active' ? 'Everything is in order.' : ''}
              </span>
            )}
          </div>

          {/* Right slot — quiet destructive text-link */}
          <div className="ml-auto shrink-0">
            {destructive ? (
              <button
                onClick={() => onSelect(destructive)}
                title={TRANSITION_HINT[destructive.label] ?? destructive.label}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] font-medium text-slate-500 hover:text-red-600 transition-colors"
              >
                {destructive.label}
                <ChevronRight size={11} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <span className="text-[11.5px] text-slate-400">No destructive actions</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TransitionButton({
  transition, onClick,
}: { transition: Transition; onClick: () => void }) {
  const Icon = transition.icon
  const styles =
    transition.intent === 'primary'
      ? 'bg-[#0787ff] text-white hover:bg-[#0670d8] shadow-[0_1px_2px_rgba(7,135,255,0.30)]'
      : transition.intent === 'danger'
        ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300'
        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
  return (
    <button
      onClick={onClick}
      className={['inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors', styles].join(' ')}
    >
      <Icon size={14} strokeWidth={2} />
      {transition.label}
    </button>
  )
}

/* Type-to-confirm dialog for destructive transitions. */
function ConfirmTransitionDialog({
  member, transition, onCancel, onConfirm,
}: {
  member: Member
  transition: Transition
  onCancel: () => void
  onConfirm: (reasonCategory: string, note: string) => void
}) {
  const reasons = REASON_CATEGORIES[transition.to] ?? []
  const [reason, setReason] = useState(reasons[0] ?? '')
  const [note, setNote]     = useState('')
  const [typed, setTyped]   = useState('')
  const needsType = transition.to === 'Deactivated'
  const canConfirm = !needsType || typed === member.email

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[440px] max-w-[92vw] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_60px_-15px_rgba(15,23,42,0.35)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 pt-4 pb-3">
          <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
            <AlertTriangle size={15} />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-slate-900">{transition.label} {member.name.split(' ')[0]}?</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Status will change from{' '}
              <span className="font-medium text-slate-700">{member.status}</span>{' '}to{' '}
              <span className="font-medium text-slate-700">{transition.to}</span>.
              This action is reversible for 10 seconds.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          {reasons.length > 0 && (
            <Field label="Reason" hint="Shown in the audit log and in reporting.">
              <SelectInput value={reason} onChange={setReason} options={reasons} />
            </Field>
          )}

          <Field label="Note (optional)" hint="Shared with the user in their notification email.">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add context so the user understands the change."
              className="resize-none rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition-all"
            />
          </Field>

          {needsType && (
            <Field label={<>Type <code className="rounded bg-slate-100 px-1 py-[1px] font-mono text-[11.5px] text-slate-700">{member.email}</code> to confirm</>}>
              <TextInput value={typed} onChange={setTyped} />
            </Field>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!canConfirm}
            onClick={() => onConfirm(reason, note)}
            className={[
              'rounded-md px-3 py-1.5 text-[13px] font-semibold text-white transition-colors',
              canConfirm ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed',
            ].join(' ')}
          >
            {transition.label}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Shared shell ────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-7">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-[22px] font-bold tracking-tight text-slate-950">snowberry</span>
        </div>
        <span className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <TrendingUp size={17} className="text-teal-600" strokeWidth={2.25} />
          <span className="text-[16px] font-semibold text-teal-700 font-display">उकालो</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-[440px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles, authors, tags…"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-16 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0787ff]/20 focus:border-[#0787ff]/40 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11.5px] font-medium text-slate-500">⌘K</kbd>
        </div>
        <button className="flex size-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
          <Bell size={18} strokeWidth={1.75} />
        </button>
        <button className="flex size-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
          <Settings size={18} strokeWidth={1.75} />
        </button>
        <div className="size-10 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&auto=format&fit=crop" alt="" className="size-full object-cover" />
        </div>
      </div>
    </header>
  )
}

function IconRail() {
  const primary = [
    { icon: Home,           label: 'Home' },
    { icon: Plus,           label: 'New' },
    { icon: MessageSquare,  label: 'Messages' },
    { icon: MessagesSquare, label: 'Chats' },
    { icon: ListChecks,     label: 'Tasks' },
    { icon: Gauge,          label: 'Performance' },
    { icon: ImageIcon,      label: 'Media' },
    { icon: Users,          label: 'People', active: true },
    { icon: Wrench,         label: 'Tools' },
  ]
  return (
    <aside className="sticky top-[68px] flex h-[calc(100vh-68px)] w-[64px] shrink-0 flex-col items-center justify-between border-r border-slate-200 bg-white py-4">
      <nav className="flex flex-col items-center gap-1.5">
        {primary.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            title={label}
            className={[
              'group relative flex size-11 items-center justify-center rounded-lg transition-colors',
              active
                ? 'bg-[#ebf6ff] text-[#0787ff]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={20} strokeWidth={1.75} />
            {active && <span className="absolute -left-2 top-2 bottom-2 w-[2.5px] rounded-full bg-[#0787ff]" />}
          </button>
        ))}
      </nav>
      <nav className="flex flex-col items-center gap-1.5">
        <button title="Settings" className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
          <Settings size={20} strokeWidth={1.75} />
        </button>
      </nav>
    </aside>
  )
}
