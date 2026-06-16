'use client'

/**
 * Story Workspace — Linear-style: monochrome canvas, one accent, calm density.
 *
 * Layout:
 *   Left   : Sources         (quiet list, no chrome)
 *   Center : Draft canvas    (title, byline, body — like a real editor)
 *            with Ledger / Outline tucked into a thin top tab strip
 *   Right  : Assistant       (collapsible; silent by default)
 */

import { useMemo, useState } from 'react'
import {
  FileText, Mic, Globe, FileImage, Radio,
  Sparkles, ArrowUpRight, ChevronDown,
  Plus, Search, X, Lock,
  ChevronLeft, MoreHorizontal,
  Circle, CheckCircle2, AlertCircle,
  PanelRightClose, PanelRightOpen,
  Calendar, Tag, User as UserIcon,
  Wand2,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SourceKind = 'transcript' | 'pdf' | 'web' | 'wire' | 'image'
type ClaimStatus = 'verified' | 'needs_check' | 'unverified' | 'disputed'
type ClaimType = 'event' | 'quote' | 'number' | 'attribution' | 'background'

type Source = {
  id: string; kind: SourceKind; title: string; meta: string
  claimCount: number; protected?: boolean; ingestedAt: string
}

type Claim = {
  id: string; statement: string; type: ClaimType; status: ClaimStatus
  sourceIds: string[]; excerpt: string; locator: string
  verifiedBy?: string; contradicts?: string[]
}

type Author = { id: string; name: string; initials: string; role: 'reporter' | 'editor' | 'contributor' }

type DraftSpan = { kind: 'claim' | 'voice' | 'unsourced'; text: string; claims?: string[] }
type DraftParagraph = { id: string; spans: DraftSpan[] }

type Suggestion = {
  id: string; severity: 'block' | 'caution' | 'info'
  title: string; body: string; cta: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const SOURCES: Source[] = []
const CLAIMS: Claim[] = []
const DRAFT: DraftParagraph[] = []
const SUGGESTIONS: Suggestion[] = []

const INITIAL_AUTHORS: Author[] = [
  { id: 'u_me', name: 'Priya Sharma', initials: 'PS', role: 'reporter' },
]

const AUTHOR_POOL: Author[] = [
  { id: 'u_daniel', name: 'Daniel Cohen',  initials: 'DC', role: 'editor'      },
  { id: 'u_ana',    name: 'Ana Ribeiro',   initials: 'AR', role: 'reporter'    },
  { id: 'u_marcus', name: 'Marcus Liu',    initials: 'ML', role: 'editor'      },
  { id: 'u_lin',    name: 'Lin Park',      initials: 'LP', role: 'contributor' },
  { id: 'u_sagar',  name: 'Sagar Mehta',   initials: 'SM', role: 'reporter'    },
  { id: 'u_riya',   name: 'Riya Kapoor',   initials: 'RK', role: 'reporter'    },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SOURCE_ICON: Record<SourceKind, typeof FileText> = {
  transcript: Mic, pdf: FileText, web: Globe, wire: Radio, image: FileImage,
}

const STATUS_DOT: Record<ClaimStatus, string> = {
  verified:    'bg-emerald-500',
  needs_check: 'bg-amber-500',
  unverified:  'bg-slate-300',
  disputed:    'bg-rose-500',
}

const STATUS_LABEL: Record<ClaimStatus, string> = {
  verified: 'Verified', needs_check: 'Needs check', unverified: 'Unverified', disputed: 'Disputed',
}

function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'draft' | 'ledger' | 'outline'

export default function StoryWorkspace({ storyId }: { storyId: string }) {
  const [tab, setTab] = useState<Tab>('draft')
  const [assistantOpen, setAssistantOpen] = useState(true)
  const [authors, setAuthors] = useState<Author[]>(INITIAL_AUTHORS)
  const [showAuthorPicker, setShowAuthorPicker] = useState(false)
  const [showProvenance, setShowProvenance] = useState(false)

  const usedClaimIds = useMemo(() => {
    const set = new Set<string>()
    DRAFT.forEach(p => p.spans.forEach(s => s.claims?.forEach(id => set.add(id))))
    return set
  }, [])

  const counts = useMemo(() => {
    const verified = CLAIMS.filter(c => c.status === 'verified').length
    const total = CLAIMS.length
    const unsourced = DRAFT.reduce((n, p) => n + p.spans.filter(s => s.kind === 'unsourced').length, 0)
    return { verified, total, unsourced, pct: Math.round((verified / total) * 100) }
  }, [])

  const addAuthor = (a: Author) => {
    setAuthors(prev => prev.some(x => x.id === a.id) ? prev : [...prev, a])
    setShowAuthorPicker(false)
  }
  const removeAuthor = (id: string) => setAuthors(prev => prev.filter(a => a.id !== id))

  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: 'var(--font-inter)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">
        <TopBar
          storyId={storyId}
          counts={counts}
          assistantOpen={assistantOpen}
          onToggleAssistant={() => setAssistantOpen(v => !v)}
        />

        <div className="flex-1 flex overflow-hidden min-h-0">
          <SourcesPanel sources={SOURCES} />

          <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
            <TabStrip
              tab={tab} onChange={setTab}
              showProvenance={showProvenance}
              onToggleProvenance={() => setShowProvenance(v => !v)}
            />

            <div className="flex-1 overflow-y-auto">
              {tab === 'draft' && (
                <DraftCanvas
                  authors={authors}
                  onRemoveAuthor={removeAuthor}
                  showAuthorPicker={showAuthorPicker}
                  onOpenAuthorPicker={() => setShowAuthorPicker(true)}
                  onCloseAuthorPicker={() => setShowAuthorPicker(false)}
                  onAddAuthor={addAuthor}
                  pool={AUTHOR_POOL.filter(p => !authors.some(a => a.id === p.id))}
                  showProvenance={showProvenance}
                />
              )}
              {tab === 'ledger'  && <LedgerView claims={CLAIMS} usedClaimIds={usedClaimIds} />}
              {tab === 'outline' && <OutlineView />}
            </div>
          </main>

          {assistantOpen && <AssistantPanel />}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Top bar — calm, three groups, no color blocks
// ─────────────────────────────────────────────────────────────────────────────

function TopBar({
  storyId, counts, assistantOpen, onToggleAssistant,
}: {
  storyId: string
  counts: { verified: number; total: number; unsourced: number; pct: number }
  assistantOpen: boolean
  onToggleAssistant: () => void
}) {
  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button className="size-7 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center">
          <ChevronLeft size={15} />
        </button>
        <span className="text-[12px] text-slate-500">News</span>
        <span className="text-[12px] text-slate-300">/</span>
        <span className="text-[12px] text-slate-400 truncate max-w-[420px]">
          Untitled story
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="inline-flex items-center gap-1.5 h-7 px-2 text-[12px] text-slate-400">
          <span className="size-1.5 rounded-full bg-slate-300" />
          Draft
        </span>

        <span className="w-px h-5 bg-slate-200 mx-1.5" />

        <button
          onClick={onToggleAssistant}
          className="h-7 px-2 rounded-md hover:bg-slate-100 text-slate-500 inline-flex items-center gap-1.5 text-[12px]"
          title="Toggle assistant"
        >
          {assistantOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
        </button>
        <button className="size-7 rounded-md hover:bg-slate-100 text-slate-500 flex items-center justify-center">
          <MoreHorizontal size={14} />
        </button>
        <button className="h-7 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-medium ml-1">
          Send to editor
        </button>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab strip — minimal
// ─────────────────────────────────────────────────────────────────────────────

function TabStrip({
  tab, onChange, showProvenance, onToggleProvenance,
}: {
  tab: Tab
  onChange: (t: Tab) => void
  showProvenance: boolean
  onToggleProvenance: () => void
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'draft',   label: 'Draft' },
    { id: 'ledger',  label: 'Facts' },
    { id: 'outline', label: 'Outline' },
  ]
  return (
    <div className="flex items-center justify-between h-10 px-6 border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-4">
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={cn(
                'h-10 text-[13px] inline-flex items-center border-b-2 -mb-px transition-colors',
                active
                  ? 'text-slate-900 border-slate-900 font-medium'
                  : 'text-slate-500 border-transparent hover:text-slate-800',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {tab === 'draft' && (
        <button
          onClick={onToggleProvenance}
          className={cn(
            'h-7 px-2 rounded-md text-[12px] inline-flex items-center gap-1.5 transition-colors',
            showProvenance ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50',
          )}
        >
          <CheckCircle2 size={12} /> Provenance
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Left — Sources (calm)
// ─────────────────────────────────────────────────────────────────────────────

function SourcesPanel({ sources }: { sources: Source[] }) {
  return (
    <aside className="w-[260px] shrink-0 border-r border-slate-100 bg-white flex flex-col min-h-0">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between h-6 mb-2">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Sources</span>
          <button className="size-5 rounded-md hover:bg-slate-100 text-slate-400 flex items-center justify-center">
            <Plus size={12} />
          </button>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search"
            className="w-full h-7 rounded-md bg-transparent border border-transparent hover:border-slate-200 focus:border-slate-300 pl-7 pr-2 text-[12px] placeholder:text-slate-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {sources.length === 0 ? (
          <div className="px-3 pt-6 pb-4">
            <p className="text-[12px] text-slate-400 leading-relaxed">
              No sources yet. Drop a file, paste a link, or record audio — Berry will transcribe, OCR, and pull out claims.
            </p>
          </div>
        ) : (
          <ul>
            {sources.map(s => {
              const Icon = SOURCE_ICON[s.kind]
              return (
                <li key={s.id}>
                  <button className="w-full text-left px-2 py-2 rounded-md hover:bg-slate-50 flex items-start gap-2 group">
                    <Icon size={13} className="text-slate-400 mt-0.5 shrink-0" strokeWidth={1.8} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] text-slate-800 truncate">{s.title}</span>
                        {s.protected && <Lock size={10} className="text-slate-400 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {s.meta} · {s.claimCount} claims
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <button className="m-3 h-16 rounded-md border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-[12px] text-slate-500 hover:text-slate-700 flex flex-col items-center justify-center gap-1 transition-colors">
        <Plus size={14} />
        <span>Add source</span>
      </button>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Center — Draft canvas (the editor surface)
// ─────────────────────────────────────────────────────────────────────────────

function DraftCanvas({
  authors, onRemoveAuthor,
  showAuthorPicker, onOpenAuthorPicker, onCloseAuthorPicker, onAddAuthor, pool,
  showProvenance,
}: {
  authors: Author[]
  onRemoveAuthor: (id: string) => void
  showAuthorPicker: boolean
  onOpenAuthorPicker: () => void
  onCloseAuthorPicker: () => void
  onAddAuthor: (a: Author) => void
  pool: Author[]
  showProvenance: boolean
}) {
  const [category, setCategory] = useState('Business')

  return (
    <div className="mx-auto w-full max-w-[720px] px-10 pt-14 pb-24">
      {/* Title */}
      <input
        autoFocus
        placeholder="Untitled story"
        className="w-full text-[36px] font-semibold text-slate-900 leading-[1.2] bg-transparent focus:outline-none placeholder:text-slate-300"
        style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '-0.02em' }}
      />

      {/* Standfirst */}
      <input
        placeholder="Add a standfirst"
        className="w-full mt-3 text-[16px] text-slate-500 leading-relaxed bg-transparent focus:outline-none placeholder:text-slate-300"
      />

      {/* Meta strip — authors, category, date */}
      <div className="mt-6 flex items-center gap-1.5 flex-wrap">
        {/* Authors */}
        {authors.map(a => (
          <span
            key={a.id}
            className="group inline-flex items-center gap-1.5 h-7 pl-1 pr-2 rounded-full border border-slate-200 hover:border-slate-300 text-[12px] text-slate-700"
          >
            <span className="size-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center justify-center">
              {a.initials}
            </span>
            {a.name}
            <span className="text-[10px] text-slate-400">· {a.role}</span>
            <button
              onClick={() => onRemoveAuthor(a.id)}
              className="size-4 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 hidden group-hover:flex items-center justify-center"
              title="Remove"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {/* Add author */}
        <div className="relative">
          <button
            onClick={onOpenAuthorPicker}
            className="h-7 px-2 rounded-full border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[12px] text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
          >
            <Plus size={11} /> Author
          </button>
          {showAuthorPicker && (
            <AuthorPicker pool={pool} onPick={onAddAuthor} onClose={onCloseAuthorPicker} />
          )}
        </div>

        <span className="w-px h-4 bg-slate-200 mx-1" />

        {/* Category */}
        <MetaChip icon={<Tag size={11} />} value={category} onChange={setCategory} options={['Business', 'Markets', 'Politics', 'Tech', 'Sports']} />

        {/* Date */}
        <span className="inline-flex items-center gap-1.5 h-7 px-2 rounded-full text-[12px] text-slate-500">
          <Calendar size={11} /> Jun 10, 2026
        </span>
      </div>

      {/* Divider — quiet */}
      <div className="mt-8 h-px bg-slate-100" />

      {/* Provenance key — only if toggled */}
      {showProvenance && (
        <div className="mt-6 flex items-center gap-5 text-[11.5px] text-slate-500">
          <LegendDot color="emerald" label="Verified" />
          <LegendDot color="amber"   label="Needs check" />
          <LegendDot color="rose"    label="Unsourced" />
          <LegendDot color="slate"   label="Your voice" dashed />
        </div>
      )}

      {/* Body — empty state: a single placeholder paragraph and the slash hint */}
      {DRAFT.length === 0 ? (
        <div className="mt-8">
          <p className="text-[17px] leading-[1.75] text-slate-300">
            Start writing, or press <kbd className="px-1 py-px text-[11px] font-mono border border-slate-200 rounded text-slate-400">/</kbd> for commands. Drop a source on the left and Berry will draft from it.
          </p>
        </div>
      ) : (
        <>
          <article className="mt-8 flex flex-col gap-6">
            {DRAFT.map(p => (
              <p key={p.id} className="text-[17px] leading-[1.75] text-slate-900">
                {p.spans.map((span, i) => (
                  <DraftSpanView key={i} span={span} showProvenance={showProvenance} />
                ))}
              </p>
            ))}
          </article>
          <button className="mt-6 group flex items-center gap-2 text-[14px] text-slate-300 hover:text-slate-500 transition-colors">
            <span className="size-5 rounded border border-slate-200 group-hover:border-slate-300 flex items-center justify-center">
              <Plus size={11} />
            </span>
            Continue writing — press <kbd className="px-1 py-px text-[10px] font-mono border border-slate-200 rounded">/</kbd> for commands
          </button>
        </>
      )}
    </div>
  )
}

function LegendDot({
  color, label, dashed,
}: { color: 'emerald' | 'amber' | 'rose' | 'slate'; label: string; dashed?: boolean }) {
  const dot: Record<string, string> = {
    emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500', slate: 'bg-slate-300',
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-1.5 rounded-full', dot[color], dashed && 'opacity-60')} />
      {label}
    </span>
  )
}

function DraftSpanView({ span, showProvenance }: { span: DraftSpan; showProvenance: boolean }) {
  if (!showProvenance) return <span>{span.text}</span>

  if (span.kind === 'voice') {
    return (
      <span className="border-b border-dashed border-slate-300/80 pb-px">{span.text}</span>
    )
  }
  if (span.kind === 'unsourced') {
    return (
      <span className="bg-rose-50 rounded px-0.5 border-b border-rose-400 pb-px" title="No verified Claim covers this">
        {span.text}
      </span>
    )
  }
  const claims = (span.claims ?? []).map(id => CLAIMS.find(c => c.id === id)).filter(Boolean) as Claim[]
  const worst = worstStatus(claims.map(c => c.status))
  const border = worst === 'verified' ? 'border-emerald-400' : worst === 'needs_check' ? 'border-amber-400' : 'border-slate-300'
  return (
    <span
      className={cn('border-b-[1.5px] pb-px hover:bg-slate-50/80 rounded transition-colors cursor-pointer', border)}
      title={claims.map(c => `${c.id}: ${c.statement}`).join('\n')}
    >
      {span.text}
    </span>
  )
}

function worstStatus(statuses: ClaimStatus[]): ClaimStatus {
  const order: ClaimStatus[] = ['disputed', 'unverified', 'needs_check', 'verified']
  for (const s of order) if (statuses.includes(s)) return s
  return 'verified'
}

// ─────────────────────────────────────────────────────────────────────────────
// Author picker — Linear-style command palette popover
// ─────────────────────────────────────────────────────────────────────────────

function AuthorPicker({ pool, onPick, onClose }: { pool: Author[]; onPick: (a: Author) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const filtered = pool.filter(a => a.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 top-9 left-0 w-[280px] bg-white border border-slate-200 rounded-lg shadow-[0_8px_24px_rgba(15,23,42,0.08),0_2px_4px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-2 pt-2">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Add an author…"
              className="w-full h-8 rounded-md border border-slate-200 bg-white pl-7 pr-2 text-[12.5px] placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>
        <ul className="max-h-[240px] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-3 py-3 text-[12px] text-slate-400">No matches</li>
          )}
          {filtered.map(a => (
            <li key={a.id}>
              <button
                onClick={() => onPick(a)}
                className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-left"
              >
                <span className="size-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center justify-center">
                  {a.initials}
                </span>
                <span className="flex-1 text-[12.5px] text-slate-800">{a.name}</span>
                <span className="text-[11px] text-slate-400 capitalize">{a.role}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-slate-100 px-2 py-1.5">
          <button className="w-full h-7 rounded-md hover:bg-slate-50 text-[12px] text-slate-600 inline-flex items-center gap-1.5 px-2">
            <UserIcon size={11} /> Invite a contributor…
          </button>
        </div>
      </div>
    </>
  )
}

function MetaChip({
  icon, value, onChange, options,
}: { icon: React.ReactNode; value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="h-7 px-2 rounded-full hover:bg-slate-50 text-[12px] text-slate-600 inline-flex items-center gap-1.5"
      >
        {icon} {value} <ChevronDown size={10} className="text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-9 left-0 w-[180px] bg-white border border-slate-200 rounded-lg shadow-[0_8px_24px_rgba(15,23,42,0.08)] py-1">
            {options.map(o => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 inline-flex items-center justify-between"
              >
                {o}
                {o === value && <CheckCircle2 size={12} className="text-slate-900" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ledger — calm rows
// ─────────────────────────────────────────────────────────────────────────────

function LedgerView({ claims, usedClaimIds }: { claims: Claim[]; usedClaimIds: Set<string> }) {
  return (
    <div className="mx-auto w-full max-w-[860px] px-10 py-10">
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Facts
        </h2>
        <p className="text-[13px] text-slate-500 mt-1">
          Every fact in the story lives here. Verified ones can be cited in the draft.
        </p>
      </div>

      {claims.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 size={18} className="text-slate-400" />}
          title="No facts yet"
          body="Facts come from sources. Add a source on the left, or type a claim manually."
          cta="Add source"
        />
      )}
      {claims.length > 0 && (
      <ul className="divide-y divide-slate-100 border-y border-slate-100">
        {claims.map(c => (
          <li key={c.id} className="py-4 group">
            <div className="flex items-start gap-3">
              <span className={cn('size-2 rounded-full mt-2 shrink-0', STATUS_DOT[c.status])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] text-slate-900 leading-snug">{c.statement}</p>
                  <span className="text-[10.5px] font-mono text-slate-300 shrink-0 mt-0.5">{c.id}</span>
                </div>
                <blockquote className="mt-1.5 text-[12.5px] text-slate-500 italic leading-snug">
                  “{c.excerpt}”
                </blockquote>
                <div className="mt-2 flex items-center gap-2 text-[11.5px] text-slate-500">
                  <span>{STATUS_LABEL[c.status]}</span>
                  <span className="text-slate-300">·</span>
                  {c.sourceIds.map((sid, i) => {
                    const src = SOURCES.find(s => s.id === sid)
                    return (
                      <span key={sid} className="inline-flex items-center gap-1">
                        {i > 0 && <span className="text-slate-300">+</span>}
                        <span className="hover:text-slate-700 cursor-pointer underline-offset-2 hover:underline">
                          {src?.title.split(' · ')[0]} · {c.locator}
                        </span>
                      </span>
                    )
                  })}
                  {usedClaimIds.has(c.id) && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-700">in draft</span>
                    </>
                  )}
                  {c.verifiedBy && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>verified by {c.verifiedBy}</span>
                    </>
                  )}
                  {c.status === 'needs_check' && (
                    <button className="ml-auto text-[12px] text-slate-900 hover:underline inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Find second source <ArrowUpRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Outline — minimal
// ─────────────────────────────────────────────────────────────────────────────

function OutlineView() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-10 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Outline
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            The Drafter writes only from facts bound here.
          </p>
        </div>
      </div>

      <EmptyState
        icon={<Wand2 size={18} className="text-slate-400" />}
        title="No outline yet"
        body="Add a few facts first, then let Berry suggest an outline — or write the sections yourself."
        cta="Add section"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Right — Assistant (calm)
// ─────────────────────────────────────────────────────────────────────────────

function AssistantPanel() {
  return (
    <aside className="w-[320px] shrink-0 border-l border-slate-100 bg-white flex flex-col min-h-0">
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-100">
        <div className="inline-flex items-center gap-2">
          <Sparkles size={13} className="text-slate-700" />
          <span className="text-[13px] font-medium text-slate-900">Berry</span>
        </div>
        <span className="text-[11px] text-slate-400">Silent unless needed</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {SUGGESTIONS.length > 0 && SUGGESTIONS.map(s => (
          <SuggestionRow key={s.id} s={s} />
        ))}

        {SUGGESTIONS.length === 0 && (
          <div className="px-2 pt-6 pb-4">
            <p className="text-[12.5px] text-slate-500 leading-relaxed">
              Nothing to flag yet. Berry shows up when something needs you — a missing source, a single-source claim, a libel-risk phrasing.
            </p>
          </div>
        )}

        <div className="mt-5 px-1">
          <div className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400 mb-2">Start with</div>
          <div className="flex flex-col gap-0.5">
            {[
              'Summarise a source',
              'Suggest an angle',
              'Draft a lede',
              'Find related coverage',
            ].map(a => (
              <button key={a} className="h-8 px-2 rounded-md text-left text-[12.5px] text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2">
                <Circle size={6} className="text-slate-300 fill-slate-300" />
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="relative">
          <input
            placeholder="Ask Berry…"
            className="w-full h-9 rounded-md border border-slate-200 bg-white pl-3 pr-9 text-[12.5px] placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 rounded">⌘K</kbd>
        </div>
      </div>
    </aside>
  )
}

function EmptyState({
  icon, title, body, cta,
}: { icon: React.ReactNode; title: string; body: string; cta?: string }) {
  return (
    <div className="py-16 flex flex-col items-center text-center">
      <div className="size-10 rounded-lg border border-slate-200 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-[14px] font-medium text-slate-900">{title}</h3>
      <p className="text-[12.5px] text-slate-500 mt-1 max-w-[320px] leading-relaxed">{body}</p>
      {cta && (
        <button className="mt-4 h-8 px-3 rounded-md border border-slate-200 hover:border-slate-300 text-[12.5px] text-slate-700 inline-flex items-center gap-1.5">
          <Plus size={12} /> {cta}
        </button>
      )}
    </div>
  )
}

function SuggestionRow({ s }: { s: Suggestion }) {
  const dot = s.severity === 'block' ? 'bg-rose-500' : s.severity === 'caution' ? 'bg-amber-500' : 'bg-slate-300'
  return (
    <button className="w-full text-left px-2 py-2.5 rounded-md hover:bg-slate-50 group">
      <div className="flex items-start gap-2">
        <span className={cn('size-1.5 rounded-full mt-1.5 shrink-0', dot)} />
        <div className="flex-1 min-w-0">
          <h4 className="text-[12.5px] font-medium text-slate-900 leading-snug">{s.title}</h4>
          <p className="text-[11.5px] text-slate-500 leading-snug mt-0.5">{s.body}</p>
          <span className="text-[11.5px] text-slate-900 inline-flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {s.cta} <ArrowUpRight size={10} />
          </span>
        </div>
      </div>
    </button>
  )
}
