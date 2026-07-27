'use client'

/**
 * SocialComposer — multi-platform live-preview composer.
 *
 * Implements Figma frame I02tmA6iTr4Z9nKGNi4hki?node-id=40000133-19900:
 *   - Header: Back / Download Image / Share and publish
 *   - Left (65%): glass preview wall with platform pager + live previews
 *   - Right (35%): glass panels — Choose Social Platform, Overlay Title,
 *     Post caption, Author
 *
 * Layered on top of the Figma frame: the philosophy from the brief —
 * write-once / preview-everywhere with per-platform overrides, smart
 * platform warnings, and an inline Publish popover.
 */

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, ChevronDown, Check, Plus, X,
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  ThumbsUp, Repeat2, Globe, Sparkles,
} from 'lucide-react'

/* ─── Platforms ─────────────────────────────────────────────────────────── */

type PlatformId = 'instagram' | 'linkedin' | 'facebook' | 'x' | 'threads'

type Platform = {
  id: PlatformId
  name: string
  accent: string         // hex, used for chip dot
  captionLimit: number   // for smart warnings
}

const PLATFORMS: Platform[] = [
  { id: 'instagram', name: 'Instagram', accent: '#E1306C', captionLimit: 2200 },
  { id: 'linkedin',  name: 'LinkedIn',  accent: '#0A66C2', captionLimit: 3000 },
  { id: 'facebook',  name: 'Facebook',  accent: '#1877F2', captionLimit: 63206 },
  { id: 'x',         name: 'X',         accent: '#0F172A', captionLimit: 280 },
  { id: 'threads',   name: 'Threads',   accent: '#0F172A', captionLimit: 500 },
]

/* ─── Content model ─────────────────────────────────────────────────────── */

type Content = {
  overlayTitle: string
  caption: string
  author: string
  imageDataUrl: string | null
}

const DEFAULT_CONTENT: Content = {
  overlayTitle: 'NEA posts NPR 22.4 B profit, ends decade of losses',
  caption:
    'Nepal Electricity Authority closed FY 2025/26 with a NPR 22.4 billion net profit — the first time in 12 years the state utility has cleared its accumulated losses. Managing director Kulman Ghising attributed the turnaround to lower system leakage and sustained dry-season exports to the Indian Energy Exchange.',
  author: 'Snowberry Business Desk',
  imageDataUrl: null,
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function SocialComposer() {
  const router = useRouter()

  const [enabled, setEnabled] = useState<PlatformId[]>(['instagram', 'linkedin'])
  const [activeIdx, setActiveIdx] = useState(0)
  const active = enabled[activeIdx] ?? enabled[0]

  const [shared, setShared] = useState<Content>(DEFAULT_CONTENT)
  // Per-platform overrides — only fields the user explicitly customised.
  const [overrides, setOverrides] = useState<
    Partial<Record<PlatformId, Partial<Content>>>
  >({})

  const [platformPickerOpen, setPlatformPickerOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [pendingField, setPendingField] = useState<{ field: keyof Content; value: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* Effective content for a given platform: shared + override */
  const contentFor = (p: PlatformId): Content => ({
    ...shared,
    ...(overrides[p] ?? {}),
  })

  /* Field editors — write to shared by default */
  const updateShared = <K extends keyof Content>(field: K, value: Content[K]) => {
    setShared((s) => ({ ...s, [field]: value }))
  }

  const applyOverrideChoice = (scope: 'all' | 'one') => {
    if (!pendingField) return
    if (scope === 'all') {
      setShared((s) => ({ ...s, [pendingField.field]: pendingField.value }))
      // Clear any prior override on this field for the active platform
      setOverrides((o) => {
        const next = { ...o }
        if (next[active]) {
          const { [pendingField.field]: _, ...rest } = next[active] as Partial<Content>
          next[active] = rest
        }
        return next
      })
    } else {
      setOverrides((o) => ({
        ...o,
        [active]: { ...(o[active] ?? {}), [pendingField.field]: pendingField.value },
      }))
    }
    setPendingField(null)
  }

  const onImagePick = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => updateShared('imageDataUrl', reader.result as string)
    reader.readAsDataURL(file)
  }

  /* Cycle pager */
  const prev = () => setActiveIdx((i) => (i - 1 + enabled.length) % enabled.length)
  const next = () => setActiveIdx((i) => (i + 1) % enabled.length)

  const togglePlatform = (id: PlatformId) => {
    setEnabled((list) => {
      const has = list.includes(id)
      const next = has ? list.filter((p) => p !== id) : [...list, id]
      if (next.length === 0) return list // never empty
      // keep activeIdx in range
      setActiveIdx((i) => Math.min(i, next.length - 1))
      return next
    })
  }

  const activePlatform = useMemo(() => PLATFORMS.find((p) => p.id === active)!, [active])
  const activeContent = contentFor(active)

  /* Warnings per platform */
  const warningFor = (p: Platform, c: Content): string | null => {
    if (c.caption.length > p.captionLimit) return `Caption is ${c.caption.length - p.captionLimit} over the ${p.captionLimit}-char limit`
    if (p.id === 'instagram' && c.imageDataUrl == null) return 'Add an image — Instagram needs a visual'
    return null
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden px-8 py-6">
      {/* ── Background — editorial off-white with hairline grid ───── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#fafaf9]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse 90% 70% at 50% 30%, black 40%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 70% at 50% 30%, black 40%, transparent 100%)',
          }}
        />
        <div className="absolute top-0 inset-x-0 h-[280px] bg-gradient-to-b from-white to-transparent" />
      </div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-[1408px] items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 -ml-2 rounded-md px-2 py-1 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <button className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Download
          </button>

          <div className="relative">
            <button
              onClick={() => setPublishOpen((o) => !o)}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Publish
            </button>
            {publishOpen && (
              <PublishPopover
                enabled={enabled}
                onClose={() => setPublishOpen(false)}
              />
            )}
          </div>
        </div>
      </header>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="mx-auto mt-5 grid max-w-[1408px] grid-cols-[1fr_404px] gap-3 h-[calc(100vh-120px)]">
        {/* ── Preview wall ─────────────────────────────────────────────── */}
        <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-slate-200/70 px-6 pt-4 pb-4">
            <p className="text-lg font-medium text-slate-950">
              {activePlatform.name} preview
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Previous platform"
                className="flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="size-3.5 text-slate-600" />
              </button>
              <button
                onClick={next}
                aria-label="Next platform"
                className="flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <ArrowRight className="size-3.5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Platform tabs — editorial underlined style */}
          <div className="flex items-center justify-between gap-4 px-6 border-b border-slate-200/70">
            <div className="flex items-center -mb-px">
              {PLATFORMS.filter((p) => enabled.includes(p.id)).map((p) => {
                const isActive = p.id === active
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveIdx(enabled.indexOf(p.id))}
                    onDoubleClick={() => togglePlatform(p.id)}
                    title="Click to focus · double-click to hide"
                    className={[
                      'group relative inline-flex items-center gap-2 px-3 py-3 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-800',
                    ].join(' ')}
                  >
                    <span>{p.name}</span>
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute inset-x-2 bottom-0 h-[1.5px] bg-slate-900 rounded-full"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Add platform — quiet ghost chips */}
            <div className="flex items-center gap-1">
              {PLATFORMS.filter((p) => !enabled.includes(p.id)).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    togglePlatform(p.id)
                    setActiveIdx(enabled.length)
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="size-3" />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview canvas */}
          <div className="relative flex-1 overflow-auto">
            <div className="flex min-h-full items-start justify-center py-10 px-6">
              <PreviewSwitch
                platform={activePlatform}
                content={activeContent}
                onInlineEdit={(field, value) => setPendingField({ field, value })}
                pendingField={pendingField}
                onScopeChoice={applyOverrideChoice}
                hasOverride={(field) => Boolean(overrides[active]?.[field])}
              />
            </div>

            {/* Smart warning ribbon */}
            {(() => {
              const w = warningFor(activePlatform, activeContent)
              if (!w) {
                return (
                  <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-success-500/10 px-3 py-1 text-xs font-medium text-success-600 border border-success-500/20">
                    <Check className="size-3" />
                    Looks good on {activePlatform.name}
                  </div>
                )
              }
              return (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-warning-500/15 px-3 py-1 text-xs font-medium text-warning-600 border border-warning-500/30">
                  <Sparkles className="size-3" />
                  {w}
                </div>
              )
            })()}
          </div>
        </section>

        {/* ── Right composer ──────────────────────────────────────────── */}
        <aside className="flex h-full flex-col gap-2">
          {/* Choose Social Platform */}
          <div className="relative rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Label>Distribution</Label>
            <button
              onClick={() => setPlatformPickerOpen((o) => !o)}
              className="mt-2 flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-left text-[13.5px] text-slate-800 hover:border-slate-300 hover:bg-white transition-colors"
            >
              <span className="flex min-w-0 items-center gap-2">
                {enabled.length === 0 ? (
                  <span className="text-slate-400">Select platforms</span>
                ) : (
                  <span className="truncate">
                    {enabled.length === 1
                      ? PLATFORMS.find((p) => p.id === enabled[0])!.name
                      : `${enabled.length} platforms`}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                {enabled.length > 0 && (
                  <span className="text-[11px] tabular-nums text-slate-400">{enabled.length}/{PLATFORMS.length}</span>
                )}
                <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-150 ${platformPickerOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {platformPickerOpen && (
              <div className="absolute left-4 right-4 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-[0_4px_8px_-2px_rgba(15,23,42,0.06),0_16px_32px_-12px_rgba(15,23,42,0.12)]">
                {PLATFORMS.map((p) => {
                  const on = enabled.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-[13.5px] text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: p.accent }} />
                        <span>{p.name}</span>
                      </span>
                      {on && <Check className="size-3.5 text-slate-900" strokeWidth={2.5} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Content fields */}
          <div className="flex-1 overflow-auto rounded-xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-4">
              <Field
                label="Overlay Title"
                value={shared.overlayTitle}
                placeholder="Place Overlay content here"
                onChange={(v) => updateShared('overlayTitle', v)}
              />

              <Field
                label="Post caption"
                value={shared.caption}
                placeholder="Enter post caption"
                multiline
                onChange={(v) => updateShared('caption', v)}
                hint={`${shared.caption.length} chars`}
              />

              <Field
                label="Author"
                value={shared.author}
                placeholder="Add author name"
                onChange={(v) => updateShared('author', v)}
                trailing={<ChevronDown className="size-4 text-slate-500" />}
              />

              <div>
                <Label>Image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onImagePick(f)
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 flex h-28 w-full items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/40 text-[13px] text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  {shared.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shared.imageDataUrl} alt="" className="max-h-full max-w-full rounded-md object-cover" />
                  ) : (
                    <span className="flex items-center gap-1.5"><Plus className="size-4" /> Upload image</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ─── Field primitives ──────────────────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{children}</p>
  )
}

function Field({
  label, value, onChange, placeholder, multiline, trailing, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  trailing?: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      <div className="mt-1.5 flex items-stretch">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-28 w-full resize-none border-0 border-b border-slate-200 bg-transparent px-0 py-2 text-[14.5px] leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 transition-colors"
          />
        ) : (
          <>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="h-9 flex-1 border-0 border-b border-slate-200 bg-transparent px-0 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 transition-colors"
            />
            {trailing && (
              <div className="flex size-9 items-center justify-center text-slate-400">
                {trailing}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Publish popover ───────────────────────────────────────────────────── */

function PublishPopover({ enabled, onClose }: { enabled: PlatformId[]; onClose: () => void }) {
  const [now, setNow] = useState<'now' | 'schedule'>('now')
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-modal">
        <p className="text-sm font-medium text-slate-900">Publishing to</p>
        <ul className="mt-2 space-y-1">
          {enabled.map((id) => {
            const p = PLATFORMS.find((x) => x.id === id)!
            return (
              <li key={id} className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-sm text-slate-800">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: p.accent }} />
                  {p.name}
                </span>
                <Check className="size-3.5 text-success-500" />
              </li>
            )
          })}
        </ul>

        <div className="mt-3 flex rounded-md bg-slate-100 p-0.5 text-xs font-medium">
          <button
            onClick={() => setNow('now')}
            className={['flex-1 rounded px-2 py-1.5', now === 'now' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'].join(' ')}
          >Publish now</button>
          <button
            onClick={() => setNow('schedule')}
            className={['flex-1 rounded px-2 py-1.5', now === 'schedule' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'].join(' ')}
          >Schedule</button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {now === 'now' ? 'Publish' : 'Schedule post'}
        </button>
      </div>
    </>
  )
}

/* ─── Preview switch ────────────────────────────────────────────────────── */

function PreviewSwitch(props: {
  platform: Platform
  content: Content
  onInlineEdit: (field: keyof Content, value: string) => void
  pendingField: { field: keyof Content; value: string } | null
  onScopeChoice: (scope: 'all' | 'one') => void
  hasOverride: (field: keyof Content) => boolean
}) {
  const { platform } = props
  switch (platform.id) {
    case 'instagram': return <InstagramPreview {...props} />
    case 'linkedin':  return <LinkedInPreview  {...props} />
    case 'facebook':  return <FacebookPreview  {...props} />
    case 'x':         return <XPreview         {...props} />
    case 'threads':   return <ThreadsPreview   {...props} />
  }
}

/* ─── Inline-editable text ──────────────────────────────────────────────── */

function Editable({
  value, field, onInlineEdit, pendingField, onScopeChoice, hasOverride,
  className, multiline,
}: {
  value: string
  field: keyof Content
  onInlineEdit: (field: keyof Content, value: string) => void
  pendingField: { field: keyof Content; value: string } | null
  onScopeChoice: (scope: 'all' | 'one') => void
  hasOverride: (field: keyof Content) => boolean
  className?: string
  multiline?: boolean
}) {
  const showMenu = pendingField?.field === field
  const overridden = hasOverride(field)
  return (
    <span className="relative inline-block w-full">
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const next = e.currentTarget.textContent ?? ''
          if (next !== value) onInlineEdit(field, next)
        }}
        className={[
          className ?? '',
          'outline-none focus:bg-brand-50/60 rounded px-0.5 -mx-0.5',
          overridden ? 'underline decoration-dotted decoration-warning-500/70 underline-offset-4' : '',
          multiline ? 'whitespace-pre-wrap' : '',
        ].join(' ')}
      >
        {value}
      </span>
      {showMenu && (
        <span className="absolute left-0 top-full z-30 mt-1 flex gap-1 rounded-md border border-slate-200 bg-white p-1 text-xs shadow-modal">
          <button
            onClick={() => onScopeChoice('all')}
            className="rounded px-2 py-1 hover:bg-slate-100"
          >Edit for all platforms</button>
          <button
            onClick={() => onScopeChoice('one')}
            className="rounded px-2 py-1 hover:bg-slate-100 text-warning-600"
          >This platform only</button>
        </span>
      )}
    </span>
  )
}

/* ─── Platform-specific previews ───────────────────────────────────────── */

function InstagramPreview(props: PreviewProps) {
  const { content } = props
  return (
    <article className="w-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="size-8 rounded-full bg-gradient-to-br from-pink-400 via-red-400 to-yellow-400 p-0.5">
          <div className="size-full rounded-full bg-white" />
        </div>
        <div className="flex-1 text-sm font-semibold">
          <Editable {...props} field="author" value={content.author || 'snowberry.news'} />
        </div>
        <MoreHorizontal className="size-4 text-slate-500" />
      </div>
      <div className="relative aspect-square bg-slate-100">
        {content.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.imageDataUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-slate-400">No image</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <Editable
            {...props}
            field="overlayTitle"
            value={content.overlayTitle}
            className="text-base font-semibold leading-tight"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 py-2 text-slate-800">
        <Heart className="size-5" />
        <MessageCircle className="size-5" />
        <Send className="size-5" />
        <Bookmark className="ml-auto size-5" />
      </div>
      <div className="px-3 pb-3 text-sm leading-snug">
        <span className="mr-1 font-semibold">{content.author || 'snowberry.news'}</span>
        <Editable {...props} field="caption" value={content.caption} multiline />
      </div>
    </article>
  )
}

function LinkedInPreview(props: PreviewProps) {
  const { content } = props
  return (
    <article className="w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-4 pt-3">
        <div className="size-10 rounded-full bg-slate-200" />
        <div className="flex flex-col">
          <Editable {...props} field="author" value={content.author} className="text-[15px] font-semibold text-slate-900" />
          <span className="text-xs text-slate-500">Newsroom · Just now · 🌐</span>
        </div>
      </div>
      <div className="px-4 py-3 text-[15px] leading-snug text-slate-900">
        <Editable {...props} field="overlayTitle" value={content.overlayTitle} className="block font-semibold mb-1.5" />
        <Editable {...props} field="caption" value={content.caption} multiline />
      </div>
      {content.imageDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={content.imageDataUrl} alt="" className="w-full max-h-[280px] object-cover" />
      )}
      <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-sm text-slate-600">
        <span className="flex items-center gap-1"><ThumbsUp className="size-4" /> Like</span>
        <span className="flex items-center gap-1"><MessageCircle className="size-4" /> Comment</span>
        <span className="flex items-center gap-1"><Repeat2 className="size-4" /> Repost</span>
        <span className="flex items-center gap-1"><Send className="size-4" /> Send</span>
      </div>
    </article>
  )
}

function FacebookPreview(props: PreviewProps) {
  const { content } = props
  return (
    <article className="w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-4 pt-3">
        <div className="size-10 rounded-full bg-slate-200" />
        <div className="flex flex-col">
          <Editable {...props} field="author" value={content.author} className="text-[15px] font-semibold text-slate-900" />
          <span className="text-xs text-slate-500 flex items-center gap-1">Just now · <Globe className="size-3" /></span>
        </div>
      </div>
      <div className="px-4 py-3 text-[15px] leading-snug text-slate-900">
        <Editable {...props} field="caption" value={content.caption} multiline />
      </div>
      <div className="relative">
        {content.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.imageDataUrl} alt="" className="w-full max-h-[320px] object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center bg-slate-100 text-xs text-slate-400">No image</div>
        )}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
          <Editable {...props} field="overlayTitle" value={content.overlayTitle} className="block text-base font-semibold text-slate-900" />
          <span className="text-xs uppercase tracking-wide text-slate-500">snowberry.news</span>
        </div>
      </div>
    </article>
  )
}

function XPreview(props: PreviewProps) {
  const { content } = props
  return (
    <article className="w-[460px] rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex gap-3">
        <div className="size-10 shrink-0 rounded-full bg-slate-900" />
        <div className="flex-1">
          <div className="flex items-center gap-1 text-sm">
            <Editable {...props} field="author" value={content.author} className="font-semibold text-slate-900" />
            <span className="text-slate-500">@snowberry · now</span>
          </div>
          <div className="mt-1 text-[15px] leading-snug text-slate-900">
            <Editable {...props} field="overlayTitle" value={content.overlayTitle} className="block font-semibold" />
            <Editable {...props} field="caption" value={content.caption} multiline />
          </div>
          {content.imageDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.imageDataUrl} alt="" className="mt-2 w-full max-h-[260px] rounded-xl border border-slate-200 object-cover" />
          )}
        </div>
      </div>
    </article>
  )
}

function ThreadsPreview(props: PreviewProps) {
  const { content } = props
  return (
    <article className="w-[460px] rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex gap-3">
        <div className="size-10 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1">
          <Editable {...props} field="author" value={content.author} className="text-sm font-semibold text-slate-900" />
          <div className="mt-1 text-[15px] leading-snug text-slate-900">
            <Editable {...props} field="caption" value={content.caption} multiline />
          </div>
          {content.imageDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.imageDataUrl} alt="" className="mt-2 w-full max-h-[260px] rounded-2xl object-cover" />
          )}
        </div>
      </div>
    </article>
  )
}

type PreviewProps = {
  platform: Platform
  content: Content
  onInlineEdit: (field: keyof Content, value: string) => void
  pendingField: { field: keyof Content; value: string } | null
  onScopeChoice: (scope: 'all' | 'one') => void
  hasOverride: (field: keyof Content) => boolean
}
