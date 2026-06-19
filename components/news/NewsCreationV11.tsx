'use client'

/**
 * NewsCreationV11 — Figma news-creation flow, dashboard-soft skin.
 *
 * Implements every state from the Figma flow (4170:4693):
 *   1. Default editor (empty cards: Title, Sub-Title, Image, Description)
 *   2. Composing (filled in)
 *   3. Manage Details right panel (Category, Author, News Type)
 *   4. Image picker overlay (search + grid)
 *   5. Block picker overlay (H1/H2/H3, image, quote, attachment)
 *   6. Continue to Review → AI checklist
 *   7. Category search picker (from Needs Attention)
 *
 * Visual direction: Urbanist, pale-blue canvas, white rounded-[24px]
 * cards with soft shadows, coral primary CTA, yellow status accents.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Search,
  Plus, FileText, Image as ImageIcon, Quote, Type, Heading1, Heading2,
  List, Link2, Sparkles, X, LayoutDashboard, Newspaper,
  FilePen, Layers, ListChecks, Folder, BarChart3, Image as MediaIcon,
  Users, Wrench, Settings, Pin, ListFilter, Clock, Tag,
} from 'lucide-react'

/* ───────────────────────────────────────────────────────────────────────────
   Data
   ─────────────────────────────────────────────────────────────────────────── */

type CardKind = 'heading' | 'subheading' | 'image' | 'paragraph' | 'quote' | 'attachment'
type Card = { id: string; kind: CardKind; value: string; alt?: string }

const STARTING_CARDS: Card[] = [
  { id: 'c-title', kind: 'heading',     value: '' },
  { id: 'c-sub',   kind: 'subheading',  value: '' },
  { id: 'c-img',   kind: 'image',       value: '' },
  { id: 'c-desc',  kind: 'paragraph',   value: '' },
]

const SAMPLE_CARDS: Card[] = [
  { id: 'c-title', kind: 'heading',    value: 'Holding center stabilises after management shake-up' },
  { id: 'c-sub',   kind: 'subheading', value: 'Food shortage on Monday left residents on edge — supplies resumed Tuesday morning.' },
  { id: 'c-img',   kind: 'image',      value: '/cover.jpg', alt: 'Holding center exterior' },
  { id: 'c-desc',  kind: 'paragraph',  value: 'Residents of the Radhaswami holding center in Kirtipur grew anxious on Monday morning after the regular tea and breakfast service did not arrive. Children waited past 9 a.m. before parents began visiting the on-site canteen for answers.' },
  { id: 'c-q',     kind: 'quote',      value: '"This decision was made without consulting the workers," one resident said.' },
  { id: 'c-p2',    kind: 'paragraph',  value: 'New management took over the same evening. By Tuesday morning, both tea and a hot meal had been served on schedule, and city police stationed inside the compound confirmed the situation had returned to normal.' },
]

const IMAGE_LIBRARY: { id: string; title: string; tag: string; tone: string }[] = [
  { id: 'img-1', title: 'Holding center exterior',     tag: 'Kirtipur · 2026',     tone: 'from-[#fde68a] to-[#fca5a5]' },
  { id: 'img-2', title: 'Workers gathered at canteen', tag: 'Reuters',             tone: 'from-[#bae6fd] to-[#c7d2fe]' },
  { id: 'img-3', title: 'Parents at the gate',         tag: 'Original photo',     tone: 'from-[#bbf7d0] to-[#fde68a]' },
  { id: 'img-4', title: 'Police perimeter, Monday',    tag: 'Original photo',     tone: 'from-[#e9d5ff] to-[#bae6fd]' },
  { id: 'img-5', title: 'Holding center, Tuesday',     tag: 'Original photo',     tone: 'from-[#fed7aa] to-[#fde68a]' },
  { id: 'img-6', title: 'Newly served breakfast',      tag: 'Original photo',     tone: 'from-[#fbcfe8] to-[#fde68a]' },
]

const CATEGORY_OPTIONS = [
  'Politics', 'Economy', 'Society', 'Culture', 'Sports', 'World', 'Opinion',
  'Business', 'Markets', 'Technology', 'Science', 'Health', 'Education',
  'Environment', 'Climate', 'Energy', 'Agriculture', 'Crime', 'Justice',
  'Defense', 'Foreign Affairs', 'Local', 'Kathmandu', 'Lalitpur', 'Birgunj',
]

const NEWS_TYPES = ['Breaking', 'Feature', 'Analysis', 'Opinion', 'Photo Essay', 'Interview']

type CheckResult = {
  id: string
  group: 'attention' | 'suggestion' | 'verified'
  title: string
  detail?: string
  action?: string
}

const AI_CHECKS: CheckResult[] = [
  { id: 'cat',  group: 'attention',  title: 'Choose a category',         detail: 'Required before sending to editor.', action: 'Choose category' },
  { id: 'src',  group: 'attention',  title: 'Unsupported claim in p4',   detail: '“50,000 workers will be affected” — no linked source.', action: 'Link source' },
  { id: 'att',  group: 'attention',  title: 'Quote needs attribution',   detail: 'Direct quote in p5 has no named speaker.', action: 'Add speaker' },
  { id: 'gram', group: 'suggestion', title: 'Grammar — 3 polish edits',   detail: 'Punctuation and clause clarity.', action: 'Preview' },
  { id: 'head', group: 'suggestion', title: 'Headline polish',            detail: 'Tighter framing, same meaning.', action: 'Preview' },
  { id: 'cov',  group: 'verified',   title: 'Cover image verified',      detail: '16:9 · 142 KB · alt text present.' },
  { id: 'dup',  group: 'verified',   title: 'No duplicate content',      detail: 'Scanned 6 cards against prior coverage.' },
  { id: 'leg',  group: 'verified',   title: 'No legal risk flagged',     detail: 'No unattributed accusations.' },
  { id: 'meta', group: 'verified',   title: 'Metadata filled',           detail: 'Tags · slug · summary.' },
]

/* ───────────────────────────────────────────────────────────────────────────
   Root
   ─────────────────────────────────────────────────────────────────────────── */

type Mode = 'editing' | 'reviewing' | 'reviewed'

export default function NewsCreationV11() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('editing')
  const [cards, setCards] = useState<Card[]>(STARTING_CARDS)
  const [focusedCard, setFocusedCard] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [imagePickerFor, setImagePickerFor] = useState<string | null>(null)
  const [blockPickerOpen, setBlockPickerOpen] = useState(false)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [resolvedChecks, setResolvedChecks] = useState<Set<string>>(new Set())

  // News details
  const [category, setCategory] = useState<string | null>(null)
  const [author, setAuthor] = useState('Adam Driver')
  const [newsType, setNewsType] = useState<string | null>(null)

  const wordCount = useMemo(() => {
    const all = cards.map(c => c.value).join(' ').trim()
    if (!all) return 0
    return all.split(/\s+/).length
  }, [cards])

  const charCount = useMemo(() => cards.map(c => c.value).join('').length, [cards])

  function updateCard(id: string, patch: Partial<Card>) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  function addCard(kind: CardKind) {
    const id = `c-${Date.now()}`
    setCards(prev => [...prev, { id, kind, value: '' }])
    setBlockPickerOpen(false)
    setFocusedCard(id)
  }

  function removeCard(id: string) {
    setCards(prev => prev.filter(c => c.id !== id))
  }

  function loadSample() {
    setCards(SAMPLE_CARDS)
  }

  function continueToReview() {
    if (cards.every(c => !c.value)) loadSample()
    setMode('reviewing')
    window.setTimeout(() => setMode('reviewed'), 1400)
  }

  const openAttention = AI_CHECKS.filter(c => c.group === 'attention' && !resolvedChecks.has(c.id))
  const openSuggestions = AI_CHECKS.filter(c => c.group === 'suggestion' && !resolvedChecks.has(c.id))
  const verified = AI_CHECKS.filter(c => c.group === 'verified')
  const pending = openAttention.length + openSuggestions.length
  const ready = pending === 0 && mode === 'reviewed'

  function resolve(id: string) {
    setResolvedChecks(prev => { const n = new Set(prev); n.add(id); return n })
  }

  useEffect(() => {
    if (category) resolve('cat')
  }, [category])

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden"
      style={{
        fontFamily: 'var(--font-urbanist)',
        background: 'radial-gradient(80% 60% at 50% 0%, #eaf1fb 0%, #dde7f3 55%, #cfdcec 100%)',
      }}
    >
      <V11Styles />

      <Sidebar />

      <main className="flex-1 mt-[14px] mb-[14px] mr-[14px] bg-white border border-[#e6ecf4] rounded-[24px] shadow-[0px_24px_60px_-20px_rgba(31,57,99,0.12),0px_2px_6px_-2px_rgba(31,57,99,0.06)] overflow-hidden flex flex-col min-w-0">

        {/* Top header */}
        <header className="border-b border-[#eef2f7] flex items-center justify-between px-6 h-[68px] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 h-9 pl-2 pr-3 rounded-[12px] bg-[#f7faff] border border-[#eef2f7] text-[#0f172a] text-[13px] font-semibold tracking-tight hover:bg-[#eef4fb] transition-colors"
            >
              <ArrowLeft size={15} strokeWidth={2.25} /> Back
            </button>
            <h1 className="text-[17px] font-semibold leading-6 text-[#0f172a] tracking-tight truncate">
              New news
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full bg-[#FED7AA] text-[#9A3412] text-[10.5px] font-bold uppercase tracking-[0.12em] leading-none">
              Draft
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-[36px] px-3.5 rounded-[12px] text-[13px] font-semibold text-[#475569] hover:bg-[#f3f6fb] tracking-tight transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-[36px] px-3.5 rounded-[12px] bg-white border border-[#e6ecf4] text-[#0f172a] text-[13px] font-semibold tracking-tight shadow-[0_1px_2px_0_rgba(31,57,99,0.04)] hover:bg-[#f7faff] transition-colors"
            >
              Preview
            </button>
            <PrimaryButton onClick={continueToReview}>
              Continue to review <ArrowRight size={13} strokeWidth={2.5} />
            </PrimaryButton>
          </div>
        </header>

        {/* Secondary row */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            {mode !== 'editing' && (
              <button
                type="button"
                onClick={() => { setMode('editing'); setResolvedChecks(new Set()) }}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#f3f6fb] text-[#475569] text-[12px] font-semibold tracking-tight hover:bg-[#e6ecf4] transition-colors"
              >
                <ArrowLeft size={12} strokeWidth={2.5} /> Back to editor
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] text-[#64748b] tabular-nums">{wordCount.toLocaleString()} words</span>
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] bg-white border border-[#e6ecf4] text-[#0f172a] text-[12.5px] font-semibold tracking-tight hover:bg-[#f7faff] transition-colors"
            >
              <FileText size={13} strokeWidth={2} className="text-[#94a3b8]" /> Manage details
            </button>
          </div>
        </div>

        {/* Body */}
        {mode === 'editing' && (
          <article className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-[820px] pl-12 pr-8 py-6 flex flex-col gap-2">
              {cards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  focused={focusedCard === card.id}
                  onFocus={() => setFocusedCard(card.id)}
                  onBlur={() => setFocusedCard(null)}
                  onChange={(v) => updateCard(card.id, { value: v })}
                  onRemove={() => removeCard(card.id)}
                  onPickImage={() => setImagePickerFor(card.id)}
                />
              ))}

              <button
                type="button"
                onClick={() => setBlockPickerOpen(true)}
                className="mt-3 self-start inline-flex items-center gap-2 h-11 px-5 rounded-[14px] bg-white border border-dashed border-[#cfd9e8] text-[#475569] text-[13.5px] font-semibold tracking-tight hover:border-[#0787FF] hover:text-[#0787FF] hover:bg-[#eff6ff] transition-colors"
              >
                <Plus size={15} strokeWidth={2.25} /> Add new card
              </button>

              <div className="h-24" />
            </div>
          </article>
        )}

        {mode === 'reviewing' && <ReviewingState />}

        {mode === 'reviewed' && (
          <ReviewedView
            cards={cards}
            attention={openAttention}
            suggestions={openSuggestions}
            verified={verified}
            ready={ready}
            pending={pending}
            onResolve={resolve}
            onOpenCategory={() => setCategoryPickerOpen(true)}
            category={category}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-[#eef2f7] flex items-center justify-between px-6 h-[52px] shrink-0">
          <div className="text-[12px] text-[#94a3b8] font-medium tracking-tight">
            Autosaved · 12s ago
          </div>
          <div className="flex items-center gap-3 text-[12px] text-[#64748b] tabular-nums">
            <span>{wordCount.toLocaleString()} words</span>
            <span className="size-1 rounded-full bg-[#cbd5e1]" />
            <span>{charCount.toLocaleString()} characters</span>
          </div>
        </footer>
      </main>

      {/* Manage details slide-over */}
      {detailsOpen && (
        <DetailsPanel
          category={category}
          author={author}
          newsType={newsType}
          onClose={() => setDetailsOpen(false)}
          onOpenCategory={() => { setDetailsOpen(false); setCategoryPickerOpen(true) }}
          onAuthor={setAuthor}
          onNewsType={setNewsType}
        />
      )}

      {/* Image picker */}
      {imagePickerFor && (
        <ImagePicker
          onPick={(img) => {
            updateCard(imagePickerFor, { value: img.id, alt: img.title })
            setImagePickerFor(null)
          }}
          onClose={() => setImagePickerFor(null)}
        />
      )}

      {/* Block picker */}
      {blockPickerOpen && (
        <BlockPicker
          onPick={(kind) => addCard(kind)}
          onClose={() => setBlockPickerOpen(false)}
        />
      )}

      {/* Category picker */}
      {categoryPickerOpen && (
        <CategoryPicker
          value={category}
          onPick={(c) => { setCategory(c); setCategoryPickerOpen(false) }}
          onClose={() => setCategoryPickerOpen(false)}
        />
      )}
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Sidebar
   ─────────────────────────────────────────────────────────────────────────── */

function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const items: { Icon: typeof LayoutDashboard; label: string }[] = [
    { Icon: LayoutDashboard, label: 'Dashboard' },
    { Icon: Newspaper,       label: 'News' },
    { Icon: FilePen,         label: 'Drafts' },
    { Icon: ListFilter,      label: 'Category' },
    { Icon: Layers,          label: 'Series' },
    { Icon: Folder,          label: 'Archived' },
    { Icon: ListChecks,      label: 'Tasks' },
    { Icon: BarChart3,       label: 'Performance' },
    { Icon: MediaIcon,       label: 'Media' },
    { Icon: Users,           label: 'People' },
  ]
  const footer: { Icon: typeof Wrench; label: string }[] = [
    { Icon: Wrench,   label: 'Site config' },
    { Icon: Settings, label: 'Settings' },
  ]
  return (
    <nav
      className={`shrink-0 mt-[14px] mb-[14px] ml-[14px] mr-[14px] bg-white border border-[#e6ecf4] rounded-[20px] shadow-[0px_24px_60px_-20px_rgba(31,57,99,0.10),0px_2px_6px_-2px_rgba(31,57,99,0.04)] flex flex-col gap-4 ${expanded ? 'items-stretch px-3 py-5' : 'items-center px-3 py-5'} overflow-hidden`}
      style={{
        width: expanded ? 224 : 64,
        transition: 'width 260ms cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Brand — click to toggle */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2.5 h-9 rounded-[12px] hover:bg-[#f3f6fb] transition-colors px-1 -mx-1"
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <span className="size-9 rounded-[12px] bg-[#0f172a] inline-flex items-center justify-center text-white text-[14px] font-bold tracking-tight shrink-0">
          S
        </span>
        {expanded && (
          <span
            className="text-[15px] font-bold tracking-tight text-[#0f172a] whitespace-nowrap v11-side-fade"
            style={{ fontFamily: 'var(--font-urbanist)' }}
          >
            Snowberry
          </span>
        )}
      </button>

      <div className={`h-px bg-[#e6ecf4] ${expanded ? 'w-full' : 'w-8 mx-auto'}`} />

      {/* New article CTA */}
      <button
        type="button"
        className={`group inline-flex items-center gap-2.5 h-9 rounded-[12px] bg-[#0787FF] shadow-[0px_8px_18px_-6px_rgba(7,135,255,0.45)] hover:brightness-105 transition-[filter] ${expanded ? 'justify-start px-2.5' : 'justify-center w-9 self-center'}`}
      >
        <Plus size={16} strokeWidth={2.5} className="text-white shrink-0" />
        {expanded && (
          <span
            className="text-[13px] font-semibold text-white tracking-tight v11-side-fade"
            style={{ fontFamily: 'var(--font-urbanist)' }}
          >
            New Article
          </span>
        )}
      </button>

      {/* Main items */}
      <div className="flex flex-col gap-1">
        {items.map(({ Icon, label }, i) => (
          <SideItem key={i} Icon={Icon} label={label} expanded={expanded} active={i === 0} />
        ))}
      </div>

      {/* Footer items */}
      <div className="mt-auto flex flex-col gap-1">
        {footer.map(({ Icon, label }, i) => (
          <SideItem key={i} Icon={Icon} label={label} expanded={expanded} />
        ))}
      </div>
    </nav>
  )
}

function SideItem({
  Icon, label, expanded, active,
}: {
  Icon: typeof LayoutDashboard
  label: string
  expanded: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={expanded ? undefined : label}
      className={`group flex items-center gap-2.5 h-9 rounded-[11px] transition-colors ${
        expanded ? 'justify-start px-2.5 w-full' : 'justify-center w-9 self-center'
      } ${
        active
          ? 'bg-[#DBEAFE] text-[#0787FF]'
          : 'text-[#94a3b8] hover:bg-[#f3f6fb] hover:text-[#0f172a]'
      }`}
    >
      <Icon size={18} strokeWidth={1.75} className="shrink-0" />
      {expanded && (
        <span
          className="text-[13px] font-medium tracking-tight whitespace-nowrap v11-side-fade"
          style={{ fontFamily: 'var(--font-urbanist)' }}
        >
          {label}
        </span>
      )}
    </button>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Card row
   ─────────────────────────────────────────────────────────────────────────── */

function CardRow({
  card, focused, onFocus, onBlur, onChange, onRemove, onPickImage,
}: {
  card: Card
  focused: boolean
  onFocus: () => void
  onBlur: () => void
  onChange: (v: string) => void
  onRemove: () => void
  onPickImage: () => void
}) {
  const Glyph = kindGlyph(card.kind)
  return (
    <div
      className={`group relative flex gap-3 px-3 py-3 -mx-3 rounded-[16px] transition-colors ${
        focused ? 'bg-[#f7faff]' : 'hover:bg-[#f7faff]/60'
      }`}
      onMouseDown={onFocus}
    >
      {/* Gutter icon */}
      <div className="flex flex-col items-center pt-1 select-none">
        <div className={`size-8 rounded-[10px] inline-flex items-center justify-center transition-colors ${
          focused ? 'bg-[#DBEAFE] text-[#0787FF]' : 'bg-[#f3f6fb] text-[#94a3b8] group-hover:text-[#475569]'
        }`}>
          <Glyph size={14} strokeWidth={2.25} />
        </div>
        <div className={`flex-1 w-px mt-2 ${focused ? 'bg-[#0787FF]/30' : 'bg-transparent group-hover:bg-[#e6ecf4]'}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {card.kind === 'heading' && (
          <textarea
            value={card.value}
            placeholder="Title"
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={e => onChange(e.target.value)}
            rows={1}
            className="w-full resize-none bg-transparent outline-none text-[32px] leading-[1.15] font-bold tracking-[-0.025em] text-[#0f172a] placeholder:text-[#cbd5e1]"
          />
        )}
        {card.kind === 'subheading' && (
          <textarea
            value={card.value}
            placeholder="Sub-Title"
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={e => onChange(e.target.value)}
            rows={1}
            className="w-full resize-none bg-transparent outline-none text-[18px] leading-[1.4] font-semibold tracking-tight text-[#334155] placeholder:text-[#cbd5e1]"
          />
        )}
        {card.kind === 'image' && (
          <ImageCard
            value={card.value}
            alt={card.alt}
            onPick={onPickImage}
            onClear={() => onChange('')}
          />
        )}
        {card.kind === 'paragraph' && (
          <textarea
            value={card.value}
            placeholder="Description here.."
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={e => onChange(e.target.value)}
            rows={3}
            className="w-full resize-none bg-transparent outline-none text-[16px] leading-[1.7] text-[#1e293b] placeholder:text-[#cbd5e1]"
          />
        )}
        {card.kind === 'quote' && (
          <textarea
            value={card.value}
            placeholder="Pull quote…"
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={e => onChange(e.target.value)}
            rows={2}
            className="w-full resize-none bg-transparent outline-none text-[17px] leading-[1.5] font-medium italic text-[#0f172a] placeholder:text-[#cbd5e1] border-l-[3px] border-[#C4B5FD] pl-4"
          />
        )}
        {card.kind === 'attachment' && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] border border-[#e6ecf4] bg-white">
            <Link2 size={14} className="text-[#94a3b8]" />
            <input
              value={card.value}
              placeholder="Paste a link or attach a document…"
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={e => onChange(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[13.5px] text-[#0f172a] placeholder:text-[#94a3b8] tracking-tight"
            />
          </div>
        )}
      </div>

      {/* Hover controls */}
      <div className={`absolute right-3 top-3 flex items-center gap-1 transition-opacity ${focused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove card"
          className="size-7 rounded-[8px] inline-flex items-center justify-center text-[#94a3b8] hover:bg-white hover:text-[#0787FF] transition-colors"
        >
          <X size={13} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}

function ImageCard({ value, alt, onPick, onClear }: { value: string; alt?: string; onPick: () => void; onClear: () => void }) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="w-full h-[220px] rounded-[16px] border border-dashed border-[#cfd9e8] bg-[#f7faff] flex flex-col items-center justify-center gap-2 text-[#64748b] hover:border-[#0787FF] hover:text-[#0787FF] hover:bg-[#eff6ff] transition-colors"
      >
        <div className="size-10 rounded-[12px] bg-white border border-[#e6ecf4] inline-flex items-center justify-center">
          <ImageIcon size={16} strokeWidth={2} />
        </div>
        <p className="text-[14px] font-semibold tracking-tight">Click to add an image</p>
        <p className="text-[12px] text-[#94a3b8]">or drag and drop — PNG, JPG, WEBP</p>
      </button>
    )
  }
  const lib = IMAGE_LIBRARY.find(i => i.id === value)
  const tone = lib?.tone ?? 'from-[#bae6fd] to-[#c7d2fe]'
  return (
    <div className="relative w-full h-[260px] rounded-[16px] overflow-hidden border border-[#e6ecf4]">
      <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
      <div className="absolute left-3 bottom-3 flex items-center gap-2">
        <span className="px-2 py-1 rounded-md bg-black/30 backdrop-blur text-white text-[11px] font-semibold tracking-tight">
          {alt ?? 'Cover'}
        </span>
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPick}
          className="h-8 px-3 rounded-[10px] bg-white/95 backdrop-blur text-[#0f172a] text-[12px] font-semibold tracking-tight shadow-sm hover:bg-white transition-colors"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onClear}
          className="size-8 rounded-[10px] bg-white/95 backdrop-blur text-[#0f172a] inline-flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          aria-label="Remove image"
        >
          <X size={13} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}

function kindGlyph(kind: CardKind): typeof Heading1 {
  switch (kind) {
    case 'heading':     return Heading1
    case 'subheading':  return Type
    case 'image':       return ImageIcon
    case 'paragraph':   return List
    case 'quote':       return Quote
    case 'attachment':  return Link2
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   Reviewing & Reviewed views
   ─────────────────────────────────────────────────────────────────────────── */

function ReviewingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <span className="relative inline-flex items-center justify-center size-20 rounded-[24px] bg-[#DBEAFE]">
        <span aria-hidden className="absolute inset-0 rounded-[24px] border-[2px] border-transparent border-t-[#0787FF] animate-spin" />
        <Sparkles size={28} strokeWidth={2} className="text-[#0787FF] v11-sparkle" />
      </span>
      <div className="flex flex-col items-center gap-1.5 text-center max-w-[320px]">
        <p className="text-[18px] font-bold tracking-tight text-[#0f172a]">Berry is reviewing your story…</p>
        <p className="text-[13px] text-[#64748b] leading-relaxed">
          Checking grammar, attribution, sources, metadata, and publication readiness.
        </p>
      </div>
    </div>
  )
}

function ReviewedView({
  cards, attention, suggestions, verified, ready, pending,
  onResolve, onOpenCategory, category,
}: {
  cards: Card[]
  attention: CheckResult[]
  suggestions: CheckResult[]
  verified: CheckResult[]
  ready: boolean
  pending: number
  onResolve: (id: string) => void
  onOpenCategory: () => void
  category: string | null
}) {
  return (
    <div className="flex-1 min-w-0 overflow-hidden flex">

      {/* Article (read-only-ish) */}
      <article className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] pl-12 pr-8 py-6 flex flex-col gap-5">
          {cards.map(card => (
            <ReadCard key={card.id} card={card} />
          ))}
          <div className="h-24" />
        </div>
      </article>

      {/* AI panel */}
      <aside className="w-[400px] shrink-0 border-l border-[#eef2f7] flex flex-col bg-[#fbfdff] overflow-hidden">

        {/* Status header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#eef2f7]">
          <div className="flex items-start gap-3">
            <span className={`inline-flex items-center justify-center size-10 rounded-[14px] shrink-0 ${ready ? 'bg-[#D1FAE5] text-[#047857]' : 'bg-[#FED7AA] text-[#9A3412]'}`}>
              {ready
                ? <Check size={18} strokeWidth={2.75} />
                : <span className="text-[15px] font-bold leading-none tracking-tight">{pending}</span>}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold tracking-tight text-[#0f172a]">
                {ready
                  ? 'Ready for editorial review'
                  : `${pending} ${pending === 1 ? 'decision needs' : 'decisions need'} attention`}
              </p>
              <p className="mt-0.5 text-[12.5px] text-[#64748b] leading-relaxed">
                Estimated review time · 30 sec
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={!ready}
            className="relative mt-3.5 w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-[14px] overflow-hidden disabled:opacity-45 disabled:cursor-not-allowed enabled:hover:brightness-105 enabled:active:scale-[0.99] transition-[filter,transform,opacity]"
          >
            <span aria-hidden className={`absolute inset-0 rounded-[14px] ${ready ? 'bg-[#0787FF]' : 'bg-[#0f172a]'}`} />
            <span className="relative inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-white tracking-tight">
              Send to Editor <ArrowRight size={14} strokeWidth={2.5} />
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">

          {attention.length > 0 && (
            <CheckSection title="Needs attention" count={attention.length} accent="rose">
              {attention.map(c => (
                <CheckCard
                  key={c.id}
                  check={c}
                  tone="attention"
                  onAction={() => {
                    if (c.id === 'cat') onOpenCategory()
                    else onResolve(c.id)
                  }}
                  meta={c.id === 'cat' && category ? `Selected · ${category}` : undefined}
                />
              ))}
            </CheckSection>
          )}

          {suggestions.length > 0 && (
            <CheckSection title="Suggestions" count={suggestions.length} accent="amber">
              {suggestions.map(c => (
                <CheckCard
                  key={c.id}
                  check={c}
                  tone="suggestion"
                  onAction={() => onResolve(c.id)}
                />
              ))}
            </CheckSection>
          )}

          <CheckSection title="Fixed by Berry" count={verified.length} accent="emerald" collapsible>
            {verified.map(c => (
              <div key={c.id} className="flex items-center gap-2.5 py-1.5 px-1">
                <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={2.75} />
                </span>
                <span className="text-[12.5px] text-[#0f172a] tracking-tight">{c.title}</span>
              </div>
            ))}
          </CheckSection>
        </div>
      </aside>
    </div>
  )
}

function ReadCard({ card }: { card: Card }) {
  if (card.kind === 'heading') {
    return <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[#0f172a] leading-[1.2]">{card.value}</h2>
  }
  if (card.kind === 'subheading') {
    return <p className="text-[17px] font-semibold text-[#334155] tracking-tight leading-[1.5]">{card.value}</p>
  }
  if (card.kind === 'image') {
    const lib = IMAGE_LIBRARY.find(i => i.id === card.value)
    const tone = lib?.tone ?? 'from-[#bae6fd] to-[#c7d2fe]'
    return (
      <div className="relative w-full h-[220px] rounded-[16px] overflow-hidden border border-[#e6ecf4]">
        <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
      </div>
    )
  }
  if (card.kind === 'quote') {
    return (
      <blockquote className="border-l-[3px] border-[#C4B5FD] pl-4 text-[17px] italic font-medium text-[#0f172a] leading-[1.5]">
        {card.value}
      </blockquote>
    )
  }
  if (card.kind === 'attachment') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#f7faff] border border-[#e6ecf4] text-[#0f172a] text-[13px] font-medium">
        <Link2 size={13} className="text-[#94a3b8]" /> {card.value}
      </div>
    )
  }
  return <p className="text-[16px] leading-[1.7] text-[#1e293b]">{card.value}</p>
}

function CheckSection({
  title, count, accent, collapsible, children,
}: {
  title: string
  count: number
  accent: 'rose' | 'amber' | 'emerald'
  collapsible?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!collapsible)
  const dot = accent === 'rose' ? 'bg-[#FB7185]' : accent === 'amber' ? 'bg-[#A78BFA]' : 'bg-[#34D399]'
  return (
    <section className="px-5 pt-4 pb-1">
      <button
        type="button"
        onClick={() => collapsible && setOpen(o => !o)}
        className={`w-full flex items-center gap-2 mb-2.5 ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#475569]">{title}</span>
        <span className="text-[10.5px] font-semibold text-[#94a3b8]">· {count}</span>
        {collapsible && (
          <ChevronRight size={12} strokeWidth={2.25} className={`ml-auto text-[#94a3b8] transition-transform ${open ? 'rotate-90' : ''}`} />
        )}
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </section>
  )
}

function CheckCard({
  check, tone, onAction, meta,
}: {
  check: CheckResult
  tone: 'attention' | 'suggestion'
  onAction: () => void
  meta?: string
}) {
  const dot = tone === 'attention' ? 'bg-[#FB7185]' : 'bg-[#A78BFA]'
  return (
    <div className="rounded-[16px] border border-[#e6ecf4] bg-white overflow-hidden hover:border-[#cfd9e8] hover:shadow-[0_4px_14px_-4px_rgba(31,57,99,0.08)] transition-[border-color,box-shadow]">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span className={`mt-1.5 size-[8px] rounded-full ${dot} shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold tracking-tight text-[#0f172a] leading-[1.35]">
              {check.title}
            </p>
            {check.detail && (
              <p className="mt-1 text-[12.5px] text-[#64748b] leading-[1.5]">{check.detail}</p>
            )}
            {meta && (
              <p className="mt-1.5 text-[11.5px] text-emerald-600 font-semibold tracking-tight">{meta}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onAction}
            className={`h-8 px-3.5 rounded-[10px] text-[12.5px] font-semibold tracking-tight transition-colors ${
              tone === 'attention'
                ? 'bg-[#0f172a] text-white hover:brightness-110'
                : 'bg-white border border-[#e6ecf4] text-[#0f172a] hover:bg-[#f7faff]'
            }`}
          >
            {check.action ?? 'Resolve'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Overlays — Details panel, Image picker, Block picker, Category picker
   ─────────────────────────────────────────────────────────────────────────── */

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] v11-overlay-in"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[6px]" />
      <div
        className="relative h-full w-full flex items-center justify-center p-8"
        onMouseDown={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function DetailsPanel({
  category, author, newsType, onClose, onOpenCategory, onAuthor, onNewsType,
}: {
  category: string | null
  author: string
  newsType: string | null
  onClose: () => void
  onOpenCategory: () => void
  onAuthor: (v: string) => void
  onNewsType: (v: string) => void
}) {
  return (
    <div className="fixed inset-0 z-[55] flex justify-end v11-overlay-in" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-[#0f172a]/25 backdrop-blur-[4px]" />
      <div
        className="relative h-full w-[440px] bg-white border-l border-[#e6ecf4] shadow-[0_24px_60px_-20px_rgba(31,57,99,0.25)] flex flex-col v11-slide-in"
        onMouseDown={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 h-[68px] border-b border-[#eef2f7]">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]">Manage</p>
            <h2 className="text-[17px] font-bold tracking-tight text-[#0f172a]">News Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-[12px] inline-flex items-center justify-center text-[#475569] hover:bg-[#f3f6fb] transition-colors"
            aria-label="Close"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <Field label="Category" required>
            <button
              type="button"
              onClick={onOpenCategory}
              className="w-full h-11 px-3.5 rounded-[12px] bg-white border border-[#e6ecf4] hover:border-[#cfd9e8] text-left flex items-center justify-between transition-colors"
            >
              <span className={`text-[13.5px] tracking-tight ${category ? 'text-[#0f172a] font-semibold' : 'text-[#94a3b8]'}`}>
                {category ?? 'Category Name'}
              </span>
              <ChevronDown size={13} className="text-[#94a3b8]" />
            </button>
            <p className="text-[11.5px] text-[#94a3b8] mt-1.5">(Optional but recommended)</p>
          </Field>

          <Field label="Author">
            <input
              value={author}
              onChange={e => onAuthor(e.target.value)}
              className="w-full h-11 px-3.5 rounded-[12px] bg-white border border-[#e6ecf4] focus:border-[#0787FF] focus:ring-2 focus:ring-[#0787FF]/15 outline-none text-[13.5px] tracking-tight text-[#0f172a] font-semibold transition-[box-shadow,border-color]"
            />
          </Field>

          <Field label="News Type">
            <div className="flex flex-wrap gap-1.5">
              {NEWS_TYPES.map(t => {
                const active = newsType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onNewsType(t)}
                    className={`h-8 px-3 rounded-full text-[12px] font-semibold tracking-tight transition-colors ${
                      active
                        ? 'bg-[#0f172a] text-white'
                        : 'bg-[#f3f6fb] text-[#475569] hover:bg-[#e6ecf4]'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Tags">
            <input
              placeholder="Add a tag and press enter…"
              className="w-full h-11 px-3.5 rounded-[12px] bg-white border border-[#e6ecf4] focus:border-[#0787FF] focus:ring-2 focus:ring-[#0787FF]/15 outline-none text-[13.5px] tracking-tight text-[#0f172a] placeholder:text-[#94a3b8] transition-[box-shadow,border-color]"
            />
          </Field>

          <Field label="Publish schedule">
            <div className="flex items-center gap-2">
              <button className="flex-1 h-11 px-3.5 rounded-[12px] bg-[#0f172a] text-white text-[13px] font-semibold tracking-tight inline-flex items-center justify-center gap-2 hover:brightness-110 transition-[filter]">
                <Clock size={13} strokeWidth={2.5} /> Schedule
              </button>
              <button className="flex-1 h-11 px-3.5 rounded-[12px] bg-white border border-[#e6ecf4] text-[#0f172a] text-[13px] font-semibold tracking-tight hover:bg-[#f7faff] transition-colors">
                Publish now
              </button>
            </div>
          </Field>

          <Field label="Pin to">
            <div className="flex flex-wrap gap-1.5">
              {['Homepage', 'Section top', 'Newsletter'].map(p => (
                <button
                  key={p}
                  type="button"
                  className="h-8 px-3 rounded-full bg-[#f3f6fb] text-[#475569] text-[12px] font-semibold tracking-tight hover:bg-[#e6ecf4] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Pin size={11} strokeWidth={2.25} /> {p}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <footer className="px-6 py-4 border-t border-[#eef2f7] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[12px] text-[#475569] text-[13px] font-semibold tracking-tight hover:bg-[#f3f6fb] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[12px] bg-[#0787FF] text-white text-[13px] font-semibold tracking-tight shadow-[0_8px_18px_-6px_rgba(7,135,255,0.45)] hover:brightness-105 transition-[filter]"
          >
            Save details
          </button>
        </footer>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]">{label}</span>
        {required && <span className="size-1.5 rounded-full bg-[#0787FF]" />}
      </div>
      {children}
    </div>
  )
}

function ImagePicker({
  onPick, onClose,
}: {
  onPick: (img: { id: string; title: string }) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = IMAGE_LIBRARY.filter(i => i.title.toLowerCase().includes(q.toLowerCase().trim()))
  return (
    <Overlay onClose={onClose}>
      <div className="w-[720px] max-h-[80vh] bg-white border border-[#e6ecf4] rounded-[24px] shadow-[0px_32px_80px_-20px_rgba(31,57,99,0.30)] flex flex-col overflow-hidden">
        <header className="px-6 pt-5 pb-4 flex flex-col gap-3 border-b border-[#eef2f7]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]">Insert</p>
              <h2 className="text-[17px] font-bold tracking-tight text-[#0f172a]">Add an image</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-[12px] inline-flex items-center justify-center text-[#475569] hover:bg-[#f3f6fb] transition-colors"
              aria-label="Close"
            >
              <X size={15} strokeWidth={2.25} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} strokeWidth={2.25} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search media library…"
              className="w-full h-11 pl-10 pr-3 rounded-[12px] bg-[#f7faff] border border-[#eef2f7] focus:border-[#0787FF] focus:bg-white focus:ring-2 focus:ring-[#0787FF]/15 outline-none text-[13.5px] tracking-tight text-[#0f172a] placeholder:text-[#94a3b8] transition-[box-shadow,border-color,background-color]"
            />
          </div>
        </header>

        <div className="px-6 pt-3 flex items-center gap-1.5">
          {['All media', 'Uploads', 'Stock', 'AI generated'].map((t, i) => (
            <button
              key={t}
              className={`h-8 px-3 rounded-full text-[12px] font-semibold tracking-tight transition-colors ${
                i === 0 ? 'bg-[#0f172a] text-white' : 'bg-[#f3f6fb] text-[#475569] hover:bg-[#e6ecf4]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(img => (
              <button
                key={img.id}
                type="button"
                onClick={() => onPick(img)}
                className="group relative aspect-[4/3] rounded-[14px] overflow-hidden border border-[#e6ecf4] hover:border-[#0787FF] hover:shadow-[0_8px_20px_-6px_rgba(31,57,99,0.18)] transition-[border-color,box-shadow]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${img.tone}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
                <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/55 to-transparent text-left">
                  <p className="text-[12px] font-semibold text-white tracking-tight truncate">{img.title}</p>
                  <p className="text-[10.5px] text-white/85 truncate">{img.tag}</p>
                </div>
                <span className="absolute right-2 top-2 size-7 rounded-full bg-white/95 text-[#0f172a] inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check size={13} strokeWidth={2.5} />
                </span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-[13px] text-[#94a3b8] py-12">No matches.</p>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-[#eef2f7] flex items-center justify-between">
          <button
            type="button"
            className="h-10 px-4 rounded-[12px] bg-white border border-[#e6ecf4] text-[#0f172a] text-[13px] font-semibold tracking-tight inline-flex items-center gap-2 hover:bg-[#f7faff] transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} /> Upload new
          </button>
          <p className="text-[12px] text-[#94a3b8]">Click an image to insert it.</p>
        </footer>
      </div>
    </Overlay>
  )
}

function BlockPicker({
  onPick, onClose,
}: {
  onPick: (kind: CardKind) => void
  onClose: () => void
}) {
  const blocks: { kind: CardKind; Icon: typeof Heading1; label: string; detail: string }[] = [
    { kind: 'heading',    Icon: Heading1, label: 'Heading',    detail: 'Big section title' },
    { kind: 'subheading', Icon: Heading2, label: 'Sub-heading', detail: 'Smaller section break' },
    { kind: 'paragraph',  Icon: List,     label: 'Paragraph',  detail: 'Body copy with autosave' },
    { kind: 'image',      Icon: ImageIcon, label: 'Image',     detail: 'Inline visual with caption' },
    { kind: 'quote',      Icon: Quote,    label: 'Pull quote', detail: 'Emphasise a key line' },
    { kind: 'attachment', Icon: Link2,    label: 'Attachment', detail: 'Source link or document' },
  ]
  return (
    <Overlay onClose={onClose}>
      <div className="w-[560px] bg-white border border-[#e6ecf4] rounded-[24px] shadow-[0px_32px_80px_-20px_rgba(31,57,99,0.30)] flex flex-col overflow-hidden">
        <header className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-[#eef2f7]">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#94a3b8]">Insert</p>
            <h2 className="text-[17px] font-bold tracking-tight text-[#0f172a]">Add a card</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-[12px] inline-flex items-center justify-center text-[#475569] hover:bg-[#f3f6fb] transition-colors"
            aria-label="Close"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </header>
        <div className="p-4 grid grid-cols-2 gap-2.5">
          {blocks.map(({ kind, Icon, label, detail }) => (
            <button
              key={kind}
              type="button"
              onClick={() => onPick(kind)}
              className="group flex items-start gap-3 p-4 rounded-[16px] border border-[#e6ecf4] hover:border-[#0787FF] hover:bg-[#eff6ff] transition-colors text-left"
            >
              <span className="size-10 rounded-[12px] bg-[#DBEAFE] text-[#0787FF] inline-flex items-center justify-center shrink-0 group-hover:bg-[#0787FF] group-hover:text-white transition-colors">
                <Icon size={16} strokeWidth={2.25} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold tracking-tight text-[#0f172a]">{label}</p>
                <p className="text-[11.5px] text-[#64748b] mt-0.5 leading-[1.4]">{detail}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  )
}

function CategoryPicker({
  value, onPick, onClose,
}: {
  value: string | null
  onPick: (c: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = CATEGORY_OPTIONS.filter(c => c.toLowerCase().includes(q.toLowerCase().trim()))
  return (
    <Overlay onClose={onClose}>
      <div className="w-[480px] max-h-[70vh] bg-white border border-[#e6ecf4] rounded-[24px] shadow-[0px_32px_80px_-20px_rgba(31,57,99,0.30)] flex flex-col overflow-hidden">
        <header className="px-5 pt-4 pb-3 flex flex-col gap-3 border-b border-[#eef2f7]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-[#0787FF]" />
              <h2 className="text-[15px] font-bold tracking-tight text-[#0f172a]">Choose a category</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-[10px] inline-flex items-center justify-center text-[#475569] hover:bg-[#f3f6fb] transition-colors"
              aria-label="Close"
            >
              <X size={14} strokeWidth={2.25} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} strokeWidth={2.25} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search categories…"
              className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-[#f7faff] border border-[#eef2f7] focus:border-[#0787FF] focus:bg-white focus:ring-2 focus:ring-[#0787FF]/15 outline-none text-[13px] tracking-tight text-[#0f172a] placeholder:text-[#94a3b8] transition-[box-shadow,border-color,background-color]"
            />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map(c => {
            const selected = value === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => onPick(c)}
                className={`w-full flex items-center justify-between gap-2 px-3 h-10 rounded-[10px] text-[13px] tracking-tight transition-colors ${
                  selected
                    ? 'bg-[#0f172a] text-white font-semibold'
                    : 'text-[#0f172a] hover:bg-[#f7faff] font-medium'
                }`}
              >
                <span>{c}</span>
                {selected && <Check size={13} strokeWidth={2.5} />}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-[13px] text-[#94a3b8] py-10">No matches.</p>
          )}
        </div>
      </div>
    </Overlay>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Buttons & styles
   ─────────────────────────────────────────────────────────────────────────── */

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-[14px] overflow-hidden hover:brightness-105 active:scale-[0.98] transition-[filter,transform]"
    >
      <span aria-hidden className="absolute inset-0 bg-[#0787FF] rounded-[14px]" />
      <span aria-hidden className="absolute inset-0 rounded-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_24px_-8px_rgba(7,135,255,0.45)]" />
      <span className="relative inline-flex items-center gap-1.5 text-[13.5px] font-semibold leading-5 text-white tracking-tight">
        {children}
      </span>
    </button>
  )
}

function V11Styles() {
  return (
    <style jsx global>{`
      @keyframes v11-sparkle {
        0%, 100% { transform: rotate(-6deg) scale(1); opacity: 1; }
        50%      { transform: rotate(6deg)  scale(1.08); opacity: 0.9; }
      }
      .v11-sparkle { animation: v11-sparkle 2.4s ease-in-out infinite; }

      @keyframes v11-side-fade {
        from { opacity: 0; transform: translateX(-4px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .v11-side-fade { animation: v11-side-fade 220ms cubic-bezier(0.22,1,0.36,1) 80ms both; }

      @keyframes v11-overlay-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .v11-overlay-in { animation: v11-overlay-in 180ms cubic-bezier(0.22,1,0.36,1) both; }

      @keyframes v11-slide-in {
        from { transform: translateX(20px); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
      .v11-slide-in { animation: v11-slide-in 260ms cubic-bezier(0.22,1,0.36,1) both; }
    `}</style>
  )
}
