'use client'

/**
 * NewsCreationV6 — Publish Readiness Check.
 *
 * Reporters write. The system handles everything it can. When they click
 * "Continue to review" the AI runs checks in a brief overlay, fixes anything
 * low-risk on its own, then shows a lightweight summary of what it handled
 * and what still needs the reporter's attention. Each remaining issue jumps
 * directly to its location. The reporter sends to editor — they don't publish.
 *
 * The article remains the hero throughout. Review chrome is just two moments:
 *  - a quick "Berry is reviewing" pass
 *  - a calm summary overlay
 *
 * Visual reference: Linear, Arc Browser, Notion.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Check, ChevronDown, ChevronRight, FileText, Layers,
  LayoutDashboard, ListChecks, MessageSquare, MessageSquareText,
  Newspaper, Plus, Settings, Sparkles, SquarePen, Type, Users, Wrench, Clock,
  ArrowRight, Wand2,
} from 'lucide-react'

/* ───────────────────────────────────────────────────────────────────────────
   Data
   ─────────────────────────────────────────────────────────────────────────── */

type CheckId =
  | 'grammar' | 'spelling' | 'metadata' | 'formatting' | 'headline'
  | 'cover' | 'duplicate' | 'attribution' | 'source' | 'legal' | 'readiness'

// Each auto-fix carries the actual evidence — so reporters can verify what
// Berry did, not just trust the headline. `kind: 'pass'` rows describe what
// Berry *checked* and confirmed; `'replace' | 'add'` rows show before/after.
type FixChange =
  | { kind: 'replace'; before: string; after: string; where?: string }
  | { kind: 'add';     value: string;  where?: string }
  | { kind: 'pass';    text: string }
type AutoFix = {
  id: CheckId
  label: string
  detail?: string
  variant: 'fix' | 'suggestion' | 'pass'
  changes: FixChange[]
}
type Issue   = {
  id: string
  tone: 'critical' | 'suggestion'
  eyebrow: string
  title: string
  body?: string
  anchor: 'headline' | `p${number}`
  action: string
}

// Static demo: what Berry handled automatically + what needs the reporter.
// Each row has expandable evidence so the reporter can verify the change.
const AUTO_FIXES: AutoFix[] = [
  {
    id: 'grammar',
    label: 'Grammar corrected',
    detail: '3 small fixes',
    variant: 'fix',
    changes: [
      { kind: 'replace', where: 'Paragraph 1', before: 'अपेक्षामा थिए तर बिहान',  after: 'अपेक्षामा थिए। तर बिहान' },
      { kind: 'replace', where: 'Paragraph 2', before: 'workers according to', after: 'workers, according to' },
      { kind: 'replace', where: 'Paragraph 3', before: 'school जान',             after: 'स्कुल जान' },
    ],
  },
  {
    id: 'spelling',
    label: 'Spelling corrected',
    detail: '1 word',
    variant: 'fix',
    changes: [
      { kind: 'replace', where: 'Paragraph 2', before: 'importrers', after: 'importers' },
    ],
  },
  {
    id: 'metadata',
    label: 'Metadata completed',
    detail: 'Category · tags · slug',
    variant: 'fix',
    changes: [
      { kind: 'add', where: 'Category', value: 'Politics · Policy' },
      { kind: 'add', where: 'Tags',     value: 'import-reform, small-business, birgunj' },
      { kind: 'add', where: 'Slug',     value: 'import-reform-policy-small-businesses' },
    ],
  },
  {
    id: 'formatting',
    label: 'Formatting cleaned',
    detail: 'Smart quotes, spacing',
    variant: 'fix',
    changes: [
      { kind: 'replace', where: 'Paragraph 4', before: '"This decision was made',  after: '“This decision was made' },
      { kind: 'replace', where: 'Body',        before: 'workers ."',               after: 'workers.”' },
      { kind: 'pass',    text: 'Removed 4 stray double spaces.' },
    ],
  },
  {
    id: 'headline',
    label: 'Headline polish suggested',
    detail: 'Optional — needs your approval',
    variant: 'suggestion',
    changes: [
      {
        kind: 'replace',
        where: 'Headline',
        before: 'व्यवस्थापन फेरबदलले सुकुमवासी होल्डिङ सेन्टरमा सोमबार तनाव, आजदेखि सहज',
        after:  'सुकुमवासी होल्डिङ सेन्टरमा खाना अभाव — सोमबार तनाव, आजदेखि सहज',
      },
    ],
  },
  {
    id: 'cover',
    label: 'Cover image verified',
    variant: 'pass',
    changes: [
      { kind: 'pass', text: 'Aspect ratio 16:9 · file size 142 KB · alt text present.' },
    ],
  },
  {
    id: 'duplicate',
    label: 'No duplicate information found',
    variant: 'pass',
    changes: [
      { kind: 'pass', text: 'Scanned 5 paragraphs against 2 linked sources and prior coverage from the same reporter — no overlapping passages above 70% similarity.' },
    ],
  },
  {
    id: 'legal',
    label: 'No legal risk flagged',
    variant: 'pass',
    changes: [
      { kind: 'pass', text: 'No named individuals accused of crime without attribution. No copyrighted long-form quotes detected. No personal identifiers (phone, address, NID) found in body.' },
    ],
  },
]

const ISSUES: Issue[] = [
  {
    id: 'src-1',
    tone: 'critical',
    eyebrow: 'Source',
    anchor: 'p2',
    title: 'Unsupported claim',
    body: '"The policy will impact over 50,000 workers." — could not be verified from attached sources.',
    action: 'Link source',
  },
  {
    id: 'att-1',
    tone: 'critical',
    eyebrow: 'Attribution',
    anchor: 'p4',
    title: 'Missing attribution',
    body: 'Paragraph 4 contains a quote without an identified speaker.',
    action: 'Add attribution',
  },
]

const PARAGRAPHS = [
  'काठमाडौँ — कीर्तिपुरस्थित राधास्वामी सत्संग होल्डिङ सेन्टरमा रहेका सुकुमवासीहरू खाना व्यवस्थापनको समन्वय नहुँदा सोमबार आक्रोशित भए । उनीहरू बिहान चियाको प्रतीक्षामा थिए । तर बिहान न चिया आयो, न खाना नै ।',
  'The policy will impact over 50,000 workers, according to early estimates, with small importers in the Birgunj corridor expected to absorb the heaviest near-term cost.',
  'बालबालिकाहरू बिहान ९ बजेपछि स्कुल जान ठिक्क परेको निकैबेरसम्म पनि खाना नआएपछि अभिभावकहरू आश्चर्यमा परे र क्यान्टिनतिर गए ।',
  '"This decision was made without consulting workers." — the statement could not be attributed to a named speaker.',
  'गृवानिकाहरू खाना कतिबेला आउँछ भनेर होल्डिङ सेन्टरमै रहेका नगर प्रहरीहरूसँग बुझ्न पनि गएका थिए ।',
]

// What appears in the running-checks animation (subset of AUTO_FIXES + checks
// that will turn into issues). Ordered for nice cascading visual.
const RUNNING_CHECKS: { id: CheckId | 'spelling-x' | 'source-x' | 'attribution-x'; label: string; result: 'pass' | 'fix' | 'flag' }[] = [
  { id: 'grammar',     label: 'Grammar',               result: 'fix'  },
  { id: 'spelling',    label: 'Spelling',              result: 'fix'  },
  { id: 'formatting',  label: 'Formatting',            result: 'fix'  },
  { id: 'metadata',    label: 'Metadata',              result: 'fix'  },
  { id: 'cover',       label: 'Cover image',           result: 'pass' },
  { id: 'duplicate',   label: 'Duplicate information', result: 'pass' },
  { id: 'legal',       label: 'Legal risk',            result: 'pass' },
  { id: 'source-x',    label: 'Source verification',   result: 'flag' },
  { id: 'attribution-x', label: 'Attribution',         result: 'flag' },
  { id: 'readiness',   label: 'Publication readiness', result: 'pass' },
]

/* ───────────────────────────────────────────────────────────────────────────
   Root
   ─────────────────────────────────────────────────────────────────────────── */

type Mode = 'edit' | 'reviewing' | 'summary' | 'fixing'

export default function NewsCreationV6() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('edit')
  const [title, setTitle] = useState('व्यवस्थापन फेरबदलले सुकुमवासी होल्डिङ सेन्टरमा सोमबार तनाव, आजदेखि सहज')
  const [synopsis] = useState('व्यवस्थापन फेरबदलले सुकुमवासी होल्डिङ सेन्टरमा सोमबार तनाव, आजदेखि सहज')

  // Issues that still need the reporter
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const open = useMemo(() => ISSUES.filter(i => !resolved.has(i.id)), [resolved])

  // What's being fixed inline right now (anchor of the active issue)
  const [focusAnchor, setFocusAnchor] = useState<string | null>(null)
  const anchorRefs = useRef<Map<string, HTMLElement>>(new Map())

  function startReview() { setMode('reviewing') }
  function openSummary() { setMode('summary') }
  function backToEdit()  { setMode('edit'); setFocusAnchor(null) }

  function jumpToIssue(issue: Issue) {
    setMode('fixing')
    setFocusAnchor(issue.anchor)
    // Scroll the line into view + soft highlight
    requestAnimationFrame(() => {
      const el = anchorRefs.current.get(issue.anchor)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
  function markFixed(issueId: string) {
    setResolved(r => { const n = new Set(r); n.add(issueId); return n })
    setFocusAnchor(null)
    setMode('summary')
  }
  function dismissFocus() {
    setFocusAnchor(null)
    setMode('summary')
  }

  const sendable = open.length === 0
  const fixSeconds = open.length * 15

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(60% 40% at 100% 0%, rgba(124,58,237,0.10) 0%, transparent 60%),
          radial-gradient(55% 35% at 0% 0%, rgba(7,135,255,0.08) 0%, transparent 65%),
          #f3f4f6
        `,
      }}
    >
      <V6Styles />
      <CollapsedSidebar />
      <SourcesPanel />

      {/* Main editor card */}
      <main className="flex-1 mt-[10px] mr-[10px] mb-[10px] backdrop-blur-[100px] bg-[rgba(255,255,255,0.6)] border border-black/5 rounded-[14px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col min-w-0">

        {/* Header */}
        <header className="border-b border-slate-200 flex items-center justify-between px-4 h-[62px] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={16} strokeWidth={1.75} className="text-slate-700" />
            </button>
            <h1 className="text-[16px] font-medium leading-6 text-[#262626] truncate" style={{ fontFamily: 'var(--font-inter)' }}>
              New news
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <GhostBtn>Save as Draft</GhostBtn>
            <OutlineBtn>Preview</OutlineBtn>
            <PrimaryBtn onClick={startReview}>Continue to review</PrimaryBtn>
          </div>
        </header>

        {/* Secondary row — word count + tools (edit mode only) */}
        <div className="flex items-center justify-end gap-4 px-4 pt-[14px] pb-2 shrink-0">
          <div className="flex items-center gap-2 text-[14px] text-[#0f172a]" style={{ fontFamily: 'var(--font-inter)' }}>
            <span>1,243 words</span>
            <span className="size-1.5 rounded-full bg-slate-300" />
            <span>1,132 characters</span>
          </div>
          <OutlineBtn small><Sparkles size={14} strokeWidth={1.75} className="text-[#0787ff]" />Enable Focus Mode</OutlineBtn>
          <OutlineBtn small><FileText size={14} strokeWidth={1.75} className="text-slate-700" />Manage details</OutlineBtn>
        </div>

        {/* Article */}
        <article className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto max-w-[920px] px-[48px] py-[28px] flex flex-col gap-7">

            {/* Headline */}
            <FieldGroup
              eyebrow="Headline"
              helper="Aim for 7–12 words. This is what readers see first."
              counter={`${title.length} / 120`}
              setRef={el => el && anchorRefs.current.set('headline', el)}
              focused={focusAnchor === 'headline'}
            >
              <textarea
                value={title}
                onChange={e => setTitle(e.target.value)}
                rows={2}
                className="w-full resize-none bg-transparent outline-none text-[24px] leading-[1.3] font-semibold text-[#0f172a]"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </FieldGroup>

            {/* Synopsis */}
            <FieldGroup eyebrow="Synopsis" collapsible>
              <p className="text-[14px] leading-5 text-[#0f172a]" style={{ fontFamily: 'var(--font-inter)' }}>
                {synopsis}
              </p>
            </FieldGroup>

            {/* Cover */}
            <FieldGroup eyebrow="Cover Image" noBorder>
              <CoverImage />
            </FieldGroup>

            {/* Description / body */}
            <FieldGroup eyebrow="Description" noBorder>
              <div className="flex flex-col gap-3 pt-1">
                {PARAGRAPHS.map((p, i) => {
                  const anchor = `p${i}` as const
                  const isFocused = focusAnchor === anchor
                  return (
                    <ParagraphRow
                      key={anchor}
                      text={p}
                      focused={isFocused}
                      setRef={el => el && anchorRefs.current.set(anchor, el)}
                    >
                      {isFocused && (
                        <InlineFixBar
                          issue={ISSUES.find(i => i.anchor === anchor)!}
                          onFixed={() => markFixed(ISSUES.find(i => i.anchor === anchor)!.id)}
                          onCancel={dismissFocus}
                        />
                      )}
                    </ParagraphRow>
                  )
                })}
              </div>
            </FieldGroup>

            <div className="h-32" />
          </div>
        </article>
      </main>

      {/* ─── Overlays ───────────────────────────────────────────────────── */}
      {mode === 'reviewing' && (
        <ReviewingOverlay onDone={openSummary} />
      )}
      {mode === 'summary' && (
        <SummaryOverlay
          autoFixes={AUTO_FIXES}
          openIssues={open}
          totalIssues={ISSUES.length}
          fixSeconds={fixSeconds}
          sendable={sendable}
          onJump={jumpToIssue}
          onClose={backToEdit}
          onSend={() => {/* hook up */}}
        />
      )}
      {mode === 'fixing' && (
        <FloatingReturnPill
          remaining={open.length}
          onReturn={() => setMode('summary')}
        />
      )}
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   ReviewingOverlay — brief "Berry is reviewing" animation
   ─────────────────────────────────────────────────────────────────────────── */

function ReviewingOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= RUNNING_CHECKS.length) {
      const t = setTimeout(onDone, 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep(s => s + 1), 180)
    return () => clearTimeout(t)
  }, [step, onDone])

  return (
    <Backdrop>
      <div
        className="w-[440px] max-w-[90vw] rounded-[20px] border border-white/60 overflow-hidden"
        style={{
          background:
            'radial-gradient(120% 100% at 0% 0%, rgba(124,58,237,0.12) 0%, transparent 55%), ' +
            'radial-gradient(80% 80% at 100% 100%, rgba(7,135,255,0.14) 0%, transparent 60%), ' +
            'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.92) 100%)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.6) inset, ' +
            '0 30px 70px -30px rgba(15,23,42,0.35), ' +
            '0 4px 14px -8px rgba(7,135,255,0.18)',
        }}
      >
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="relative shrink-0 inline-flex items-center justify-center size-10 rounded-[12px] bg-gradient-to-br from-[#0787ff] to-[#7c3aed] text-white shadow-[0_8px_22px_-6px_rgba(124,58,237,0.55)]">
              <Sparkles size={18} strokeWidth={1.75} className="berry-sparkle" />
              <span aria-hidden className="absolute inset-0 rounded-[12px] berry-ring" />
            </span>
            <div className="flex-1 min-w-0">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.18em] bg-clip-text text-transparent bg-gradient-to-r from-[#0787ff] to-[#7c3aed]"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Berry
              </span>
              <p
                className="text-[17px] leading-[1.35] text-[#0f172a] tracking-[-0.005em]"
                style={{ fontFamily: 'var(--font-dm-sans)', fontVariationSettings: '"opsz" 14' }}
              >
                Reviewing your story…
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {RUNNING_CHECKS.map((c, i) => {
              const state: 'pending' | 'running' | 'done' =
                i < step ? 'done' : i === step ? 'running' : 'pending'
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-[10px] transition-colors ${
                    state === 'running' ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RunningIcon state={state} result={c.result} />
                    <span
                      className={`text-[13.5px] leading-[1.4] truncate ${
                        state === 'pending' ? 'text-slate-400' : 'text-[#0f172a]'
                      }`}
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {c.label}
                    </span>
                  </div>
                  {state === 'done' && (
                    <span
                      className={`text-[11.5px] font-medium uppercase tracking-[0.14em] ${
                        c.result === 'fix'  ? 'text-[#0787ff]' :
                        c.result === 'flag' ? 'text-amber-600' :
                                              'text-emerald-600'
                      }`}
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {c.result === 'fix' ? 'Fixed' : c.result === 'flag' ? 'Flagged' : 'OK'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Backdrop>
  )
}

function RunningIcon({ state, result }: { state: 'pending' | 'running' | 'done'; result: 'pass' | 'fix' | 'flag' }) {
  if (state === 'pending') {
    return <span className="size-[14px] rounded-full border border-slate-200" />
  }
  if (state === 'running') {
    return (
      <span className="relative inline-flex items-center justify-center size-[14px]">
        <span aria-hidden className="absolute inset-0 rounded-full border-[1.5px] border-slate-200" />
        <span aria-hidden className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#0787ff] animate-spin" />
      </span>
    )
  }
  if (result === 'flag') {
    return (
      <span className="inline-flex items-center justify-center size-[14px] rounded-full bg-amber-100 text-amber-700">
        <span className="text-[10px] leading-none font-semibold">!</span>
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center justify-center size-[14px] rounded-full text-white ${
      result === 'fix' ? 'bg-[#0787ff]' : 'bg-emerald-500'
    }`}>
      <Check size={9} strokeWidth={3} />
    </span>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   SummaryOverlay — Berry handled + needs attention + Send to Editor
   ─────────────────────────────────────────────────────────────────────────── */

function SummaryOverlay({
  autoFixes, openIssues, totalIssues, fixSeconds, sendable,
  onJump, onClose, onSend,
}: {
  autoFixes: AutoFix[]
  openIssues: Issue[]
  totalIssues: number
  fixSeconds: number
  sendable: boolean
  onJump: (i: Issue) => void
  onClose: () => void
  onSend: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const resolvedCount = totalIssues - openIssues.length

  return (
    <Backdrop onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-[480px] max-w-[92vw] max-h-[80vh] rounded-[20px] border border-white/70 bg-white overflow-hidden flex flex-col summary-in"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.6) inset, ' +
            '0 30px 70px -30px rgba(15,23,42,0.35), ' +
            '0 4px 14px -8px rgba(7,135,255,0.18)',
        }}
      >
        {/* Header */}
        <div
          className="relative px-6 pt-6 pb-5 overflow-hidden"
          style={{
            background:
              sendable
                ? 'radial-gradient(120% 100% at 0% 0%, rgba(16,185,129,0.16) 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.92))'
                : 'radial-gradient(120% 100% at 0% 0%, rgba(124,58,237,0.14) 0%, transparent 55%), radial-gradient(80% 80% at 100% 100%, rgba(7,135,255,0.14) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.92))',
          }}
        >
          <div className="flex items-start gap-3">
            <span className={`shrink-0 inline-flex items-center justify-center size-10 rounded-[12px] text-white shadow-[0_8px_22px_-6px_rgba(124,58,237,0.45)] ${
              sendable ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                         'bg-gradient-to-br from-[#0787ff] to-[#7c3aed]'
            }`}>
              {sendable ? <Check size={18} strokeWidth={2.5} /> : <Sparkles size={18} strokeWidth={1.75} />}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {sendable ? 'Ready for editorial review' : 'Almost ready'}
              </span>
              <p
                className="mt-1 text-[20px] leading-[1.25] text-[#0f172a] tracking-[-0.01em]"
                style={{ fontFamily: 'var(--font-dm-sans)', fontVariationSettings: '"opsz" 14' }}
              >
                {sendable
                  ? 'All required checks passed.'
                  : openIssues.length === 1
                    ? '1 issue needs your attention.'
                    : `${openIssues.length} issues need your attention.`}
              </p>
              {!sendable && (
                <p className="mt-1 text-[12.5px] text-slate-500" style={{ fontFamily: 'var(--font-inter)' }}>
                  Estimated fix time: {fixSeconds < 60 ? `${fixSeconds}s` : `${Math.round(fixSeconds / 60)} min`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Close"
            >
              <ChevronDown size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-5 flex flex-col gap-4">
          {/* Needs attention — show first, this is what the reporter does */}
          {openIssues.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionHeader label={`Needs your attention · ${openIssues.length}`} />
              <div className="flex flex-col gap-2">
                {openIssues.map(i => (
                  <IssueAction key={i.id} issue={i} onJump={() => onJump(i)} />
                ))}
              </div>
            </section>
          )}

          {/* Berry handled this — collapsed by default; expanding feels delightful */}
          <section className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="flex items-center justify-between w-full text-left group"
            >
              <SectionHeader label={`Berry handled ${autoFixes.length} ${autoFixes.length === 1 ? 'check' : 'checks'}`} />
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 group-hover:text-slate-900 transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                {expanded ? 'Hide' : 'Show'}
                <ChevronRight size={12} strokeWidth={2} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </span>
            </button>
            {expanded && (
              <div className="flex flex-col berry-fixes-in">
                {autoFixes.map(f => (
                  <AutoFixRow key={f.id} fix={f} />
                ))}
              </div>
            )}
            {!expanded && resolvedCount > 0 && (
              <p className="text-[12px] text-slate-500" style={{ fontFamily: 'var(--font-inter)' }}>
                + {resolvedCount} {resolvedCount === 1 ? 'issue' : 'issues'} resolved by you
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Back to editing
          </button>
          <button
            type="button"
            disabled={!sendable}
            onClick={onSend}
            className="relative inline-flex items-center justify-center gap-2 min-h-[38px] px-5 rounded-[10px] overflow-hidden transition-[filter,opacity] disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:brightness-110"
          >
            <span aria-hidden className={`absolute inset-0 rounded-[10px] ${
              sendable
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                : 'bg-gradient-to-br from-[#0787ff] to-[#7c3aed]'
            }`} />
            <span aria-hidden className="absolute inset-0 rounded-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]" />
            <span className="relative text-[13.5px] font-semibold text-white tracking-[-0.005em]" style={{ fontFamily: 'var(--font-inter)' }}>
              Send to Editor
            </span>
            <ArrowRight size={14} strokeWidth={2.25} className="relative text-white" />
          </button>
        </div>
      </div>
    </Backdrop>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      {label}
    </span>
  )
}

function IssueAction({ issue, onJump }: { issue: Issue; onJump: () => void }) {
  const dot = issue.tone === 'critical' ? 'bg-rose-500' : 'bg-amber-400'
  return (
    <div className="group rounded-[14px] border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_4px_14px_-8px_rgba(15,23,42,0.18)] transition-[box-shadow,border-color] overflow-hidden">
      <div className="p-3.5 flex items-start gap-3">
        <span className={`mt-1.5 size-[7px] rounded-full ${dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {issue.eyebrow}
            </span>
          </div>
          <p
            className="mt-0.5 text-[14.5px] leading-[1.35] text-[#0f172a]"
            style={{ fontFamily: 'var(--font-dm-sans)', fontVariationSettings: '"opsz" 14' }}
          >
            {issue.title}
          </p>
          {issue.body && (
            <p className="mt-1 text-[12.5px] leading-[1.5] text-[#64748b]" style={{ fontFamily: 'var(--font-inter)' }}>
              {issue.body}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onJump}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#0f172a] text-white text-[12.5px] font-semibold hover:brightness-110 transition-[filter]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {issue.action}
          <ArrowRight size={12} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   AutoFixRow — collapsible row showing before/after evidence for each check
   ─────────────────────────────────────────────────────────────────────────── */

function AutoFixRow({ fix }: { fix: AutoFix }) {
  const [open, setOpen] = useState(false)

  const iconClasses =
    fix.variant === 'fix'        ? 'bg-[#0787ff]/10 text-[#0787ff]' :
    fix.variant === 'suggestion' ? 'bg-amber-50 text-amber-600' :
                                   'bg-emerald-50 text-emerald-600'

  const tagText  =
    fix.variant === 'fix'        ? 'Fixed' :
    fix.variant === 'suggestion' ? 'Suggested' :
                                   'OK'
  const tagClasses =
    fix.variant === 'fix'        ? 'text-[#0787ff]' :
    fix.variant === 'suggestion' ? 'text-amber-600' :
                                   'text-emerald-600'

  return (
    <div className="border-b border-slate-100 last:border-none">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center w-full gap-3 py-2 text-left hover:bg-slate-50/60 rounded-[8px] px-1.5 -mx-1.5 transition-colors"
      >
        <span className={`inline-flex items-center justify-center size-[18px] rounded-full ${iconClasses}`}>
          <Check size={10} strokeWidth={3} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="text-[13px] text-[#0f172a]" style={{ fontFamily: 'var(--font-inter)' }}>
            {fix.label}
          </span>
          {fix.detail && (
            <span className="ml-2 text-[11.5px] text-slate-400" style={{ fontFamily: 'var(--font-inter)' }}>
              {fix.detail}
            </span>
          )}
        </span>
        <span
          className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${tagClasses}`}
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {tagText}
        </span>
        <ChevronRight
          size={13}
          strokeWidth={2}
          className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="pl-[30px] pr-1.5 py-2 flex flex-col gap-2 fix-evidence-in">
          {fix.changes.map((c, i) => (
            <ChangeBlock key={i} change={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChangeBlock({ change }: { change: FixChange }) {
  if (change.kind === 'pass') {
    return (
      <div className="rounded-[10px] bg-slate-50/70 border border-slate-100 px-3 py-2">
        <p className="text-[12.5px] leading-[1.5] text-slate-600" style={{ fontFamily: 'var(--font-inter)' }}>
          {change.text}
        </p>
      </div>
    )
  }

  if (change.kind === 'add') {
    return (
      <div className="rounded-[10px] border border-slate-100 overflow-hidden">
        {change.where && (
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400" style={{ fontFamily: 'var(--font-inter)' }}>
              {change.where}
            </span>
          </div>
        )}
        <div className="px-3 pb-2 flex items-start gap-2">
          <span className="inline-flex items-center justify-center size-[16px] rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
            <Plus size={10} strokeWidth={3} />
          </span>
          <p
            className="flex-1 text-[13px] leading-[1.45] text-[#0f172a]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {change.value}
          </p>
        </div>
      </div>
    )
  }

  // 'replace'
  return (
    <div className="rounded-[10px] border border-slate-100 overflow-hidden">
      {change.where && (
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400" style={{ fontFamily: 'var(--font-inter)' }}>
            {change.where}
          </span>
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 pb-2 items-stretch">
        <div className="rounded-[8px] bg-rose-50/70 border border-rose-100 px-2.5 py-1.5">
          <p
            className="text-[12.5px] leading-[1.5] text-rose-900/80 line-through decoration-rose-300"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {change.before}
          </p>
        </div>
        <div className="flex items-center justify-center text-slate-300">
          <ArrowRight size={12} strokeWidth={2} />
        </div>
        <div className="rounded-[8px] bg-emerald-50/70 border border-emerald-100 px-2.5 py-1.5">
          <p
            className="text-[12.5px] leading-[1.5] text-emerald-900"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {change.after}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   FloatingReturnPill — appears while reporter is fixing an issue inline
   ─────────────────────────────────────────────────────────────────────────── */

function FloatingReturnPill({ remaining, onReturn }: { remaining: number; onReturn: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pill-in">
      <button
        type="button"
        onClick={onReturn}
        className="inline-flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full border border-white/70 bg-white/90 backdrop-blur-md shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35),0_4px_14px_-8px_rgba(15,23,42,0.18)] hover:bg-white transition-colors"
      >
        <span className="inline-flex items-center justify-center size-6 rounded-full bg-gradient-to-br from-[#0787ff] to-[#7c3aed] text-white">
          <Wand2 size={12} strokeWidth={2} />
        </span>
        <span className="text-[13px] text-[#0f172a] font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
          {remaining} {remaining === 1 ? 'issue left' : 'issues left'}
        </span>
        <span className="text-[12px] text-slate-500" style={{ fontFamily: 'var(--font-inter)' }}>
          ·  return to summary
        </span>
        <ArrowRight size={12} strokeWidth={2.25} className="text-slate-500" />
      </button>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   InlineFixBar — sits below the focused paragraph
   ─────────────────────────────────────────────────────────────────────────── */

function InlineFixBar({
  issue, onFixed, onCancel,
}: {
  issue: Issue
  onFixed: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="relative mt-3 rounded-[14px] border border-white/70 bg-white p-4 flex flex-col gap-3 fix-in"
      style={{
        boxShadow:
          '0 10px 28px -16px rgba(15,23,42,0.22), 0 2px 8px -4px rgba(15,23,42,0.06)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className={`size-[6px] rounded-full ${issue.tone === 'critical' ? 'bg-rose-500' : 'bg-amber-400'}`} />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {issue.eyebrow}
        </span>
      </div>
      <p
        className="text-[15px] leading-[1.4] text-[#0f172a]"
        style={{ fontFamily: 'var(--font-dm-sans)', fontVariationSettings: '"opsz" 14' }}
      >
        {issue.title}
      </p>
      <input
        type="text"
        placeholder={
          issue.id === 'src-1' ? 'Paste a source URL or DOI…' :
                                 'Name the speaker (e.g., गीता लामा, residents association)'
        }
        className="w-full px-3 py-2 rounded-[10px] border border-slate-200 bg-slate-50/60 text-[14px] text-[#0f172a] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/15 transition-[box-shadow,border-color]"
        style={{ fontFamily: 'var(--font-inter)' }}
        autoFocus
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 transition-colors"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onFixed}
          className="relative inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[10px] overflow-hidden hover:brightness-110 transition-[filter]"
        >
          <span aria-hidden className="absolute inset-0 bg-[#0f172a] rounded-[10px]" />
          <span aria-hidden className="absolute inset-0 rounded-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" />
          <span className="relative text-[13px] font-semibold text-white" style={{ fontFamily: 'var(--font-inter)' }}>
            Done
          </span>
        </button>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Article primitives (clean, no review chrome interrupting the body)
   ─────────────────────────────────────────────────────────────────────────── */

function FieldGroup({
  eyebrow, helper, counter, collapsible, noBorder, focused, setRef, children,
}: {
  eyebrow: string
  helper?: string
  counter?: string
  collapsible?: boolean
  noBorder?: boolean
  focused?: boolean
  setRef?: (el: HTMLElement | null) => void
  children: React.ReactNode
}) {
  return (
    <section
      ref={setRef as any}
      className={`relative flex flex-col gap-3 w-full ${noBorder ? '' : 'border-b border-[#e4e4e7] pb-[14px]'} ${focused ? 'focus-highlight rounded-[14px] -mx-3 px-3 py-2' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[12px] font-medium leading-[14px] uppercase text-[#4d4d56]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {eyebrow}
        </span>
        {collapsible && <ChevronDown size={14} strokeWidth={1.75} className="text-slate-500" />}
      </div>
      {children}
      {(helper || counter) && (
        <div className="flex items-center justify-between">
          {helper && <span className="text-[12px] leading-[14px] text-[#737373]" style={{ fontFamily: 'var(--font-inter)' }}>{helper}</span>}
          {counter && <span className="text-[12px] leading-[14px] text-[#4d4d56]" style={{ fontFamily: 'var(--font-inter)' }}>{counter}</span>}
        </div>
      )}
    </section>
  )
}

function ParagraphRow({
  text, focused, setRef, children,
}: {
  text: string
  focused?: boolean
  setRef?: (el: HTMLElement | null) => void
  children?: React.ReactNode
}) {
  return (
    <div
      ref={setRef as any}
      className={`relative transition-colors ${focused ? 'focus-highlight rounded-[12px] -mx-3 px-3 py-2' : ''}`}
    >
      <p className="text-[16px] leading-[1.6] text-[#262626]" style={{ fontFamily: 'var(--font-dm-sans)', fontVariationSettings: '"opsz" 14' }}>
        {text}
      </p>
      {children}
    </div>
  )
}

function CoverImage() {
  return (
    <div className="w-[310px] h-[178px] rounded-[10px] overflow-hidden border border-slate-300 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-200" />
      <div className="relative h-full flex items-end justify-start p-3">
        <span
          className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/95 px-2 py-1 rounded-md bg-black/30 backdrop-blur"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Cover photo
        </span>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Sidebar + Sources + Buttons + Backdrop + Styles
   ─────────────────────────────────────────────────────────────────────────── */

function Backdrop({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="fixed inset-0 z-50 flex items-center justify-center px-6 backdrop-in"
      style={{ background: 'rgba(15,23,42,0.32)', backdropFilter: 'blur(4px)' }}
    >
      {children}
    </div>
  )
}

function CollapsedSidebar() {
  const items = [
    { Icon: LayoutDashboard }, { Icon: MessageSquareText }, { Icon: MessageSquare },
    { Icon: ListChecks }, { Icon: Clock }, { Icon: Layers }, { Icon: Users },
    { Icon: Wrench }, { Icon: Settings },
  ]
  return (
    <nav className="shrink-0 mt-[10px] mb-[10px] ml-[10px] w-[60px] backdrop-blur-[60px] bg-[rgba(255,255,255,0.5)] border border-black/5 rounded-[16px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.02)] flex flex-col gap-4 items-center px-3 py-4">
      <div className="size-8 rounded-lg bg-gradient-to-br from-[#0787ff] to-[#7c3aed] inline-flex items-center justify-center text-white text-[13px] font-semibold">
        S
      </div>
      <div className="h-px w-full bg-slate-200" />
      <button className="size-9 rounded-lg bg-white border border-slate-200 inline-flex items-center justify-center shadow-sm">
        <Plus size={16} strokeWidth={1.75} className="text-slate-700" />
      </button>
      <div className="flex flex-col gap-1">
        {items.map(({ Icon }, i) => (
          <button key={i} className="size-9 rounded-lg inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Icon size={18} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <button className="size-9 rounded-lg inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
          <Newspaper size={18} strokeWidth={1.5} />
        </button>
        <button className="size-9 rounded-lg inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
          <SquarePen size={18} strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  )
}

function SourcesPanel() {
  return (
    <aside className="shrink-0 mt-[10px] mb-[10px] ml-[10px] w-[315px] backdrop-blur-[60px] bg-[rgba(255,255,255,0.6)] border border-black/5 rounded-[14px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 flex items-center gap-1.5 h-[62px] px-4 shrink-0">
        <button className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-slate-100 transition-colors">
          <Layers size={16} strokeWidth={1.5} className="text-slate-700" />
        </button>
        <p className="flex-1 text-[16px] font-medium leading-6 text-[#262626]" style={{ fontFamily: 'var(--font-inter)' }}>
          Sources
        </p>
        <button className="inline-flex items-center justify-center size-8 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
          <Plus size={16} strokeWidth={1.75} className="text-slate-700" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="border border-dashed border-slate-300 rounded-[12px] px-4 py-7 flex flex-col items-center gap-2 bg-white/70">
          <div className="size-10 rounded-xl bg-gradient-to-br from-sky-100 to-violet-100 inline-flex items-center justify-center">
            <Type size={18} strokeWidth={1.5} className="text-slate-500" />
          </div>
          <p className="text-[12px] leading-[1.5] text-slate-500 text-center max-w-[211px]" style={{ fontFamily: 'var(--font-inter)' }}>
            Add PDFs, documents, or other text to reference in this article.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-medium leading-[1.3] text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Linked sources
          </p>
          <div className="flex flex-col gap-1">
            <SourceRow />
            <SourceRow />
          </div>
        </div>
      </div>
    </aside>
  )
}

function SourceRow() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors">
      <div className="size-9 rounded-md bg-sky-50 inline-flex items-center justify-center">
        <FileText size={16} strokeWidth={1.5} className="text-sky-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium leading-[1.4] text-[#171717] truncate" style={{ fontFamily: 'var(--font-inter)' }}>
          सरकारसँग जनताको मुख्य अपेक्षा के छ ?
        </p>
        <p className="text-[11.5px] text-slate-500 truncate" style={{ fontFamily: 'var(--font-inter)' }}>
          Text file · Nov 21, 2025 · 5MB
        </p>
      </div>
    </div>
  )
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-3 rounded-[8px] text-[13.5px] font-medium text-[#334155] hover:bg-slate-100 transition-colors"
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      {children}
    </button>
  )
}

function OutlineBtn({ children, onClick, small }: { children: React.ReactNode; onClick?: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 ${small ? 'min-h-[28px] px-2.5 text-[12.5px]' : 'min-h-[32px] px-3 text-[13.5px]'} rounded-[8px] bg-white border border-slate-300 text-[#020617] font-medium shadow-[0_1px_8px_0_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors`}
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      {children}
    </button>
  )
}

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center justify-center gap-1.5 min-h-[32px] px-3 rounded-[8px] overflow-hidden hover:brightness-110 transition-[filter]"
    >
      <span aria-hidden className="absolute inset-0 bg-[#0787ff] rounded-[8px]" />
      <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[8px] shadow-[inset_0px_0px_4px_0px_rgba(255,255,255,0.24)]" />
      <span className="relative text-[13.5px] font-medium leading-5 text-white" style={{ fontFamily: 'var(--font-inter)' }}>
        {children}
      </span>
    </button>
  )
}

function V6Styles() {
  return (
    <style jsx global>{`
      @keyframes berry-sparkle {
        0%, 100% { transform: rotate(-6deg) scale(1); opacity: 1; }
        50%      { transform: rotate(6deg)  scale(1.08); opacity: 0.9; }
      }
      .berry-sparkle { animation: berry-sparkle 2.4s ease-in-out infinite; }

      @keyframes berry-ring {
        0%   { box-shadow: 0 0 0 0 rgba(124,58,237,0.45); }
        70%  { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
        100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
      }
      .berry-ring { animation: berry-ring 2.4s ease-out infinite; }

      @keyframes backdrop-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .backdrop-in { animation: backdrop-in 160ms ease-out both; }

      @keyframes summary-in {
        from { opacity: 0; transform: translateY(8px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .summary-in { animation: summary-in 240ms cubic-bezier(0.22,1,0.36,1) both; }

      @keyframes pill-in {
        from { opacity: 0; transform: translate(-50%, 12px); }
        to   { opacity: 1; transform: translate(-50%, 0); }
      }
      .pill-in { animation: pill-in 240ms cubic-bezier(0.22,1,0.36,1) both; }

      @keyframes berry-fixes-in {
        from { opacity: 0; transform: translateY(-2px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .berry-fixes-in { animation: berry-fixes-in 200ms ease-out both; }

      @keyframes fix-evidence-in {
        from { opacity: 0; transform: translateY(-3px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .fix-evidence-in { animation: fix-evidence-in 180ms ease-out both; }

      @keyframes fix-in {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .fix-in { animation: fix-in 200ms cubic-bezier(0.22,1,0.36,1) both; }

      @keyframes focus-highlight {
        0%   { background-color: rgba(7,135,255,0.10); }
        100% { background-color: rgba(7,135,255,0.04); }
      }
      .focus-highlight { animation: focus-highlight 600ms ease-out forwards; background-color: rgba(7,135,255,0.04); }
    `}</style>
  )
}
