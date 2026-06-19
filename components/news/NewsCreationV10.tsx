'use client'

/**
 * NewsCreationV10 — Berry Review, dashboard-soft visual direction.
 *
 * Functional model carried over from v8 (persistent right panel, accept /
 * reject inline, revision history). What changes is the visual language:
 * a soft pale-blue canvas, oversized rounded white cards with whisper-light
 * shadows, Urbanist as the system font, a coral-red primary CTA, and a
 * yellow status pill — borrowed from the WindFarm dashboard reference.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Check, ChevronDown, ChevronRight, FileText, Layers,
  LayoutDashboard, ListChecks, MessageSquare, MessageSquareText,
  Newspaper, Plus, Settings, Sparkles, SquarePen, Users, Wrench, Clock,
  ArrowRight, Globe,
} from 'lucide-react'

/* ───────────────────────────────────────────────────────────────────────────
   Data — reused verbatim from v7
   ─────────────────────────────────────────────────────────────────────────── */

type CheckId =
  | 'grammar' | 'spelling' | 'metadata' | 'formatting' | 'headline'
  | 'cover' | 'duplicate' | 'attribution' | 'source' | 'legal' | 'readiness'
  | 'synopsis'

type FixChange =
  | { kind: 'replace'; before: string; after: string; where?: string; alternatives?: string[] }
  | { kind: 'add';     value: string;  where?: string }
  | { kind: 'pass';    text: string }
type AutoFix = {
  id: CheckId
  label: string
  detail?: string
  variant: 'suggestion' | 'applied' | 'verified'
  changes: FixChange[]
}
type Issue = {
  id: string
  tone: 'critical' | 'suggestion'
  eyebrow: string
  title: string
  body?: string
  anchor: 'headline' | 'metadata' | `p${number}`
  action: string
  targetPhrase?: string
  kind?: 'category'
}

const AUTO_FIXES: AutoFix[] = [
  {
    id: 'grammar',
    label: 'Grammar — 3 suggestions',
    detail: 'Punctuation and clause clarity',
    variant: 'suggestion',
    changes: [
      { kind: 'replace', where: 'Paragraph 1', before: 'अपेक्षामा थिए तर बिहान',     after: 'अपेक्षामा थिए। तर बिहान' },
      { kind: 'replace', where: 'Paragraph 2', before: 'workers according to',       after: 'workers, according to' },
      { kind: 'replace', where: 'Paragraph 3', before: 'school जान',                 after: 'स्कुल जान' },
    ],
  },
  {
    id: 'spelling',
    label: 'Spelling — 1 suggestion',
    detail: '"importrers" looks unintended',
    variant: 'suggestion',
    changes: [
      { kind: 'replace', where: 'Paragraph 2', before: 'importrers', after: 'importers' },
    ],
  },
  {
    id: 'headline',
    label: 'Headline polish',
    detail: 'Tighter framing, same meaning',
    variant: 'suggestion',
    changes: [
      {
        kind: 'replace',
        where: 'Headline',
        before: 'व्यवस्थापन फेरबदलले सुकुमवासी होल्डिङ सेन्टरमा सोमबार तनाव, आजदेखि सहज',
        after:  'सुकुमवासी होल्डिङ सेन्टरमा खाना अभाव — सोमबार तनाव, आजदेखि सहज',
        alternatives: [
          'होल्डिङ सेन्टरमा खाना अभाव: सोमबार तनाव, मंगलबारदेखि सहज',
          'सुकुमवासी होल्डिङ सेन्टरमा सोमबार आक्रोश — व्यवस्थापन फेरबदलपछि शान्त',
        ],
      },
    ],
  },
  {
    id: 'synopsis',
    label: 'Synopsis — needs your approval',
    detail: 'Tighter, more specific framing',
    variant: 'suggestion',
    changes: [
      {
        kind: 'replace',
        where: 'Synopsis',
        before: 'व्यवस्थापन फेरबदलले सुकुमवासी होल्डिङ सेन्टरमा सोमबार तनाव, आजदेखि सहज',
        after:  'सुकुमवासी होल्डिङ सेन्टरमा खाना अभावले सोमबार तनाव — व्यवस्थापन फेरबदलपछि स्थिति सहज',
        alternatives: [
          'खाना ढिलाइले सुकुमवासी होल्डिङ सेन्टरमा सोमबार आक्रोश; नयाँ व्यवस्थापनसँगै आजदेखि क्रमशः सहज ।',
          'राधास्वामी होल्डिङ सेन्टरमा खाना नआएपछि सोमबार तनाव छायो — व्यवस्थापन परिवर्तनसँगै स्थिति सामान्य बन्दै ।',
        ],
      },
    ],
  },
  {
    id: 'metadata',
    label: 'Metadata filled where empty',
    detail: 'Category · tags · slug',
    variant: 'applied',
    changes: [
      { kind: 'add', where: 'Tags',     value: 'import-reform, small-business, birgunj' },
      { kind: 'add', where: 'Slug',     value: 'import-reform-policy-small-businesses' },
    ],
  },
  {
    id: 'formatting',
    label: 'Invisible cleanups',
    detail: 'Smart quotes, double spaces',
    variant: 'applied',
    changes: [
      { kind: 'replace', where: 'Paragraph 4', before: '"This decision was made',  after: '“This decision was made' },
      { kind: 'replace', where: 'Body',        before: 'workers ."',               after: 'workers.”' },
      { kind: 'pass',    text: 'Removed 4 stray double spaces.' },
    ],
  },
  {
    id: 'cover',
    label: 'Cover image verified',
    variant: 'verified',
    changes: [
      { kind: 'pass', text: 'Aspect ratio 16:9 · file size 142 KB · alt text present.' },
    ],
  },
  {
    id: 'duplicate',
    label: 'No duplicate information found',
    variant: 'verified',
    changes: [
      { kind: 'pass', text: 'Scanned 5 paragraphs against 2 linked sources and prior coverage from the same reporter — no overlapping passages above 70% similarity.' },
    ],
  },
  {
    id: 'legal',
    label: 'No legal risk flagged',
    variant: 'verified',
    changes: [
      { kind: 'pass', text: 'No named individuals accused of crime without attribution. No copyrighted long-form quotes detected. No personal identifiers found in body.' },
    ],
  },
]

const ISSUES: Issue[] = [
  {
    id: 'cat-1',
    tone: 'critical',
    eyebrow: 'Metadata',
    anchor: 'metadata',
    title: 'Missing category',
    body: 'This story has no category — required before sending to editor.',
    action: 'Choose category',
    kind: 'category',
  },
  {
    id: 'src-1',
    tone: 'critical',
    eyebrow: 'Source',
    anchor: 'p2',
    title: 'Unsupported claim',
    body: '"The policy will impact over 50,000 workers." — could not be verified from attached sources.',
    action: 'Link source',
    targetPhrase: 'The policy will impact over 50,000 workers',
  },
  {
    id: 'att-1',
    tone: 'critical',
    eyebrow: 'Attribution',
    anchor: 'p4',
    title: 'Missing attribution',
    body: 'Paragraph 4 contains a quote without an identified speaker.',
    action: 'Add attribution',
    targetPhrase: 'This decision was made without consulting workers.',
  },
]

const CATEGORY_OPTIONS = [
  'Politics', 'Economy', 'Society', 'Culture', 'Sports', 'World', 'Opinion',
  'Business', 'Markets', 'Technology', 'Science', 'Health', 'Education',
  'Environment', 'Climate', 'Energy', 'Agriculture', 'Crime', 'Justice',
  'Defense', 'Foreign Affairs', 'Local', 'Kathmandu', 'Lalitpur', 'Birgunj',
  'Entertainment', 'Film', 'Music', 'Books', 'Travel', 'Food', 'Lifestyle',
  'Religion', 'Festival', 'History', 'Photo Essay', 'Investigation',
  'Analysis', 'Profile', 'Obituary',
]

const PARAGRAPHS = [
  'काठमाडौँ — कीर्तिपुरस्थित राधास्वामी सत्संग होल्डिङ सेन्टरमा रहेका सुकुमवासीहरू खाना व्यवस्थापनको समन्वय नहुँदा सोमबार आक्रोशित भए । उनीहरू बिहान चियाको प्रतीक्षामा थिए । तर बिहान न चिया आयो, न खाना नै ।',
  'The policy will impact over 50,000 workers, according to early estimates, with small importers in the Birgunj corridor expected to absorb the heaviest near-term cost.',
  'बालबालिकाहरू बिहान ९ बजेपछि स्कुल जान ठिक्क परेको निकैबेरसम्म पनि खाना नआएपछि अभिभावकहरू आश्चर्यमा परे र क्यान्टिनतिर गए ।',
  '"This decision was made without consulting workers." — the statement could not be attributed to a named speaker.',
  'गृवानिकाहरू खाना कतिबेला आउँछ भनेर होल्डिङ सेन्टरमै रहेका नगर प्रहरीहरूसँग बुझ्न पनि गएका थिए ।',
]

const SOURCES = [
  { title: 'सरकारसँग जनताको मुख्य अपेक्षा के छ ?', domain: 'kathmandupost.com', initial: 'K' },
  { title: 'Import reform policy briefing — Q2 2026',     domain: 'commerce.gov.np',    initial: 'C' },
]

/* ───────────────────────────────────────────────────────────────────────────
   Root
   ─────────────────────────────────────────────────────────────────────────── */

type ReviewState = 'idle' | 'reviewing' | 'reviewed'

type Revision = {
  id: number
  timestamp: number
  resolvedIssues: Set<string>
  handledSuggestions: Set<CheckId>
  preHandledSuggestions: Set<CheckId>
}

type AnimAnchor = 'headline' | 'synopsis' | `p${number}`
type AnimState = { anchor: AnimAnchor; oldText: string; newText: string; phase: 'out' | 'in' } | null

type InlineMarker = {
  key: string
  anchor: 'headline' | 'synopsis' | `p${number}`
  phrase: string
  tone: 'suggestion' | 'critical'
  eyebrow: string
  summary: string
  actionLabel: string
  fix?: AutoFix
  changeIndex?: number
  issueId?: string
}

type PopoverState = {
  markerKey: string
  rect: { left: number; top: number; width: number; bottom: number }
} | null

const SUGGESTION_ORDER: CheckId[] = ['grammar', 'spelling', 'headline']

export default function NewsCreationV10() {
  const router = useRouter()

  const [reviewState, setReviewState] = useState<ReviewState>('idle')
  const [title, setTitle] = useState('व्यवस्थापन फेरबदलले सुकुमवासी होल्डिङ सेन्टरमा सोमबार तनाव, आजदेखि सहज')
  const [synopsis, setSynopsis] = useState('व्यवस्थापन फेरबदलले सुकुमवासी होल्डिङ सेन्टरमा सोमबार तनाव, आजदेखि सहज')
  const [paragraphs, setParagraphs] = useState(PARAGRAPHS)
  const [editingParagraph, setEditingParagraph] = useState<number | null>(null)

  const [revisions, setRevisions] = useState<Revision[]>([])
  const [activeRevIdx, setActiveRevIdx] = useState(0)
  const [, setTick] = useState(0)
  const animTimers = useRef<number[]>([])
  const [anim, setAnim] = useState<AnimState>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [primaryCategory, setPrimaryCategory] = useState<string | null>(null)
  const [popover, setPopover] = useState<PopoverState>(null)

  useEffect(() => {
    const t = window.setInterval(() => setTick(x => x + 1), 30_000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => () => {
    animTimers.current.forEach(id => window.clearTimeout(id))
  }, [])

  const isLive = activeRevIdx === revisions.length - 1
  const liveRevision = revisions[revisions.length - 1]
  const viewedRevision = revisions[activeRevIdx]

  const openIssues = useMemo(() => {
    if (!viewedRevision) return []
    return ISSUES.filter(i => !viewedRevision.resolvedIssues.has(i.id))
  }, [viewedRevision])

  const openSuggestions = useMemo(() => {
    if (!viewedRevision) return []
    return AUTO_FIXES.filter(
      f => f.variant === 'suggestion'
        && !viewedRevision.handledSuggestions.has(f.id)
        && !viewedRevision.preHandledSuggestions.has(f.id)
    )
  }, [viewedRevision])

  const appliedFixes = AUTO_FIXES.filter(f => f.variant === 'applied' || f.variant === 'verified')

  const inlineMarkers = useMemo<InlineMarker[]>(() => {
    if (reviewState !== 'reviewed' || !isLive) return []
    const markers: InlineMarker[] = []
    openSuggestions.forEach(fix => {
      fix.changes.forEach((c, ci) => {
        if (c.kind !== 'replace' || !c.where) return
        let anchor: 'headline' | 'synopsis' | `p${number}` | null = null
        if (c.where === 'Headline') anchor = 'headline'
        else if (c.where === 'Synopsis') anchor = 'synopsis'
        else {
          const m = c.where.match(/Paragraph (\d+)/)
          if (m) anchor = `p${parseInt(m[1], 10) - 1}` as `p${number}`
        }
        if (!anchor) return
        const eyebrow =
          fix.id === 'spelling' ? 'Spelling suggestion'
          : fix.id === 'grammar' ? 'Grammar'
          : fix.id === 'headline' ? 'Headline'
          : fix.id === 'synopsis' ? 'Synopsis'
          : fix.label
        markers.push({
          key: `${fix.id}-${ci}`,
          anchor,
          phrase: c.before,
          tone: 'suggestion',
          eyebrow,
          summary: fix.detail || fix.label,
          actionLabel: 'Accept',
          fix,
          changeIndex: ci,
        })
      })
    })
    openIssues.forEach(issue => {
      if (!issue.targetPhrase) return
      if (issue.anchor === 'headline' || issue.anchor === 'metadata') return
      markers.push({
        key: `issue-${issue.id}`,
        anchor: issue.anchor,
        phrase: issue.targetPhrase,
        tone: 'critical',
        eyebrow: issue.eyebrow,
        summary: issue.title,
        actionLabel: issue.action,
        issueId: issue.id,
      })
    })
    return markers
  }, [openSuggestions, openIssues, reviewState, isLive])

  useEffect(() => {
    if (!popover) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-berry-popover]') || target.closest('[data-berry-marker]')) return
      setPopover(null)
    }
    const onScroll = () => setPopover(null)
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [popover])

  useEffect(() => { setPopover(null) }, [anim])

  const pendingCount = openIssues.length + openSuggestions.length
  const sendable = reviewState === 'reviewed' && isLive && pendingCount === 0

  function startReview() {
    if (reviewState === 'reviewing') return
    setReviewState('reviewing')
    window.setTimeout(() => {
      setRevisions(prev => {
        const nextId = prev.length + 1
        const preHandled = new Set<CheckId>()
        // Each new revision: Berry has auto-resolved one more suggestion than the prior.
        // Revision 1 → none pre-handled; Revision 2 → 1 pre-handled; etc.
        for (let i = 0; i < prev.length && i < SUGGESTION_ORDER.length; i++) {
          preHandled.add(SUGGESTION_ORDER[i])
        }
        const newRev: Revision = {
          id: nextId,
          timestamp: Date.now(),
          resolvedIssues: new Set(),
          handledSuggestions: new Set(),
          preHandledSuggestions: preHandled,
        }
        const next = [...prev, newRev]
        setActiveRevIdx(next.length - 1)
        return next
      })
      setReviewState('reviewed')
    }, 1300)
  }

  function resolveIssue(id: string) {
    if (!isLive) return
    setRevisions(prev => {
      const next = [...prev]
      const last = next[next.length - 1]
      const resolved = new Set(last.resolvedIssues); resolved.add(id)
      next[next.length - 1] = { ...last, resolvedIssues: resolved }
      return next
    })
  }

  function runAcceptAnimation(anchor: AnimAnchor, oldText: string, newText: string, commit: () => void) {
    // Phase 1: blur/fade out the old text.
    setAnim({ anchor, oldText, newText, phase: 'out' })
    const t1 = window.setTimeout(() => {
      // Commit the underlying state, then run the shimmer-in phase.
      commit()
      setAnim({ anchor, oldText, newText, phase: 'in' })
      const t2 = window.setTimeout(() => setAnim(null), 700)
      animTimers.current.push(t2)
    }, 320)
    animTimers.current.push(t1)
  }

  function acceptSuggestion(fix: AutoFix, overrideAfter?: string) {
    if (!isLive) return

    const markHandled = () => setRevisions(prev => {
      const next = [...prev]
      const last = next[next.length - 1]
      const handled = new Set(last.handledSuggestions); handled.add(fix.id)
      next[next.length - 1] = { ...last, handledSuggestions: handled }
      return next
    })

    if (fix.id === 'headline') {
      const headlineChange = fix.changes.find(c => c.kind === 'replace') as
        Extract<FixChange, { kind: 'replace' }> | undefined
      if (headlineChange) {
        const target = overrideAfter ?? headlineChange.after
        runAcceptAnimation('headline', title, target, () => {
          setTitle(target)
          markHandled()
        })
        return
      }
    } else if (fix.id === 'synopsis') {
      const synopsisChange = fix.changes.find(c => c.kind === 'replace') as
        Extract<FixChange, { kind: 'replace' }> | undefined
      if (synopsisChange) {
        const target = overrideAfter ?? synopsisChange.after
        runAcceptAnimation('synopsis', synopsis, target, () => {
          setSynopsis(target)
          markHandled()
        })
        return
      }
    } else if (fix.id === 'grammar' || fix.id === 'spelling') {
      // Find the first paragraph-targeted change to animate; apply all on commit.
      const firstP = fix.changes.find(c => {
        if (c.kind !== 'replace' || !c.where) return false
        return /Paragraph (\d+)/.test(c.where)
      }) as Extract<FixChange, { kind: 'replace' }> | undefined

      const applyAll = () => {
        const next = [...paragraphs]
        fix.changes.forEach(c => {
          if (c.kind !== 'replace' || !c.where) return
          const m = c.where.match(/Paragraph (\d+)/)
          if (!m) return
          const idx = parseInt(m[1], 10) - 1
          if (idx >= 0 && idx < next.length) {
            next[idx] = next[idx].replace(c.before, c.after)
          }
        })
        setParagraphs(next)
        markHandled()
      }

      if (firstP && firstP.where) {
        const m = firstP.where.match(/Paragraph (\d+)/)!
        const idx = parseInt(m[1], 10) - 1
        const anchor = `p${idx}` as AnimAnchor
        const oldP = paragraphs[idx]
        const newP = oldP.replace(firstP.before, firstP.after)
        runAcceptAnimation(anchor, oldP, newP, applyAll)
        return
      }
      applyAll()
      return
    }
    markHandled()
  }

  function toggleCategory(issueId: string, value: string) {
    setCategories(prev => {
      const has = prev.includes(value)
      if (has) {
        const next = prev.filter(v => v !== value)
        if (primaryCategory === value) {
          setPrimaryCategory(next[0] ?? null)
        }
        return next
      }
      const next = [...prev, value]
      if (!primaryCategory) setPrimaryCategory(value)
      return next
    })
    void issueId
  }

  function setPrimary(value: string) {
    setPrimaryCategory(value)
  }

  function removeCategory(value: string) {
    setCategories(prev => {
      const next = prev.filter(v => v !== value)
      if (primaryCategory === value) setPrimaryCategory(next[0] ?? null)
      return next
    })
  }

  useEffect(() => {
    if (primaryCategory && reviewState === 'reviewed' && isLive) {
      const catIssue = ISSUES.find(i => i.kind === 'category')
      if (catIssue && !viewedRevision?.resolvedIssues.has(catIssue.id)) {
        resolveIssue(catIssue.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCategory])

  function acceptFromMarker(marker: InlineMarker, overrideAfter?: string) {
    setPopover(null)
    if (marker.fix) acceptSuggestion(marker.fix, overrideAfter)
  }

  function openMarkerPopover(markerKey: string, el: HTMLElement) {
    const r = el.getBoundingClientRect()
    setPopover({ markerKey, rect: { left: r.left + r.width / 2, top: r.top, bottom: r.bottom, width: r.width } })
  }

  function rejectSuggestion(fix: AutoFix) {
    if (!isLive) return
    setRevisions(prev => {
      const next = [...prev]
      const last = next[next.length - 1]
      const handled = new Set(last.handledSuggestions); handled.add(fix.id)
      next[next.length - 1] = { ...last, handledSuggestions: handled }
      return next
    })
  }

  function sendToEditor() {
    if (!sendable) return
    // eslint-disable-next-line no-console
    console.log('[NewsCreationV10] Sent to editor')
  }

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden"
      style={{
        fontFamily: 'var(--font-urbanist)',
        background: `
          radial-gradient(80% 60% at 50% 0%, #eaf1fb 0%, #dde7f3 55%, #cfdcec 100%)
        `,
      }}
    >
      <V10Styles />
      <CollapsedSidebar />

      {/* Main editor card */}
      <main className="flex-1 mt-[14px] mb-[14px] bg-white border border-[#e6ecf4] rounded-[24px] shadow-[0px_24px_60px_-20px_rgba(31,57,99,0.12),0px_2px_6px_-2px_rgba(31,57,99,0.06)] overflow-hidden flex flex-col min-w-0">

        {/* Header */}
        <header className="border-b border-[#eef2f7] flex items-center justify-between px-6 h-[68px] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={16} strokeWidth={1.75} className="text-slate-700" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center justify-center size-7 rounded-[10px] bg-[#0f172a] text-white text-[12px] font-bold tracking-tight">
                S
              </span>
              <h1 className="text-[17px] font-semibold leading-6 text-[#0f172a] tracking-tight truncate" style={{ fontFamily: 'var(--font-urbanist)' }}>
                News Composer
              </h1>
              <span
                className="hidden sm:inline-flex items-center gap-1 px-2 py-[3px] rounded-full bg-[#FFE94A] text-[#1a1a1a] text-[10.5px] font-bold uppercase tracking-[0.12em] leading-none"
                style={{ fontFamily: 'var(--font-urbanist)' }}
              >
                Draft
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GhostBtn>Save as Draft</GhostBtn>
            <OutlineBtn>Preview</OutlineBtn>
            <PrimaryBtn onClick={startReview}>
              {reviewState === 'idle' ? 'Push for Review' :
               reviewState === 'reviewing' ? 'Reviewing…' :
               'Re-run Review'}
            </PrimaryBtn>
          </div>
        </header>

        {/* Secondary row */}
        <div className="flex items-center justify-end gap-4 px-4 pt-[14px] pb-2 shrink-0">
          <div className="flex items-center gap-2 text-[14px] text-[#0f172a]" style={{ fontFamily: 'var(--font-urbanist)' }}>
            <span>1,243 words</span>
            <span className="size-1.5 rounded-full bg-slate-300" />
            <span>1,132 characters</span>
          </div>
          <OutlineBtn small><Sparkles size={14} strokeWidth={2} className="text-[#F04B2A]" />Enable Focus Mode</OutlineBtn>
          <OutlineBtn small><FileText size={14} strokeWidth={1.75} className="text-slate-700" />Manage details</OutlineBtn>
        </div>

        {/* Article */}
        <article className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto max-w-[820px] px-[48px] py-[28px] flex flex-col gap-7">

            <FieldGroup
              eyebrow="Headline"
              helper="Aim for 7–12 words. This is what readers see first."
              counter={`${title.length} / 120`}
            >
              {anim && anim.anchor === 'headline' ? (
                <div
                  className={`w-full text-[28px] leading-[1.2] font-bold tracking-[-0.02em] text-[#0f172a] ${
                    anim.phase === 'out' ? 'apple-text-out' : 'apple-text-in apple-shimmer'
                  }`}
                  style={{ fontFamily: 'var(--font-urbanist)' }}
                  aria-hidden
                >
                  {anim.phase === 'out' ? anim.oldText : anim.newText}
                </div>
              ) : inlineMarkers.some(m => m.anchor === 'headline') ? (
                <div
                  className="w-full text-[24px] leading-[1.3] font-semibold text-[#0f172a]"
                  style={{ fontFamily: 'var(--font-urbanist)' }}
                >
                  <MarkedText
                    text={title}
                    markers={inlineMarkers.filter(m => m.anchor === 'headline')}
                    activeKey={popover?.markerKey}
                    onMarkerClick={openMarkerPopover}
                  />
                </div>
              ) : (
                <textarea
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  rows={2}
                  className="w-full resize-none bg-transparent outline-none text-[28px] leading-[1.2] font-bold tracking-[-0.02em] text-[#0f172a]"
                  style={{ fontFamily: 'var(--font-urbanist)' }}
                />
              )}
            </FieldGroup>

            <FieldGroup eyebrow="Synopsis" collapsible>
              {anim && anim.anchor === 'synopsis' ? (
                <p
                  className={`text-[14px] leading-5 text-[#0f172a] ${
                    anim.phase === 'out' ? 'apple-text-out' : 'apple-text-in apple-shimmer'
                  }`}
                  style={{ fontFamily: 'var(--font-urbanist)' }}
                  aria-hidden
                >
                  {anim.phase === 'out' ? anim.oldText : anim.newText}
                </p>
              ) : inlineMarkers.some(m => m.anchor === 'synopsis') ? (
                <p className="text-[14px] leading-5 text-[#0f172a]" style={{ fontFamily: 'var(--font-urbanist)' }}>
                  <MarkedText
                    text={synopsis}
                    markers={inlineMarkers.filter(m => m.anchor === 'synopsis')}
                    activeKey={popover?.markerKey}
                    onMarkerClick={openMarkerPopover}
                  />
                </p>
              ) : (
                <textarea
                  value={synopsis}
                  onChange={e => setSynopsis(e.target.value)}
                  rows={2}
                  className="w-full resize-none bg-transparent outline-none text-[14px] leading-5 text-[#0f172a]"
                  style={{ fontFamily: 'var(--font-urbanist)' }}
                />
              )}
            </FieldGroup>

            <FieldGroup eyebrow="Cover Image" noBorder>
              <CoverImage />
            </FieldGroup>

            <FieldGroup eyebrow="Description" noBorder>
              <div className="flex flex-col gap-3 pt-1">
                {paragraphs.map((p, i) => {
                  const isAnim = anim && anim.anchor === `p${i}`
                  const text = isAnim
                    ? (anim!.phase === 'out' ? anim!.oldText : anim!.newText)
                    : p
                  const animClass = isAnim
                    ? (anim!.phase === 'out' ? 'apple-text-out' : 'apple-text-in apple-shimmer')
                    : ''
                  const pMarkers = inlineMarkers.filter(m => m.anchor === `p${i}`)
                  const isEditing = editingParagraph === i
                  if (isEditing && !isAnim) {
                    return (
                      <AutoTextarea
                        key={i}
                        value={p}
                        onChange={(v) => {
                          setParagraphs(prev => {
                            const next = [...prev]
                            next[i] = v
                            return next
                          })
                        }}
                        onBlur={() => setEditingParagraph(null)}
                        autoFocus
                      />
                    )
                  }
                  return (
                    <p
                      key={i}
                      className={`text-[16.5px] leading-[1.7] text-[#1e293b] cursor-text ${animClass}`}
                      style={{ fontFamily: 'var(--font-urbanist)' }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('[data-berry-marker]')) return
                        if (isAnim) return
                        setEditingParagraph(i)
                      }}
                    >
                      {isAnim || pMarkers.length === 0 ? text : (
                        <MarkedText
                          text={text}
                          markers={pMarkers}
                          activeKey={popover?.markerKey}
                          onMarkerClick={openMarkerPopover}
                        />
                      )}
                    </p>
                  )
                })}
              </div>
            </FieldGroup>

            <div className="h-32" />
          </div>
        </article>
      </main>

      {/* Persistent Berry Review panel */}
      <BerryReviewPanel
        reviewState={reviewState}
        openIssues={openIssues}
        openSuggestions={openSuggestions}
        appliedFixes={appliedFixes}
        pendingCount={pendingCount}
        sendable={sendable}
        revisions={revisions}
        activeRevIdx={activeRevIdx}
        isLive={isLive}
        categories={categories}
        primaryCategory={primaryCategory}
        onSelectRevision={setActiveRevIdx}
        onStartReview={startReview}
        onResolveIssue={resolveIssue}
        onToggleCategory={toggleCategory}
        onSetPrimaryCategory={setPrimary}
        onRemoveCategory={removeCategory}
        onAcceptSuggestion={acceptSuggestion}
        onRejectSuggestion={rejectSuggestion}
        onSend={sendToEditor}
      />

      {popover && (() => {
        const marker = inlineMarkers.find(m => m.key === popover.markerKey)
        if (!marker) return null
        const useVariations =
          (marker.fix?.id === 'headline' || marker.fix?.id === 'synopsis') &&
          marker.fix &&
          marker.changeIndex !== undefined
        if (useVariations) {
          const change = marker.fix!.changes[marker.changeIndex!]
          if (change.kind === 'replace') {
            const options = [change.after, ...(change.alternatives ?? [])]
            return (
              <VariationPopover
                rect={popover.rect}
                eyebrow={marker.eyebrow}
                options={options}
                onPick={(val) => acceptFromMarker(marker, val)}
                onClose={() => setPopover(null)}
              />
            )
          }
        }
        return (
          <InlineMarkerPopover
            rect={popover.rect}
            eyebrow={marker.eyebrow}
            summary={marker.summary}
            actionLabel={marker.actionLabel}
            tone={marker.tone}
            disabled={marker.tone === 'critical' && !marker.fix}
            onAction={() => acceptFromMarker(marker)}
            onClose={() => setPopover(null)}
          />
        )
      })()}
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Berry Review Panel — persistent right column
   ─────────────────────────────────────────────────────────────────────────── */

function BerryReviewPanel({
  reviewState, openIssues, openSuggestions, appliedFixes, pendingCount, sendable,
  revisions, activeRevIdx, isLive, categories, primaryCategory, onSelectRevision,
  onStartReview, onResolveIssue, onToggleCategory, onSetPrimaryCategory, onRemoveCategory,
  onAcceptSuggestion, onRejectSuggestion, onSend,
}: {
  reviewState: ReviewState
  openIssues: Issue[]
  openSuggestions: AutoFix[]
  appliedFixes: AutoFix[]
  pendingCount: number
  sendable: boolean
  revisions: Revision[]
  activeRevIdx: number
  isLive: boolean
  categories: string[]
  primaryCategory: string | null
  onSelectRevision: (idx: number) => void
  onStartReview: () => void
  onResolveIssue: (id: string) => void
  onToggleCategory: (issueId: string, value: string) => void
  onSetPrimaryCategory: (value: string) => void
  onRemoveCategory: (value: string) => void
  onAcceptSuggestion: (f: AutoFix) => void
  onRejectSuggestion: (f: AutoFix) => void
  onSend: () => void
}) {
  return (
    <aside className="shrink-0 mt-[14px] mr-[14px] mb-[14px] ml-[14px] w-[390px] bg-white border border-[#e6ecf4] rounded-[24px] shadow-[0px_24px_60px_-20px_rgba(31,57,99,0.12),0px_2px_6px_-2px_rgba(31,57,99,0.06)] flex flex-col overflow-hidden">

      {/* Panel header */}
      <div className="border-b border-[#eef2f7] flex items-center gap-2.5 h-[68px] px-5 shrink-0">
        <span className="relative shrink-0 inline-flex items-center justify-center size-8 rounded-[11px] bg-[#0f172a] text-[#FFE94A]">
          <Sparkles size={15} strokeWidth={2.25} className="berry-sparkle" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-5 text-[#0f172a] tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            Berry Review
          </p>
          <p className="text-[11.5px] text-[#64748b] leading-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            {reviewState === 'idle' ? 'Not yet reviewed' :
             reviewState === 'reviewing' ? 'Reviewing your story' :
             pendingCount > 0 ? `${pendingCount} pending` : 'All clear'}
          </p>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto">
        {revisions.length > 0 && (
          <RevisionHistoryStrip
            revisions={revisions}
            activeRevIdx={activeRevIdx}
            onSelect={onSelectRevision}
          />
        )}
        {reviewState === 'idle' && <EmptyState onStart={onStartReview} />}
        {reviewState === 'reviewing' && <ReviewingState />}
        {reviewState === 'reviewed' && (
          <ReviewedContent
            openIssues={openIssues}
            openSuggestions={openSuggestions}
            appliedFixes={appliedFixes}
            pendingCount={pendingCount}
            sendable={sendable}
            readOnly={!isLive}
            categories={categories}
            primaryCategory={primaryCategory}
            onResolveIssue={onResolveIssue}
            onToggleCategory={onToggleCategory}
            onSetPrimaryCategory={onSetPrimaryCategory}
            onRemoveCategory={onRemoveCategory}
            onAcceptSuggestion={onAcceptSuggestion}
            onRejectSuggestion={onRejectSuggestion}
            onSend={onSend}
          />
        )}
      </div>
    </aside>
  )
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="px-5 py-10 flex flex-col items-center text-center gap-4 berry-fade-in">
      <div className="size-16 rounded-[20px] bg-[#FFE94A] inline-flex items-center justify-center shadow-[inset_0_-2px_0_rgba(0,0,0,0.05)]">
        <Sparkles size={24} strokeWidth={2} className="text-[#0f172a]" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-medium text-[#0f172a]" style={{ fontFamily: 'var(--font-urbanist)' }}>
          Berry hasn't reviewed yet
        </p>
        <p className="text-[12.5px] leading-[1.55] text-slate-500 max-w-[260px]" style={{ fontFamily: 'var(--font-urbanist)' }}>
          Push for review when you're ready. Berry will check your story and surface anything that needs your attention here.
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="relative inline-flex items-center justify-center gap-1.5 mt-1 min-h-[38px] px-5 rounded-[12px] overflow-hidden hover:brightness-105 active:scale-[0.98] transition-[filter,transform]"
      >
        <span aria-hidden className="absolute inset-0 bg-[#F04B2A] rounded-[12px]" />
        <span aria-hidden className="absolute inset-0 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_-6px_rgba(240,75,42,0.45)]" />
        <span className="relative text-[13px] font-semibold text-white tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
          Push for Review
        </span>
      </button>
    </div>
  )
}

function ReviewingState() {
  return (
    <div className="px-5 py-10 flex flex-col items-center text-center gap-4 berry-fade-in">
      <span className="relative inline-flex items-center justify-center size-16 rounded-[20px] bg-[#FFF4B0]">
        <span aria-hidden className="absolute inset-0 rounded-[20px] border-[2px] border-transparent border-t-[#F04B2A] animate-spin" />
        <Sparkles size={22} strokeWidth={2} className="text-[#0f172a] berry-sparkle" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-medium text-[#0f172a]" style={{ fontFamily: 'var(--font-urbanist)' }}>
          Berry is reviewing…
        </p>
        <p className="text-[12.5px] leading-[1.55] text-slate-500 max-w-[260px]" style={{ fontFamily: 'var(--font-urbanist)' }}>
          Checking grammar, sources, attribution, and publication readiness.
        </p>
      </div>
    </div>
  )
}

function ReviewedContent({
  openIssues, openSuggestions, appliedFixes, pendingCount, sendable, readOnly,
  categories, primaryCategory,
  onResolveIssue, onToggleCategory, onSetPrimaryCategory, onRemoveCategory,
  onAcceptSuggestion, onRejectSuggestion, onSend,
}: {
  openIssues: Issue[]
  openSuggestions: AutoFix[]
  appliedFixes: AutoFix[]
  pendingCount: number
  sendable: boolean
  readOnly: boolean
  categories: string[]
  primaryCategory: string | null
  onResolveIssue: (id: string) => void
  onToggleCategory: (issueId: string, value: string) => void
  onSetPrimaryCategory: (value: string) => void
  onRemoveCategory: (value: string) => void
  onAcceptSuggestion: (f: AutoFix) => void
  onRejectSuggestion: (f: AutoFix) => void
  onSend: () => void
}) {
  return (
    <div className="flex flex-col berry-fade-in">

      {readOnly && (
        <div className="mx-4 mt-3 mb-0 rounded-[10px] border border-slate-200 bg-slate-50/80 px-3 py-2 text-[11.5px] text-slate-500 leading-[1.45]" style={{ fontFamily: 'var(--font-urbanist)' }}>
          Viewing an earlier review. Switch to the latest revision to make changes.
        </div>
      )}

      {/* Top status */}
      <StatusBlock pendingCount={pendingCount} sendable={sendable} readOnly={readOnly} onSend={onSend} />

      {/* Needs Attention */}
      {openIssues.length > 0 && (
        <Section title="Needs Attention" count={openIssues.length}>
          {openIssues.map(issue => (
            <NeedsAttentionCard
              key={issue.id}
              issue={issue}
              readOnly={readOnly}
              categories={categories}
              primaryCategory={primaryCategory}
              onResolve={() => onResolveIssue(issue.id)}
              onToggleCategory={(v) => onToggleCategory(issue.id, v)}
              onSetPrimaryCategory={onSetPrimaryCategory}
              onRemoveCategory={onRemoveCategory}
            />
          ))}
        </Section>
      )}

      {/* Suggestions */}
      {openSuggestions.length > 0 && (
        <Section title="Suggestions" count={openSuggestions.length}>
          {openSuggestions.map(fix => (
            <SuggestionCard
              key={fix.id}
              fix={fix}
              readOnly={readOnly}
              onAccept={() => onAcceptSuggestion(fix)}
              onReject={() => onRejectSuggestion(fix)}
            />
          ))}
        </Section>
      )}

      {/* Fixed by Berry */}
      <FixedByBerry fixes={appliedFixes} />

      {/* Sources */}
      <SourcesBlock />

      <div className="h-6" />
    </div>
  )
}

function StatusBlock({ pendingCount, sendable, readOnly, onSend }: { pendingCount: number; sendable: boolean; readOnly?: boolean; onSend: () => void }) {
  const ready = pendingCount === 0
  void readOnly
  return (
    <div className="px-4 pt-4 pb-4 border-b border-[#eef2f7]">
      <div className="rounded-[18px] border border-[#e6ecf4] bg-[#f7faff] px-4 py-4 flex flex-col gap-3.5">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex items-center justify-center size-9 rounded-[12px] shrink-0 ${
            ready
              ? 'bg-[#FFE94A] text-[#0f172a]'
              : 'bg-[#FFE94A] text-[#0f172a]'
          }`}>
            {ready
              ? <Check size={16} strokeWidth={2.75} />
              : <span className="text-[14px] font-bold leading-none tracking-tight">{pendingCount}</span>}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold leading-[1.3] text-[#0f172a] tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
              {ready
                ? 'Ready for Editorial Review'
                : `${pendingCount} ${pendingCount === 1 ? 'decision needs' : 'decisions need'} attention`}
            </p>
            <p className="mt-0.5 text-[12px] leading-[1.45] text-[#64748b]" style={{ fontFamily: 'var(--font-urbanist)' }}>
              Estimated review time · 30 sec
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!sendable}
          onClick={onSend}
          className="relative inline-flex items-center justify-center gap-1.5 w-full min-h-[40px] rounded-[12px] overflow-hidden transition-[filter,opacity,transform] disabled:opacity-45 disabled:cursor-not-allowed enabled:hover:brightness-105 enabled:active:scale-[0.99]"
        >
          <span aria-hidden className={`absolute inset-0 rounded-[12px] ${
            sendable
              ? 'bg-[#F04B2A]'
              : 'bg-[#0f172a]'
          }`} />
          <span aria-hidden className={`absolute inset-0 rounded-[12px] ${sendable ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_24px_-8px_rgba(240,75,42,0.5)]' : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]'}`} />
          <span className="relative text-[13.5px] font-semibold text-white tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
            Send to Editor
          </span>
          <ArrowRight size={14} strokeWidth={2.5} className="relative text-white" />
        </button>
      </div>
    </div>
  )
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-4 pb-1 flex flex-col gap-2.5">
      <div className="flex items-baseline gap-2 px-0.5">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          style={{ fontFamily: 'var(--font-urbanist)' }}
        >
          {title}
        </span>
        {typeof count === 'number' && (
          <span className="text-[10.5px] font-medium text-slate-400" style={{ fontFamily: 'var(--font-urbanist)' }}>
            · {count}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function NeedsAttentionCard({
  issue, readOnly, categories, primaryCategory,
  onResolve, onToggleCategory, onSetPrimaryCategory, onRemoveCategory,
}: {
  issue: Issue
  readOnly?: boolean
  categories: string[]
  primaryCategory: string | null
  onResolve: () => void
  onToggleCategory: (value: string) => void
  onSetPrimaryCategory: (value: string) => void
  onRemoveCategory: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [catQuery, setCatQuery] = useState('')
  const isCategory = issue.kind === 'category'

  const filteredCats = CATEGORY_OPTIONS.filter(c =>
    c.toLowerCase().includes(catQuery.trim().toLowerCase())
  )

  return (
    <div className="rounded-[16px] border border-[#e6ecf4] bg-white overflow-hidden hover:border-[#cfd9e8] hover:shadow-[0_4px_14px_-4px_rgba(31,57,99,0.08)] transition-[border-color,box-shadow]">
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 size-[7px] rounded-full bg-rose-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              style={{ fontFamily: 'var(--font-urbanist)' }}
            >
              {issue.eyebrow}
            </span>
            <p
              className="mt-0.5 text-[13.5px] leading-[1.4] font-medium text-[#0f172a]"
              style={{ fontFamily: 'var(--font-urbanist)' }}
            >
              {issue.title}
            </p>
            {issue.body && (
              <p className="mt-1 text-[12px] leading-[1.5] text-[#64748b]" style={{ fontFamily: 'var(--font-urbanist)' }}>
                {issue.body}
              </p>
            )}
          </div>
        </div>

        {!open && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#0f172a] text-white text-[12px] font-semibold hover:brightness-110 transition-[filter] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={{ fontFamily: 'var(--font-urbanist)' }}
            >
              {issue.action}
            </button>
          </div>
        )}

        {open && isCategory && (
          <div className="flex flex-col gap-2 berry-row-in">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => {
                  const isPrimary = primaryCategory === c
                  return (
                    <span
                      key={c}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-[8px] text-[11.5px] font-medium border ${
                        isPrimary
                          ? 'border-[#0f172a] bg-[#0f172a] text-white'
                          : 'border-slate-200 bg-white text-[#0f172a]'
                      }`}
                      style={{ fontFamily: 'var(--font-urbanist)' }}
                    >
                      <button
                        type="button"
                        title={isPrimary ? 'Primary category' : 'Set as primary'}
                        disabled={readOnly}
                        onClick={() => onSetPrimaryCategory(c)}
                        className={`leading-none ${isPrimary ? 'text-amber-300' : 'text-slate-400 hover:text-amber-500'}`}
                      >
                        {isPrimary ? '★' : '☆'}
                      </button>
                      <span>{c}</span>
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => onRemoveCategory(c)}
                        className={`leading-none ml-0.5 ${isPrimary ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                        aria-label={`Remove ${c}`}
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <input
              type="text"
              value={catQuery}
              onChange={e => setCatQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full px-3 py-2 rounded-[8px] border border-slate-200 bg-white text-[12.5px] text-[#0f172a] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/15 transition-[box-shadow,border-color]"
              style={{ fontFamily: 'var(--font-urbanist)' }}
            />
            <div className="max-h-[240px] overflow-y-auto rounded-[8px] border border-slate-200 bg-white">
              {filteredCats.length === 0 && (
                <p className="px-3 py-3 text-[12px] text-slate-400" style={{ fontFamily: 'var(--font-urbanist)' }}>
                  No matches
                </p>
              )}
              {filteredCats.map(opt => {
                const selected = categories.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onToggleCategory(opt)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-[12.5px] border-b border-slate-100 last:border-b-0 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed ${
                      selected ? 'text-[#0f172a] font-medium' : 'text-slate-700'
                    }`}
                    style={{ fontFamily: 'var(--font-urbanist)' }}
                  >
                    <span>{opt}</span>
                    {selected && <Check size={12} strokeWidth={2.5} className="text-emerald-600" />}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 tabular-nums" style={{ fontFamily: 'var(--font-urbanist)' }}>
                {categories.length} selected
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[12px] font-medium text-slate-500 hover:text-slate-900 px-2.5 py-1.5 transition-colors"
                style={{ fontFamily: 'var(--font-urbanist)' }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {open && !isCategory && (
          <div className="flex flex-col gap-2 berry-row-in">
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={
                issue.id === 'src-1'
                  ? 'Paste a source URL or DOI…'
                  : 'Name the speaker (e.g., गीता लामा)'
              }
              autoFocus
              className="w-full px-3 py-2 rounded-[10px] border border-slate-200 bg-slate-50/60 text-[13px] text-[#0f172a] outline-none focus:border-[#0787ff] focus:ring-2 focus:ring-[#0787ff]/15 transition-[box-shadow,border-color]"
              style={{ fontFamily: 'var(--font-urbanist)' }}
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => { setOpen(false); setValue('') }}
                className="text-[12px] font-medium text-slate-500 hover:text-slate-900 px-2.5 py-1.5 transition-colors"
                style={{ fontFamily: 'var(--font-urbanist)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onResolve}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#0f172a] text-white text-[12px] font-semibold hover:brightness-110 transition-[filter]"
                style={{ fontFamily: 'var(--font-urbanist)' }}
              >
                Resolve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SuggestionCard({ fix, readOnly, onAccept, onReject }: { fix: AutoFix; readOnly?: boolean; onAccept: () => void; onReject: () => void }) {
  const [previewing, setPreviewing] = useState(false)
  const firstReplace = fix.changes.find(c => c.kind === 'replace') as
    Extract<FixChange, { kind: 'replace' }> | undefined
  const extraCount = Math.max(0, fix.changes.filter(c => c.kind === 'replace').length - 1)

  return (
    <div className="rounded-[16px] border border-[#e6ecf4] bg-white overflow-hidden hover:border-[#cfd9e8] hover:shadow-[0_4px_14px_-4px_rgba(31,57,99,0.08)] transition-[border-color,box-shadow]">
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <span className="mt-1 inline-flex items-center justify-center size-[20px] rounded-full bg-[#FFE94A] text-[#0f172a] shrink-0">
            <Sparkles size={11} strokeWidth={2.5} />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[13.5px] leading-[1.4] font-medium text-[#0f172a]"
              style={{ fontFamily: 'var(--font-urbanist)' }}
            >
              {fix.label}
            </p>
            {fix.detail && (
              <p className="mt-0.5 text-[12px] leading-[1.5] text-[#64748b]" style={{ fontFamily: 'var(--font-urbanist)' }}>
                {fix.detail}
              </p>
            )}
          </div>
        </div>

        {!previewing && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-white border border-slate-200 text-[12px] font-medium text-[#0f172a] hover:bg-slate-50 transition-colors"
              style={{ fontFamily: 'var(--font-urbanist)' }}
            >
              Preview Suggestion
            </button>
          </div>
        )}

        {previewing && firstReplace && (
          <div className="flex flex-col gap-2 berry-row-in">
            {firstReplace.where && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400" style={{ fontFamily: 'var(--font-urbanist)' }}>
                {firstReplace.where}
              </span>
            )}
            <div className="flex flex-col gap-1.5">
              <div className="rounded-[8px] border border-slate-150 bg-slate-50/70 px-2.5 py-1.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-0.5" style={{ fontFamily: 'var(--font-urbanist)' }}>
                  Current
                </p>
                <p className="text-[12.5px] leading-[1.5] text-slate-700" style={{ fontFamily: 'var(--font-urbanist)' }}>
                  {firstReplace.before}
                </p>
              </div>
              <div className="rounded-[8px] border border-emerald-100 bg-emerald-50/60 px-2.5 py-1.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-700 mb-0.5" style={{ fontFamily: 'var(--font-urbanist)' }}>
                  Suggested
                </p>
                <p className="text-[12.5px] leading-[1.5] text-emerald-900" style={{ fontFamily: 'var(--font-urbanist)' }}>
                  {firstReplace.after}
                </p>
              </div>
              {extraCount > 0 && (
                <p className="text-[11px] text-slate-400 px-0.5" style={{ fontFamily: 'var(--font-urbanist)' }}>
                  + {extraCount} more similar {extraCount === 1 ? 'change' : 'changes'} in this group
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5 pt-0.5">
              <button
                type="button"
                disabled={readOnly}
                onClick={onReject}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                style={{ fontFamily: 'var(--font-urbanist)' }}
              >
                Reject
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={onAccept}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#0f172a] text-white text-[12px] font-semibold hover:brightness-110 transition-[filter] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                style={{ fontFamily: 'var(--font-urbanist)' }}
              >
                Accept
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FixedByBerry({ fixes }: { fixes: AutoFix[] }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="px-4 pt-4 pb-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-0.5 group"
      >
        <div className="flex items-baseline gap-2">
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            style={{ fontFamily: 'var(--font-urbanist)' }}
          >
            Fixed by Berry
          </span>
          <span className="text-[10.5px] font-medium text-slate-400" style={{ fontFamily: 'var(--font-urbanist)' }}>
            · {fixes.length}
          </span>
        </div>
        <ChevronRight
          size={12}
          strokeWidth={2}
          className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-2.5 rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 flex flex-col gap-1.5 berry-row-in">
          {fixes.map(fix => (
            <div key={fix.id} className="flex items-center gap-2.5 py-1">
              <span className="inline-flex items-center justify-center size-[16px] rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                <Check size={10} strokeWidth={2.75} />
              </span>
              <span className="text-[12.5px] text-[#0f172a] leading-[1.4]" style={{ fontFamily: 'var(--font-urbanist)' }}>
                {fix.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SourcesBlock() {
  return (
    <section className="px-4 pt-4 pb-1 flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between px-0.5">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-500"
            style={{ fontFamily: 'var(--font-urbanist)' }}
          >
            Sources
          </span>
          <span className="text-[10.5px] font-medium text-slate-400" style={{ fontFamily: 'var(--font-urbanist)' }}>
            · {SOURCES.length}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
          style={{ fontFamily: 'var(--font-urbanist)' }}
        >
          <Plus size={11} strokeWidth={2.25} /> Add
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {SOURCES.map((s, i) => (
          <SourceCard key={i} title={s.title} domain={s.domain} initial={s.initial} />
        ))}
      </div>
    </section>
  )
}

function SourceCard({ title, domain, initial }: { title: string; domain: string; initial: string }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40 transition-colors">
      <div className="size-7 rounded-[8px] bg-gradient-to-br from-sky-100 to-violet-100 inline-flex items-center justify-center text-[11.5px] font-semibold text-slate-700 shrink-0" style={{ fontFamily: 'var(--font-urbanist)' }}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium leading-[1.35] text-[#0f172a] truncate" style={{ fontFamily: 'var(--font-urbanist)' }}>
          {title}
        </p>
        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1" style={{ fontFamily: 'var(--font-urbanist)' }}>
          <Globe size={9} strokeWidth={2} className="opacity-70" />
          {domain}
        </p>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Article primitives
   ─────────────────────────────────────────────────────────────────────────── */

function FieldGroup({
  eyebrow, helper, counter, collapsible, noBorder, children,
}: {
  eyebrow: string
  helper?: string
  counter?: string
  collapsible?: boolean
  noBorder?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`relative flex flex-col gap-3 w-full ${noBorder ? '' : 'border-b border-[#eef2f7] pb-[18px]'}`}>
      <div className="flex items-center gap-2">
        <span
          className="text-[10.5px] font-bold leading-none uppercase tracking-[0.18em] text-[#94a3b8]"
          style={{ fontFamily: 'var(--font-urbanist)' }}
        >
          {eyebrow}
        </span>
        {collapsible && <ChevronDown size={14} strokeWidth={1.75} className="text-slate-500" />}
      </div>
      {children}
      {(helper || counter) && (
        <div className="flex items-center justify-between">
          {helper && <span className="text-[12px] leading-[14px] text-[#737373]" style={{ fontFamily: 'var(--font-urbanist)' }}>{helper}</span>}
          {counter && <span className="text-[12px] leading-[14px] text-[#4d4d56]" style={{ fontFamily: 'var(--font-urbanist)' }}>{counter}</span>}
        </div>
      )}
    </section>
  )
}

function CoverImage() {
  return (
    <div className="w-[310px] h-[178px] rounded-[10px] overflow-hidden border border-slate-300 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-200" />
      <div className="relative h-full flex items-end justify-start p-3">
        <span
          className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/95 px-2 py-1 rounded-md bg-black/30 backdrop-blur"
          style={{ fontFamily: 'var(--font-urbanist)' }}
        >
          Cover photo
        </span>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   Sidebar + Buttons + Styles
   ─────────────────────────────────────────────────────────────────────────── */

function CollapsedSidebar() {
  const [expanded, setExpanded] = useState(false)
  const items: { Icon: typeof LayoutDashboard; label: string }[] = [
    { Icon: LayoutDashboard,   label: 'Dashboard' },
    { Icon: MessageSquareText, label: 'Stories' },
    { Icon: MessageSquare,     label: 'Messages' },
    { Icon: ListChecks,        label: 'Tasks' },
    { Icon: Clock,             label: 'History' },
    { Icon: Layers,            label: 'Sections' },
    { Icon: Users,             label: 'Team' },
    { Icon: Wrench,            label: 'Tools' },
    { Icon: Settings,          label: 'Settings' },
  ]
  const footer: { Icon: typeof Newspaper; label: string }[] = [
    { Icon: Newspaper, label: 'Newsroom' },
    { Icon: SquarePen, label: 'Compose' },
  ]
  return (
    <nav
      className={`shrink-0 mt-[14px] mb-[14px] ml-[14px] mr-[14px] bg-white border border-[#e6ecf4] rounded-[20px] shadow-[0px_24px_60px_-20px_rgba(31,57,99,0.10),0px_2px_6px_-2px_rgba(31,57,99,0.04)] flex flex-col gap-4 ${expanded ? 'items-stretch px-3 py-5' : 'items-center px-3 py-5'} overflow-hidden`}
      style={{
        width: expanded ? 224 : 64,
        transition: 'width 260ms cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Brand row — click to toggle */}
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
            className="text-[15px] font-bold tracking-tight text-[#0f172a] whitespace-nowrap v10-side-fade"
            style={{ fontFamily: 'var(--font-urbanist)' }}
          >
            Snowberry
          </span>
        )}
      </button>

      <div className={`h-px bg-[#e6ecf4] ${expanded ? 'w-full' : 'w-8 mx-auto'}`} />

      {/* New / primary CTA */}
      <button
        type="button"
        className={`group inline-flex items-center gap-2.5 h-9 rounded-[12px] bg-[#F04B2A] shadow-[0px_8px_18px_-6px_rgba(240,75,42,0.45)] hover:brightness-105 transition-[filter] ${expanded ? 'justify-start px-2.5' : 'justify-center w-9 self-center'}`}
      >
        <Plus size={16} strokeWidth={2.5} className="text-white shrink-0" />
        {expanded && (
          <span
            className="text-[13px] font-semibold text-white tracking-tight v10-side-fade"
            style={{ fontFamily: 'var(--font-urbanist)' }}
          >
            New Story
          </span>
        )}
      </button>

      {/* Main items */}
      <div className="flex flex-col gap-1">
        {items.map(({ Icon, label }, i) => (
          <SidebarItem key={i} Icon={Icon} label={label} expanded={expanded} active={i === 1} />
        ))}
      </div>

      {/* Footer items */}
      <div className="mt-auto flex flex-col gap-1">
        {footer.map(({ Icon, label }, i) => (
          <SidebarItem key={i} Icon={Icon} label={label} expanded={expanded} />
        ))}
      </div>
    </nav>
  )
}

function SidebarItem({
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
          ? 'bg-[#f3f6fb] text-[#0f172a]'
          : 'text-[#94a3b8] hover:bg-[#f3f6fb] hover:text-[#0f172a]'
      }`}
    >
      <Icon size={18} strokeWidth={1.75} className="shrink-0" />
      {expanded && (
        <span
          className="text-[13px] font-medium tracking-tight whitespace-nowrap v10-side-fade"
          style={{ fontFamily: 'var(--font-urbanist)' }}
        >
          {label}
        </span>
      )}
    </button>
  )
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-3.5 rounded-[12px] text-[13.5px] font-semibold text-[#475569] hover:bg-[#f3f6fb] tracking-tight transition-colors"
      style={{ fontFamily: 'var(--font-urbanist)' }}
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
      className={`inline-flex items-center justify-center gap-1.5 ${small ? 'min-h-[30px] px-3 text-[12.5px]' : 'min-h-[36px] px-3.5 text-[13.5px]'} rounded-[12px] bg-white border border-[#e6ecf4] text-[#0f172a] font-semibold tracking-tight shadow-[0_1px_2px_0_rgba(31,57,99,0.04)] hover:bg-[#f7faff] transition-colors`}
      style={{ fontFamily: 'var(--font-urbanist)' }}
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
      className="relative inline-flex items-center justify-center gap-1.5 min-h-[36px] px-4 rounded-[12px] overflow-hidden hover:brightness-105 active:scale-[0.98] transition-[filter,transform]"
    >
      <span aria-hidden className="absolute inset-0 bg-[#F04B2A] rounded-[12px]" />
      <span aria-hidden className="absolute inset-0 pointer-events-none rounded-[12px] shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.28),0px_8px_20px_-6px_rgba(240,75,42,0.45)]" />
      <span className="relative inline-flex items-center gap-1.5 text-[13.5px] font-semibold leading-5 text-white tracking-tight" style={{ fontFamily: 'var(--font-urbanist)' }}>
        <Sparkles size={13} strokeWidth={2.25} />
        {children}
      </span>
    </button>
  )
}

function formatRelativeTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts)
  const sec = Math.floor(diff / 1000)
  if (sec < 30) return 'just now'
  if (sec < 90) return '1m ago'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

function RevisionHistoryStrip({
  revisions, activeRevIdx, onSelect,
}: {
  revisions: Revision[]
  activeRevIdx: number
  onSelect: (idx: number) => void
}) {
  const ordered = revisions.map((r, idx) => ({ r, idx })).slice().reverse()
  return (
    <div className="px-4 pt-3 pb-2 border-b border-slate-200/80">
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          style={{ fontFamily: 'var(--font-urbanist)' }}
        >
          History
        </span>
        <span className="text-[10px] font-medium text-slate-400" style={{ fontFamily: 'var(--font-urbanist)' }}>
          · {revisions.length}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {ordered.map(({ r, idx }) => {
          const active = idx === activeRevIdx
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(idx)}
              className={`inline-flex items-center gap-1.5 h-[24px] px-2 rounded-full border text-[11px] transition-colors ${
                active
                  ? 'bg-[#0f172a] border-[#0f172a] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
              style={{ fontFamily: 'var(--font-urbanist)' }}
              aria-pressed={active}
            >
              <span className="font-semibold">Review {r.id}</span>
              <span className={active ? 'text-white/70' : 'text-slate-400'}>·</span>
              <span className={active ? 'text-white/85' : 'text-slate-500'}>
                {formatRelativeTime(r.timestamp)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MarkedText({
  text, markers, activeKey, onMarkerClick,
}: {
  text: string
  markers: InlineMarker[]
  activeKey?: string
  onMarkerClick: (key: string, el: HTMLElement) => void
}) {
  type Seg = { start: number; end: number; marker: InlineMarker }
  const segs: Seg[] = []
  markers.forEach(m => {
    if (!m.phrase) return
    const idx = text.indexOf(m.phrase)
    if (idx < 0) return
    segs.push({ start: idx, end: idx + m.phrase.length, marker: m })
  })
  segs.sort((a, b) => a.start - b.start)
  // Drop overlaps (keep first)
  const filtered: Seg[] = []
  let lastEnd = -1
  for (const s of segs) {
    if (s.start >= lastEnd) { filtered.push(s); lastEnd = s.end }
  }
  if (filtered.length === 0) return <>{text}</>

  const out: React.ReactNode[] = []
  let cursor = 0
  filtered.forEach((s, i) => {
    if (s.start > cursor) out.push(<span key={`t-${i}`}>{text.slice(cursor, s.start)}</span>)
    const active = activeKey === s.marker.key
    const isSuggestion = s.marker.tone === 'suggestion'
    const cls = isSuggestion
      ? `cursor-pointer berry-marker-suggestion ${active ? 'berry-marker-suggestion-active' : ''}`
      : `cursor-pointer berry-marker-critical ${active ? 'berry-marker-critical-active' : ''}`
    out.push(
      <span
        key={`m-${i}`}
        data-berry-marker
        className={cls}
        onClick={e => onMarkerClick(s.marker.key, e.currentTarget as HTMLElement)}
      >
        {text.slice(s.start, s.end)}
      </span>
    )
    cursor = s.end
  })
  if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>)
  return <>{out}</>
}

function usePopoverPlacement(rect: { top: number; bottom: number }, estimatedHeight: number) {
  const gap = 6
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const spaceBelow = vh - rect.bottom
  const placeBelow = spaceBelow >= estimatedHeight + gap || spaceBelow >= rect.top
  const top = placeBelow ? rect.bottom + gap : rect.top - gap
  const transform = placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
  return { top, transform, placeBelow }
}

function InlineMarkerPopover({
  rect, eyebrow, summary, actionLabel, tone, disabled, onAction, onClose,
}: {
  rect: { left: number; top: number; bottom: number; width: number }
  eyebrow: string
  summary: string
  actionLabel: string
  tone: 'suggestion' | 'critical'
  disabled?: boolean
  onAction: () => void
  onClose: () => void
}) {
  const eyebrowColor = tone === 'critical' ? 'text-rose-600' : 'text-[#7c3aed]'
  const accentBtn = tone === 'critical'
    ? 'bg-rose-600 hover:brightness-110'
    : 'bg-[#0f172a] hover:brightness-110'
  const { top, transform, placeBelow } = usePopoverPlacement(rect, 60)
  return (
    <div
      data-berry-popover
      className="fixed z-50 berry-popover-in"
      style={{ left: rect.left, top, transform }}
    >
      <div className="rounded-[10px] bg-white border border-slate-200 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.18),0_2px_6px_-2px_rgba(15,23,42,0.08)] px-3 py-2 flex items-center gap-2.5 min-w-[240px] max-w-[320px]">
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${eyebrowColor}`} style={{ fontFamily: 'var(--font-urbanist)' }}>
            {eyebrow}
          </p>
          <p className="text-[12.5px] leading-[1.4] text-[#0f172a] truncate" style={{ fontFamily: 'var(--font-urbanist)' }}>
            {summary}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onAction}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-white text-[11.5px] font-semibold transition-[filter] disabled:opacity-40 disabled:cursor-not-allowed ${accentBtn}`}
          style={{ fontFamily: 'var(--font-urbanist)' }}
        >
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex items-center justify-center size-5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors text-[12px] leading-none"
        >
          ×
        </button>
      </div>
      <div
        className={`absolute left-1/2 -translate-x-1/2 size-[10px] rotate-45 bg-white ${
          placeBelow
            ? '-top-[5px] border-l border-t border-slate-200'
            : '-bottom-[5px] border-r border-b border-slate-200'
        }`}
      />
    </div>
  )
}

function VariationPopover({
  rect, eyebrow, options, onPick, onClose,
}: {
  rect: { left: number; top: number; bottom: number; width: number }
  eyebrow: string
  options: string[]
  onPick: (value: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState(0)
  const { top, transform, placeBelow } = usePopoverPlacement(rect, 220)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(options.length - 1, s + 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(0, s - 1)) }
      else if (e.key === 'Enter') { e.preventDefault(); onPick(options[selected]) }
      else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, selected, onPick, onClose])

  return (
    <div
      data-berry-popover
      className="fixed z-50 berry-popover-in"
      style={{ left: rect.left, top, transform }}
    >
      <div className="rounded-[12px] bg-white border border-slate-200 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.18),0_2px_6px_-2px_rgba(15,23,42,0.08)] w-[360px] overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#737373]" style={{ fontFamily: 'var(--font-urbanist)' }}>
            {eyebrow}
          </p>
          <p className="text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-urbanist)' }}>
            <span className="tabular-nums">▲ ▼</span> to navigate · <span className="tabular-nums">↵</span> to select · esc to close
          </p>
        </div>
        <div className="p-1.5 flex flex-col gap-1 max-h-[280px] overflow-y-auto">
          {options.map((opt, i) => {
            const isSelected = i === selected
            return (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setSelected(i)}
                onClick={() => onPick(opt)}
                className={`w-full text-left rounded-full px-3 py-2 flex items-start gap-2.5 transition-colors ${
                  isSelected
                    ? 'bg-[#0787ff]/8 text-[#0f172a]'
                    : 'hover:bg-slate-50 text-[#0f172a]'
                }`}
                style={{ fontFamily: 'var(--font-urbanist)' }}
              >
                <span className={`mt-0.5 text-[12px] leading-none shrink-0 ${isSelected ? 'text-[#0787ff]' : 'text-slate-400'}`}>
                  →
                </span>
                <span className="text-[12.5px] leading-[1.5]">{opt}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div
        className={`absolute left-1/2 -translate-x-1/2 size-[10px] rotate-45 bg-white ${
          placeBelow
            ? '-top-[5px] border-l border-t border-slate-200'
            : '-bottom-[5px] border-r border-b border-slate-200'
        }`}
      />
    </div>
  )
}

function AutoTextarea({
  value, onChange, onBlur, autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  autoFocus?: boolean
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
      autoFocus={autoFocus}
      onBlur={onBlur}
      onChange={e => onChange(e.target.value)}
      className="w-full resize-none bg-transparent outline-none text-[16.5px] leading-[1.7] text-[#1e293b]"
      style={{ fontFamily: 'var(--font-urbanist)' }}
    />
  )
}

function V10Styles() {
  return (
    <style jsx global>{`
      @keyframes berry-sparkle {
        0%, 100% { transform: rotate(-6deg) scale(1); opacity: 1; }
        50%      { transform: rotate(6deg)  scale(1.08); opacity: 0.9; }
      }
      .berry-sparkle { animation: berry-sparkle 2.4s ease-in-out infinite; }

      @keyframes v10-side-fade {
        from { opacity: 0; transform: translateX(-4px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .v10-side-fade { animation: v10-side-fade 220ms cubic-bezier(0.22,1,0.36,1) 80ms both; }

      @keyframes berry-fade-in {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .berry-fade-in { animation: berry-fade-in 280ms cubic-bezier(0.22,1,0.36,1) both; }

      @keyframes berry-row-in {
        from { opacity: 0; transform: translateY(-2px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .berry-row-in { animation: berry-row-in 180ms ease-out both; }

      @keyframes apple-text-out {
        0%   { opacity: 1; filter: blur(0px);    transform: translateY(0); }
        100% { opacity: 0; filter: blur(4px);    transform: translateY(-2px); }
      }
      .apple-text-out {
        animation: apple-text-out 300ms cubic-bezier(0.4,0,0.2,1) both;
        will-change: opacity, filter, transform;
      }

      @keyframes apple-text-in {
        0%   { opacity: 0; filter: blur(4px);    transform: translateY(2px); }
        100% { opacity: 1; filter: blur(0px);    transform: translateY(0); }
      }
      .apple-text-in {
        animation: apple-text-in 600ms cubic-bezier(0.22,1,0.36,1) both;
        will-change: opacity, filter, transform;
      }

      .berry-marker-suggestion {
        background-color: rgba(255,233,74,0.30);
        box-shadow: inset 0 -1.5px 0 rgba(240,75,42,0.55);
        border-radius: 3px;
        padding: 0 2px;
        transition: background-color 140ms ease, box-shadow 140ms ease;
      }
      .berry-marker-suggestion:hover {
        background-color: rgba(255,233,74,0.55);
        box-shadow: inset 0 -1.5px 0 rgba(240,75,42,0.85);
      }
      .berry-marker-suggestion-active {
        background-color: rgba(255,233,74,0.75);
        box-shadow: inset 0 -1.5px 0 rgba(240,75,42,0.95);
      }
      .berry-marker-critical {
        background-color: rgba(254,243,199,0.55);
        box-shadow: inset 0 -1.5px 0 rgba(217,119,6,0.55);
        border-radius: 2px;
        padding: 0 2px;
        transition: background-color 140ms ease, box-shadow 140ms ease;
      }
      .berry-marker-critical:hover {
        background-color: rgba(254,243,199,0.85);
        box-shadow: inset 0 -1.5px 0 rgba(217,119,6,0.85);
      }
      .berry-marker-critical-active {
        background-color: rgba(254,243,199,0.95);
        box-shadow: inset 0 -1.5px 0 rgba(217,119,6,0.95);
      }

      @keyframes berry-popover-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .berry-popover-in { animation: berry-popover-in 140ms cubic-bezier(0.22,1,0.36,1) both; }

      @keyframes apple-shimmer-sweep {
        0%   { background-position: -120% 0; }
        100% { background-position: 220% 0; }
      }
      .apple-shimmer {
        background-image: linear-gradient(
          100deg,
          #0f172a 0%,
          #0f172a 38%,
          rgba(240,75,42,0.95) 48%,
          rgba(255,200,40,0.95) 54%,
          #0f172a 64%,
          #0f172a 100%
        );
        background-size: 220% 100%;
        background-repeat: no-repeat;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation:
          apple-text-in 600ms cubic-bezier(0.22,1,0.36,1) both,
          apple-shimmer-sweep 700ms cubic-bezier(0.4,0,0.2,1) 60ms both;
      }
    `}</style>
  )
}
