'use client'

/**
 * NewsroomCategories — Figma frame 5196:24759.
 *
 * Category taxonomy management. Two groups (In Nav / Sub menu) each shown
 * as a reorderable list of rows. A row displays the category's letter
 * avatar, name, description, aggregate metrics (article count, 30d views,
 * delta) and row actions. The top strip shows aggregate metrics across
 * the whole site.
 */

import { useState } from 'react'
import {
  Search, Bell, Settings, Home, Plus, MessageSquare, MessagesSquare,
  ListChecks, Gauge, Image as ImageIcon, Users, Wrench, ArrowUpRight,
  MoreHorizontal, ChevronDown, GripVertical, TrendingUp, Menu,
  Eye, EyeOff, Pencil, Trash2,
} from 'lucide-react'

/* ─── Data ────────────────────────────────────────────────────────────── */

type Category = {
  id: string
  key: string
  name: string
  slug: string
  description: string
  articles: number
  views: string
  delta: string
  visible: boolean
  accent: string
}

const IN_NAV: Category[] = [
  { id: 'c-pol', key: 'P', name: 'Politics', slug: 'politics', description: 'National politics, parliament and party coverage.',      articles: 1284, views: '412k', delta: '+18%', visible: true, accent: '#EF4444' },
  { id: 'c-biz', key: 'B', name: 'Business', slug: 'business', description: 'Markets, macroeconomy, and corporate news.',              articles: 942,  views: '286k', delta: '+22%', visible: true, accent: '#0787FF' },
  { id: 'c-cul', key: 'C', name: 'Culture',  slug: 'culture',  description: 'Art, heritage, food and everyday life features.',       articles: 431,  views: '124k', delta: '+9%',  visible: true, accent: '#A855F7' },
  { id: 'c-wld', key: 'W', name: 'World',    slug: 'world',    description: 'International wire and correspondent reporting.',        articles: 812,  views: '198k', delta: '+14%', visible: true, accent: '#0EA5E9' },
  { id: 'c-opn', key: 'O', name: 'Opinion',  slug: 'opinion',  description: 'Editorials, op-eds and columnist voices.',              articles: 268,  views: '96k',  delta: '+6%',  visible: true, accent: '#F59E0B' },
  { id: 'c-sci', key: 'S', name: 'Science',  slug: 'science',  description: 'Research, climate, technology and health science.',     articles: 189,  views: '58k',  delta: '+11%', visible: true, accent: '#10B981' },
]

const SUB_MENU: Category[] = [
  { id: 'c-spt', key: 'S', name: 'Sports',    slug: 'sports',    description: 'Football, cricket and national leagues.',              articles: 512, views: '164k', delta: '+16%', visible: true,  accent: '#EC4899' },
  { id: 'c-tec', key: 'T', name: 'Tech',      slug: 'tech',      description: 'Startups, IT policy and consumer tech reviews.',       articles: 278, views: '92k',  delta: '+24%', visible: true,  accent: '#6366F1' },
  { id: 'c-hth', key: 'H', name: 'Health',    slug: 'health',    description: 'Public health, hospitals and wellbeing coverage.',     articles: 156, views: '48k',  delta: '+4%',  visible: true,  accent: '#22C55E' },
  { id: 'c-edu', key: 'E', name: 'Education', slug: 'education', description: 'Schools, universities and policy shifts.',             articles: 132, views: '36k',  delta: '−2%',  visible: false, accent: '#F97316' },
]

const METRIC_STRIP = [
  { label: '30d Views', value: '1.2M',   delta: '+ 14%' },
  { label: 'Articles',  value: '198.4k', delta: '+ 6%'  },
  { label: 'Authors',   value: '12',     delta: '+ 2'   },
  { label: 'Comments',  value: '4.8k',   delta: '+ 22%' },
]

/* ─── Component ───────────────────────────────────────────────────────── */

export default function NewsroomCategories() {
  const [inNav,    setInNav]    = useState<Category[]>(IN_NAV)
  const [subMenu,  setSubMenu]  = useState<Category[]>(SUB_MENU)
  const [addOpen,  setAddOpen]  = useState<null | 'in-nav' | 'sub-menu'>(null)

  const toggleVisible = (id: string) => {
    const flip = (list: Category[]) => list.map((c) => c.id === id ? { ...c, visible: !c.visible } : c)
    setInNav(flip)
    setSubMenu(flip)
  }

  return (
    <div className="relative min-h-screen w-full bg-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[520px] rounded-full bg-teal-100/50 blur-[110px]" />
        <div className="absolute top-1/2 -right-40 size-[520px] rounded-full bg-blue-100/40 blur-[110px]" />
      </div>

      <TopBar />

      <div className="flex">
        <IconRail />

        <main className="flex-1 min-w-0 px-8 pb-10 pt-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-medium text-slate-500">Site structure</p>
              <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.01em] text-slate-950">Categories</h1>
              <p className="mt-1 text-[13.5px] text-slate-500 max-w-[560px]">
                Organise how sections appear in your site navigation. Drag to reorder,
                hide from readers without deleting, or add new categories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search categories"
                  className="h-10 w-[260px] rounded-lg border border-black/10 bg-white/70 pl-9 pr-3 text-[13.5px] text-slate-800 placeholder:text-black/40 outline-none focus:border-slate-300 transition-colors"
                />
              </div>
              <button
                onClick={() => setAddOpen('in-nav')}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-[13px] font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <Plus size={14} strokeWidth={2.25} />
                Add category
              </button>
            </div>
          </div>

          {/* Metric strip */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            {METRIC_STRIP.map((m) => (
              <div key={m.label} className="rounded-[10px] bg-white/70 backdrop-blur-md p-4 ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-slate-800/80">{m.label}</p>
                  <ArrowUpRight size={14} className="text-slate-400" />
                </div>
                <p className="mt-2 text-[26px] font-medium leading-none text-slate-950 tabular-nums">{m.value}</p>
                <p className="mt-2 text-[12px] text-emerald-600">
                  {m.delta} <span className="text-slate-500">vs prev period</span>
                </p>
              </div>
            ))}
          </div>

          {/* Group: In Nav */}
          <CategoryGroup
            title="In Nav"
            hint="Shown as top-level items in site navigation."
            categories={inNav}
            onToggleVisible={toggleVisible}
            onAdd={() => setAddOpen('in-nav')}
          />

          {/* Group: Sub menu */}
          <CategoryGroup
            title="Sub menu"
            hint="Nested inside dropdowns; not shown on the main nav bar."
            categories={subMenu}
            onToggleVisible={toggleVisible}
            onAdd={() => setAddOpen('sub-menu')}
          />
        </main>
      </div>

      {addOpen && <AddCategoryModal group={addOpen} onClose={() => setAddOpen(null)} />}
    </div>
  )
}

/* ─── Group + row ─────────────────────────────────────────────────────── */

function CategoryGroup({
  title, hint, categories, onToggleVisible, onAdd,
}: {
  title: string
  hint: string
  categories: Category[]
  onToggleVisible: (id: string) => void
  onAdd: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="group inline-flex items-center gap-1.5"
        >
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 group-hover:text-slate-700 transition-colors">{title}</p>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 tabular-nums">{categories.length}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-500 hidden md:inline">{hint}</span>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3 rounded-[12px] bg-white/70 backdrop-blur-md ring-1 ring-slate-200/50 overflow-hidden">
          <div className="grid grid-cols-[24px_minmax(0,1fr)_120px_120px_100px_44px] items-center gap-4 border-b border-slate-200 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            <span></span>
            <span>Category</span>
            <span className="text-right">Articles</span>
            <span className="text-right">30d Views</span>
            <span>Visible</span>
            <span></span>
          </div>
          {categories.map((c, i) => (
            <CategoryRow
              key={c.id}
              c={c}
              onToggleVisible={() => onToggleVisible(c.id)}
              last={i === categories.length - 1}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function CategoryRow({ c, onToggleVisible, last }: { c: Category; onToggleVisible: () => void; last: boolean }) {
  return (
    <div
      className={[
        'group grid grid-cols-[24px_minmax(0,1fr)_120px_120px_100px_44px] items-center gap-4 px-4 py-3 hover:bg-slate-50/60 transition-colors',
        last ? '' : 'border-b border-slate-100',
      ].join(' ')}
    >
      <span className="flex justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical size={14} />
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-9 items-center justify-center rounded-md font-semibold text-white text-[14px]"
          style={{ backgroundColor: c.accent }}
        >
          {c.key}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14.5px] font-medium text-slate-900">{c.name}</p>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-500">/{c.slug}</span>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-slate-500">{c.description}</p>
        </div>
      </div>

      <span className="text-right text-[13.5px] font-medium text-slate-900 tabular-nums">
        {c.articles.toLocaleString()}
      </span>

      <div className="flex flex-col items-end">
        <span className="text-[13.5px] font-medium text-slate-900 tabular-nums">{c.views}</span>
        <span className={`text-[11.5px] font-medium tabular-nums ${c.delta.startsWith('−') ? 'text-red-500' : 'text-emerald-600'}`}>
          {c.delta}
        </span>
      </div>

      <button
        onClick={onToggleVisible}
        className={[
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset transition-colors',
          c.visible
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/20 hover:bg-emerald-100'
            : 'bg-slate-100 text-slate-500 ring-slate-400/20 hover:bg-slate-200',
        ].join(' ')}
      >
        {c.visible ? <Eye size={11} /> : <EyeOff size={11} />}
        {c.visible ? 'Visible' : 'Hidden'}
      </button>

      <RowMenu />
    </div>
  )
}

function RowMenu() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-[0_4px_8px_-2px_rgba(15,23,42,0.06),0_16px_32px_-12px_rgba(15,23,42,0.12)]">
            <MenuItem icon={<Pencil size={13} />} label="Edit" />
            <MenuItem icon={<ImageIcon size={13} />} label="Change accent" />
            <div className="my-1 h-px bg-slate-100" />
            <MenuItem icon={<Trash2 size={13} />} label="Delete" danger />
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button className={[
      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-slate-50 transition-colors',
      danger ? 'text-red-600' : 'text-slate-700',
    ].join(' ')}>
      {icon}
      {label}
    </button>
  )
}

/* ─── Add category modal ─────────────────────────────────────────────── */

function AddCategoryModal({ group, onClose }: { group: 'in-nav' | 'sub-menu'; onClose: () => void }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [desc, setDesc] = useState('')
  const [accent, setAccent] = useState('#0787FF')

  const swatches = ['#EF4444', '#F59E0B', '#22C55E', '#0787FF', '#A855F7', '#EC4899', '#10B981', '#6366F1']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[440px] max-w-[92vw] overflow-hidden rounded-[16px] border border-white/70 bg-white shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)]">
        <div className="border-b border-slate-100 px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-500">Add category</p>
          <p className="mt-1 text-[16px] font-semibold text-slate-900">
            New {group === 'in-nav' ? 'top-level' : 'sub'} section
          </p>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4">
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
              }}
              placeholder="e.g. Environment"
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-[13.5px] text-slate-900 outline-none focus:border-brand-400 transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600">Slug</span>
            <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50/70 px-2.5">
              <span className="text-[12.5px] text-slate-400">/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="environment"
                className="flex-1 bg-transparent text-[13.5px] text-slate-900 outline-none"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600">Short description</span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="One sentence — helps editors and search."
              className="resize-none rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[13.5px] text-slate-900 outline-none focus:border-brand-400 transition-colors"
            />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[11.5px] font-medium text-slate-600">Accent colour</span>
            <div className="flex items-center gap-1.5">
              {swatches.map((s) => (
                <button
                  key={s}
                  onClick={() => setAccent(s)}
                  className={[
                    'size-7 rounded-md transition-all',
                    accent === s ? 'ring-2 ring-offset-2 ring-slate-900' : 'ring-1 ring-slate-200 hover:ring-slate-400',
                  ].join(' ')}
                  style={{ backgroundColor: s }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={onClose}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            Add category
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Shared shell (top bar + icon rail) ─────────────────────────────── */

function TopBar() {
  return (
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
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded bg-slate-900/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700">⌘K</kbd>
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
  )
}

function IconRail() {
  const primary = [
    { icon: Home,           label: 'Home',        active: false },
    { icon: Plus,           label: 'New',         active: false },
    { icon: MessageSquare,  label: 'Messages',    active: false },
    { icon: MessagesSquare, label: 'Chats',       active: false },
    { icon: ListChecks,     label: 'Tasks',       active: false },
    { icon: Gauge,          label: 'Performance', active: false },
    { icon: ImageIcon,      label: 'Media',       active: false },
    { icon: Menu,           label: 'Categories',  active: true  },
    { icon: Wrench,         label: 'Tools',       active: false },
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
