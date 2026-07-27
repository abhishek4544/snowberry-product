'use client'

/**
 * MenuManagement — Snowberry Site configuration → Menu.
 *
 * Layout:
 *   ┌── Sidebar 235 ─┬── Panel ──────────────────────────────────────────┐
 *   │                │ Top bar                                            │
 *   │                ├────────────────────────────────────────────────────┤
 *   │                │ 3 stat cards                                       │
 *   │                ├────────────────────────────────────────────────────┤
 *   │                │ Menu section (55% Tree │ 45% Inspector)            │
 *   │                │ ┌──── Tree ────┐ ┌──── Inspector ────┐            │
 *   │                │ │ Quick-add    │ │ Selected item     │            │
 *   │                │ │ Item cards   │ │ Editable fields   │            │
 *   │                │ │ Drop target  │ │ Danger delete     │            │
 *   │                │ └──────────────┘ └───────────────────┘            │
 *   └────────────────┴────────────────────────────────────────────────────┘
 *
 * Sidebar / top bar / stats derived from Figma frame 40000005:24430.
 * The 55/45 tree+inspector split is a redesign — the original 30/70 categories
 * split was replaced because it prioritised sourcing over the menu itself.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Command,
  LayoutGrid,
  MessageSquare,
  MessagesSquare,
  ListChecks,
  Gauge,
  ImageIcon,
  Users,
  Wrench,
  ChevronDown,
  List,
  Users2,
  Settings,
  Search,
  Bell,
  GripVertical,
  MoreVertical,
  MousePointer2,
  Tag,
  FileText,
  Link2,
  Globe,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Mountain,
  Eye,
  Upload,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  X,
  ArrowRight,
  ArrowLeft,
  EyeOff,
  Copy,
  ListTree,
  type LucideIcon,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* ─── Types & data ────────────────────────────────────────────────────── */

type SourceKind = 'category' | 'page' | 'custom' | 'external'

type Source = {
  id: string
  label: string
  path: string
  kind: SourceKind
}

type MenuItem = {
  uid: string
  sourceId: string
  kind: SourceKind
  label: string
  navLabel: string
  path: string
  level: 0 | 1 | 2
  views: string
  openNewTab: boolean
  visible: boolean
  showMobile: boolean
  showDesktop: boolean
  icon: string
  description: string
}

const SOURCES: Source[] = [
  { id: 'cat-prabidhik',   label: 'प्राविधिक',     path: '/प्राविधिक',    kind: 'category' },
  { id: 'cat-business',    label: 'बिजनेसवीक',    path: '/बिजनेसवीक',   kind: 'category' },
  { id: 'cat-sports',      label: 'खेलकुद',        path: '/खेलकुद',       kind: 'category' },
  { id: 'cat-other',       label: 'अन्य',           path: '/अन्य',         kind: 'category' },
  { id: 'cat-economics',   label: 'अर्थशास्त्र',   path: '/अर्थशास्त्र',  kind: 'category' },
  { id: 'cat-politics',    label: 'Politics',       path: '/politics',      kind: 'category' },
  { id: 'cat-business-en', label: 'Business',       path: '/business',      kind: 'category' },
  { id: 'page-about',      label: 'About us',       path: '/about',         kind: 'page'    },
  { id: 'page-contact',    label: 'Contact',        path: '/contact',       kind: 'page'    },
  { id: 'page-privacy',    label: 'Privacy Policy', path: '/privacy',       kind: 'page'    },
  { id: 'custom-home',     label: 'Home',           path: '/',              kind: 'custom'  },
  { id: 'custom-latest',   label: 'Latest',         path: '/latest',        kind: 'custom'  },
  { id: 'ext-twitter',     label: 'Twitter',        path: 'https://x.com/…', kind: 'external' },
  { id: 'ext-facebook',    label: 'Facebook',       path: 'https://fb…',     kind: 'external' },
]

type RowActions = {
  onMoveUp: (uid: string) => void
  onMoveDown: (uid: string) => void
  onIndent: (uid: string) => void
  onOutdent: (uid: string) => void
  onToggleVisible: (uid: string) => void
  onDuplicate: (uid: string) => void
  onCopyPath: (path: string) => void
  onDelete: (uid: string) => void
}

type SuggestionSeverity = 'error' | 'warning' | 'info'

type Suggestion = {
  id: string
  itemUid: string
  severity: SuggestionSeverity
  title: string
  detail: string
}

const INITIAL_SUGGESTIONS: Suggestion[] = [
  { id: 's1', itemUid: 'm3', severity: 'error',   title: 'Broken path',      detail: '/बिजनेसवीक returned 404 in the last crawl' },
  { id: 's2', itemUid: 'm5', severity: 'warning', title: 'Very low engagement', detail: '0 clicks in the last 30 days · consider hiding on mobile' },
  { id: 's3', itemUid: 'm4', severity: 'info',    title: 'Duplicate label',  detail: 'Matches another item at the same level' },
]

const INITIAL_MENU: MenuItem[] = [
  seed({ uid: 'm1', sourceId: 'cat-economics', label: 'अर्थशास्त्र', path: '/अर्थशास्त्र', kind: 'category', level: 0 }),
  seed({ uid: 'm2', sourceId: 'cat-prabidhik', label: 'प्राविधिक',    path: '/प्राविधिक',   kind: 'category', level: 0 }),
  seed({ uid: 'm3', sourceId: 'cat-business',  label: 'बिजनेसवीक',   path: '/बिजनेसवीक',  kind: 'category', level: 1 }),
  seed({ uid: 'm4', sourceId: 'cat-business',  label: 'बिजनेसवीक',   path: '/बिजनेसवीक',  kind: 'category', level: 1 }),
  seed({ uid: 'm5', sourceId: 'cat-sports',    label: 'खेलकुद',       path: '/खेलकुद',      kind: 'category', level: 2 }),
  seed({ uid: 'm6', sourceId: 'cat-prabidhik', label: 'प्राविधिक',    path: '/प्राविधिक',   kind: 'category', level: 0 }),
]

function seed(partial: Pick<MenuItem, 'uid' | 'sourceId' | 'label' | 'path' | 'kind' | 'level'>): MenuItem {
  return {
    ...partial,
    navLabel: partial.label,
    views: '1.2M views',
    openNewTab: false,
    visible: true,
    showMobile: true,
    showDesktop: true,
    icon: 'none',
    description: '',
  }
}

const KIND_META: Record<SourceKind, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  category: { label: 'Category',      icon: Tag },
  page:     { label: 'Page',          icon: FileText },
  custom:   { label: 'Custom link',   icon: Link2 },
  external: { label: 'External link', icon: Globe },
}

const GROUP_ORDER: SourceKind[] = ['category', 'page', 'custom', 'external']
const GROUP_LABEL: Record<SourceKind, string> = {
  category: 'Categories',
  page: 'Pages',
  custom: 'Custom links',
  external: 'External links',
}

/* ─── Root ────────────────────────────────────────────────────────────── */

export default function MenuManagement() {
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU)
  const [selectedUid, setSelectedUid] = useState<string | null>('m1')
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS)

  const selected = useMemo(() => menu.find((m) => m.uid === selectedUid) ?? null, [menu, selectedUid])
  const activeSuggestions = useMemo(
    () => suggestions.filter((s) => menu.some((m) => m.uid === s.itemUid)),
    [suggestions, menu],
  )

  const openSuggestion = (s: Suggestion) => {
    setSelectedUid(s.itemUid)
    setSuggestions((prev) => prev.filter((x) => x.id !== s.id))
    setTimeout(() => {
      document.getElementById(`menu-row-${s.itemUid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 40)
  }
  const dismissAllSuggestions = () => setSuggestions([])

  const addItem = (source: Source) => {
    const uid = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const next: MenuItem = seed({ uid, sourceId: source.id, label: source.label, path: source.path, kind: source.kind, level: 0 })
    setMenu((m) => [...m, next])
    setSelectedUid(uid)
  }

  const updateSelected = (patch: Partial<MenuItem>) => {
    if (!selected) return
    setMenu((m) => m.map((it) => (it.uid === selected.uid ? { ...it, ...patch } : it)))
  }

  const deleteSelected = () => {
    if (!selected) return
    setMenu((m) => m.filter((it) => it.uid !== selected.uid))
    setSelectedUid(null)
  }

  const moveItem = (activeUid: string, overUid: string, newLevel: 0 | 1 | 2) => {
    setMenu((prev) => {
      const activeIdx = prev.findIndex((i) => i.uid === activeUid)
      const overIdx   = prev.findIndex((i) => i.uid === overUid)
      if (activeIdx === -1 || overIdx === -1) return prev
      const next = activeIdx === overIdx ? prev.slice() : arrayMove(prev, activeIdx, overIdx)
      return next.map((it) => (it.uid === activeUid ? { ...it, level: newLevel } : it))
    })
  }

  const rowActions: RowActions = {
    onMoveUp: (uid) => setMenu((prev) => {
      const idx = prev.findIndex((x) => x.uid === uid)
      return idx > 0 ? arrayMove(prev, idx, idx - 1) : prev
    }),
    onMoveDown: (uid) => setMenu((prev) => {
      const idx = prev.findIndex((x) => x.uid === uid)
      return idx !== -1 && idx < prev.length - 1 ? arrayMove(prev, idx, idx + 1) : prev
    }),
    onIndent: (uid) => setMenu((prev) => prev.map((x) =>
      x.uid === uid ? { ...x, level: Math.min(MAX_LEVEL, x.level + 1) as 0 | 1 | 2 } : x,
    )),
    onOutdent: (uid) => setMenu((prev) => prev.map((x) =>
      x.uid === uid ? { ...x, level: Math.max(0, x.level - 1) as 0 | 1 | 2 } : x,
    )),
    onToggleVisible: (uid) => setMenu((prev) => prev.map((x) =>
      x.uid === uid ? { ...x, visible: !x.visible } : x,
    )),
    onDuplicate: (uid) => setMenu((prev) => {
      const idx = prev.findIndex((x) => x.uid === uid)
      if (idx === -1) return prev
      const src = prev[idx]
      const dup: MenuItem = {
        ...src,
        uid: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        navLabel: `${src.navLabel} (copy)`,
      }
      return [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]
    }),
    onCopyPath: (path) => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(path).catch(() => {})
      }
    },
    onDelete: (uid) => {
      setMenu((prev) => prev.filter((x) => x.uid !== uid))
      if (selectedUid === uid) setSelectedUid(null)
    },
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#e8f1fb] via-[#f4f8fd] to-[#f8fafc] font-sans text-neutral-900">
      <TopBar />
      <Sidebar />
      <main className="ml-[72px] px-6 pb-8 pt-2">
        <PageHeader />
        <StatsRow
          items={menu}
          suggestions={activeSuggestions}
          onOpenSuggestion={openSuggestion}
          onDismissAll={dismissAllSuggestions}
        />
        <MenuSection
          items={menu}
          selected={selected}
          onSelect={setSelectedUid}
          onAdd={addItem}
          onUpdate={updateSelected}
          onDelete={deleteSelected}
          onMove={moveItem}
          rowActions={rowActions}
        />
      </main>
    </div>
  )
}

/* ─── Sidebar ─────────────────────────────────────────────────────────── */

function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 bottom-0 flex w-[72px] flex-col items-center gap-1.5 py-4">
      <SideIcon icon={LayoutGrid}   label="Dashboard" />
      <SideIcon icon={Plus}          label="New" />
      <SideIcon icon={MessageSquare} label="Content" />
      <SideIcon icon={MessagesSquare} label="Engagement" />
      <SideIcon icon={ListChecks}    label="Tasks" />
      <SideIcon icon={Gauge}         label="Performance" />
      <SideIcon icon={ImageIcon}     label="Media" />
      <SideIcon icon={Users}         label="People" />
      <SideIcon icon={Wrench}        label="Site configuration" active />
      <div className="flex-1" />
      <SideIcon icon={Users2}        label="Team" />
      <SideIcon icon={Settings}      label="Settings" />
    </aside>
  )
}

function SideIcon({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`grid size-11 place-items-center rounded-[12px] transition-all active:scale-[0.96] ${
        active
          ? 'border border-white/70 bg-white/70 text-[#0787ff] shadow-[0px_4px_12px_rgba(7,135,255,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl'
          : 'border border-transparent text-[#475569] hover:border-white/60 hover:bg-white/55 hover:text-[#0f172a] hover:shadow-[0px_2px_6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:backdrop-blur-xl'
      }`}
    >
      <Icon className="size-[20px]" />
    </button>
  )
}

function Kbd({ letter }: { letter: string }) {
  return (
    <span className="flex items-center gap-1 rounded-[4px] bg-[rgba(26,26,26,0.06)] p-0.5">
      <Command className="size-3 text-[#1e293b]" />
      <span className="text-xs leading-none text-[#1e293b]">{letter}</span>
    </span>
  )
}

/* ─── Top bar ─────────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="sticky top-0 z-30 w-full">
      {/* Frosted glass panel — sits over the page gradient. */}
      <div className="relative flex h-16 w-full items-center justify-between gap-6 border-b border-white/40 bg-white/45 px-6 backdrop-blur-2xl backdrop-saturate-150">
        {/* Inner top highlight — subtle glass sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
        />

        <TopBarBrand />

        <div className="flex flex-1 items-center justify-end gap-2.5">
          <label className="group flex h-11 w-full max-w-[460px] items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 shadow-[0px_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all focus-within:border-[#76cdff]/70 focus-within:bg-white/85 focus-within:shadow-[0px_0px_0px_4px_rgba(209,236,255,0.55),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-white/80 hover:bg-white/70">
            <Search className="size-4 text-[#475569]" />
            <input
              type="text"
              placeholder="Search articles, authors, tags…"
              className="flex-1 bg-transparent text-[14px] text-[#0f172a] outline-none placeholder:text-[#64748b]"
            />
            <Kbd letter="K" />
          </label>

          <TopIconBtn label="Notifications">
            <Bell className="size-[18px]" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#ef4444] ring-2 ring-white/80" />
          </TopIconBtn>
          <TopIconBtn label="Settings">
            <Settings className="size-[18px]" />
          </TopIconBtn>

          <button
            type="button"
            className="ml-1 grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#76CDFF] to-[#0787FF] text-sm font-semibold text-white shadow-[0px_4px_10px_rgba(7,135,255,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] ring-2 ring-white/70"
            aria-label="Account menu"
          >
            A
          </button>
        </div>
      </div>
    </header>
  )
}

function TopIconBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-full border border-white/60 bg-white/55 text-[#334155] shadow-[0px_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all hover:border-white/80 hover:bg-white/75 hover:text-[#0f172a] active:scale-[0.97]"
    >
      {children}
    </button>
  )
}

function TopBarBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-baseline gap-0.5">
        <span className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#020617]">
          snowberry
        </span>
        <sup className="text-[9px] font-semibold text-[#64748b]">TM</sup>
      </div>
      <div className="h-7 w-px bg-[#cbd5e1]" />
      <div className="flex items-center gap-1.5">
        <div className="grid size-7 place-items-center rounded-[6px] bg-gradient-to-br from-[#0787ff] to-[#003399] text-white">
          <Mountain className="size-4" />
        </div>
        <span
          className="text-[18px] font-semibold text-[#020617]"
          style={{ fontFamily: 'var(--font-mukta), var(--font-inter), sans-serif' }}
        >
          उकालो
        </span>
      </div>
    </div>
  )
}

/* ─── Page header ─────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-[#020617]">
          Menu Structure
        </h1>
        <p className="text-[14px] leading-[1.5] text-[#475569]">
          Build your site navigation — add, reorder, and nest menu items
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-[12px] border border-[#cbd5e1] bg-white px-4 text-[14px] font-semibold text-[#1e293b] shadow-[0px_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#f8fafc] hover:text-[#0f172a]"
        >
          <Eye className="size-4" />
          Preview
        </button>
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-[12px] bg-[#0787ff] px-4 text-[14px] font-semibold text-white shadow-[0px_2px_6px_rgba(7,135,255,0.28)] transition-colors hover:bg-[#0673e0]"
        >
          <Upload className="size-4" />
          Publish changes
        </button>
      </div>
    </div>
  )
}

/* ─── Stats row — icon-hero variant ──────────────────────────────────── */

const STATIC_STAT_CARDS = [
  { label: 'Top clicked',     value: '1.2M',    hint: 'Politics · +12% this month',   icon: TrendingUp,     color: '#0787ff' },
  { label: 'Needs review',    value: '3 items', hint: 'Low clicks or broken paths',   icon: AlertTriangle,  color: '#f59e0b' },
  { label: 'Combined reach',  value: '4.8M',    hint: 'Monthly menu readership',      icon: Eye,            color: '#8b5cf6' },
] as const

function StatsRow({
  items,
  suggestions,
  onOpenSuggestion,
  onDismissAll,
}: {
  items: MenuItem[]
  suggestions: Suggestion[]
  onOpenSuggestion: (s: Suggestion) => void
  onDismissAll: () => void
}) {
  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HealthCard
          items={items}
          suggestions={suggestions}
          onOpenSuggestion={onOpenSuggestion}
          onDismissAll={onDismissAll}
        />
        {STATIC_STAT_CARDS.map((c) => (
          <IconStatCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  )
}

/* ─── Menu-health card — reactive to suggestions ─────────────────────── */

function HealthCard({
  items,
  suggestions,
  onOpenSuggestion,
  onDismissAll,
}: {
  items: MenuItem[]
  suggestions: Suggestion[]
  onOpenSuggestion: (s: Suggestion) => void
  onDismissAll: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hasSuggestions = suggestions.length > 0

  useEffect(() => {
    if (!hasSuggestions && open) setOpen(false)
  }, [hasSuggestions, open])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const color = hasSuggestions ? '#f59e0b' : '#22c55e'
  const Icon = hasSuggestions ? Lightbulb : CheckCircle2
  const value = hasSuggestions
    ? `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'}`
    : 'Excellent'
  const hint = hasSuggestions
    ? 'Click to review and fix each one'
    : '0 suggestions · all checks passed'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => hasSuggestions && setOpen((v) => !v)}
        aria-expanded={hasSuggestions ? open : undefined}
        aria-haspopup={hasSuggestions ? 'dialog' : undefined}
        className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-[16px] border p-5 text-left shadow-[0px_1px_2px_rgba(15,23,42,0.04)] transition-all ${
          hasSuggestions
            ? 'cursor-pointer border-[#fde68a] bg-gradient-to-br from-white to-[#fffaf0] hover:-translate-y-0.5 hover:border-[#fcd34d] hover:shadow-[0px_8px_24px_-8px_rgba(245,158,11,0.22)]'
            : 'cursor-default border-[#e2e8f0] bg-white'
        }`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full opacity-[0.16] blur-2xl"
          style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
        />

        <div className="relative flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
            Menu health
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#0f172a]">
              {value}
            </span>
            {hasSuggestions && (
              <span className="flex items-center gap-0.5 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]">
                Review
                <ChevronRight
                  className={`size-3 transition-transform ${open ? 'rotate-90' : ''}`}
                />
              </span>
            )}
          </div>
          <span className="text-[13px] leading-snug text-[#475569]">{hint}</span>
        </div>

        <StatIconHero icon={Icon} color={color} />
      </button>

      {open && hasSuggestions && (
        <SuggestionsPopover
          items={items}
          suggestions={suggestions}
          onOpenSuggestion={onOpenSuggestion}
          onDismissAll={() => {
            onDismissAll()
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function SuggestionsPopover({
  items,
  suggestions,
  onOpenSuggestion,
  onDismissAll,
  onClose,
}: {
  items: MenuItem[]
  suggestions: Suggestion[]
  onOpenSuggestion: (s: Suggestion) => void
  onDismissAll: () => void
  onClose: () => void
}) {
  const severityMeta: Record<SuggestionSeverity, { color: string; bg: string; label: string }> = {
    error:   { color: '#dc2626', bg: '#fef2f2', label: 'Critical' },
    warning: { color: '#d97706', bg: '#fffbeb', label: 'Warning'  },
    info:    { color: '#0787ff', bg: '#eff6ff', label: 'Tip'      },
  }

  return (
    <div
      role="dialog"
      aria-label="Menu health suggestions"
      className="absolute left-0 top-full z-40 mt-2 w-[min(420px,calc(100vw-3rem))] overflow-hidden rounded-[16px] border border-white/70 bg-white/95 shadow-[0px_20px_50px_-12px_rgba(15,23,42,0.22),0px_6px_18px_-6px_rgba(15,23,42,0.10)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-[#f1f5f9] bg-white/70 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-[13px] font-semibold text-[#0f172a]">
            {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'} to review
          </span>
          <span className="text-[11px] text-[#64748b]">Click a row to jump to that menu item</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-[8px] text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <ul className="max-h-[360px] divide-y divide-[#f1f5f9] overflow-y-auto">
        {suggestions.map((s) => {
          const item = items.find((i) => i.uid === s.itemUid)
          const meta = severityMeta[s.severity]
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onOpenSuggestion(s)}
                className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc]"
              >
                <span
                  className="mt-0.5 flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <span className="mr-1 size-1.5 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] font-semibold leading-snug text-[#0f172a]">
                    {s.title}
                  </span>
                  <span className="text-[12px] leading-snug text-[#475569]">{s.detail}</span>
                  {item && (
                    <span className="mt-1 flex items-center gap-1.5 text-[11px]">
                      <span
                        className="truncate font-medium text-[#0787ff]"
                        style={{ fontFamily: 'var(--font-mukta), var(--font-inter), sans-serif' }}
                      >
                        {item.navLabel}
                      </span>
                      <span className="font-mono text-[#94a3b8]">{item.path}</span>
                    </span>
                  )}
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-[#cbd5e1] transition-all group-hover:translate-x-0.5 group-hover:text-[#0787ff]" />
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between gap-2 border-t border-[#f1f5f9] bg-[#fbfcfd] px-4 py-2.5">
        <span className="text-[11px] text-[#64748b]">Press ESC to close</span>
        <button
          type="button"
          onClick={onDismissAll}
          className="rounded-[6px] px-2 py-1 text-[12px] font-semibold text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
        >
          Dismiss all
        </button>
      </div>
    </div>
  )
}

function IconStatCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  color: string
}) {
  return (
    <article className="group relative flex items-center gap-4 overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-[0px_8px_24px_-8px_rgba(15,23,42,0.10)]">
      {/* Watercolor blob — tinted, blurred, corner-anchored */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full opacity-[0.14] blur-2xl"
        style={{ background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` }}
      />

      <div className="relative flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
          {label}
        </span>
        <span className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#0f172a]">
          {value}
        </span>
        <span className="text-[13px] leading-snug text-[#475569]">{hint}</span>
      </div>

      <StatIconHero icon={Icon} color={color} />
    </article>
  )
}

function StatIconHero({
  icon: Icon,
  color,
}: {
  icon: LucideIcon
  color: string
}) {
  return (
    <div className="relative grid size-[76px] shrink-0 place-items-center">
      {/* Layered soft halos for the "painted" glass feel */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full opacity-30 blur-lg transition-opacity duration-300 group-hover:opacity-45"
        style={{ background: `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 60%)` }}
      />
      <span
        aria-hidden
        className="absolute inset-2 rounded-[22px] border transition-all duration-300 group-hover:scale-[1.04]"
        style={{
          borderColor: `${color}33`,
          background: `linear-gradient(135deg, ${color}18 0%, ${color}06 60%, transparent 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9)`,
        }}
      />
      <Icon
        className="relative size-9 transition-transform duration-300 group-hover:scale-110"
        strokeWidth={1.6}
        style={{ color, filter: `drop-shadow(0 2px 6px ${color}55)` }}
      />
    </div>
  )
}

/* ─── Menu section: split 55/45 ───────────────────────────────────────── */

function MenuSection({
  items,
  selected,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
  onMove,
  rowActions,
}: {
  items: MenuItem[]
  selected: MenuItem | null
  onSelect: (uid: string) => void
  onAdd: (s: Source) => void
  onUpdate: (patch: Partial<MenuItem>) => void
  onDelete: () => void
  onMove: (activeUid: string, overUid: string, newLevel: 0 | 1 | 2) => void
  rowActions: RowActions
}) {
  const maxLevel = items.reduce((m, it) => Math.max(m, it.level), 0)
  const topLevelCount = items.filter((it) => it.level === 0).length
  return (
    <section className="flex flex-col overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white shadow-[0px_1px_3px_rgba(15,23,42,0.04)]">
      {/* Section header — real menu-level context, not a filler title */}
      <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-[8px] border border-[#e2e8f0] bg-white text-[#0787ff]">
            <List className="size-[18px]" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-display text-[16px] font-semibold leading-tight text-neutral-900">
              Header navigation
            </h2>
            <p className="mt-1 text-[13px] text-[#475569]">
              {items.length} items · {topLevelCount} in top nav · Level {maxLevel + 1} max
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TopNavCapacity items={items} max={TOP_NAV_MAX} />
          <StatusPill state="live" />
        </div>
      </div>

      <div className="grid grid-cols-[55fr_45fr] gap-4 p-4">
        <TreePanel
          items={items}
          selectedUid={selected?.uid ?? null}
          onSelect={onSelect}
          onAdd={onAdd}
          onMove={onMove}
          rowActions={rowActions}
        />
        <InspectorPanel item={selected} onUpdate={onUpdate} onDelete={onDelete} />
      </div>
    </section>
  )
}

function TopNavCapacity({ items, max }: { items: MenuItem[]; max: number }) {
  const topLevel = items.filter((it) => it.level === 0)
  const used = topLevel.length
  const remaining = Math.max(0, max - used)
  const over = Math.max(0, used - max)
  const isFull = used >= max
  const isNearFull = used === max - 1 && !isFull

  const scheme = isFull
    ? { fg: '#991b1b', muted: '#b91c1c', bg: '#fef2f2', border: '#fecaca', accent: '#dc2626' }
    : isNearFull
      ? { fg: '#92400e', muted: '#b45309', bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b' }
      : { fg: '#1e40af', muted: '#3b82f6', bg: '#f0f9ff', border: '#bfdbfe', accent: '#0787ff' }

  const KIND_DOT: Record<SourceKind, string> = {
    category: '#0787ff',
    page:     '#8b5cf6',
    custom:   '#22c55e',
    external: '#f59e0b',
  }

  const VISIBLE = 3
  const shown = topLevel.slice(0, VISIBLE)
  const hidden = Math.max(0, topLevel.length - shown.length)

  const tooltip = isFull
    ? over > 0
      ? `${used} top-level items — ${over} over the recommended limit`
      : 'Top nav is at capacity'
    : `${remaining} slot${remaining === 1 ? '' : 's'} left`

  return (
    <div
      title={tooltip}
      className="flex items-center gap-2 rounded-[12px] border py-1 pl-2 pr-2.5"
      style={{ background: scheme.bg, borderColor: scheme.border }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-[0.08em]"
        style={{ color: scheme.muted }}
      >
        Top nav
      </span>

      <div className="flex items-center gap-1">
        {shown.map((it) => (
          <span
            key={it.uid}
            title={it.navLabel}
            className="flex max-w-[92px] items-center gap-1 rounded-full border border-white bg-white px-1.5 py-0.5 text-[11px] font-medium text-[#0f172a] shadow-[0px_1px_2px_rgba(15,23,42,0.06)]"
          >
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: KIND_DOT[it.kind] }} />
            <span
              className="truncate"
              style={{ fontFamily: 'var(--font-mukta), var(--font-inter), sans-serif' }}
            >
              {it.navLabel}
            </span>
          </span>
        ))}
        {hidden > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{ color: scheme.fg, background: `${scheme.accent}22` }}
          >
            +{hidden}
          </span>
        )}
        {shown.length === 0 && (
          <span className="text-[11px] font-medium italic" style={{ color: scheme.muted }}>
            no top-level items
          </span>
        )}
      </div>

      <span className="mx-0.5 h-4 w-px" style={{ background: scheme.border }} />

      <span
        className="flex items-center gap-1 text-[11px] font-bold tabular-nums"
        style={{ color: scheme.fg }}
      >
        {used}
        <span className="opacity-50">/{max}</span>
        {isFull && <AlertTriangle className="size-3" />}
      </span>
    </div>
  )
}

function StatusPill({ state }: { state: 'live' | 'draft' }) {
  const map = {
    live:  { fg: '#166534', bg: '#f0fdf4', border: '#dcfce7', dot: '#22c55e', label: 'Live'  },
    draft: { fg: '#92400e', bg: '#fffbeb', border: '#fef3c7', dot: '#f59e0b', label: 'Draft' },
  }[state]
  return (
    <span
      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold"
      style={{ color: map.fg, background: map.bg, borderColor: map.border }}
    >
      <span className="size-1.5 rounded-full" style={{ background: map.dot }} />
      {map.label}
    </span>
  )
}

/* ─── Tree ────────────────────────────────────────────────────────────── */

const MAX_LEVEL = 2 as const
const INDENT_PX = 28
const TOP_NAV_MAX = 8

function TreePanel({
  items,
  selectedUid,
  onSelect,
  onAdd,
  onMove,
  rowActions,
}: {
  items: MenuItem[]
  selectedUid: string | null
  onSelect: (uid: string) => void
  onAdd: (s: Source) => void
  onMove: (activeUid: string, overUid: string, newLevel: 0 | 1 | 2) => void
  rowActions: RowActions
}) {
  const [activeUid, setActiveUid] = useState<string | null>(null)
  const [overUid, setOverUid] = useState<string | null>(null)
  const [offsetX, setOffsetX] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeItem = activeUid ? items.find((i) => i.uid === activeUid) ?? null : null

  const projection = useMemo(
    () => (activeUid && overUid ? getProjection(items, activeUid, overUid, offsetX) : null),
    [items, activeUid, overUid, offsetX],
  )

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id)
    setActiveUid(id)
    setOverUid(id)
    setOffsetX(0)
  }
  function onDragMove(e: DragMoveEvent) {
    setOffsetX(e.delta.x)
    if (e.over) setOverUid(String(e.over.id))
  }
  function onDragEnd(e: DragEndEvent) {
    if (activeUid && projection) {
      const over = e.over ? String(e.over.id) : activeUid
      onMove(activeUid, over, projection.depth as 0 | 1 | 2)
    }
    reset()
  }
  function reset() {
    setActiveUid(null)
    setOverUid(null)
    setOffsetX(0)
  }

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#eef2f7] bg-white p-4">
      <QuickAddSearch items={items} onAdd={onAdd} />
      <QuickAddChips items={items} onAdd={onAdd} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragCancel={reset}
      >
        <SortableContext items={items.map((i) => i.uid)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <SortableMenuRow
                key={item.uid}
                item={item}
                selected={item.uid === selectedUid}
                projectedLevel={
                  activeUid === item.uid && projection ? (projection.depth as 0 | 1 | 2) : null
                }
                onClick={() => onSelect(item.uid)}
                rowActions={rowActions}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeItem && (
            <div className="pointer-events-none w-full max-w-[560px] opacity-95">
              <MenuRowCard
                item={{ ...activeItem, level: (projection?.depth ?? activeItem.level) as 0 | 1 | 2 }}
                selected
                overlay
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className="flex items-center justify-between gap-3 px-1 pt-1 text-[12px] text-[#64748b]">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="size-1.5 animate-pulse rounded-full bg-[#22c55e]" />
          Auto-saved · {items.length} items
        </span>
        <span className="hidden xl:inline">Drag ⇢ to nest · ⇠ to un-nest · up to {MAX_LEVEL + 1} levels</span>
      </div>
    </div>
  )
}

/* ─── Quick-add chips: one-click add for popular unused sources ─────── */

function QuickAddChips({
  items,
  onAdd,
}: {
  items: MenuItem[]
  onAdd: (s: Source) => void
}) {
  const used = useMemo(() => new Set(items.map((i) => i.sourceId)), [items])
  const suggestions = useMemo(() => SOURCES.filter((s) => !used.has(s.id)).slice(0, 6), [used])

  if (suggestions.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#475569]">
        Quick add
      </span>
      <div className="flex items-center gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onAdd(s)}
            className="group flex shrink-0 items-center gap-1.5 rounded-full border border-[#cbd5e1] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1e293b] transition-colors hover:border-[#0787ff] hover:bg-[#f0f9ff] hover:text-[#0787ff]"
            title={`Add ${s.label}`}
          >
            <span
              className="max-w-[110px] truncate"
              style={{ fontFamily: 'var(--font-mukta), var(--font-inter), sans-serif' }}
            >
              {s.label}
            </span>
            <Plus className="size-3.5 text-[#64748b] group-hover:text-[#0787ff]" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Projection: where does the dragged item land? ───────────────────── */

function getProjection(
  items: MenuItem[],
  activeUid: string,
  overUid: string,
  dragDeltaX: number,
): { depth: 0 | 1 | 2; overIndex: number } {
  const overIdx   = items.findIndex((i) => i.uid === overUid)
  const activeIdx = items.findIndex((i) => i.uid === activeUid)
  const activeItem = items[activeIdx]

  // Simulate the array after the move to inspect siblings.
  const virtual = activeIdx === overIdx ? items : arrayMove(items, activeIdx, overIdx)
  const previous = virtual[overIdx - 1]
  const next     = virtual[overIdx + 1]

  const dragDepth = Math.round(dragDeltaX / INDENT_PX)
  const projected = activeItem.level + dragDepth
  const max = Math.min(previous ? previous.level + 1 : 0, MAX_LEVEL)
  const min = next ? next.level : 0
  const depth = Math.max(min, Math.min(projected, max))
  return { depth: depth as 0 | 1 | 2, overIndex: overIdx }
}

/* ─── Quick-add search ────────────────────────────────────────────────── */

function QuickAddSearch({
  items,
  onAdd,
}: {
  items: MenuItem[]
  onAdd: (s: Source) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const usedIds = useMemo(() => new Set(items.map((i) => i.sourceId)), [items])

  const flat = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SOURCES.filter((s) => !usedIds.has(s.id)).filter((s) =>
      q === '' ? true : s.label.toLowerCase().includes(q) || s.path.toLowerCase().includes(q),
    )
  }, [query, usedIds])

  const trimmed = query.trim()
  const customSource = useMemo<Source | null>(() => {
    if (!trimmed) return null
    const isUrl = /^https?:\/\//i.test(trimmed)
    const looksLikePath = trimmed.startsWith('/')
    if (isUrl) {
      return { id: `ext-${trimmed}`, label: trimmed, path: trimmed, kind: 'external' }
    }
    return {
      id: `custom-${trimmed}`,
      label: trimmed,
      path: looksLikePath ? trimmed : `/${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
      kind: 'custom',
    }
  }, [trimmed])

  const totalRows = flat.length + (customSource ? 1 : 0)

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(i: number) {
    const s = i < flat.length ? flat[i] : customSource
    if (!s) return
    onAdd(s)
    setQuery('')
    setCursor(0)
    inputRef.current?.focus()
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(Math.max(0, totalRows - 1), c + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); pick(cursor) }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex items-center gap-3 rounded-[12px] border bg-white px-4 py-3 transition-colors ${
          open
            ? 'border-[#76cdff] shadow-[0px_0px_0px_4px_rgba(209,236,255,0.48)]'
            : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
        }`}
      >
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-[8px] transition-colors ${
            open ? 'bg-[#ebf6ff] text-[#0787ff]' : 'bg-[#f8fafc] text-[#475569]'
          }`}
        >
          <Plus className="size-[18px]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder="Add menu item — search or paste a URL"
            className="w-full bg-transparent text-[15px] font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-[#64748b]"
          />
          <span className="mt-1 text-[12px] text-[#64748b]">
            Type to filter · Click a suggestion below · Press ⏎ to add
          </span>
        </div>
        <div className="hidden shrink-0 items-center gap-1 text-[12px] text-[#475569] lg:flex">
          <span className="flex items-center gap-1 rounded-[4px] bg-[rgba(26,26,26,0.08)] px-1.5 py-1">
            <ArrowUp className="size-3" /><ArrowDown className="size-3" />
          </span>
          <span className="flex items-center gap-1 rounded-[4px] bg-[rgba(26,26,26,0.08)] px-1.5 py-1">
            <CornerDownLeft className="size-3" />
          </span>
        </div>
        <ChevronDown className={`hidden size-4 shrink-0 text-[#64748b] transition-transform lg:block ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[420px] overflow-y-auto rounded-[14px] border border-[#e5e9f0] bg-white shadow-[0px_16px_40px_-12px_rgba(15,23,42,0.16),0px_4px_12px_-4px_rgba(15,23,42,0.08)]">
          {totalRows === 0 ? (
            <div className="p-5 text-[14px] text-[#475569]">
              No matches. Type a label or paste a URL to create a custom link.
            </div>
          ) : (
            <ResultsList
              items={flat}
              customSource={customSource}
              cursor={cursor}
              onHover={setCursor}
              onPick={pick}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ResultsList({
  items,
  customSource,
  cursor,
  onHover,
  onPick,
}: {
  items: Source[]
  customSource: Source | null
  cursor: number
  onHover: (i: number) => void
  onPick: (i: number) => void
}) {
  const customIndex = items.length
  return (
    <div className="py-2">
      {items.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onMouseEnter={() => onHover(i)}
          onMouseDown={(e) => { e.preventDefault(); onPick(i) }}
          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${cursor === i ? 'bg-[#ebf6ff]' : 'hover:bg-[#f8fafc]'}`}
        >
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-[8px] transition-colors ${
              cursor === i ? 'bg-white text-[#0787ff]' : 'bg-[#f8fafc] text-[#334155]'
            }`}
          >
            <ListTree className="size-4" />
          </span>
          <span
            className={`flex-1 truncate text-[14px] font-medium ${cursor === i ? 'text-[#062365]' : 'text-neutral-900'}`}
            style={{ fontFamily: 'var(--font-mukta), var(--font-inter), sans-serif' }}
          >
            {s.label}
          </span>
          <span className="truncate font-mono text-[12px] text-[#64748b]">{s.path}</span>
          <Plus className={`size-4 shrink-0 ${cursor === i ? 'text-[#0787ff]' : 'text-[#94a3b8]'}`} />
        </button>
      ))}

      {customSource && (
        <>
          {items.length > 0 && <div className="my-1 h-px bg-[#e5e9f0]" />}
          <button
            type="button"
            onMouseEnter={() => onHover(customIndex)}
            onMouseDown={(e) => { e.preventDefault(); onPick(customIndex) }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${cursor === customIndex ? 'bg-[#ebf6ff]' : 'hover:bg-[#f8fafc]'}`}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-[8px] transition-colors ${
                cursor === customIndex ? 'bg-white text-[#0787ff]' : 'bg-[#f8fafc] text-[#334155]'
              }`}
            >
              <Plus className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className={`truncate text-[14px] font-medium ${cursor === customIndex ? 'text-[#062365]' : 'text-neutral-900'}`}
                style={{ fontFamily: 'var(--font-mukta), var(--font-inter), sans-serif' }}
              >
                Create custom link "{customSource.label}"
              </span>
              <span className="truncate font-mono text-[12px] text-[#64748b]">{customSource.path}</span>
            </span>
            <span className="rounded-[6px] border border-[#cfe6ff] bg-[#ebf6ff] px-1.5 py-0.5 text-[11px] font-semibold text-[#0787ff]">
              New
            </span>
          </button>
        </>
      )}
    </div>
  )
}

/* ─── Menu row + tree rails ───────────────────────────────────────────── */

function SortableMenuRow({
  item,
  selected,
  projectedLevel,
  onClick,
  rowActions,
}: {
  item: MenuItem
  selected: boolean
  projectedLevel: 0 | 1 | 2 | null
  onClick: () => void
  rowActions?: RowActions
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.uid })

  const displayLevel = projectedLevel ?? item.level
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div ref={setNodeRef} id={`menu-row-${item.uid}`} style={style}>
      <MenuRowCard
        item={{ ...item, level: displayLevel }}
        selected={selected}
        onClick={onClick}
        gripRef={setActivatorNodeRef}
        gripHandlers={{ ...attributes, ...listeners }}
        indicatorGhost={isDragging && projectedLevel != null}
        rowActions={rowActions}
      />
    </div>
  )
}

function MenuRowCard({
  item,
  selected,
  onClick,
  gripRef,
  gripHandlers,
  overlay,
  indicatorGhost,
  rowActions,
}: {
  item: MenuItem
  selected: boolean
  onClick?: () => void
  gripRef?: (el: HTMLElement | null) => void
  gripHandlers?: React.HTMLAttributes<HTMLElement>
  overlay?: boolean
  indicatorGhost?: boolean
  rowActions?: RowActions
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuAnchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e: MouseEvent) {
      if (!menuAnchorRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const indent = item.level === 0 ? '' : item.level === 1 ? 'pl-1' : 'pl-12'
  const cardBorder = overlay
    ? 'border-[#0787ff] shadow-[0px_16px_36px_-4px_rgba(7,135,255,0.22),0px_6px_14px_-4px_rgba(15,23,42,0.10)]'
    : indicatorGhost
      ? 'border-dashed border-[#bfdbfe] bg-[#f0f9ff]'
      : selected
        ? 'border-[#0787ff] bg-white shadow-[0px_1px_3px_rgba(7,135,255,0.10)]'
        : 'border-[#e5e9f0] bg-white hover:border-[#cbd5e1] hover:shadow-[0px_1px_3px_rgba(15,23,42,0.05)]'

  return (
    <div className={`flex w-full items-center py-1 ${indent}`}>
      {item.level > 0 && <TreeRail />}
      <div
        role={onClick ? 'button' : undefined}
        aria-pressed={onClick ? selected : undefined}
        onClick={onClick}
        className={`group relative flex flex-1 items-center gap-3 rounded-[12px] border py-3 pl-3 pr-2 text-left transition-all duration-150 ${cardBorder}`}
      >
        {selected && !overlay && (
          <span
            aria-hidden
            className="absolute left-0 top-2 h-[calc(100%-16px)] w-[3px] rounded-r-[3px] bg-[#0787ff]"
          />
        )}
        <span
          ref={gripRef}
          {...(gripHandlers ?? {})}
          onClick={(e) => e.stopPropagation()}
          className={`grid size-7 shrink-0 cursor-grab place-items-center rounded-[6px] transition-colors active:cursor-grabbing ${
            selected || overlay
              ? 'text-[#0787ff]'
              : 'text-[#94a3b8] group-hover:bg-[#f1f5f9] group-hover:text-[#475569]'
          }`}
          aria-label="Drag to reorder or nest"
        >
          <GripVertical className="size-5" />
        </span>
        <KindDot kind={item.kind} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`truncate text-[15px] font-medium leading-tight ${
                selected || overlay ? 'text-[#062365]' : 'text-[#0f172a]'
              }`}
              style={{ fontFamily: 'var(--font-mukta), var(--font-inter), sans-serif' }}
            >
              {item.navLabel}
            </span>
            <KindBadge level={item.level} />
            {!item.visible && (
              <span className="rounded-[4px] bg-[#f1f5f9] px-1.5 py-0.5 text-[11px] font-semibold text-[#475569]">
                Hidden
              </span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2 text-[12px] text-[#475569]">
            <span className="truncate font-mono text-[#64748b]">{item.path}</span>
            <span className="size-[3px] shrink-0 rounded-full bg-[#94a3b8]" />
            <span className="whitespace-nowrap">{item.views}</span>
          </div>
        </div>
        <div ref={menuAnchorRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (rowActions) setMenuOpen((v) => !v)
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Row actions"
            className={`grid size-8 shrink-0 place-items-center rounded-[8px] transition-colors ${
              menuOpen
                ? 'bg-[#ebf6ff] text-[#0787ff]'
                : selected || overlay
                  ? 'text-[#0787ff] hover:bg-[#ebf6ff]'
                  : 'text-[#64748b] hover:bg-[#f1f5f9]'
            }`}
          >
            <MoreVertical className="size-4" />
          </button>
          {menuOpen && rowActions && !overlay && (
            <RowActionsMenu
              item={item}
              actions={rowActions}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function RowActionsMenu({
  item,
  actions,
  onClose,
}: {
  item: MenuItem
  actions: RowActions
  onClose: () => void
}) {
  const run = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn()
    onClose()
  }
  return (
    <div
      role="menu"
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full z-40 mt-1.5 w-60 overflow-hidden rounded-[12px] border border-white/70 bg-white/95 py-1 shadow-[0px_20px_50px_-12px_rgba(15,23,42,0.22),0px_6px_18px_-6px_rgba(15,23,42,0.10)] backdrop-blur-xl"
    >
      <RowActionGroup>
        <RowActionItem icon={ArrowUp}    label="Move up"       onClick={run(() => actions.onMoveUp(item.uid))} />
        <RowActionItem icon={ArrowDown}  label="Move down"     onClick={run(() => actions.onMoveDown(item.uid))} />
      </RowActionGroup>
      <RowActionGroup>
        <RowActionItem
          icon={ArrowRight}
          label="Nest as child"
          onClick={run(() => actions.onIndent(item.uid))}
          disabled={item.level >= 2}
        />
        <RowActionItem
          icon={ArrowLeft}
          label="Un-nest"
          onClick={run(() => actions.onOutdent(item.uid))}
          disabled={item.level === 0}
        />
      </RowActionGroup>
      <RowActionGroup>
        <RowActionItem
          icon={item.visible ? EyeOff : Eye}
          label={item.visible ? 'Hide from menu' : 'Show in menu'}
          onClick={run(() => actions.onToggleVisible(item.uid))}
        />
        <RowActionItem
          icon={Copy}
          label="Duplicate"
          kbd="⌘D"
          onClick={run(() => actions.onDuplicate(item.uid))}
        />
        <RowActionItem
          icon={Link2}
          label="Copy path"
          onClick={run(() => actions.onCopyPath(item.path))}
        />
      </RowActionGroup>
      <RowActionGroup last>
        <RowActionItem
          icon={Trash2}
          label="Delete"
          kbd="⌫"
          danger
          onClick={run(() => actions.onDelete(item.uid))}
        />
      </RowActionGroup>
    </div>
  )
}

function RowActionGroup({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? 'py-1' : 'border-b border-[#f1f5f9] py-1'}>
      {children}
    </div>
  )
}

function RowActionItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
  kbd,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
  danger?: boolean
  kbd?: string
}) {
  const base = 'flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors'
  const tone = danger
    ? 'text-[#dc2626] hover:bg-[#fef2f2]'
    : 'text-[#334155] hover:bg-[#f8fafc] hover:text-[#0f172a]'
  const off = disabled ? 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-[#334155]' : ''
  return (
    <button
      type="button"
      role="menuitem"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${tone} ${off}`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {kbd && <span className="font-mono text-[11px] text-[#94a3b8]">{kbd}</span>}
    </button>
  )
}

function KindBadge({ level }: { level: 0 | 1 | 2 }) {
  if (level === 0) return null
  return (
    <span className="rounded-[6px] border border-[#dbeafe] bg-[#eff6ff] px-1.5 py-0.5 text-[11px] font-medium text-[#1d4ed8]">
      {level === 1 ? 'Sub-menu' : 'Level 3'}
    </span>
  )
}

function KindDot({ kind }: { kind: SourceKind }) {
  const color = {
    category: '#0787ff',
    page:     '#8b5cf6',
    custom:   '#22c55e',
    external: '#f59e0b',
  }[kind]
  return (
    <span
      aria-hidden
      className="size-2 shrink-0 rounded-full"
      style={{ background: color }}
      title={KIND_META[kind].label}
    />
  )
}

function TreeRail() {
  return (
    <div className="relative flex h-16 w-9 shrink-0 items-start justify-center">
      <div className="h-8 w-px bg-[#e2e8f0]" />
      <span aria-hidden className="absolute left-1/2 top-8 h-px w-3 bg-[#e2e8f0]" />
    </div>
  )
}

/* ─── Inspector ───────────────────────────────────────────────────────── */

function InspectorPanel({
  item,
  onUpdate,
  onDelete,
}: {
  item: MenuItem | null
  onUpdate: (patch: Partial<MenuItem>) => void
  onDelete: () => void
}) {
  if (!item) return <InspectorEmpty />

  const Icon = KIND_META[item.kind].icon
  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#eef2f7] bg-white">
      {/* Header — big label, subtle meta */}
      <div className="flex items-start gap-3 px-5 pb-4 pt-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-[#e2e8f0] bg-white text-[#0787ff]">
          <Icon className="size-[18px]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="truncate font-display text-[18px] font-semibold leading-tight text-neutral-900"
            style={{ fontFamily: 'var(--font-mukta), var(--font-dm-sans), sans-serif' }}
          >
            {item.navLabel}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[#475569]">
            <span className="font-medium">{KIND_META[item.kind].label}</span>
            <span className="size-[3px] rounded-full bg-[#94a3b8]" />
            <span>{item.level === 0 ? 'Top level' : `Level ${item.level + 1}`}</span>
            {!item.visible && (
              <>
                <span className="size-[3px] rounded-full bg-[#94a3b8]" />
                <span className="font-medium text-[#b45309]">Hidden</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Groups */}
      <InspectorGroup label="Basics">
        <Field label="Navigation label" hint="What editors see in the site nav.">
          <Input
            value={item.navLabel}
            onChange={(e) => onUpdate({ navLabel: e.target.value })}
            className="h-10 rounded-[10px] border-[#e2e8f0] text-[14px]"
          />
        </Field>

        <Field label="Path">
          <Input
            value={item.path}
            onChange={(e) => onUpdate({ path: e.target.value })}
            className="h-10 rounded-[10px] border-[#e2e8f0] font-mono text-[14px]"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={item.kind} onValueChange={(v) => onUpdate({ kind: v as SourceKind })}>
              <SelectTrigger className="h-10 rounded-[10px] border-[#e2e8f0] text-[14px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="page">Page</SelectItem>
                <SelectItem value="custom">Custom link</SelectItem>
                <SelectItem value="external">External link</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Icon">
            <Select value={item.icon} onValueChange={(v) => onUpdate({ icon: v })}>
              <SelectTrigger className="h-10 rounded-[10px] border-[#e2e8f0] text-[14px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="tag">Tag</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="globe">Globe</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </InspectorGroup>

      <InspectorGroup label="Visibility">
        <ToggleRow
          label="Visible"
          hint="Show this item in the menu."
          checked={item.visible}
          onCheckedChange={(v) => onUpdate({ visible: v })}
        />
        <ToggleRow
          label="Show on desktop"
          checked={item.showDesktop}
          onCheckedChange={(v) => onUpdate({ showDesktop: v })}
        />
        <ToggleRow
          label="Show on mobile"
          checked={item.showMobile}
          onCheckedChange={(v) => onUpdate({ showMobile: v })}
        />
      </InspectorGroup>

      <InspectorGroup label="Behavior">
        <ToggleRow
          label="Open in new tab"
          hint="Recommended for external links."
          checked={item.openNewTab}
          onCheckedChange={(v) => onUpdate({ openNewTab: v })}
        />
      </InspectorGroup>

      <InspectorGroup label="Description">
        <Textarea
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          placeholder="Shown in mega-menus and previews. Optional."
          className="rounded-[8px] border-[#e2e8f0] text-[13px]"
        />
      </InspectorGroup>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-[#eef2f7] bg-[#fbfcfd] px-5 py-3">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#475569]">
          <span className="size-1.5 animate-pulse rounded-full bg-[#22c55e]" />
          Auto-saved
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 rounded-[8px] px-2.5 text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#dc2626]"
        >
          <Trash2 className="mr-1 size-4" />
          Remove
        </Button>
      </div>
    </div>
  )
}

function InspectorEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#e2e8f0] bg-white p-8">
      <div className="grid size-11 place-items-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
        <MousePointer2 className="size-5" />
      </div>
      <div className="mt-3 text-[14px] font-semibold text-neutral-900">Nothing selected</div>
      <div className="mt-1 max-w-[220px] text-center text-[13px] leading-[1.5] text-[#475569]">
        Click a menu item to edit its label, path, visibility and more.
      </div>
    </div>
  )
}

function InspectorGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#f1f5f9] px-5 py-4 first:border-t-0">
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#475569]">
        {label}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

/* ─── Field / Toggle helpers ──────────────────────────────────────────── */

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[13px] font-semibold text-[#1e293b]">{label}</Label>
      {children}
      {hint && <div className="text-[12px] text-[#64748b]">{hint}</div>}
    </div>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-[14px] font-medium text-neutral-900">{label}</span>
        {hint && <span className="text-[12px] text-[#64748b]">{hint}</span>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
