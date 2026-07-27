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
import MediaPickerModal from '@/components/media/MediaPickerModal'
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Search,
  Plus, FileText, Image as ImageIcon, Quote, Type, Heading1, Heading2,
  List, Link2, Sparkles, X, LayoutDashboard,
  ListChecks, BarChart3, Image as MediaIcon,
  Users, Wrench, Pin, Clock, Tag,
  MessageSquare, MessageSquareText,
  Trash2, Send, ChevronUp,
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

type PopoverRect = { left: number; top: number; width?: number }
type InlinePopover =
  | { kind: 'block'; insertAt: number; rect: PopoverRect }
  | { kind: 'ai';    cardId: string;   rect: PopoverRect }
  | null

export default function NewsCreationV11() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('editing')
  const [cards, setCards] = useState<Card[]>(STARTING_CARDS)
  const [focusedCard, setFocusedCard] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [imagePickerFor, setImagePickerFor] = useState<string | null>(null)
  const [inlinePopover, setInlinePopover] = useState<InlinePopover>(null)
  const [aiPreview, setAiPreview] = useState<{ cardId: string; next: string } | null>(null)
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

  function insertCardAt(insertAt: number, kind: CardKind) {
    const id = `c-${Date.now()}`
    setCards(prev => {
      const next = [...prev]
      const idx = Math.max(0, Math.min(insertAt, next.length))
      next.splice(idx, 0, { id, kind, value: '' })
      return next
    })
    setInlinePopover(null)
    setFocusedCard(id)
  }

  function removeCard(id: string) {
    setCards(prev => prev.filter(c => c.id !== id))
    if (focusedCard === id) setFocusedCard(null)
  }

  function moveCard(id: string, delta: -1 | 1) {
    setCards(prev => {
      const i = prev.findIndex(c => c.id === id)
      const j = i + delta
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(i, 1)
      next.splice(j, 0, moved)
      return next
    })
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

  useEffect(() => {
    if (!inlinePopover) return
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('[data-v11-popover]') || target.closest('[data-v11-popover-trigger]')) return
      setInlinePopover(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setInlinePopover(null)
    }
    function onScroll() { setInlinePopover(null) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [inlinePopover])

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
            <div className="max-w-[820px] pl-12 pr-8 py-6 flex flex-col">
              <CardGap
                index={0}
                onInsert={(rect) => setInlinePopover({ kind: 'block', insertAt: 0, rect })}
              />
              {cards.map((card, i) => (
                <div key={card.id}>
                  <CardRow
                    card={card}
                    isFirst={i === 0}
                    isLast={i === cards.length - 1}
                    focused={focusedCard === card.id}
                    onFocus={() => setFocusedCard(card.id)}
                    onBlur={() => setFocusedCard(null)}
                    onChange={(v) => updateCard(card.id, { value: v })}
                    onRemove={() => removeCard(card.id)}
                    onPickImage={() => setImagePickerFor(card.id)}
                    onMoveUp={() => moveCard(card.id, -1)}
                    onMoveDown={() => moveCard(card.id, 1)}
                    onOpenAI={(rect) => setInlinePopover({ kind: 'ai', cardId: card.id, rect })}
                    aiOpenFor={inlinePopover && inlinePopover.kind === 'ai' ? inlinePopover.cardId : null}
                    previewValue={aiPreview?.cardId === card.id ? aiPreview.next : undefined}
                  />
                  <CardGap
                    index={i + 1}
                    onInsert={(rect) => setInlinePopover({ kind: 'block', insertAt: i + 1, rect })}
                  />
                </div>
              ))}

              <button
                type="button"
                data-v11-popover-trigger
                onClick={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setInlinePopover({
                    kind: 'block',
                    insertAt: cards.length,
                    rect: { left: r.left, top: r.bottom + 8, width: r.width },
                  })
                }}
                className="mt-2 self-start inline-flex items-center gap-2 h-11 px-5 rounded-[14px] bg-white border border-dashed border-[#cfd9e8] text-[#475569] text-[13.5px] font-semibold tracking-tight hover:border-[#0787FF] hover:text-[#0787FF] hover:bg-[#eff6ff] transition-colors"
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

      {/* Image picker — Finder-style media library modal */}
      <MediaPickerModal
        open={imagePickerFor !== null}
        onSelect={(img) => {
          if (imagePickerFor) updateCard(imagePickerFor, { value: img.src, alt: img.title })
          setImagePickerFor(null)
        }}
        onClose={() => setImagePickerFor(null)}
      />

      {/* Inline popovers (block picker + Berry AI) */}
      {inlinePopover && inlinePopover.kind === 'block' && (
        <BlockPicker
          rect={inlinePopover.rect}
          onPick={(kind) => insertCardAt(inlinePopover.insertAt, kind)}
          onClose={() => setInlinePopover(null)}
        />
      )}
      {inlinePopover && inlinePopover.kind === 'ai' && (() => {
        const target = cards.find(c => c.id === inlinePopover.cardId)
        if (!target) return null
        return (
          <BerryAIPanel
            rect={inlinePopover.rect}
            source={target.value}
            onPreview={(next) => setAiPreview({ cardId: target.id, next })}
            onClearPreview={() => setAiPreview(null)}
            onApply={(next) => {
              updateCard(target.id, { value: next })
              setAiPreview(null)
              setInlinePopover(null)
            }}
            onClose={() => {
              setAiPreview(null)
              setInlinePopover(null)
            }}
          />
        )
      })()}

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
  // Order mirrors Figma node 1:599: Home, +, Message, Chat, Checklist,
  // Gauge, Media, Users, Wrench.
  const items: { Icon: typeof LayoutDashboard; label: string; active?: boolean }[] = [
    { Icon: MessageSquareText, label: 'Stories' },
    { Icon: MessageSquare,     label: 'Chats' },
    { Icon: ListChecks,        label: 'Tasks' },
    { Icon: BarChart3,         label: 'Performance' },
    { Icon: MediaIcon,         label: 'Media' },
    { Icon: Users,             label: 'People' },
    { Icon: Wrench,            label: 'Settings' },
  ]
  return (
    <nav className="shrink-0 self-center ml-5 mr-3 flex flex-col gap-2.5">
      {/* 1. Home / Dashboard — active */}
      <SideItem Icon={LayoutDashboard} label="Dashboard" active />

      {/* 2. + New article — solid brand pill */}
      <button
        type="button"
        aria-label="New article"
        className="size-11 rounded-full bg-[#0787FF] inline-flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(7,135,255,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-105 active:scale-95 transition-[filter,transform]"
      >
        <Plus size={18} strokeWidth={2.5} className="text-white" />
      </button>

      {/* 3–9. rest */}
      {items.map(({ Icon, label, active }, i) => (
        <SideItem key={i} Icon={Icon} label={label} active={active} />
      ))}
    </nav>
  )
}

function SideItem({
  Icon, label, active,
}: {
  Icon: typeof LayoutDashboard
  label: string
  active?: boolean
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        className={`size-11 rounded-full inline-flex items-center justify-center transition-[background-color,color,border-color,transform] active:scale-95 ${
          active
            ? 'bg-[#DBEAFE] text-[#0787FF] border border-[#bfdbfe] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'
            : 'bg-white/55 backdrop-blur-[14px] border border-white/65 text-[#475569] hover:bg-white/90 hover:text-[#0f172a] hover:border-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
        }`}
      >
        <Icon size={18} strokeWidth={2} />
      </button>
      {/* Tooltip */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 rounded-[8px] bg-[#0f172a] text-white text-[11.5px] font-semibold tracking-tight whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-150 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.45)]"
        style={{ fontFamily: 'var(--font-urbanist)' }}
      >
        {label}
        <span aria-hidden className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 rotate-45 bg-[#0f172a]" />
      </span>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Card row
   ─────────────────────────────────────────────────────────────────────────── */

function CardRow({
  card, focused, isFirst, isLast, onFocus, onBlur, onChange, onRemove,
  onPickImage, onMoveUp, onMoveDown, onOpenAI, aiOpenFor, previewValue,
}: {
  card: Card
  focused: boolean
  isFirst: boolean
  isLast: boolean
  onFocus: () => void
  onBlur: () => void
  onChange: (v: string) => void
  onRemove: () => void
  onPickImage: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onOpenAI: (rect: PopoverRect) => void
  aiOpenFor: string | null
  previewValue?: string
}) {
  const Glyph = kindGlyph(card.kind)
  const active = focused || aiOpenFor === card.id
  const isPreviewing = previewValue !== undefined

  function triggerAI(e: React.MouseEvent<HTMLElement>) {
    // Align the AI panel with the card row (not the button) so it feels
    // attached to the card being edited, matching the Figma layout.
    const row = (e.currentTarget as HTMLElement).closest('[data-v11-card-row]') as HTMLElement | null
    const btn = e.currentTarget as HTMLElement
    const r = (row ?? btn).getBoundingClientRect()
    onOpenAI({ left: r.left, top: r.bottom + 8, width: r.width })
  }

  return (
    <div
      data-v11-card-row
      className={`group relative flex gap-3 px-3 py-3 -mx-3 rounded-[16px] transition-colors ${
        active ? 'bg-[#f1f5f9]' : 'hover:bg-[#f7faff]/70'
      }`}
      onMouseDown={onFocus}
    >
      {/* Gutter icon */}
      <div className="flex flex-col items-center pt-1 select-none">
        <div className={`size-8 rounded-[10px] inline-flex items-center justify-center transition-colors ${
          active ? 'bg-[#DBEAFE] text-[#0787FF]' : 'bg-[#f3f6fb] text-[#94a3b8] group-hover:text-[#475569]'
        }`}>
          <Glyph size={14} strokeWidth={2.25} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {card.kind === 'heading' && (
          isPreviewing ? (
            <DiffText
              original={card.value}
              next={previewValue!}
              className="text-[32px] leading-[1.15] font-bold tracking-[-0.025em] text-[#0f172a]"
            />
          ) : (
            <AutoTextarea
              value={card.value}
              placeholder="Title"
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={onChange}
              className="text-[32px] leading-[1.15] font-bold tracking-[-0.025em] text-[#0f172a] placeholder:text-[#cbd5e1]"
            />
          )
        )}
        {card.kind === 'subheading' && (
          isPreviewing ? (
            <DiffText
              original={card.value}
              next={previewValue!}
              className="text-[18px] leading-[1.4] font-semibold tracking-tight text-[#334155]"
            />
          ) : (
            <AutoTextarea
              value={card.value}
              placeholder="Sub-Title"
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={onChange}
              className="text-[18px] leading-[1.4] font-semibold tracking-tight text-[#334155] placeholder:text-[#cbd5e1]"
            />
          )
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
          isPreviewing ? (
            <DiffText
              original={card.value}
              next={previewValue!}
              className="text-[16px] leading-[1.7] text-[#1e293b]"
            />
          ) : (
            <AutoTextarea
              value={card.value}
              placeholder="Description here.."
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={onChange}
              className="text-[16px] leading-[1.7] text-[#1e293b] placeholder:text-[#cbd5e1]"
            />
          )
        )}
        {card.kind === 'quote' && (
          isPreviewing ? (
            <DiffText
              original={card.value}
              next={previewValue!}
              className="text-[17px] leading-[1.5] font-medium italic text-[#0f172a] border-l-[3px] border-[#C4B5FD] pl-4"
            />
          ) : (
            <AutoTextarea
              value={card.value}
              placeholder="Pull quote…"
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={onChange}
              className="text-[17px] leading-[1.5] font-medium italic text-[#0f172a] placeholder:text-[#cbd5e1] border-l-[3px] border-[#C4B5FD] pl-4"
            />
          )
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

      {/* Right side toolbar */}
      {active ? (
        // Active = full toolbar
        <div className="absolute right-3 top-3 flex items-center gap-1.5 v11-tool-in">
          <button
            type="button"
            data-v11-popover-trigger
            onClick={triggerAI}
            className="relative inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-[10px] overflow-hidden hover:brightness-105 active:scale-[0.97] transition-[filter,transform]"
            aria-label="Berry AI"
          >
            <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#7DD3FC] to-[#0787FF] rounded-[10px]" />
            <span aria-hidden className="absolute inset-0 rounded-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-6px_rgba(7,135,255,0.45)]" />
            <span className="relative inline-flex items-center gap-1.5 text-[12px] font-semibold text-white tracking-tight">
              Berry AI <Sparkles size={11} strokeWidth={2.5} />
            </span>
          </button>
          <div className="flex items-center bg-white border border-[#e6ecf4] rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(31,57,99,0.04)]">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Move up"
              className="size-8 inline-flex items-center justify-center text-[#475569] hover:bg-[#f7faff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp size={13} strokeWidth={2.25} />
            </button>
            <div className="w-px h-4 bg-[#eef2f7]" />
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Move down"
              className="size-8 inline-flex items-center justify-center text-[#475569] hover:bg-[#f7faff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown size={13} strokeWidth={2.25} />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove card"
            className="size-8 rounded-[10px] bg-white border border-[#e6ecf4] inline-flex items-center justify-center text-[#475569] hover:text-[#dc2626] hover:bg-[#fff5f5] hover:border-[#fecaca] shadow-[0_1px_2px_rgba(31,57,99,0.04)] transition-colors"
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      ) : (
        // Hover only = small Berry AI icon
        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            data-v11-popover-trigger
            onClick={triggerAI}
            className="relative size-8 rounded-[10px] overflow-hidden inline-flex items-center justify-center hover:brightness-105 active:scale-95 transition-[filter,transform]"
            aria-label="Berry AI"
          >
            <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#7DD3FC] to-[#0787FF] rounded-[10px]" />
            <span aria-hidden className="absolute inset-0 rounded-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-6px_rgba(7,135,255,0.45)]" />
            <Sparkles size={13} strokeWidth={2.5} className="relative text-white" />
          </button>
        </div>
      )}
    </div>
  )
}

function AutoTextarea({
  value, placeholder, className, onFocus, onBlur, onChange,
}: {
  value: string
  placeholder: string
  className?: string
  onFocus: () => void
  onBlur: () => void
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={e => onChange(e.target.value)}
      rows={1}
      className={`w-full resize-none bg-transparent outline-none overflow-hidden ${className ?? ''}`}
    />
  )
}

function CardGap({ index, onInsert }: { index: number; onInsert: (rect: PopoverRect) => void }) {
  const [hovered, setHovered] = useState(false)
  void index
  function clickPlus(e: React.MouseEvent<HTMLElement>) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onInsert({ left: r.left + r.width / 2 - 230, top: r.bottom + 8, width: 460 })
  }
  return (
    <div
      className="relative h-3 -my-0.5 select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-[#cbd5e1] transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`} />
      <button
        type="button"
        data-v11-popover-trigger
        onClick={clickPlus}
        aria-label="Insert card here"
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-6 rounded-full bg-[#0787FF] inline-flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(7,135,255,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] transition-[opacity,transform] ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
      >
        <Plus size={13} strokeWidth={2.75} className="text-white" />
      </button>
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
  const isUrl = /^(https?:|blob:)/.test(value)
  return (
    <div className="relative w-full h-[260px] rounded-[16px] overflow-hidden border border-[#e6ecf4]">
      {isUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={alt ?? ''} className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
        </>
      )}
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
        {/^(https?:|blob:)/.test(card.value) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.value} alt={card.alt ?? ''} className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
          </>
        )}
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

function BlockPicker({
  rect, onPick, onClose,
}: {
  rect: PopoverRect
  onPick: (kind: CardKind) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'all' | 'insert' | 'template'>('all')
  void onClose

  type Tile = { kind: CardKind; Icon: typeof Heading1; label: string; section: 'suggested' | 'assets' | 'text' }
  const tiles: Tile[] = [
    // Suggested
    { kind: 'paragraph',  Icon: FileText, label: 'Normal Text',    section: 'suggested' },
    { kind: 'attachment', Icon: Link2,    label: 'File attachment', section: 'suggested' },
    { kind: 'heading',    Icon: Heading1, label: 'Heading 1',      section: 'suggested' },
    { kind: 'subheading', Icon: Heading2, label: 'Heading 3',      section: 'suggested' },
    // Assets
    { kind: 'image',      Icon: ImageIcon, label: 'Image',         section: 'assets' },
    { kind: 'attachment', Icon: Link2,     label: 'File attachment', section: 'assets' },
    // Text
    { kind: 'paragraph',  Icon: FileText, label: 'Normal Text',    section: 'text' },
    { kind: 'heading',    Icon: Heading1, label: 'Heading 1',      section: 'text' },
    { kind: 'subheading', Icon: Heading2, label: 'Heading 2',      section: 'text' },
    { kind: 'subheading', Icon: Heading2, label: 'Heading 3',      section: 'text' },
    { kind: 'quote',      Icon: Quote,    label: 'Pull quote',     section: 'text' },
  ]

  const visible = tiles.filter(t => {
    if (tab === 'insert' && t.section === 'text') return false
    if (tab === 'template') return false
    if (!q) return true
    return t.label.toLowerCase().includes(q.toLowerCase().trim())
  })

  const groups: { id: 'suggested' | 'assets' | 'text'; title: string }[] = [
    { id: 'suggested', title: 'Suggested' },
    { id: 'assets',    title: 'Assets' },
    { id: 'text',      title: 'Text' },
  ]

  const left = Math.max(16, Math.min(rect.left, (typeof window !== 'undefined' ? window.innerWidth : 1280) - (rect.width ?? 460) - 16))

  return (
    <div
      data-v11-popover
      className="fixed z-[70] v11-popover-in"
      style={{ left, top: rect.top, width: rect.width ?? 460 }}
    >
      <div className="bg-white border border-[#e6ecf4] rounded-[20px] shadow-[0px_24px_60px_-12px_rgba(31,57,99,0.30),0px_2px_6px_-2px_rgba(31,57,99,0.10)] overflow-hidden">

        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search size={13} strokeWidth={2.25} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full h-10 pl-9 pr-3 rounded-[12px] bg-[#f7faff] border border-[#eef2f7] focus:border-[#0787FF] focus:bg-white focus:ring-2 focus:ring-[#0787FF]/15 outline-none text-[13px] tracking-tight text-[#0f172a] placeholder:text-[#94a3b8] transition-[box-shadow,border-color,background-color]"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-3 pb-2 flex items-center gap-1.5">
          {(['all', 'insert', 'template'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`h-7 px-3 rounded-full text-[11.5px] font-semibold tracking-tight capitalize transition-colors ${
                tab === t ? 'bg-[#0f172a] text-white' : 'bg-[#f3f6fb] text-[#475569] hover:bg-[#e6ecf4]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Groups */}
        <div className="max-h-[420px] overflow-y-auto px-3 pb-3">
          {groups.map(g => {
            const groupTiles = visible.filter(t => t.section === g.id)
            if (groupTiles.length === 0) return null
            return (
              <section key={g.id} className="pt-2">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#94a3b8] px-1 mb-1.5">{g.title}</p>
                <div className="grid grid-cols-4 gap-2">
                  {groupTiles.map((t, i) => (
                    <button
                      key={`${g.id}-${i}`}
                      type="button"
                      onClick={() => onPick(t.kind)}
                      className="group flex flex-col items-center justify-center gap-2 py-3.5 rounded-[14px] border border-[#e6ecf4] hover:border-[#0787FF] hover:bg-[#eff6ff] active:scale-[0.98] transition-[border-color,background-color,transform]"
                    >
                      <span className="size-8 rounded-[10px] inline-flex items-center justify-center text-[#0787FF] group-hover:scale-105 transition-transform">
                        <t.Icon size={18} strokeWidth={2.25} />
                      </span>
                      <span className="text-[11.5px] font-semibold text-[#0f172a] tracking-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
          {visible.length === 0 && (
            <p className="text-center text-[12px] text-[#94a3b8] py-6">No matches.</p>
          )}
        </div>
      </div>
    </div>
  )
}

type BerryStage = 'prompt' | 'loading' | 'result'

type DiffPart = { type: 'eq' | 'add' | 'del'; text: string }

function wordDiff(a: string, b: string): DiffPart[] {
  const A = a.length ? a.split(/(\s+)/).filter(Boolean) : []
  const B = b.length ? b.split(/(\s+)/).filter(Boolean) : []
  const n = A.length, m = B.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out: DiffPart[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: 'eq', text: A[i] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: A[i] }); i++ }
    else { out.push({ type: 'add', text: B[j] }); j++ }
  }
  while (i < n) out.push({ type: 'del', text: A[i++] })
  while (j < m) out.push({ type: 'add', text: B[j++] })
  return out
}

function DiffText({ original, next, className }: { original: string; next: string; className?: string }) {
  const parts = useMemo(() => wordDiff(original, next), [original, next])
  return (
    <div className={`${className ?? ''} whitespace-pre-wrap v11-diff-in`}>
      {parts.map((p, i) => {
        if (p.type === 'eq') return <span key={i}>{p.text}</span>
        if (p.type === 'add') {
          return (
            <span
              key={i}
              className="rounded-[3px] px-[1px] bg-[#dcfce7] text-[#065f46] shadow-[inset_0_-1px_0_rgba(16,185,129,0.35)]"
            >
              {p.text}
            </span>
          )
        }
        return (
          <span
            key={i}
            className="rounded-[3px] px-[1px] line-through decoration-[1.5px] bg-[#fee2e2] text-[#991b1b]/80 decoration-[#dc2626]/60"
          >
            {p.text}
          </span>
        )
      })}
    </div>
  )
}

function BerryAIPanel({
  rect, source, onPreview, onClearPreview, onApply, onClose,
}: {
  rect: PopoverRect
  source: string
  onPreview: (next: string) => void
  onClearPreview: () => void
  onApply: (next: string) => void
  onClose: () => void
}) {
  const [input, setInput] = useState('')
  const [stage, setStage] = useState<BerryStage>('prompt')
  const [result, setResult] = useState('')
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const width = Math.max(560, Math.min(rect.width ?? 720, 900))
  const left = Math.max(16, Math.min(
    rect.left,
    (typeof window !== 'undefined' ? window.innerWidth : 1280) - width - 16
  ))

  const chips = ['Fix grammar', 'Make Formal', 'Make Shorter', 'Translate']
  const followUps = ['Make it shorter', 'More formal', 'Add a source', 'Punchier lede']

  const canSend = input.trim().length > 0 && stage === 'prompt'

  function extractBody(raw: string): string {
    const idx = raw.indexOf('\n\n')
    return idx > 0 ? raw.slice(idx + 2) : raw
  }

  function send(promptText?: string, iterateOnLast = false) {
    const p = (promptText ?? input).trim()
    if (!p) return
    if (promptText) setInput(promptText)
    // Follow-up chips iterate on Berry's last answer; a fresh Send starts from
    // the original card so the diff on the card stays anchored to the source.
    const base = iterateOnLast && result ? extractBody(result) : source
    setStage('loading')
    window.setTimeout(() => {
      const raw = fakeAI(p, base)
      setResult(raw)
      onPreview(extractBody(raw))
      setStage('result')
    }, 1200)
  }

  function regenerate() {
    setStage('loading')
    window.setTimeout(() => {
      const raw = fakeAI(input.trim(), source, /* variant */ true)
      setResult(raw)
      onPreview(extractBody(raw))
      setStage('result')
    }, 900)
  }

  function keyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Backdrop — matches the Figma blur wash */}
      <div
        aria-hidden
        data-v11-popover
        className="fixed inset-0 z-[65] bg-white/20 backdrop-blur-[4px] v11-overlay-in"
        onClick={onClose}
      />

      <div
        data-v11-popover
        className="fixed z-[70] v11-popover-in"
        style={{ left, top: rect.top, width }}
      >
        {/* Outer panel — white card, soft double shadow, hairline outline */}
        <div className="relative rounded-[10px] bg-white p-1 shadow-[0px_8px_24px_-6px_rgba(0,0,0,0.16),0px_0px_1px_0px_rgba(0,0,0,0.18)]">
          {/* Header — subtle glassy gradient (blue/cyan bloom under a heavy blur) */}
          <div className="relative overflow-hidden rounded-t-[8px]">
            <div aria-hidden className="absolute -left-32 -top-10 h-[220px] w-[520px] rounded-full opacity-45"
              style={{ background: 'radial-gradient(closest-side, #0787ff 0%, rgba(7,135,255,0) 70%)' }} />
            <div aria-hidden className="absolute -right-24 -top-8 h-[240px] w-[420px] rounded-full opacity-45"
              style={{ background: 'radial-gradient(closest-side, rgba(0,205,255,0.9) 0%, rgba(73,219,255,0) 70%)' }} />
            <div aria-hidden className="absolute inset-0 backdrop-blur-[50px] bg-white/40" />

            <div className="relative flex items-center gap-3 px-4 py-2.5">
              <span
                className="size-[26px] rounded-[6px] border border-white inline-flex items-center justify-center shadow-[0px_0px_8px_0px_rgba(17,24,39,0.08)]"
                style={{ backgroundImage: 'linear-gradient(154deg, rgba(255,255,255,0.15) 8%, rgba(255,255,255,0.7) 88%)' }}
              >
                <Sparkles size={13} strokeWidth={2.25} className="text-[#0787FF]" />
              </span>
              <h3 className="flex-1 text-[16px] font-semibold tracking-tight text-[#020617] leading-[1.25]">
                Berry Writing Tools
              </h3>
              <span className="inline-flex items-center gap-1 px-1 py-0.5 text-[12px] font-medium tracking-[-0.12px] text-[#171717]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 1v2m0 6v2M1 6h2m6 0h2M2.5 2.5l1.4 1.4m4.2 4.2l1.4 1.4M2.5 9.5l1.4-1.4m4.2-4.2L9.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                  <circle cx="6" cy="6" r="1.6" fill="currentColor" />
                </svg>
                Pandulipi
              </span>
            </div>
          </div>

          {/* Body block */}
          <div className="rounded-[8px] border border-[#e8eef4] bg-white overflow-hidden">
            {stage === 'prompt' && (
              <div className="p-2">
                <textarea
                  ref={inputRef}
                  autoFocus
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={keyDown}
                  placeholder="Revise this content to incorporate a more politically charged tone."
                  rows={5}
                  className="w-full resize-none outline-none px-1.5 py-2 text-[16px] leading-[1.5] text-[#020617] placeholder:text-[#020617]/30 tracking-tight bg-transparent"
                />
              </div>
            )}

            {stage === 'loading' && (
              <div className="px-3.5 py-4 flex items-center gap-2 min-h-[132px]">
                <span className="v11-berry-dot" />
                <span className="v11-berry-dot" style={{ animationDelay: '150ms' }} />
                <span className="v11-berry-dot" style={{ animationDelay: '300ms' }} />
                <p className="text-[13.5px] tracking-tight text-[#64748b] font-medium ml-1.5">
                  Berry is rewriting…
                </p>
              </div>
            )}

            {stage === 'result' && (
              <div className="p-3 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className="shrink-0 size-[26px] rounded-[8px] border border-white inline-flex items-center justify-center shadow-[0px_0px_8px_0px_rgba(17,24,39,0.08)]"
                    style={{ backgroundImage: 'linear-gradient(154deg, #dbeafe 0%, #ffffff 100%)' }}
                  >
                    <Sparkles size={13} strokeWidth={2.25} className="text-[#0787FF] v11-sparkle" />
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12.5px] font-semibold tracking-tight text-[#0f172a]">Berry</span>
                      <span className="text-[11.5px] font-medium text-[#94a3b8] tracking-tight">
                        {(() => {
                          const idx = result.indexOf('\n\n')
                          const preface = idx > 0 ? result.slice(0, idx) : ''
                          return preface.replace(/[:.]$/, '') || 'suggests this rewrite'
                        })()}
                      </span>
                    </div>
                    {/* Clean, readable answer — the diff on the card shows what changed */}
                    <div
                      className="rounded-[12px] rounded-tl-[4px] px-3.5 py-2.5 text-[14px] leading-[1.55] text-[#020617] tracking-tight whitespace-pre-wrap"
                      style={{
                        background: 'linear-gradient(180deg, #f4faff 0%, #ffffff 100%)',
                        boxShadow: 'inset 0 0 0 1px #dbeafe',
                      }}
                    >
                      {extractBody(result)}
                    </div>
                  </div>
                </div>

                {/* Follow-up chips — iterate on Berry's last answer */}
                <div className="flex flex-wrap items-center gap-1.5 pl-[36px]">
                  {followUps.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => send(label + ' this text.', /* iterateOnLast */ true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#e2e8f0] text-[11.5px] font-medium text-[#475569] leading-4 tracking-tight hover:border-[#0787FF] hover:text-[#0787FF] hover:bg-[#eff6ff] transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer actions row */}
            <div className="border-t border-black/[0.05] p-3.5 flex items-center gap-3">
              {stage === 'result' ? (
                <>
                  <button
                    type="button"
                    onClick={() => { onClearPreview(); setStage('prompt') }}
                    className="inline-flex items-center h-8 px-3 rounded-full bg-black/[0.03] hover:bg-black/[0.06] text-[12px] font-medium text-[#171717] leading-5 tracking-tight transition-colors"
                  >
                    Edit prompt
                  </button>
                  <button
                    type="button"
                    onClick={regenerate}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/[0.03] hover:bg-black/[0.06] text-[12px] font-medium text-[#171717] leading-5 tracking-tight transition-colors"
                  >
                    Try again
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center h-8 px-3 rounded-[8px] text-[13px] font-medium text-[#475569] hover:bg-[#f3f6fb] tracking-tight transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => onApply(extractBody(result))}
                    className="inline-flex items-center gap-1.5 min-h-[32px] px-3 rounded-[8px] bg-[#0787FF] text-white text-[14px] font-medium leading-5 tracking-tight shadow-[inset_0_0_4px_0_rgba(255,255,255,0.24)] hover:brightness-105 active:scale-[0.98] transition-[filter,transform]"
                  >
                    <Check size={13} strokeWidth={2.5} />
                    Accept
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {chips.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setInput(label + ' this text.')}
                        className="inline-flex items-center px-3 py-1.5 rounded-full bg-black/[0.03] hover:bg-black/[0.06] text-[12px] font-medium text-[#171717] leading-5 tracking-tight transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => send()}
                    disabled={!canSend}
                    className={`inline-flex items-center min-h-[32px] px-3 rounded-[8px] bg-[#0787FF] text-white text-[14px] font-medium leading-5 tracking-tight shadow-[inset_0_0_4px_0_rgba(255,255,255,0.24)] transition-[opacity,filter,transform] ${
                      canSend ? 'hover:brightness-105 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    Send to AI
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function fakeAI(prompt: string, source: string, variant = false): string {
  const base = source.trim()
  const p = prompt.toLowerCase()
  const seed = base || 'Class 12 results were published today, with 64.13% of examinees passing.'

  if (p.includes('fix grammar')) {
    const lead = variant
      ? 'Here is the same passage with tightened punctuation and clause structure:'
      : 'Here is a grammar-polished version of your card:'
    return `${lead}\n\n${polish(seed)}`
  }
  if (p.includes('formal')) {
    const lead = variant
      ? 'A more elevated, broadsheet register — same meaning, weightier tone:'
      : 'Here is a more formal rendering of your card:'
    return `${lead}\n\n${formalize(seed)}`
  }
  if (p.includes('shorter') || p.includes('shorten')) {
    const lead = variant
      ? 'A tighter cut — redundant qualifiers removed:'
      : 'Here is a shorter version, same lede:'
    return `${lead}\n\n${shorten(seed)}`
  }
  if (p.includes('translate')) {
    return 'Translated into Nepali:\n\nकक्षा १२ को नतिजा सार्वजनिक भएको छ। ६४.१३ प्रतिशत परीक्षार्थी उत्तीर्ण भएका छन्।'
  }
  if (p.includes('politic')) {
    const lead = variant
      ? 'A version sharpened with a stronger political frame:'
      : 'Here is a rewrite with a more politically charged tone:'
    const body = `${seed} The announcement lands amid renewed scrutiny over how the ministry has staged and timed public disclosures this quarter${variant ? ', with opposition benches signalling a formal parliamentary review' : ''}.`
    return `${lead}\n\n${body}`
  }
  const lead = variant
    ? 'A crisper, tighter framing on the same lede:'
    : 'Here is a rewrite based on your prompt:'
  return `${lead}\n\n${polish(seed)}`
}

function polish(s: string) {
  if (!s) return 'Berry generated a polished draft based on your prompt.'
  return s.replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim()
}
function formalize(s: string) {
  if (!s) return 'A more formal register has been applied to your draft.'
  return s.replace(/\bdon't\b/gi, 'do not').replace(/\bcan't\b/gi, 'cannot').replace(/\bit's\b/gi, 'it is')
}
function shorten(s: string) {
  if (!s) return 'Concise version drafted by Berry.'
  const first = s.split(/(?<=\.)\s+/)[0] ?? s
  return first.length < s.length ? first : s.slice(0, Math.max(80, Math.floor(s.length * 0.6))).trim() + '…'
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

      @keyframes v11-popover-in {
        from { opacity: 0; transform: translateY(-4px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .v11-popover-in { animation: v11-popover-in 160ms cubic-bezier(0.22,1,0.36,1) both; transform-origin: top center; }

      @keyframes v11-tool-in {
        from { opacity: 0; transform: translateY(-2px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .v11-tool-in { animation: v11-tool-in 140ms ease-out both; }

      @keyframes v11-diff-in {
        from { opacity: 0; transform: translateY(-1px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .v11-diff-in { animation: v11-diff-in 220ms cubic-bezier(0.22,1,0.36,1) both; }

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

      @keyframes v11-berry-dot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
        30%           { transform: translateY(-4px); opacity: 1; }
      }
      .v11-berry-dot {
        display: inline-block;
        width: 6px; height: 6px;
        border-radius: 9999px;
        background: #0787FF;
        animation: v11-berry-dot 900ms ease-in-out infinite;
      }
    `}</style>
  )
}
