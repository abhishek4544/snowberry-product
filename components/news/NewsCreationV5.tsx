'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Plus,
  X,
  Search,
  Check,
  Sparkles,
  LayoutDashboard,
  Layers,
  MessageSquare,
  ListChecks,
  BarChart2,
  Image as ImageIcon,
  Users,
  Wrench,
  Settings,
  PencilLine,
  Trash2,
  Heading1,
  Type,
  AlignLeft,
  GripVertical,
  ImagePlus,
  MessageSquareText,
  Clock,
  Newspaper,
  SquarePen,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  FileBox,
  FileImage,
  Pilcrow,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { Input } from '@ui/Input'

const LOGO_MARK = '/logo-mark.svg'

// ─── Types ────────────────────────────────────────────────────────────────────
type BlockKind = 'title' | 'subtitle' | 'image' | 'paragraph'
type ContentBlock = {
  id: string
  kind: BlockKind
  value?: string
  imageUrl?: string
}
type NewsType = 'Normal News' | 'Breaking News' | 'Feature' | 'Opinion'
type Category = { id: string; label: string }

const CATEGORY_OPTIONS: Category[] = [
  { id: 'cat-1',  label: 'नयाँ श्रेणी' },
  { id: 'cat-2',  label: 'विश्व समाचार' },
  { id: 'cat-3',  label: 'राजनीति' },
  { id: 'cat-4',  label: 'अर्थतन्त्र' },
  { id: 'cat-5',  label: 'खेलकुद' },
  { id: 'cat-6',  label: 'प्रविधि' },
  { id: 'cat-7',  label: 'संस्कृति' },
  { id: 'cat-8',  label: 'स्वास्थ्य' },
]

const INITIAL_BLOCKS: ContentBlock[] = [
  { id: 'b-title',    kind: 'title',    value: '' },
  { id: 'b-subtitle', kind: 'subtitle', value: '' },
  { id: 'b-image',    kind: 'image' },
  { id: 'b-para-1',   kind: 'paragraph', value: '' },
]

/* ─── Block-type icons ─────────────────────────────────────────────────────
   Wrapped in a 32×32 chip frame so the column has consistent visual weight
   instead of a stranded 16px glyph. Identity-colored on row hover. */
type BlockKindIcon = 'title' | 'subtitle' | 'image' | 'description' | 'paragraph'

const ICON_TINT: Record<BlockKindIcon, string> = {
  title:       'group-hover:text-brand-500',
  subtitle:    'group-hover:text-teal-500',
  image:       'group-hover:text-amber-500',
  description: 'group-hover:text-violet-500',
  paragraph:   'group-hover:text-violet-500',
}

function BlockIconChip({ kind }: { kind: BlockKindIcon }) {
  const Icon =
    kind === 'title'    ? Heading1 :
    kind === 'subtitle' ? Type :
    kind === 'image'    ? ImageIcon :
                          AlignLeft
  return (
    <span
      className={[
        'inline-flex items-center justify-center size-8 rounded-md',
        'text-slate-400 transition-colors',
        'group-hover:bg-slate-50',
        ICON_TINT[kind],
      ].join(' ')}
      aria-hidden
    >
      <Icon size={18} strokeWidth={1.75} />
    </span>
  )
}

/* ─── Collapsed sidebar (matches Figma 40000113:14100) ────────────────────────
   Slim 60px column, transparent bg, no border. Logo at top with bottom divider,
   white-card "+" trigger, two grouped icon stacks (nav + footer) with tooltips,
   active-state highlight, hover affordance. */
type NavItem = {
  id:    string
  label: string
  Icon:  React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  href?: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',          Icon: LayoutDashboard,   href: '/' },
  { id: 'content',     label: 'Content',            Icon: MessageSquareText },
  { id: 'engagement',  label: 'Engagement',         Icon: MessageSquare },
  { id: 'task',        label: 'Task',               Icon: ListChecks,        href: '/task' },
  { id: 'performance', label: 'Performance',        Icon: Clock,             href: '/performance' },
  { id: 'media',       label: 'Media',              Icon: Layers,            href: '/media' },
  { id: 'people',      label: 'People',             Icon: Users,             href: '/people' },
  { id: 'config',      label: 'Site configuration', Icon: Wrench },
  { id: 'settings',    label: 'Settings',           Icon: Settings,          href: '/settings' },
]

const FOOTER_ITEMS: NavItem[] = [
  { id: 'news-foot', label: 'News',     Icon: Newspaper,  href: '/news' },
  { id: 'edit-foot', label: 'Drafts',   Icon: SquarePen,  href: '/drafts' },
]

function SidebarIconButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.label}
      className={[
        'group/sb relative size-9 rounded-lg flex items-center justify-center transition-all',
        active
          // Berry: active = brand→violet gradient pill with violet halo
          ? 'text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.55)] bg-gradient-to-br from-brand-500 to-violet-500'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      ].join(' ')}
    >
      <item.Icon size={18} strokeWidth={1.5} />

      {/* Tooltip — appears on hover (shadcn-style: small popover to the right) */}
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover/sb:opacity-100 transition-opacity">
        <span className="block whitespace-nowrap rounded-md bg-neutral-900 text-white text-[12px] font-medium px-2 py-1 shadow-md ring-1 ring-white/10">
          {item.label}
        </span>
      </span>
    </button>
  )
}

function CollapsedSidebar() {
  const router = useRouter()

  function go(item: NavItem) {
    if (item.href) router.push(item.href)
  }

  return (
    <aside
      className="flex flex-col gap-4 items-stretch py-4 px-3 shrink-0 self-stretch"
      style={{ width: 60 }}
    >
      {/* Logo with bottom divider */}
      <div className="flex items-center justify-center pb-3.5 pt-1.5 border-b border-slate-200">
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Snowberry — home"
          className="rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
        >
          <img src={LOGO_MARK} alt="Snowberry" className="w-[30px] h-[30px]" />
        </button>
      </div>

      {/* + new article (Berry: gradient pill) */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => router.push('/news/new-v5')}
          aria-label="New article (⌘N)"
          className="group/sb relative size-9 rounded-lg text-white flex items-center justify-center
            bg-gradient-to-br from-brand-500 to-violet-500
            shadow-[0_8px_20px_-6px_rgba(7,135,255,0.55),inset_0_0_0_1px_rgba(255,255,255,0.15)]
            hover:brightness-110 transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]"
        >
          <Plus size={20} strokeWidth={1.75} />
          <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover/sb:opacity-100 transition-opacity">
            <span className="block whitespace-nowrap rounded-md bg-neutral-900 text-white text-[12px] font-medium px-2 py-1 shadow-md">
              New article
              <span className="ml-2 text-slate-400 font-mono">⌘N</span>
            </span>
          </span>
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col items-center">
        {NAV_ITEMS.map(item => (
          <SidebarIconButton
            key={item.id}
            item={item}
            onClick={() => go(item)}
          />
        ))}
      </nav>

      {/* Footer nav */}
      <nav className="flex flex-col items-center mt-auto">
        {FOOTER_ITEMS.map(item => (
          <SidebarIconButton
            key={item.id}
            item={item}
            onClick={() => go(item)}
          />
        ))}
      </nav>
    </aside>
  )
}

// ─── Auto-grow textarea (shadcn-style: focus ring, smooth caret) ─────────────
function AutoTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  minRows = 1,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  minRows?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full resize-none bg-transparent outline-none border-none placeholder:text-slate-300 caret-brand-500 ${className}`}
    />
  )
}

/* ─── Berry AI button — violet pill, sweeping top shimmer, glowing halo ───── */
function BerryAIButton({ onClick }: { onClick?: () => void }) {
  return (
    <div className="relative inline-flex items-center isolate">
      {/* Pulsing violet halo behind the button */}
      <span
        aria-hidden
        className="berry-glow pointer-events-none absolute -inset-4 rounded-full -z-10"
      />

      {/* The pill — solid violet, animated top shimmer (see globals.css) */}
      <button
        type="button"
        onClick={onClick}
        className="berry-button relative inline-flex items-center gap-2 h-[38px] pl-3 pr-5 rounded-full
          text-white text-[14px] font-semibold tracking-tight
          ring-1 ring-violet-300/40
          hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] transition-transform"
      >
        <Sparkles size={16} strokeWidth={2.5} className="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
        Berry AI
      </button>
    </div>
  )
}

/* ─── AI control bar (Figma 40000113:14068) ──────────────────────────────────
   `kind` decides which controls appear:
     • title / subtitle / image → AI only (no move, no delete)
     • paragraph                 → AI + reorder + delete */
function RowAIControls({
  kind,
  onMove,
  onDelete,
  onAI,
}: {
  kind: BlockKindIcon
  onMove?: (dir: 'up' | 'down') => void
  onDelete?: () => void
  onAI?: () => void
}) {
  const fullControls = kind === 'paragraph' || kind === 'description'

  return (
    <div className="flex items-center gap-3 shrink-0 pt-[2px]">
      <BerryAIButton onClick={onAI} />

      {fullControls && (
        <>
          {/* Reorder chevrons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove?.('up')}
              aria-label="Move up"
              className="size-8 rounded-lg bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
            >
              <ChevronUp size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => onMove?.('down')}
              aria-label="Move down"
              className="size-8 rounded-lg bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
            >
              <ChevronDown size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete block"
            className="size-8 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 flex items-center justify-center transition-colors"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </>
      )}
    </div>
  )
}

/* ─── Editor row ──────────────────────────────────────────────────────────────
   Content is constrained to a centered, narrow column (~640px / ≈40% workspace)
   for comfortable reading width. AI controls appear UNDER the content (right-
   aligned within the column) — never in the far-right corner of the canvas. */
function Row({
  kind,
  children,
  isActive,
  lockedOut,
  onSelect,
  onMove,
  onDelete,
  onAI,
}: {
  kind: BlockKindIcon
  children: React.ReactNode
  isActive?: boolean
  lockedOut?: boolean
  onSelect?: () => void
  onMove?: (dir: 'up' | 'down') => void
  onDelete?: () => void
  onAI?: () => void
}) {
  const showEmphasis = isActive
  const allowHoverEmphasis = !lockedOut && !isActive

  return (
    <div
      onMouseDown={onSelect}
      className={[
        'group relative w-full transition-colors py-[18px]',
        showEmphasis
          ? 'bg-[rgba(235,246,255,0.6)]'
          : allowHoverEmphasis
            ? 'hover:bg-[rgba(235,246,255,0.6)]'
            : '',
      ].join(' ')}
    >
      {/* Centered narrow content column */}
      <div className="mx-auto w-full max-w-[640px] px-6 flex gap-4 items-start relative">
        {/* Drag grip — sits in the left gutter of the centered column */}
        {!lockedOut && (
          <button
            type="button"
            tabIndex={-1}
            className={[
              'absolute -left-2 top-[8px] size-5 rounded-md flex items-center justify-center text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-opacity',
              showEmphasis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            ].join(' ')}
            aria-label="Drag block"
          >
            <GripVertical size={14} />
          </button>
        )}

        {/* Type-icon chip */}
        <div className="flex items-center shrink-0">
          <BlockIconChip kind={kind} />
        </div>

        {/* Content + fixed-height straight left rail */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start px-6 border-l-[1.5px] border-black/10">
            {children}
          </div>

          {/* AI control bar — INSIDE the content column, beneath the content,
              right-aligned. Only when row is active or hovered. */}
          {!lockedOut && (
            <div
              className={[
                'mt-3 pl-6 flex justify-end transition-opacity',
                showEmphasis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              ].join(' ')}
            >
              <RowAIControls kind={kind} onMove={onMove} onDelete={onDelete} onAI={onAI} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Between-row insert gutter (Figma 40000113:13765) ────────────────────────
   8px tall band. On hover: shows a faint horizontal line and a blue + button
   on the far-left (aligned with the icon column). Click → opens BlockPicker. */
function InsertGutter({ onInsert }: { onInsert: () => void }) {
  return (
    <div
      className="group/gutter relative h-2 w-full cursor-pointer flex items-center justify-center transition-opacity"
      onClick={onInsert}
      role="button"
      aria-label="Insert block here"
    >
      {/* Horizontal track — faint by default, brand-tinted on hover */}
      <div className="h-px w-full rounded-[2px] bg-transparent group-hover/gutter:bg-slate-100 transition-colors" />

      {/* Plus button — sits on the left, aligned with icon column.
          Visible only on hover. */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onInsert() }}
        className="absolute left-[34px] -translate-y-1/2 top-1/2 size-6 rounded-full text-white flex items-center justify-center
          bg-gradient-to-br from-brand-500 to-violet-500 hover:brightness-110
          opacity-0 group-hover/gutter:opacity-100 transition-all
          shadow-[0_8px_20px_-6px_rgba(124,58,237,0.55),inset_0_0_0_1px_rgba(255,255,255,0.18)]
          focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2"
        aria-label="Insert block here"
      >
        <Plus size={16} strokeWidth={2.25} />
      </button>
    </div>
  )
}

/* ─── Image dropzone — shadcn card pattern (dashed border, hover ring) ─────── */
function ImageDropzone({
  url,
  onPick,
  onRemove,
}: {
  url?: string
  onPick: (url: string) => void
  onRemove?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) onPick(URL.createObjectURL(f))
  }

  if (url) {
    return (
      <div className="group relative w-[560px] max-w-full">
        <img
          src={url}
          alt=""
          className="w-full max-h-[360px] rounded-lg border border-slate-200 object-cover"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 size-7 rounded-md bg-white/90 backdrop-blur border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        'w-[560px] max-w-full aspect-[16/9] rounded-lg border border-dashed transition-all',
        'flex flex-col items-center justify-center gap-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2',
        dragging
          ? 'bg-brand-50 border-brand-400 text-brand-500 scale-[1.005]'
          : 'bg-slate-50/60 border-slate-200 text-slate-400 hover:bg-slate-100/70 hover:border-slate-300 hover:text-slate-500',
      ].join(' ')}
    >
      <div className="size-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center">
        <ImagePlus size={18} strokeWidth={1.75} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm font-medium leading-5">
          {dragging ? 'Drop your image' : 'Click to add an image'}
        </span>
        <span className="text-[12px] text-slate-400 leading-4">
          or drag and drop — PNG, JPG, WEBP
        </span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPick(URL.createObjectURL(f)) }} />
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
/* ─── Block picker popover (Figma 40000113:13532) ─────────────────────────────
   Categorized block library: All / Insert / Template tabs at top, sections of
   115×91 cards. Opened by clicking the between-row insert gutter. */
type BlockPickerKind = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'image' | 'file' | 'quote' | 'bulleted' | 'numbered'

const BLOCK_PICKER_GROUPS: { title: string; items: { kind: BlockPickerKind; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] }[] = [
  {
    title: 'Suggested',
    items: [
      { kind: 'paragraph', label: 'Normal Text',     Icon: Pilcrow },
      { kind: 'file',      label: 'File attachment', Icon: FileBox },
      { kind: 'heading1',  label: 'Heading 1',       Icon: Heading1 },
      { kind: 'heading3',  label: 'Heading 3',       Icon: Heading3 },
    ],
  },
  {
    title: 'Assets',
    items: [
      { kind: 'image', label: 'Image',           Icon: FileImage },
      { kind: 'file',  label: 'File attachment', Icon: FileBox },
    ],
  },
  {
    title: 'Text',
    items: [
      { kind: 'paragraph', label: 'Normal Text', Icon: Pilcrow },
      { kind: 'heading1',  label: 'Heading 1',   Icon: Heading1 },
      { kind: 'heading2',  label: 'Heading 2',   Icon: Heading2 },
      { kind: 'heading3',  label: 'Heading 3',   Icon: Heading3 },
      { kind: 'quote',     label: 'Pull a quote', Icon: Quote },
    ],
  },
  {
    title: 'List',
    items: [
      { kind: 'bulleted', label: 'Bulleted list', Icon: List },
      { kind: 'numbered', label: 'Numbered list', Icon: ListOrdered },
    ],
  },
]

function BlockPicker({
  onPick,
  onClose,
}: {
  onPick: (kind: BlockPickerKind) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'insert' | 'template'>('all')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  // Filter groups by search query
  const filteredGroups = BLOCK_PICKER_GROUPS
    .map(g => ({
      ...g,
      items: g.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter(g => g.items.length > 0)

  return (
    <div
      ref={ref}
      className="w-[560px] max-h-[480px] flex flex-col bg-white rounded-[12px]
        shadow-[0px_0px_0px_1px_rgba(41,41,41,0.04),0px_1px_2px_-1px_rgba(123,123,123,0.2),0px_2px_24px_-1px_rgba(128,128,128,0.22)]
        overflow-hidden"
      role="dialog"
      aria-label="Insert block"
    >
      {/* Search header */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center gap-2 h-10 px-3 rounded-[12px] bg-white border border-slate-200 shadow-xs">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-[14px] py-[14px] flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          {(['all', 'insert', 'template'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'px-3 py-1.5 rounded-[12px] border text-xs font-medium leading-5 capitalize transition-colors shadow-xs',
                tab === t
                  ? 'bg-slate-900 text-neutral-50 border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sections */}
        {filteredGroups.length === 0 ? (
          <p className="text-sm text-slate-400">No matches.</p>
        ) : (
          filteredGroups.map(g => (
            <div key={g.title} className="flex flex-col gap-2">
              <p className="text-[12px] font-medium text-slate-900 leading-[14px]">{g.title}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map(item => (
                  <button
                    key={`${g.title}-${item.label}`}
                    type="button"
                    onClick={() => onPick(item.kind)}
                    className="w-[115px] h-[91px] flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] bg-white border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    <div className="size-[26px] flex items-center justify-center rounded-[4px] bg-white">
                      <item.Icon size={18} strokeWidth={1.5} className="text-slate-700" />
                    </div>
                    <span className="text-[12px] font-medium text-neutral-800 leading-[14px]">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function NewsCreationV5() {
  const router = useRouter()
  const [blocks, setBlocks] = useState<ContentBlock[]>(INITIAL_BLOCKS)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Click outside any row clears the active state (releases the hover lock)
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node
      if (editorRef.current && !editorRef.current.contains(target)) {
        setActiveId(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Manage Details form state
  const [categories, setCategories] = useState<string[]>([])
  const [author, setAuthor] = useState('')
  const [newsType, setNewsType] = useState<NewsType>('Normal News')
  const [reviewChecks, setReviewChecks] = useState({
    grammar: false,
    tone:    false,
    clarity: false,
  })

  // Review-mode flow
  type CheckStatus = 'idle' | 'running' | 'pass'
  const [mode, setMode] = useState<'edit' | 'review'>('edit')
  const [checks, setChecks] = useState<{ grammar: CheckStatus; tone: CheckStatus; clarity: CheckStatus }>({
    grammar: 'idle', tone: 'idle', clarity: 'idle',
  })
  const [published, setPublished] = useState(false)

  function enterReview() {
    setActiveId(null)
    setDetailsOpen(false)
    setMode('review')
    setChecks({ grammar: 'running', tone: 'idle', clarity: 'idle' })
    setTimeout(() => setChecks(c => ({ ...c, grammar: 'pass', tone: 'running' })), 900)
    setTimeout(() => setChecks(c => ({ ...c, tone: 'pass', clarity: 'running' })), 1800)
    setTimeout(() => setChecks(c => ({ ...c, clarity: 'pass' })), 2700)
  }
  function backToEdit() {
    setMode('edit')
    setChecks({ grammar: 'idle', tone: 'idle', clarity: 'idle' })
    setPublished(false)
  }
  const allChecksPassed = checks.grammar === 'pass' && checks.tone === 'pass' && checks.clarity === 'pass'

  // Word counter
  const wordCount = blocks
    .map(b => b.value ?? '')
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  function update(id: string, patch: Partial<ContentBlock>) {
    setBlocks(bs => bs.map(b => (b.id === id ? { ...b, ...patch } : b)))
  }
  function addParagraph() {
    setBlocks(bs => [...bs, { id: `b-${Date.now()}`, kind: 'paragraph', value: '' }])
  }

  // Insert from BlockPicker — map picker-kind into our ContentBlock kinds.
  function insertAt(index: number, kind: BlockPickerKind) {
    const id = `b-${Date.now()}`
    const newBlock: ContentBlock =
      kind === 'image'    ? { id, kind: 'image' }
      : kind === 'heading1' ? { id, kind: 'title',    value: '' }
      : kind === 'heading2' || kind === 'heading3' ? { id, kind: 'subtitle', value: '' }
      :                      { id, kind: 'paragraph', value: '' }
    setBlocks(bs => [...bs.slice(0, index), newBlock, ...bs.slice(index)])
    setPickerIndex(null)
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden relative"
      style={{
        background: `
          radial-gradient(70% 40% at 100% 0%, rgba(124,58,237,0.08) 0%, transparent 60%),
          radial-gradient(55% 35% at 92% 22%, rgba(7,135,255,0.10) 0%, transparent 65%),
          #fafafa
        `,
      }}
    >
      <CollapsedSidebar />

      {/* Workspace card — pure white writing surface */}
      <main className="flex-1 min-w-0 pr-[10px] py-[9px] flex">
        <div className="flex-1 min-w-0 flex flex-col bg-white border border-slate-200 rounded-[14px] shadow-[0px_10px_28px_-12px_rgba(7,15,40,0.10),0px_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">

          {/* ── Top bar ─────────────────────────────────────────────────── */}
          <header className="flex items-center justify-between px-4 py-[14px] border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 min-h-9 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft size={16} strokeWidth={2} className="text-neutral-900" />
                <span className="text-sm font-medium text-neutral-900 leading-5">Back</span>
              </button>
              <h1 className="font-display text-[18px] font-medium text-neutral-800 leading-[1.5] px-1.5">
                New news
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {mode === 'edit' ? (
                <>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-800 leading-[1.25] tracking-[-0.14px] hover:bg-slate-50 transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-xs text-sm font-medium text-slate-800 leading-[1.25] tracking-[-0.14px] hover:bg-slate-50 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={enterReview}
                    className="relative px-3.5 py-2 rounded-lg text-sm font-medium text-white leading-[1.25] tracking-[-0.14px] transition-all
                      bg-gradient-to-br from-brand-500 to-violet-500 hover:brightness-110
                      shadow-[0_8px_20px_-6px_rgba(7,135,255,0.55),inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                  >
                    Continue to review
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={backToEdit}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-xs text-sm font-medium text-slate-800 leading-[1.25] tracking-[-0.14px] hover:bg-slate-50 transition-colors"
                  >
                    Back to edit
                  </button>
                  <button
                    type="button"
                    disabled={!allChecksPassed || published}
                    onClick={() => setPublished(true)}
                    className="relative px-3.5 py-2 rounded-lg text-sm font-medium text-white leading-[1.25] tracking-[-0.14px] transition-all
                      bg-gradient-to-br from-brand-500 to-violet-500 hover:brightness-110
                      shadow-[0_8px_20px_-6px_rgba(7,135,255,0.55),inset_0_0_0_1px_rgba(255,255,255,0.15)]
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
                  >
                    {published ? 'Published ✓' : 'Publish'}
                  </button>
                </>
              )}
            </div>
          </header>

          {/* ── Word count + Manage details ──────────────────────────────── */}
          <div className="flex items-center justify-end gap-[14px] pt-[14px] pb-2 px-4 shrink-0">
            <span className="text-sm text-slate-600 leading-[1.5] tracking-[-0.14px]">
              {wordCount.toLocaleString()} words
            </span>
            <button
              type="button"
              onClick={() => setDetailsOpen(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs text-xs font-medium text-slate-800 leading-[1.5] hover:bg-slate-50 transition-colors"
            >
              <FileText size={14} strokeWidth={1.5} />
              Manage details
            </button>
          </div>

          {/* ── Editor body ─────────────────────────────────────────────── */}
          <div ref={editorRef} className="flex-1 min-h-0 overflow-y-auto">
            {blocks.map((b, i) => (
              <div key={b.id} className="relative">
                {/* Block */}
                {b.kind === 'title' && (
                  <Row
                    kind="title"
                    isActive={activeId === b.id}
                    lockedOut={activeId !== null && activeId !== b.id}
                    onSelect={() => setActiveId(b.id)}
                    onDelete={() => setBlocks(bs => bs.filter(x => x.id !== b.id))}
                  >
                    <AutoTextarea
                      value={b.value ?? ''}
                      onChange={v => update(b.id, { value: v })}
                      placeholder="Title"
                      className="font-bold text-[32px] leading-[1.3] tracking-tight text-neutral-950 placeholder:text-slate-300"
                    />
                  </Row>
                )}
                {b.kind === 'subtitle' && (
                  <Row
                    kind="subtitle"
                    isActive={activeId === b.id}
                    lockedOut={activeId !== null && activeId !== b.id}
                    onSelect={() => setActiveId(b.id)}
                    onDelete={() => setBlocks(bs => bs.filter(x => x.id !== b.id))}
                  >
                    <AutoTextarea
                      value={b.value ?? ''}
                      onChange={v => update(b.id, { value: v })}
                      placeholder="Sub-Title"
                      className="font-semibold text-[16px] leading-6 text-neutral-800 placeholder:text-slate-300"
                    />
                  </Row>
                )}
                {b.kind === 'image' && (
                  <Row
                    kind="image"
                    isActive={activeId === b.id}
                    lockedOut={activeId !== null && activeId !== b.id}
                    onSelect={() => setActiveId(b.id)}
                    onDelete={() => setBlocks(bs => bs.filter(x => x.id !== b.id))}
                  >
                    <ImageDropzone
                      url={b.imageUrl}
                      onPick={url => update(b.id, { imageUrl: url })}
                      onRemove={() => update(b.id, { imageUrl: undefined })}
                    />
                  </Row>
                )}
                {b.kind === 'paragraph' && (
                  <Row
                    kind="paragraph"
                    isActive={activeId === b.id}
                    lockedOut={activeId !== null && activeId !== b.id}
                    onSelect={() => setActiveId(b.id)}
                    onMove={dir => {
                      setBlocks(bs => {
                        const i = bs.findIndex(x => x.id === b.id)
                        const j = dir === 'up' ? i - 1 : i + 1
                        if (i < 0 || j < 0 || j >= bs.length) return bs
                        const next = [...bs]
                        ;[next[i], next[j]] = [next[j], next[i]]
                        return next
                      })
                    }}
                    onDelete={() => setBlocks(bs => bs.filter(x => x.id !== b.id))}
                  >
                    <AutoTextarea
                      value={b.value ?? ''}
                      onChange={v => update(b.id, { value: v })}
                      placeholder="Description here.."
                      className="text-[16px] leading-6 text-neutral-800 placeholder:text-slate-300"
                      minRows={3}
                    />
                  </Row>
                )}

                {/* Between-row gutter — insert above next block (i+1) */}
                {i < blocks.length - 1 && (
                  <div className="relative">
                    <InsertGutter onInsert={() => setPickerIndex(i + 1)} />
                    {pickerIndex === i + 1 && (
                      <div className="absolute left-[34px] top-full z-50 mt-1">
                        <BlockPicker
                          onPick={kind => insertAt(i + 1, kind)}
                          onClose={() => setPickerIndex(null)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add content row — shadcn "ghost" trigger that fills the gutter */}
            <button
              type="button"
              onClick={addParagraph}
              className="group/add flex gap-4 items-start px-6 py-[18px] w-full text-left transition-colors hover:bg-slate-50/60 focus-visible:outline-none focus-visible:bg-slate-50/80"
            >
              <div className="flex items-center pt-[2px] shrink-0 w-5 justify-center">
                <span
                  className="flex items-center justify-center size-5 rounded-full text-white transition-all
                    bg-gradient-to-br from-brand-500 to-violet-500
                    group-hover/add:scale-110 group-hover/add:brightness-110
                    group-hover/add:shadow-[0_8px_20px_-4px_rgba(124,58,237,0.55)]"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </span>
              </div>
              <div className="flex-1 min-w-0 h-[131px] flex items-start px-6 border-l-[1.5px] border-black/10">
                <span className="text-[16px] leading-6 text-slate-400 group-hover/add:text-slate-600 transition-colors">
                  Add new content
                </span>
              </div>
            </button>

            <div className="h-12" />
          </div>
        </div>
      </main>

      {/* ── Manage Details modal-style right panel ───────────────────────── */}
      {detailsOpen && (
        <ManageDetailsModal
          categories={categories}
          setCategories={setCategories}
          author={author}
          setAuthor={setAuthor}
          newsType={newsType}
          setNewsType={setNewsType}
          reviewChecks={reviewChecks}
          setReviewChecks={setReviewChecks}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Manage Details modal (456px, absolute over editor with dim backdrop) ────
function ManageDetailsModal({
  categories,
  setCategories,
  author,
  setAuthor,
  newsType,
  setNewsType,
  reviewChecks,
  setReviewChecks,
  onClose,
}: {
  categories: string[]
  setCategories: (v: string[]) => void
  author: string
  setAuthor: (v: string) => void
  newsType: NewsType
  setNewsType: (v: NewsType) => void
  reviewChecks: { grammar: boolean; tone: boolean; clarity: boolean }
  setReviewChecks: (v: { grammar: boolean; tone: boolean; clarity: boolean }) => void
  onClose: () => void
}) {
  return (
    <>
      {/* Dim backdrop (rgba(26,26,26,0.2) per Figma) */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(26,26,26,0.2)' }}
        onClick={onClose}
      />

      {/* Panel — fixed to the right edge, 456px wide, rounded-12 white card */}
      <aside
        className="fixed right-[10px] top-[9px] bottom-[9px] z-50 w-[456px] bg-white border border-neutral-200 rounded-[12px] flex flex-col overflow-hidden"
        role="dialog"
        aria-label="News Details"
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-neutral-200 shrink-0">
          <p className="flex-1 min-w-0 text-[16px] font-semibold text-neutral-900 leading-[1.5] truncate">
            News Details
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-xs text-sm font-medium text-slate-800 leading-[1.25] tracking-[-0.14px] hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
          {/* Category Name */}
          <CategoryField values={categories} onChange={setCategories} />

          {/* Author */}
          <Field label="Author">
            <Input
              size="md"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Add author"
              className="rounded-[12px]"
            />
          </Field>

          {/* News Type */}
          <NewsTypeField value={newsType} onChange={setNewsType} />

          {/* Divider */}
          <div className="h-px bg-neutral-200" />

          {/* News Review */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 py-2">
              <Sparkles size={16} strokeWidth={1.5} className="text-slate-800" />
              <p className="flex-1 text-sm font-medium text-slate-800 leading-5">News Review</p>
            </div>

            <ReviewCheckRow
              label="Check Grammar and Spelling"
              checked={reviewChecks.grammar}
              onChange={v => setReviewChecks({ ...reviewChecks, grammar: v })}
            />
            <ReviewCheckRow
              label="Check Tone of Voice"
              checked={reviewChecks.tone}
              onChange={v => setReviewChecks({ ...reviewChecks, tone: v })}
            />
            <ReviewCheckRow
              label="Ensure Clarity"
              checked={reviewChecks.clarity}
              onChange={v => setReviewChecks({ ...reviewChecks, clarity: v })}
            />
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Field label wrapper ────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-slate-800 leading-[1.25] tracking-[-0.14px]">{label}</p>
      {children}
    </div>
  )
}

// ─── News Type dropdown (rounded-12 like Inline input in Figma) ──────────────
function NewsTypeField({
  value,
  onChange,
}: {
  value: NewsType
  onChange: (v: NewsType) => void
}) {
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
    <div className="flex flex-col gap-2" ref={ref}>
      <p className="text-sm font-medium text-slate-800 leading-[1.25] tracking-[-0.14px]">News Type</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-[10px] rounded-[12px] border border-neutral-300 bg-white text-left hover:bg-slate-50 transition-colors"
        >
          <span className="flex-1 min-w-0 text-sm text-neutral-600 leading-[1.5] tracking-[-0.14px] truncate">
            {value}
          </span>
          <Info size={16} strokeWidth={1.5} className="text-slate-400 shrink-0" />
          <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute z-10 left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-[12px] shadow-card overflow-hidden">
            {(['Normal News', 'Breaking News', 'Feature', 'Opinion'] as NewsType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false) }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-slate-50"
              >
                {t}
                {t === value && <Check size={14} className="text-brand-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Category multi-select (closed: text input; open: chips + search + list) ─
function CategoryField({
  values,
  onChange,
}: {
  values: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const filtered = CATEGORY_OPTIONS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  )

  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter(v => v !== id) : [...values, id])
  }

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <p className="text-sm font-medium text-slate-800 leading-[1.25] tracking-[-0.14px]">Category Name</p>

      <div className="relative">
        {/* Trigger: rounded-[12px] border neutral-300, white bg, gray placeholder */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true) } }}
          className={`w-full min-h-[42px] px-3 py-[10px] rounded-[12px] border bg-white cursor-text transition-colors ${open ? 'border-brand-400' : 'border-neutral-300 hover:border-neutral-400'}`}
        >
          {values.length === 0 ? (
            <span className="text-sm text-neutral-600 leading-[1.5] tracking-[-0.14px]">
              Enter category title here
            </span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {values.map(id => {
                const c = CATEGORY_OPTIONS.find(o => o.id === id)
                if (!c) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-[3px] bg-brand-500 text-white rounded-full text-xs leading-none font-medium"
                  >
                    {c.label}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); toggle(id) }}
                      className="size-4 rounded-full hover:bg-white/20 flex items-center justify-center"
                      aria-label={`Remove ${c.label}`}
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Open: search + scrollable list with checkmarks (Figma "filled state") */}
        {open && (
          <div className="absolute z-10 left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-[12px] shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-100">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search categories"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="max-h-[240px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-400">No results</p>
              ) : (
                filtered.map(c => {
                  const checked = values.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-slate-50 text-left"
                    >
                      <span className="text-sm text-neutral-800">{c.label}</span>
                      <span
                        className={`size-4 rounded-[4px] border flex items-center justify-center ${checked ? 'bg-brand-500 border-brand-500 text-white' : 'border-neutral-300'}`}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Review checkbox row (dashed unchecked circle, solid check when on) ──────
function ReviewCheckRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-2 py-2 text-left"
    >
      {/* 16px circle — dashed border when off, brand fill when on */}
      <span
        className={`shrink-0 size-4 rounded-full flex items-center justify-center transition-colors ${checked ? 'bg-brand-500 text-white' : 'border border-dashed border-neutral-400'}`}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="text-sm font-medium text-slate-900 leading-5">{label}</span>
    </button>
  )
}
