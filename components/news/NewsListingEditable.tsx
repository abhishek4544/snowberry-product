'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Search, Plus, LayoutGrid, Menu, ChevronLeft, ChevronRight,
  MoreVertical, Globe, ArrowUpRight, ChevronDown,
  Home, MessageSquare, MessagesSquare, ListChecks, Gauge,
  LayoutDashboard, Users, Wrench, Settings, Bell, FolderTree,
  Trash2, Copy, RotateCcw, Pencil, X, Check,
  Newspaper, Image as ImageIcon, Bookmark, Star, Flag, Zap, Heart, Coffee,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────
   Editable News Listing
   Every visible label, icon, and card in this page can be edited in place.
   State is persisted to localStorage under `newsListingEditable:v1`.
   ───────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'newsListingEditable:v1'

const ICON_LIBRARY = {
  Home, Plus, MessageSquare, MessagesSquare, ListChecks, Gauge,
  LayoutDashboard, Users, Wrench, Settings, Newspaper, ImageIcon,
  Bookmark, Star, Flag, Zap, Heart, Coffee,
} as const
type IconKey = keyof typeof ICON_LIBRARY

type Category = {
  id: string
  name: string
  location: 'in-nav' | 'sub-menu'
  articles: string
  authors: string
  views30d: string
  delta: string
  topLabel: string
  topViews: string
  topTitle: string
}

type SidebarItem = {
  id: string
  icon: IconKey
  label: string
  highlight?: boolean
}

type PageState = {
  title: string
  subtitle: string
  tabs: string[]
  activeTab: number
  topPerfTitle: string
  topPerfSub: string
  topPerfValue: string
  searchPlaceholder: string
  addLabel: string
  categories: Category[]
  sidebarMain: SidebarItem[]
  sidebarFooter: SidebarItem[]
}

const DEFAULT_STATE: PageState = {
  title: 'News',
  subtitle: 'Top-level beats for the newsroom. Drag to reorder, click to edit.',
  tabs: ['News', 'Drafts', 'Category', 'Archived News', 'Pages'],
  activeTab: 0,
  topPerfTitle: 'Top performing this week',
  topPerfSub: 'Best-performing piece per audience surface · last 7 days',
  topPerfValue: '8',
  searchPlaceholder: 'Search Category news',
  addLabel: 'Add category',
  categories: [
    { id: 'politics',   name: 'Politics',   location: 'in-nav',   articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
    { id: 'culture',    name: 'Culture',    location: 'in-nav',   articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
    { id: 'opinion',    name: 'Opinion',    location: 'in-nav',   articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
    { id: 'business-1', name: 'Business',   location: 'sub-menu', articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
    { id: 'world',      name: 'World',      location: 'sub-menu', articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
    { id: 'business-2', name: 'Business',   location: 'in-nav',   articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
    { id: 'science',    name: 'Science',    location: 'in-nav',   articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
    { id: 'technology', name: 'Technology', location: 'in-nav',   articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
    { id: 'sports',     name: 'Sports',     location: 'in-nav',   articles: '4.8k', authors: '12', views30d: '1.2M', delta: '14%', topLabel: 'Top this month', topViews: '198.4k', topTitle: 'Govt notifies safe harbour rules for online gaming platforms' },
  ],
  sidebarMain: [
    { id: 'home',     icon: 'Home',            label: 'Home' },
    { id: 'add',      icon: 'Plus',            label: 'Create', highlight: true },
    { id: 'news',     icon: 'MessageSquare',   label: 'News' },
    { id: 'chats',    icon: 'MessagesSquare',  label: 'Discussion' },
    { id: 'tasks',    icon: 'ListChecks',      label: 'Tasks' },
    { id: 'metrics',  icon: 'Gauge',           label: 'Metrics' },
    { id: 'media',    icon: 'LayoutDashboard', label: 'Media' },
    { id: 'audience', icon: 'Users',           label: 'Audience' },
    { id: 'tools',    icon: 'Wrench',          label: 'Tools' },
  ],
  sidebarFooter: [
    { id: 'team',     icon: 'Users',    label: 'Team' },
    { id: 'settings', icon: 'Settings', label: 'Settings' },
  ],
}

/* ─── Root ─────────────────────────────────────────────────────────────── */

export default function NewsListingEditable() {
  const [state, setState] = useState<PageState>(DEFAULT_STATE)
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [selectedSidebar, setSelectedSidebar] = useState('news')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) })
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state, loaded])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return state.categories
    return state.categories.filter(c => c.name.toLowerCase().includes(q))
  }, [query, state.categories])

  function resetAll() {
    if (!confirm('Reset the entire page to its default design? Your edits will be lost.')) return
    setState(DEFAULT_STATE)
  }

  function updateCategory(id: string, patch: Partial<Category>) {
    setState(s => ({ ...s, categories: s.categories.map(c => c.id === id ? { ...c, ...patch } : c) }))
  }

  function deleteCategory(id: string) {
    setState(s => ({ ...s, categories: s.categories.filter(c => c.id !== id) }))
  }

  function duplicateCategory(id: string) {
    setState(s => {
      const idx = s.categories.findIndex(c => c.id === id)
      if (idx === -1) return s
      const src = s.categories[idx]
      const copy: Category = { ...src, id: `${src.id}-${Date.now().toString(36)}` }
      const next = [...s.categories]
      next.splice(idx + 1, 0, copy)
      return { ...s, categories: next }
    })
  }

  function addCategory() {
    const id = `new-${Date.now().toString(36)}`
    setState(s => ({
      ...s,
      categories: [
        ...s.categories,
        { id, name: 'New category', location: 'in-nav', articles: '0', authors: '0', views30d: '0', delta: '0%', topLabel: 'Top this month', topViews: '0', topTitle: 'Add a headline…' },
      ],
    }))
  }

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-slate-900" style={{ fontFamily: 'Urbanist, ui-sans-serif, system-ui, sans-serif' }}>
      <EditableSidebar
        main={state.sidebarMain}
        footer={state.sidebarFooter}
        selected={selectedSidebar}
        onSelect={setSelectedSidebar}
        onUpdateMain={items => setState(s => ({ ...s, sidebarMain: items }))}
        onUpdateFooter={items => setState(s => ({ ...s, sidebarFooter: items }))}
      />

      <div className="flex flex-1 flex-col">
        <TopBar onReset={resetAll} />

        <main className="flex flex-col gap-8 pl-[77px] pr-6 pt-10">
          <EditModeBanner onReset={resetAll} />

          <header className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-2">
              <EditableText
                as="h1"
                value={state.title}
                onChange={v => setState(s => ({ ...s, title: v }))}
                className="text-[24px] font-semibold leading-[29px] tracking-[-0.4px] text-slate-950"
              />
              <EditableText
                as="p"
                value={state.subtitle}
                onChange={v => setState(s => ({ ...s, subtitle: v }))}
                className="text-sm leading-5 text-slate-500"
              />
            </div>
            <nav className="flex items-center gap-8 pt-2 text-sm">
              {state.tabs.map((t, i) => {
                const active = state.activeTab === i
                return (
                  <div key={i} className="group/tab relative flex items-center gap-1">
                    <button
                      onClick={() => setState(s => ({ ...s, activeTab: i }))}
                      className={`relative py-2 transition ${
                        active ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <EditableText
                        as="span"
                        value={t}
                        onChange={v => setState(s => ({ ...s, tabs: s.tabs.map((x, xi) => xi === i ? v : x) }))}
                        className="cursor-text"
                      />
                      {active && <span className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-brand-500" />}
                    </button>
                    <button
                      onClick={() => setState(s => {
                        const tabs = s.tabs.filter((_, xi) => xi !== i)
                        const activeTab = s.activeTab === i ? 0 : s.activeTab > i ? s.activeTab - 1 : s.activeTab
                        return { ...s, tabs, activeTab: Math.min(activeTab, Math.max(0, tabs.length - 1)) }
                      })}
                      aria-label="Remove tab"
                      className="ml-0.5 hidden h-4 w-4 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 group-hover/tab:flex"
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                )
              })}
              <button
                onClick={() => setState(s => ({ ...s, tabs: [...s.tabs, 'New tab'] }))}
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Add tab"
                title="Add tab"
              >
                <Plus className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </nav>
          </header>

          <section className="flex items-end justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div>
              <EditableText
                as="p"
                value={state.topPerfTitle}
                onChange={v => setState(s => ({ ...s, topPerfTitle: v }))}
                className="text-sm font-semibold leading-5 text-slate-900"
              />
              <EditableText
                as="p"
                value={state.topPerfSub}
                onChange={v => setState(s => ({ ...s, topPerfSub: v }))}
                className="mt-1 text-sm leading-5 text-slate-500"
              />
            </div>
            <EditableText
              as="p"
              value={state.topPerfValue}
              onChange={v => setState(s => ({ ...s, topPerfValue: v }))}
              className="text-[28px] font-semibold leading-none text-slate-950"
            />
          </section>

          <section className="flex items-center justify-between gap-3">
            <div className="flex h-10 w-[427px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition">
              <Search className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
              <input
                className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
                placeholder={state.searchPlaceholder}
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1) }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={addCategory}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                <EditableText
                  as="span"
                  value={state.addLabel}
                  onChange={v => setState(s => ({ ...s, addLabel: v }))}
                />
              </button>
              <div className="inline-flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => setView('grid')}
                  aria-pressed={view === 'grid'}
                  aria-label="Grid view"
                  className={`flex h-full w-10 items-center justify-center transition ${view === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <LayoutGrid className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <span className="w-px bg-slate-200" />
                <button
                  onClick={() => setView('list')}
                  aria-pressed={view === 'list'}
                  aria-label="List view"
                  className={`flex h-full w-10 items-center justify-center transition ${view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Menu className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </section>

          {view === 'grid' ? (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(c => (
                <EditableCategoryCard
                  key={c.id}
                  category={c}
                  onChange={patch => updateCategory(c.id, patch)}
                  onDelete={() => deleteCategory(c.id)}
                  onDuplicate={() => duplicateCategory(c.id)}
                />
              ))}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Articles</th>
                    <th className="px-4 py-3 text-left">Authors</th>
                    <th className="px-4 py-3 text-left">30d Views</th>
                    <th className="w-8 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <LetterChip letter={c.name[0]} />
                          <span className="font-medium text-slate-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><LocationPill kind={c.location} /></td>
                      <td className="px-4 py-3 text-slate-600">{c.articles}</td>
                      <td className="px-4 py-3 text-slate-600">{c.authors}</td>
                      <td className="px-4 py-3 text-slate-600">{c.views30d}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteCategory(c.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination current={page} total={5} onChange={setPage} />
          <div className="h-10" />
        </main>
      </div>
    </div>
  )
}

/* ─── Edit-mode banner ─────────────────────────────────────────────────── */

function EditModeBanner({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-brand-700">
        <Pencil className="h-4 w-4" strokeWidth={2} />
        <span className="font-medium">Edit mode</span>
        <span className="text-brand-600/80">Click any text, icon, or card element to edit. Changes save automatically.</span>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
        Reset to defaults
      </button>
    </div>
  )
}

/* ─── Top bar ──────────────────────────────────────────────────────────── */

function TopBar({ onReset }: { onReset: () => void }) {
  return (
    <header className="flex h-[60px] items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-0.5 text-brand-500">
          <span className="text-[22px] font-bold leading-none tracking-tight">snowberry</span>
          <span className="text-[9px] font-bold leading-none">TM</span>
        </div>
        <span className="h-6 w-px bg-slate-200" />
        <UkaloBrand />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-[420px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition">
          <Search className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
          <input className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none" placeholder="Search articles, authors, tags…" />
          <span className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">⌘ K</span>
        </div>
        <button
          onClick={onReset}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          title="Reset all edits"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
          Reset
        </button>
        <button aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition">
          <Bell className="h-5 w-5" strokeWidth={1.8} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition">
          <Settings className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <div role="img" aria-label="Account" className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-amber-300 to-rose-400 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
      </div>
    </header>
  )
}

function UkaloBrand() {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-white">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
          <path d="M2 9L5 4L7 7L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-sm font-medium leading-none text-slate-800">उकालो</span>
    </div>
  )
}

/* ─── Editable Sidebar ─────────────────────────────────────────────────── */

function EditableSidebar({
  main, footer, selected, onSelect, onUpdateMain, onUpdateFooter,
}: {
  main: SidebarItem[]
  footer: SidebarItem[]
  selected: string
  onSelect: (id: string) => void
  onUpdateMain: (items: SidebarItem[]) => void
  onUpdateFooter: (items: SidebarItem[]) => void
}) {
  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-center justify-between border-r border-slate-200 bg-white pb-6 pt-8">
      <ul className="flex flex-col items-center gap-2">
        {main.map(it => (
          <SidebarItemView
            key={it.id}
            item={it}
            active={selected === it.id}
            onSelect={() => onSelect(it.id)}
            onChange={patch => onUpdateMain(main.map(m => m.id === it.id ? { ...m, ...patch } : m))}
            onDelete={() => onUpdateMain(main.filter(m => m.id !== it.id))}
          />
        ))}
        <li>
          <button
            onClick={() => onUpdateMain([...main, { id: `s-${Date.now().toString(36)}`, icon: 'Star', label: 'New item' }])}
            aria-label="Add sidebar item"
            title="Add sidebar item"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-500"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
        </li>
      </ul>

      <ul className="flex flex-col items-center gap-2">
        {footer.map(it => (
          <SidebarItemView
            key={it.id}
            item={it}
            active={false}
            onSelect={() => {}}
            onChange={patch => onUpdateFooter(footer.map(m => m.id === it.id ? { ...m, ...patch } : m))}
            onDelete={() => onUpdateFooter(footer.filter(m => m.id !== it.id))}
          />
        ))}
      </ul>
    </aside>
  )
}

function SidebarItemView({
  item, active, onSelect, onChange, onDelete,
}: {
  item: SidebarItem
  active: boolean
  onSelect: () => void
  onChange: (patch: Partial<SidebarItem>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const Icon = ICON_LIBRARY[item.icon] ?? Home
  const ref = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!editing) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setEditing(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [editing])

  return (
    <li ref={ref} className="group/side relative">
      <button
        onClick={() => { onSelect(); setEditing(true) }}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
          item.highlight ? 'bg-brand-500 text-white shadow-[0_2px_8px_-2px_rgba(7,135,255,0.5)] hover:bg-brand-600' :
          active         ? 'bg-brand-50 text-brand-600' :
                           'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
      >
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </button>

      {/* Delete X — appears on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        aria-label="Delete item"
        className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 group-hover/side:flex"
      >
        <X className="h-2.5 w-2.5" strokeWidth={3} />
      </button>

      {/* Editor popover */}
      {editing && (
        <div className="absolute left-full top-0 z-30 ml-3 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.18)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Edit item</p>
            <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-700">
              <Check className="h-4 w-4" />
            </button>
          </div>
          <label className="block">
            <span className="text-xs text-slate-500">Label</span>
            <input
              autoFocus
              value={item.label}
              onChange={e => onChange({ label: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!item.highlight}
              onChange={e => onChange({ highlight: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-slate-300 text-brand-500 focus:ring-brand-100"
            />
            Primary action (highlighted style)
          </label>
          <div className="mt-3">
            <p className="text-xs text-slate-500">Icon</p>
            <div className="mt-1 grid grid-cols-6 gap-1.5">
              {(Object.keys(ICON_LIBRARY) as IconKey[]).map(key => {
                const I = ICON_LIBRARY[key]
                const isSel = item.icon === key
                return (
                  <button
                    key={key}
                    onClick={() => onChange({ icon: key })}
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                      isSel ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    title={key}
                  >
                    <I className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

/* ─── Editable Category card ───────────────────────────────────────────── */

function EditableCategoryCard({
  category, onChange, onDelete, onDuplicate,
}: {
  category: Category
  onChange: (patch: Partial<Category>) => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.08)]">
      <div className="flex h-[51px] items-center justify-between border-b border-slate-100 px-3">
        <div className="flex items-center gap-2">
          <LetterChip letter={category.name[0]} />
          <EditableText
            as="h3"
            value={category.name}
            onChange={v => onChange({ name: v || 'Untitled' })}
            className="text-base font-medium text-slate-900"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange({ location: category.location === 'in-nav' ? 'sub-menu' : 'in-nav' })}
            title="Toggle location"
          >
            <LocationPill kind={category.location} />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Category actions"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <MoreVertical className="h-4 w-4" strokeWidth={1.8} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 flex w-40 flex-col rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                  <button onClick={() => { onDuplicate(); setMenuOpen(false) }} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button onClick={() => { onChange({ location: category.location === 'in-nav' ? 'sub-menu' : 'in-nav' }); setMenuOpen(false) }} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                    <Globe className="h-3.5 w-3.5" /> Toggle location
                  </button>
                  <div className="my-1 h-px bg-slate-100" />
                  <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-3 gap-3">
          <EditableStat label="Articles" value={category.articles} onLabelChange={() => {}} onValueChange={v => onChange({ articles: v })} />
          <EditableStat label="Authors"  value={category.authors}  onLabelChange={() => {}} onValueChange={v => onChange({ authors: v })} />
          <EditableStat
            label="30d Views"
            value={category.views30d}
            delta={category.delta}
            onDeltaChange={v => onChange({ delta: v })}
            onLabelChange={() => {}}
            onValueChange={v => onChange({ views30d: v })}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <EditableText
              as="p"
              value={category.topLabel}
              onChange={v => onChange({ topLabel: v })}
              className="text-xs font-medium uppercase tracking-wide text-slate-500"
            />
            <EditableText
              as="p"
              value={category.topViews}
              onChange={v => onChange({ topViews: v })}
              className="text-sm font-medium text-slate-600"
            />
          </div>
          <EditableText
            as="p"
            value={category.topTitle}
            onChange={v => onChange({ topTitle: v })}
            className="text-sm leading-5 text-slate-800 line-clamp-2"
          />
        </div>
      </div>
    </li>
  )
}

/* ─── Primitives ───────────────────────────────────────────────────────── */

function EditableText({
  as = 'span', value, onChange, className = '',
}: {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3'
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const Tag = as as any

  function commit() {
    const el = ref.current
    if (!el) return
    const next = (el.textContent ?? '').trim()
    if (next !== value) onChange(next)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur() }
    if (e.key === 'Escape') { if (ref.current) ref.current.textContent = value; (e.target as HTMLElement).blur() }
  }

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={commit}
      onKeyDown={onKey}
      className={`${className} -mx-1 rounded px-1 outline-none transition hover:bg-slate-100/60 focus:bg-white focus:ring-2 focus:ring-brand-200`}
    >
      {value}
    </Tag>
  )
}

function LetterChip({ letter }: { letter: string }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold uppercase text-slate-500">
      {letter}
    </span>
  )
}

function LocationPill({ kind }: { kind: 'in-nav' | 'sub-menu' }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700 transition">
      {kind === 'in-nav'
        ? <Globe className="h-3 w-3" strokeWidth={2} />
        : <FolderTree className="h-3 w-3" strokeWidth={2} />}
      {kind === 'in-nav' ? 'In Nav' : 'Sub menu'}
    </span>
  )
}

function EditableStat({
  label, value, delta, onLabelChange, onValueChange, onDeltaChange,
}: {
  label: string
  value: string
  delta?: string
  onLabelChange: (v: string) => void
  onValueChange: (v: string) => void
  onDeltaChange?: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <EditableText as="span" value={label} onChange={onLabelChange} className="text-xs text-slate-500" />
      <div className="flex items-baseline gap-1.5">
        <EditableText as="span" value={value} onChange={onValueChange} className="text-[22px] font-semibold leading-[27px] text-slate-900" />
        {delta !== undefined && onDeltaChange && (
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2.5} />
            <EditableText as="span" value={delta} onChange={onDeltaChange} />
          </span>
        )}
      </div>
    </div>
  )
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  const pages = pageWindow(current, total)
  return (
    <section className="mt-2 flex h-9 items-center justify-between">
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
        Previous
      </button>

      <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">
        10 per page
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === current ? 'page' : undefined}
              className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-md px-2 text-sm font-medium transition ${
                p === current ? 'bg-brand-500 text-white shadow-[0_1px_2px_rgba(7,135,255,0.4)]' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(Math.min(total, current + 1))}
          disabled={current === total}
          className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </section>
  )
}

function pageWindow(current: number, total: number): (number | '...')[] {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set<number>([1, 2, 3, 4, total])
  set.add(current)
  const sorted = [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | '...')[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - (sorted[i - 1] as number) > 1) out.push('...')
    out.push(n)
  })
  return out
}
