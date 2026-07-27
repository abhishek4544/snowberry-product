'use client'

/**
 * TemplateEditor — concept inspired by aNepali snap editor.
 *
 * Pick one template (Breaking News With Circular Photo), edit its
 * slots in the right panel, see live updates in the centre stage.
 *
 * Multi-view: the same content is rendered in 3 canvas formats at
 * once — Square (1:1), Story (9:16), Landscape (16:9). Switch by
 * clicking the view chips at the top of the stage; the active view
 * is the large editable surface, the others stay as live thumbnails.
 */

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Download, Image as ImageIcon, Type, Palette, Upload,
} from 'lucide-react'

type ViewId = 'square' | 'story' | 'landscape'

type View = { id: ViewId; name: string; ratio: string; w: number; h: number; tag: string }

const VIEWS: View[] = [
  { id: 'square',    name: 'Instagram Post', ratio: '1:1',  w: 1080, h: 1080, tag: 'Square' },
  { id: 'story',     name: 'Story',          ratio: '9:16', w: 1080, h: 1920, tag: 'Story'  },
  { id: 'landscape', name: 'Facebook',       ratio: '16:9', w: 1200, h: 675,  tag: 'Landscape' },
]

type Content = {
  tag: string
  headline: string
  byline: string
  brand: string
  mainImage: string | null
  facePhoto: string | null
  accent: string
}

const DEFAULT_CONTENT: Content = {
  tag: 'Breaking',
  headline: 'NEA posts **NPR 22.4 B** profit, clears\na decade of accumulated losses',
  byline: 'Snowberry Business Desk · 2h',
  brand: 'SNOWBERRY',
  mainImage:
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1600&q=80&auto=format&fit=crop',
  facePhoto:
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&auto=format&fit=crop',
  accent: '#DC2626',
}

const ACCENT_SWATCHES = ['#E11D48', '#0F172A', '#0787FF', '#16A34A', '#EA580C', '#7C3AED']

/* ─── Component ────────────────────────────────────────────────────────── */

export default function TemplateEditor() {
  const router = useRouter()
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT)
  const [activeView, setActiveView] = useState<ViewId>('square')
  const mainImageRef = useRef<HTMLInputElement>(null)
  const faceImageRef = useRef<HTMLInputElement>(null)

  const update = <K extends keyof Content>(k: K, v: Content[K]) =>
    setContent((c) => ({ ...c, [k]: v }))

  const pickImage = (ref: React.RefObject<HTMLInputElement | null>, field: 'mainImage' | 'facePhoto') => {
    ref.current?.click()
    const handler = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => update(field, reader.result as string)
      reader.readAsDataURL(file)
      ref.current?.removeEventListener('change', handler)
    }
    ref.current?.addEventListener('change', handler)
  }

  const active = VIEWS.find((v) => v.id === activeView)!

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden text-slate-900">
      {/* Light glass workspace background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#f4f6fb]" />
        <div className="absolute -top-32 -left-32 size-[620px] rounded-full bg-[#cfe1ff] opacity-50 blur-[140px]" />
        <div className="absolute top-1/2 -right-40 size-[560px] rounded-full bg-[#e7d4ff] opacity-45 blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 size-[680px] rounded-full bg-[#d6f0e2] opacity-40 blur-[150px]" />
      </div>

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/40 bg-white/55 backdrop-blur-xl px-5 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/news/templates')}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Templates
          </button>
          <span className="h-4 w-px bg-slate-300/50" />
          <div className="flex items-center gap-2">
            <div className="size-6 overflow-hidden rounded-[3px] bg-slate-100 ring-1 ring-slate-200">
              {content.mainImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.mainImage} alt="" className="size-full object-cover" />
              )}
            </div>
            <p className="text-[13.5px] font-medium text-slate-900">Breaking news with circular photo</p>
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-emerald-700">Live</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-white/70 bg-white/60 px-3 py-1.5 text-[13px] font-medium text-slate-700 backdrop-blur-md hover:bg-white/80 transition-colors">
            <Download className="size-3.5" />
            Export
          </button>
          <button
            onClick={() => router.push('/news/social-composer')}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </header>

      {/* ── Main two-column body ───────────────────────────────────── */}
      <div className="grid flex-1 grid-cols-[1fr_320px] overflow-hidden">
        {/* ── Stage ──────────────────────────────────────────────── */}
        <section className="relative flex flex-col overflow-hidden">
          {/* Subtle grid overlay on the workspace */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)',
            }}
          />

          {/* Floating toolbar */}
          <div className="relative z-10 flex items-center justify-between px-6 py-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-6px_rgba(15,23,42,0.12)]">
              <ViewIcon id={active.id} className="size-3 text-slate-600" />
              <span className="text-[12px] font-medium text-slate-900">{active.name}</span>
              <span className="text-[11px] text-slate-500 tabular-nums">{active.w}×{active.h}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/60 p-0.5 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-6px_rgba(15,23,42,0.12)]">
              <button className="rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-white/70">−</button>
              <span className="px-1.5 text-[11px] font-medium tabular-nums text-slate-700">Fit</span>
              <button className="rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-white/70">+</button>
            </div>
          </div>

          {/* Canvas stage */}
          <div className="relative z-0 flex flex-1 items-center justify-center overflow-auto px-10 pb-4">
            <div className="relative">
              {/* Soft glow halo */}
              <div
                aria-hidden
                className="absolute -inset-8 rounded-[2rem] bg-white/40 blur-2xl"
              />
              <div
                className="relative overflow-hidden rounded-lg ring-1 ring-slate-900/10 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35),0_8px_24px_-8px_rgba(15,23,42,0.18)]"
                style={{
                  aspectRatio: `${active.w} / ${active.h}`,
                  height: active.id === 'story' ? '78vh' : 'auto',
                  maxHeight: '78vh',
                  maxWidth: '100%',
                }}
              >
                <TemplateCanvas content={content} view={active} />
              </div>
            </div>
          </div>

          {/* Bottom multi-view dock */}
          <div className="relative z-10 mx-4 mb-3 rounded-2xl border border-white/60 bg-white/55 px-5 py-3 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_18px_40px_-24px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Live previews · {VIEWS.length} formats</p>
              <p className="text-[10.5px] text-slate-500">Click to focus · all update as you type</p>
            </div>
            <div className="mt-2.5 flex items-end gap-3">
              {VIEWS.map((v) => {
                const isActive = v.id === activeView
                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveView(v.id)}
                    className="group flex flex-col items-start gap-1.5"
                  >
                    <div
                      className={[
                        'overflow-hidden rounded-md ring-1 transition-all duration-200',
                        isActive
                          ? 'ring-slate-900 shadow-[0_0_0_3px_rgba(15,23,42,0.08)]'
                          : 'ring-slate-200 hover:ring-slate-400',
                      ].join(' ')}
                      style={{
                        height: '96px',
                        aspectRatio: `${v.w} / ${v.h}`,
                      }}
                    >
                      <TemplateCanvas content={content} view={v} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800'}`}>{v.name}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{v.ratio}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Right inspector ────────────────────────────────────── */}
        <aside className="relative z-10 m-3 ml-0 flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_18px_40px_-24px_rgba(15,23,42,0.18)]">
          {/* Inspector tabs */}
          <div className="relative flex border-b border-white/60">
            {[
              { icon: Type,      label: 'Content' },
              { icon: ImageIcon, label: 'Media' },
              { icon: Palette,   label: 'Style' },
            ].map(({ icon: Icon, label }, i) => (
              <button
                key={label}
                className={[
                  'relative flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-[12px] font-medium transition-colors',
                  i === 0 ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800',
                ].join(' ')}
              >
                <Icon className="size-3.5" />
                {label}
                {i === 0 && (
                  <span className="absolute inset-x-4 bottom-0 h-[1.5px] bg-slate-900 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Inspector content */}
          <div className="flex-1 overflow-auto px-5 py-5">
            <div className="flex flex-col gap-6">
              <Section title="News">
                <Field label="Breaking tag" value={content.tag} onChange={(v) => update('tag', v)} />
                <Field
                  label="Headline"
                  hint="Wrap **words** in asterisks to highlight them."
                  value={content.headline}
                  onChange={(v) => update('headline', v)}
                  multiline
                />
              </Section>

              <div className="h-px bg-white/70" />

              <Section title="Media">
                <ImageSlot
                  label="Background"
                  value={content.mainImage}
                  onPick={() => pickImage(mainImageRef, 'mainImage')}
                  onClear={() => update('mainImage', null)}
                />
                <input ref={mainImageRef} type="file" accept="image/*" className="hidden" />
                <ImageSlot
                  label="Profile photo"
                  value={content.facePhoto}
                  circle
                  onPick={() => pickImage(faceImageRef, 'facePhoto')}
                  onClear={() => update('facePhoto', null)}
                />
                <input ref={faceImageRef} type="file" accept="image/*" className="hidden" />
              </Section>

              <div className="h-px bg-white/70" />

              <Section title="Accent">
                <div className="flex flex-wrap items-center gap-1.5">
                  {ACCENT_SWATCHES.map((c) => {
                    const on = c === content.accent
                    return (
                      <button
                        key={c}
                        onClick={() => update('accent', c)}
                        className={[
                          'size-8 rounded-md transition-all',
                          on ? 'ring-2 ring-offset-2 ring-offset-white ring-slate-900' : 'ring-1 ring-slate-200 hover:ring-slate-400',
                        ].join(' ')}
                        style={{ backgroundColor: c }}
                        aria-label={c}
                      />
                    )
                  })}
                  <label className="relative size-8 cursor-pointer overflow-hidden rounded-md ring-1 ring-slate-200 hover:ring-slate-400">
                    <input
                      type="color"
                      value={content.accent}
                      onChange={(e) => update('accent', e.target.value)}
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                    />
                    <div className="size-full bg-[conic-gradient(from_0deg,#ef4444,#f59e0b,#10b981,#3b82f6,#a855f7,#ef4444)]" />
                  </label>
                </div>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-white/70 bg-white/50 px-2.5 py-1.5 backdrop-blur-md">
                  <span className="size-3 rounded-sm" style={{ backgroundColor: content.accent }} />
                  <span className="font-mono text-[11.5px] text-slate-600">{content.accent.toUpperCase()}</span>
                </div>
              </Section>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ─── Subcomponents ────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({
  label, value, onChange, multiline, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium text-slate-600">{label}</span>
      {hint && <span className="text-[10.5px] text-slate-500 leading-tight">{hint}</span>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="resize-none rounded-md border border-white/70 bg-white/55 px-2.5 py-2 text-[13px] leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none backdrop-blur-md focus:border-slate-400 focus:bg-white/80 transition-colors"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 rounded-md border border-white/70 bg-white/55 px-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none backdrop-blur-md focus:border-slate-400 focus:bg-white/80 transition-colors"
        />
      )}
    </div>
  )
}

function ImageSlot({
  label, value, circle, onPick, onClear,
}: {
  label: string
  value: string | null
  circle?: boolean
  onPick: () => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium text-slate-600">{label}</span>
      <div className="group flex items-center gap-3 rounded-md border border-white/70 bg-white/55 p-2 backdrop-blur-md hover:border-slate-300 hover:bg-white/75 transition-colors">
        <div
          className={[
            'relative flex size-12 shrink-0 items-center justify-center overflow-hidden bg-slate-100 ring-1 ring-slate-200',
            circle ? 'rounded-full' : 'rounded-md',
          ].join(' ')}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-4 text-slate-400" />
          )}
        </div>
        <div className="flex flex-1 items-center gap-1">
          <button
            onClick={onPick}
            className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] bg-white/70 px-2.5 text-[11.5px] font-medium text-slate-700 ring-1 ring-slate-200/60 hover:bg-white hover:ring-slate-300 transition-colors"
          >
            <Upload className="size-3" /> Replace
          </button>
          {value && (
            <button
              onClick={onClear}
              className="inline-flex size-7 items-center justify-center rounded-[5px] text-[13px] font-medium text-slate-400 hover:bg-white/70 hover:text-slate-700 transition-colors"
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ViewIcon({ id, className }: { id: ViewId; className?: string }) {
  if (id === 'square')    return <div className={`${className} rounded-sm border-[1.5px] border-current`} />
  if (id === 'story')     return <div className={`${className} rounded-sm border-[1.5px] border-current`} style={{ aspectRatio: '9/16', height: '14px', width: 'auto' }} />
  return <div className={`${className} rounded-sm border-[1.5px] border-current`} style={{ aspectRatio: '16/9', width: '16px', height: 'auto' }} />
}

/* ─── Template canvas — Breaking News with circular photo ─────────────── */

/**
 * Layout:
 *   ┌───────────────────────────┐
 *   │                           │ ← background image (top zone)
 *   │        ┌──────┐           │
 *   │        │ face │           │ ← circle straddles the boundary
 *   │  ─ ─ ─ │      │ ─ ─ ─ ─ ─ │
 *   │        └──────┘           │
 *   │       [ Breaking News ]   │ ← red pill, centred
 *   │                           │
 *   │  Headline line one with   │ ← white, **red** for highlights
 *   │  highlighted Blue Bus     │
 *   └───────────────────────────┘   black bottom zone
 *
 * Headline syntax: wrap any word(s) in **double-asterisks** to render
 * them in the accent colour (Blue Bus in the reference).
 */

function TemplateCanvas({ content, view }: { content: Content; view: View }) {
  // Container-query-driven sizing so every rendered size — thumbnail or
  // full canvas — keeps identical proportions.
  const base = view.w
  const sz = (px: number) => `${(px / base) * 100}cqw`

  // The image fills the top portion; black bottom panel takes the rest.
  // Profile circle is centred horizontally and straddles the boundary.
  const imageZone =
    view.id === 'story' ? 0.5 :
    view.id === 'landscape' ? 0.6 :
    0.54 // square — matches reference (image just past midline)

  const circleSize =
    view.id === 'landscape' ? 170 :
    view.id === 'story'     ? 280 :
    280 // square — large like the reference

  return (
    <div
      className="relative size-full overflow-hidden bg-black"
      style={{ containerType: 'inline-size' as React.CSSProperties['containerType'] }}
    >
      {/* Top zone — background image */}
      <div
        className="absolute inset-x-0 top-0 bg-slate-300"
        style={{ height: `${imageZone * 100}%` }}
      >
        {content.mainImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.mainImage}
            alt=""
            className="size-full object-cover"
          />
        )}
      </div>

      {/* Bottom zone — solid black (no gradient, matches reference) */}
      <div
        className="absolute inset-x-0 bottom-0 bg-black"
        style={{ height: `${(1 - imageZone) * 100}%` }}
      />

      {/* Profile circle — centred, straddles the boundary */}
      <div
        className="absolute left-1/2 overflow-hidden bg-slate-200"
        style={{
          top: `calc(${imageZone * 100}% - ${sz(circleSize / 2)})`,
          transform: 'translateX(-50%)',
          width:  sz(circleSize),
          height: sz(circleSize),
          borderRadius: '50%',
          border: `${sz(8)} solid white`,
          boxShadow: `0 ${sz(8)} ${sz(24)} rgba(0,0,0,0.35)`,
        }}
      >
        {content.facePhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.facePhoto} alt="" className="size-full object-cover" />
        )}
      </div>

      {/* Breaking-news pill — centred, below circle */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-white"
        style={{
          top: `calc(${imageZone * 100}% + ${sz(circleSize / 2 + 40)})`,
          backgroundColor: content.accent,
          padding: `${sz(18)} ${sz(48)}`,
          fontSize: sz(54),
          borderRadius: sz(8),
          letterSpacing: '-0.005em',
        }}
      >
        {content.tag}
      </div>

      {/* Headline — centred, white with red highlights */}
      <p
        className="absolute left-0 right-0 px-[5%] text-center font-bold leading-[1.2] text-white"
        style={{
          bottom: sz(view.id === 'story' ? 220 : view.id === 'landscape' ? 50 : 90),
          fontSize: sz(view.id === 'landscape' ? 62 : 78),
          letterSpacing: '-0.01em',
        }}
      >
        {renderHeadline(content.headline, content.accent)}
      </p>
    </div>
  )
}

/* Renders **word** segments in the accent colour, preserves newlines */
function renderHeadline(text: string, accent: string) {
  return text.split('\n').map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
    return (
      <span key={lineIdx} className="block">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <span key={i} style={{ color: accent }}>
                {part.slice(2, -2)}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </span>
    )
  })
}
