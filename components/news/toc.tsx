'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// useFlipPosition — viewport-aware placement for any popover/dropdown.
//
// Callers compute an anchor as `{ top: trigger.bottom + 6, left: trigger.left,
// triggerTop: trigger.top }` (the +6 keeps the 6px design spacing). The hook
// measures the popover after it mounts and, if it would overflow the viewport
// bottom, flips it above the trigger (still respecting the 6px gap). It also
// clamps horizontally so the popover never bleeds off the side, and re-runs
// on window resize. Returns the final {top, left} to apply to the element.
// ─────────────────────────────────────────────────────────────────────────────
export function useFlipPosition(
  anchor: { top: number; left: number; width?: number; triggerTop?: number },
  ref: React.RefObject<HTMLElement | null>,
) {
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: anchor.top, left: anchor.left })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const compute = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      const vw = window.innerWidth
      const vh = window.innerHeight
      const margin = 8
      let top = anchor.top
      let left = anchor.left
      // Flip above the trigger if there isn't room below.
      if (top + h > vh - margin) {
        const triggerTop = anchor.triggerTop ?? anchor.top
        const flipped = triggerTop - 6 - h
        top = flipped >= margin ? flipped : Math.max(margin, vh - margin - h)
      }
      // Clamp to viewport horizontally.
      if (left + w > vw - margin) left = Math.max(margin, vw - margin - w)
      if (left < margin) left = margin
      setPos({ top, left })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [anchor.top, anchor.left, anchor.triggerTop, anchor.width, ref])
  return pos
}

// ─────────────────────────────────────────────────────────────────────────────
// Section model — Table of Contents items + the picker that creates them
// ─────────────────────────────────────────────────────────────────────────────

export type SectionType =
  | 'normal' | 'h1' | 'h2' | 'h3' | 'quote' | 'embed'
  | 'berry' | 'numbered' | 'bullet' | 'image' | 'file'
  // ── Multi-cell template blocks (Figma 40000081:28825 + 2752:16318) ─────────
  // These render a single TOC entry but a side-by-side layout in the editor:
  //   tpl-img-txt → [image upload] | [text passage]
  //   tpl-txt-img → [text passage] | [image upload]
  //   tpl-3col    → [text] | [text] | [text]
  // Two-column was kept as plain back-to-back `normal` blocks via the
  // existing template handler.
  | 'tpl-img-txt' | 'tpl-txt-img' | 'tpl-3col'

export type Section = {
  id: string
  type: SectionType
  // The user's typed content for this block. TOC entries fall back to the
  // type's display label when this is empty, so an unedited Heading 1 block
  // still surfaces as "Heading 1" in the outline.
  title: string
  // Optional per-cell content for multi-cell template blocks. cells[0] is the
  // first cell (e.g. the text in `tpl-img-txt`), etc. Plain blocks ignore it.
  cells?: string[]
  // Optional image URL for the image cell in tpl-img-txt / tpl-txt-img.
  imageUrl?: string
}

// ── Icons (16/20 viewBox; match Figma stroke weights) ────────────────────────

function IconText({ size = 20, color = '#525252' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3.5" y="3.5" width="13" height="13" rx="2" stroke={color} strokeWidth="1.4" />
      <path d="M6 8h8M6 11h6M6 14h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconHeading({ size = 20, color = '#525252', level }: { size?: number; color?: string; level?: 1 | 2 | 3 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 4v12M11 4v12M5 10h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {level && (
        <text x="14.5" y="16" fontSize="6" fontWeight="700" fill={color} fontFamily="Inter, sans-serif">
          {level}
        </text>
      )}
    </svg>
  )
}

function IconImage({ size = 20, color = '#525252' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3.5" width="14" height="13" rx="2" stroke={color} strokeWidth="1.4" />
      <circle cx="8" cy="8.5" r="1.2" fill={color} />
      <path d="M4 14l3.5-3.5 3 3 3-3L17 13.5" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function IconQuote({ size = 20, color = '#525252' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M6.5 7.5c-1.4.5-2.5 1.7-2.5 3.3 0 1.5 1.1 2.5 2.4 2.5 1.2 0 2-.9 2-2 0-1.2-.9-2-1.9-2M13.5 7.5c-1.4.5-2.5 1.7-2.5 3.3 0 1.5 1.1 2.5 2.4 2.5 1.2 0 2-.9 2-2 0-1.2-.9-2-1.9-2"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconEmbed({ size = 20, color = '#525252' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M7 6l-4 4 4 4M13 6l4 4-4 4M11.5 5l-3 10" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconNumberedList({ size = 20, color = '#525252' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M8 6h9M8 10h9M8 14h9" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <text x="3" y="8" fontSize="5" fontWeight="600" fill={color} fontFamily="Inter, sans-serif">1</text>
      <text x="3" y="12" fontSize="5" fontWeight="600" fill={color} fontFamily="Inter, sans-serif">2</text>
      <text x="3" y="16" fontSize="5" fontWeight="600" fill={color} fontFamily="Inter, sans-serif">3</text>
    </svg>
  )
}

function IconBulletList({ size = 20, color = '#525252' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M8 6h9M8 10h9M8 14h9" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1" fill={color} />
      <circle cx="4.5" cy="10" r="1" fill={color} />
      <circle cx="4.5" cy="14" r="1" fill={color} />
    </svg>
  )
}

function IconFile({ size = 20, color = '#525252' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 3.5h6.5L16 8v8a1 1 0 01-1 1H5a1 1 0 01-1-1V4.5a1 1 0 011-1z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 3.5V8h5" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7 11h6M7 14h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconPlus({ size = 20, color = '#525252' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconGrabber({ size = 16, color = '#94a3b8' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="4" r="1" fill={color} />
      <circle cx="10" cy="4" r="1" fill={color} />
      <circle cx="6" cy="8" r="1" fill={color} />
      <circle cx="10" cy="8" r="1" fill={color} />
      <circle cx="6" cy="12" r="1" fill={color} />
      <circle cx="10" cy="12" r="1" fill={color} />
    </svg>
  )
}

function IconSearch({ size = 16, color = '#94a3b8' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke={color} strokeWidth="1.4" />
      <path d="M10.5 10.5l3 3" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconSparkles({ size = 16, color = '#0787ff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5l1.2 2.8L12 5.5l-2.8 1.2L8 9.5 6.8 6.7 4 5.5l2.8-1.2L8 1.5z" fill={color} />
      <path d="M12.5 9l.55 1.3L14.3 11l-1.45.65L12.5 13l-.55-1.35L10.7 11l1.45-.7L12.5 9z" fill={color} opacity="0.85" />
    </svg>
  )
}

// ── Section type registry ────────────────────────────────────────────────────

type TypeMeta = {
  type: SectionType
  label: string
  Icon: (p: { size?: number; color?: string }) => React.JSX.Element
  group: 'text' | 'assets'
  keywords: string[]
}

const TYPES: TypeMeta[] = [
  { type: 'normal',   label: 'Normal Text',    Icon: IconText,                                                 group: 'text', keywords: ['normal', 'paragraph', 'text'] },
  { type: 'h1',       label: 'Heading 1',      Icon: ({ size, color }) => <IconHeading size={size} color={color} level={1} />, group: 'text', keywords: ['heading', 'h1', 'title'] },
  { type: 'h2',       label: 'Heading 2',      Icon: ({ size, color }) => <IconHeading size={size} color={color} level={2} />, group: 'text', keywords: ['heading', 'h2'] },
  { type: 'h3',       label: 'Heading 3',      Icon: ({ size, color }) => <IconHeading size={size} color={color} level={3} />, group: 'text', keywords: ['heading', 'h3'] },
  { type: 'quote',    label: 'Pull a quote',   Icon: IconQuote,                                                group: 'text', keywords: ['quote', 'blockquote', 'pull'] },
  { type: 'embed',    label: 'Embed link',     Icon: IconEmbed,                                                group: 'text', keywords: ['embed', 'link', 'url'] },
  { type: 'numbered', label: 'Numbered list',  Icon: IconNumberedList,                                         group: 'text', keywords: ['numbered', 'list', 'ordered'] },
  { type: 'bullet',   label: 'Bulleted list',  Icon: IconBulletList,                                           group: 'text', keywords: ['bullet', 'list', 'unordered'] },
  { type: 'image',    label: 'Image',          Icon: IconImage,                                                group: 'assets', keywords: ['image', 'photo', 'picture'] },
  { type: 'file',     label: 'File attachment',Icon: IconFile,                                                 group: 'assets', keywords: ['file', 'attachment', 'doc'] },
]

// Template blocks live outside TYPES so they don't show up in the picker's
// Suggested/Assets/Text grids — they're inserted exclusively via the Template
// tab cards. We still register their meta in TYPE_BY so the TOC entry and any
// `TYPE_BY[type]` lookups elsewhere don't blow up.
const TEMPLATE_TYPES: TypeMeta[] = [
  { type: 'tpl-img-txt', label: 'Image and Text', Icon: IconImage, group: 'assets', keywords: [] },
  { type: 'tpl-txt-img', label: 'Text and Image', Icon: IconImage, group: 'assets', keywords: [] },
  { type: 'tpl-3col',    label: 'Three column',   Icon: IconText,  group: 'text',   keywords: [] },
]

const TYPE_BY: Record<SectionType, TypeMeta> = [...TYPES, ...TEMPLATE_TYPES].reduce(
  (m, t) => { m[t.type] = t; return m },
  {} as Record<SectionType, TypeMeta>,
)

export function getSectionMeta(type: SectionType) { return TYPE_BY[type] }

// ─────────────────────────────────────────────────────────────────────────────
// LeftPanel view-toggle — replaces the old grid/list ViewToggle. Folders icon
// switches to the sources panel; bullet-list icon switches to the TOC panel.
// ─────────────────────────────────────────────────────────────────────────────

export type LeftPanelView = 'sources' | 'toc'

export function LeftViewToggle({ value, onChange }: {
  value: LeftPanelView
  onChange: (v: LeftPanelView) => void
}) {
  return (
    <div className="flex items-center p-0.5 rounded-[12px] bg-[#e5e5e5] w-[182px] shrink-0">
      <button
        onClick={() => onChange('sources')}
        title="Sources"
        className={`flex flex-1 items-center justify-center px-3.5 py-2 rounded-[10px] transition-all ${value === 'sources' ? 'bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.12),0px_0px_6px_rgba(0,0,0,0.08)]' : ''}`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 5.5a1.5 1.5 0 011.5-1.5h3l1.5 1.5h6.5A1.5 1.5 0 0116 7v6.5A1.5 1.5 0 0114.5 15h-11A1.5 1.5 0 012 13.5v-8z" stroke="#525252" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => onChange('toc')}
        title="Table of contents"
        className={`flex flex-1 items-center justify-center px-3.5 py-2 rounded-[10px] transition-all ${value === 'toc' ? 'bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.12),0px_0px_6px_rgba(0,0,0,0.08)]' : ''}`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M7 5h8M7 9h8M7 13h8" stroke="#525252" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="3.5" cy="5" r="1.2" fill="#525252" />
          <circle cx="3.5" cy="9" r="1.2" fill="#525252" />
          <circle cx="3.5" cy="13" r="1.2" fill="#525252" />
        </svg>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Table of Contents panel — list of sections with drag-handle on hover, plus
// an empty-state hint and the "Add new section" trigger.
// ─────────────────────────────────────────────────────────────────────────────

export function TableOfContents({
  sections,
  archived = [],
  activeId,
  onSelect,
  onReorder,
  onAddRequest,
  onArchive,
  onRestore,
}: {
  sections: Section[]
  archived?: Section[]
  activeId: string | null
  onSelect: (id: string) => void
  onReorder: (from: number, to: number) => void
  onAddRequest: (anchor: PickerAnchor) => void
  onArchive?: (id: string) => void
  onRestore?: (id: string) => void
}) {
  const isEmpty = sections.length === 0
  const dragFrom = useRef<number | null>(null)
  // `dragging` mirrors the dragFrom ref so we can reactively render the
  // archive drop zone only while a drag is in progress. `archiveHover`
  // highlights the zone when the pointer is over it.
  const [dragging, setDragging] = useState<number | null>(null)
  const [archiveHover, setArchiveHover] = useState(false)

  function handleAddClick(e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onAddRequest({ top: r.bottom + 6, left: r.left, width: r.width, triggerTop: r.top })
  }

  // Customise the browser's drag preview so the ghost gets the same rounded
  // card treatment as the live list item (border + shadow + 8px radius).
  // Without this the native ghost is just the bare DOM node, which renders
  // with sharp corners on macOS Chromium.
  function styleDragGhost(e: React.DragEvent<HTMLDivElement>) {
    const node = e.currentTarget
    const clone = node.cloneNode(true) as HTMLDivElement
    clone.style.position = 'absolute'
    clone.style.top = '-9999px'
    clone.style.left = '-9999px'
    clone.style.width = `${node.offsetWidth}px`
    clone.style.background = '#ffffff'
    clone.style.border = '1px solid #e5e7eb'
    clone.style.borderRadius = '8px'
    clone.style.boxShadow = '0px 8px 24px -6px rgba(0,0,0,0.16), 0px 0px 1px rgba(0,0,0,0.18)'
    clone.style.pointerEvents = 'none'
    document.body.appendChild(clone)
    e.dataTransfer.setDragImage(clone, 12, 12)
    setTimeout(() => document.body.removeChild(clone), 0)
  }

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
      {/* Title */}
      <div className="flex items-center px-2 py-0.5">
        <span
          className="text-[14px] font-medium leading-[1.3] text-[#171717]"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Table of content
        </span>
      </div>

      {/* Empty-state hint (initial) */}
      {isEmpty && (
        <div className="flex items-center px-2">
          <p
            className="text-[14px] leading-[1.5] text-[#737373] tracking-[-0.14px]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Use titles, pages or cards to create a table of contents.
          </p>
        </div>
      )}

      {/* Section list */}
      {!isEmpty && (
        <div className="flex flex-col">
          {sections.map((s, i) => {
            const meta = TYPE_BY[s.type]
            const active = activeId === s.id
            const isSource = dragging === i
            return (
              <div
                key={s.id}
                draggable
                onDragStart={e => {
                  dragFrom.current = i
                  setDragging(i)
                  styleDragGhost(e)
                }}
                onDragEnd={() => { setDragging(null); setArchiveHover(false) }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => {
                  const from = dragFrom.current
                  dragFrom.current = null
                  setDragging(null)
                  if (from === null || from === i) return
                  onReorder(from, i)
                }}
                onClick={() => onSelect(s.id)}
                className={`group flex items-center gap-1.5 p-2 rounded-[8px] cursor-pointer select-none border transition-colors ${
                  isSource
                    ? 'border-slate-200 bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.04)] opacity-60'
                    : active
                      ? 'bg-[#f1f5f9] border-transparent'
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="shrink-0 size-5 flex items-center justify-center">
                  <meta.Icon size={20} color={active ? '#171717' : '#525252'} />
                </div>
                <p
                  className={`flex-1 min-w-0 text-[14px] leading-[1.5] tracking-[-0.14px] truncate ${
                    active ? 'text-[#171717]' : 'text-[#4a5565]'
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {s.title || meta.label}
                </p>
                <div className="shrink-0 size-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <IconGrabber />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add new section — dashed */}
      <button
        type="button"
        onClick={handleAddClick}
        className="flex items-center gap-1.5 p-2 rounded-[8px] bg-[#fafafa] border border-dashed border-[#e5e5e5] hover:bg-slate-50 transition-colors"
      >
        <div className="shrink-0 size-5 flex items-center justify-center">
          <IconPlus size={20} color="#525252" />
        </div>
        <span
          className="flex-1 min-w-0 text-left text-[14px] leading-[1.5] text-[#4a5565] tracking-[-0.14px] truncate"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Add new section
        </span>
      </button>

      {/* Spacer pushes the Archive group + drop zone to the bottom of the panel. */}
      <div className="flex-1" />

      {/* Archived items — click to restore. Hidden when there's nothing
          to restore and no drag in progress, so the panel stays clean. */}
      {(archived.length > 0 || dragging !== null) && (
        <div className="flex flex-col gap-1.5">
          {archived.length > 0 && (
            <>
              <div className="flex items-center px-2">
                <span
                  className="text-[12px] font-medium leading-[1.5] text-[#737373]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Archive
                </span>
              </div>
              <div className="flex flex-col">
                {archived.map(s => {
                  const meta = TYPE_BY[s.type]
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => onRestore?.(s.id)}
                      title="Restore"
                      className="group flex items-center gap-1.5 p-2 rounded-[8px] text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="shrink-0 size-5 flex items-center justify-center">
                        <meta.Icon size={20} color="#94a3b8" />
                      </div>
                      <span
                        className="flex-1 min-w-0 text-[14px] leading-[1.5] tracking-[-0.14px] truncate text-[#94a3b8] line-through"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {s.title || meta.label}
                      </span>
                      <span
                        className="text-[11px] text-[#0787ff] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Restore
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Drag-to-archive drop zone — only visible during a drag. */}
          {dragging !== null && onArchive && (
            <div
              onDragOver={e => { e.preventDefault(); setArchiveHover(true) }}
              onDragLeave={() => setArchiveHover(false)}
              onDrop={() => {
                const from = dragFrom.current
                dragFrom.current = null
                setDragging(null)
                setArchiveHover(false)
                if (from === null) return
                onArchive(sections[from].id)
              }}
              className={`flex items-center gap-1.5 p-2 rounded-[8px] border border-dashed transition-colors ${
                archiveHover
                  ? 'bg-rose-50 border-rose-300 text-rose-600'
                  : 'bg-[#fafafa] border-[#e5e5e5] text-[#737373]'
              }`}
            >
              <div className="shrink-0 size-5 flex items-center justify-center">
                <IconTrash size={18} color={archiveHover ? '#e11d48' : '#737373'} />
              </div>
              <span
                className="flex-1 text-[14px] leading-[1.5] tracking-[-0.14px]"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {archiveHover ? 'Release to archive' : 'Drop here to archive'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Local trash icon — kept inline so we don't pull a new dep just for this.
function IconTrash({ size = 16, color = '#737373' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 4h10M6.5 4V2.5h3V4M5 4l.5 9a1 1 0 001 1h3a1 1 0 001-1L11 4M7 7v4M9 7v4"
            stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section picker popover — search + suggested / assets / text groupings.
// Anchored to a screen position; closes on outside click and Escape.
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED: SectionType[] = [
  'normal', 'h1', 'h2', 'h3', 'quote', 'embed',
  'berry', 'numbered', 'bullet', 'image', 'file',
]

export type PickerAnchor = { top: number; left: number; width?: number; triggerTop?: number }

export type TemplateId = 'image-and-text' | 'text-and-image' | 'two-column' | 'three-column'

export function SectionPicker({
  anchor,
  onPick,
  onPickTemplate,
  onClose,
  initialQuery = '',
}: {
  anchor: PickerAnchor
  onPick: (type: SectionType) => void
  onPickTemplate?: (id: TemplateId) => void
  onClose: () => void
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  // Tab filter — `all` is the full Suggested+Assets+Text view (Figma
  // Dropdown-Template-All, 40000065:28568). `insert` shows just the asset/
  // embed surface used when inserting media into a text flow. `template`
  // shows the multi-block layout cards (Figma Dropdown-Template,
  // 40000065:28477).
  const [tab, setTab] = useState<'all' | 'insert' | 'template'>('all')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const q = query.trim().toLowerCase()
  const matches = (m: TypeMeta) =>
    q === '' || m.label.toLowerCase().includes(q) || m.keywords.some(k => k.includes(q))

  const filteredText = TYPES.filter(m => m.group === 'text' && matches(m))
  const filteredAssets = TYPES.filter(m => m.group === 'assets' && matches(m))
  const filteredSuggested = SUGGESTED
    .filter(t => t !== 'berry')
    .map(t => TYPE_BY[t])
    .filter(matches)

  const width = Math.max(anchor.width ?? 0, 620)
  const pos = useFlipPosition({ ...anchor, width }, rootRef)

  return (
    <div
      ref={rootRef}
      role="dialog"
      className="fixed z-50 bg-white border border-slate-200 rounded-[16px] shadow-[0px_12px_24px_-6px_rgba(31,38,54,0.18),0px_0px_8px_0px_rgba(31,38,54,0.04)]"
      style={{ top: pos.top, left: pos.left, width, maxHeight: '60vh' }}
    >
      <div className="flex flex-col gap-4 p-2 overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-2 h-10 px-3 py-2.5 rounded-[12px] border border-slate-200 shadow-[0px_1px_0.5px_rgba(29,41,61,0.02)]">
          <IconSearch />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 text-[14px] leading-[1.2] bg-transparent outline-none placeholder:text-[#94a3b8] text-[#171717]"
            style={{ fontFamily: 'var(--font-inter)' }}
          />
        </div>

        {/* Tab pills — All / Insert / Template (Figma 40000065:28574). The
            search box is shared across tabs; pills filter what's listed below. */}
        <div className="flex items-center gap-2 px-0">
          <PickerTab label="All"      active={tab === 'all'}      onClick={() => setTab('all')} />
          <PickerTab label="Insert"   active={tab === 'insert'}   onClick={() => setTab('insert')} />
          <PickerTab label="Template" active={tab === 'template'} onClick={() => setTab('template')} />
        </div>

        {/* Fixed-height body — the Template tab has fewer rows than All, so we
            pin a `minHeight` here. The dropdown no longer collapses when the
            user switches tabs. */}
        <div className="flex flex-col gap-4 overflow-y-auto pb-2" style={{ minHeight: '420px', maxHeight: '50vh' }}>
          {tab === 'all' && (
            <>
              {/* Suggested — only when no search */}
              {q === '' && (
                <PickerGroup label="Suggested">
                  {filteredSuggested.map(m => (
                    <PickerItem key={m.type} meta={m} onPick={() => onPick(m.type)} />
                  ))}
                  <BerryItem onPick={() => onPick('berry')} />
                </PickerGroup>
              )}

              {filteredAssets.length > 0 && (
                <PickerGroup label="Assets">
                  {filteredAssets.map(m => (
                    <PickerItem key={m.type} meta={m} onPick={() => onPick(m.type)} />
                  ))}
                </PickerGroup>
              )}

              {q !== '' && filteredText.length > 0 && (
                <PickerGroup label="Text">
                  {filteredText.map(m => (
                    <PickerItem key={m.type} meta={m} highlighted onPick={() => onPick(m.type)} />
                  ))}
                </PickerGroup>
              )}

              {q !== '' && filteredText.length === 0 && filteredAssets.length === 0 && (
                <p
                  className="text-[14px] leading-[1.5] text-[#737373] px-3 py-2"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  No matching section type.
                </p>
              )}
            </>
          )}

          {tab === 'insert' && (
            <PickerGroup label="Assets">
              {filteredAssets.length > 0
                ? filteredAssets.map(m => (
                    <PickerItem key={m.type} meta={m} onPick={() => onPick(m.type)} />
                  ))
                : (
                  <p
                    className="text-[14px] leading-[1.5] text-[#737373] px-3 py-2"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    No matching assets.
                  </p>
                )}
            </PickerGroup>
          )}

          {tab === 'template' && (
            <PickerGroup label="Snowberry template">
              <TemplateCard id="image-and-text" label="Image and Text" onPick={onPickTemplate} />
              <TemplateCard id="text-and-image" label="Text and Image" onPick={onPickTemplate} />
              <TemplateCard id="two-column"     label="Two column"     onPick={onPickTemplate} />
              <TemplateCard id="three-column"   label="Three column"   onPick={onPickTemplate} />
            </PickerGroup>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab pill — Figma 40000065:28575 (active) / 40000065:28579 (idle) ─────────
function PickerTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center px-3 py-1.5 rounded-[12px] border shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] transition-colors ${
        active
          ? 'bg-[#0f172a] border-[#0f172a] text-[#fafafa]'
          : 'bg-white border-[#e5e7eb] text-[#4a5565] hover:bg-slate-50'
      }`}
    >
      <span className="text-[12px] font-medium leading-5 whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
        {label}
      </span>
    </button>
  )
}

// ─── Template preview card — Figma 40000065:28501 / 28515 / 28529 / 28546 ────
// 142×92 preview tile + label. The mini-mock shapes match the Figma greyscale
// (`alpha/light/100` for filler bars, `alpha/light/200` for the heading bar,
// `neutral/100` panel background, `neutral/200` border).
function TemplateCard({ id, label, onPick }: { id: TemplateId; label: string; onPick?: (id: TemplateId) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick?.(id)}
      disabled={!onPick}
      className="flex flex-col gap-1 items-start w-[142px] rounded-[8px] transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
    >
      <div className="relative w-[142px] h-[92px] rounded-[8px] bg-[#f5f5f5] border border-[#e5e5e5] overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <TemplatePreview id={id} />
        </div>
      </div>
      <span
        className="px-2 text-[12px] font-medium leading-5 text-[#262626]"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        {label}
      </span>
    </button>
  )
}

function TemplatePreview({ id }: { id: TemplateId }) {
  // Reusable shapes
  const Heading = ({ className = '' }: { className?: string }) => (
    <div className={`h-[9px] rounded-[2px] bg-[rgba(26,26,26,0.2)] ${className}`} />
  )
  const Line = ({ className = '' }: { className?: string }) => (
    <div className={`h-[5px] rounded-[2px] bg-[rgba(26,26,26,0.09)] ${className}`} />
  )
  const TextStack = ({ className = '' }: { className?: string }) => (
    <div className={`flex flex-col gap-[6px] w-[65px] ${className}`}>
      <Heading className="w-full" />
      <div className="flex flex-col gap-[2px]">
        <Line className="w-full" /><Line className="w-full" /><Line className="w-full" /><Line className="w-full" />
      </div>
    </div>
  )
  const ImageTile = () => (
    <div className="w-[52px] h-[46px] flex items-center justify-center rounded-[2px] bg-[rgba(26,26,26,0.09)]">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="3" width="12" height="12" rx="1.5" stroke="#525252" strokeWidth="1.2"/>
        <circle cx="7" cy="7.5" r="1.2" fill="#525252"/>
        <path d="M3 13l3.5-3.5 3 3L13 8l2 2" stroke="#525252" strokeWidth="1.2" fill="none"/>
      </svg>
    </div>
  )
  const Column = () => (
    <div className="flex-1 flex flex-col gap-[2px]">
      <Line /><Line /><Line /><Line />
    </div>
  )

  if (id === 'image-and-text') {
    return (
      <div className="flex gap-[6px] items-center">
        <ImageTile />
        <TextStack />
      </div>
    )
  }
  if (id === 'text-and-image') {
    return (
      <div className="flex gap-[6px] items-center">
        <TextStack />
        <ImageTile />
      </div>
    )
  }
  if (id === 'two-column') {
    return (
      <div className="flex flex-col gap-[6px] w-[116px]">
        <Heading />
        <div className="flex gap-[6px]"><Column /><Column /></div>
      </div>
    )
  }
  // three-column
  return (
    <div className="flex flex-col gap-[6px] w-[116px]">
      <Heading />
      <div className="flex gap-[6px]"><Column /><Column /><Column /></div>
    </div>
  )
}

function PickerGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center px-3">
        <span
          className="text-[12px] font-medium leading-5 text-[#525252]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 px-1">
        {children}
      </div>
    </div>
  )
}

function PickerItem({ meta, onPick, highlighted = false }: { meta: TypeMeta; onPick: () => void; highlighted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-[6px] border border-slate-200 shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] hover:bg-[#fafafa] transition-colors w-[191.667px] ${
        highlighted ? 'bg-[#f5f5f5]' : 'bg-white'
      }`}
    >
      <span className="flex items-center p-1 rounded-[4px] bg-white shrink-0">
        <meta.Icon size={16} color="#262626" />
      </span>
      <span
        className="flex-1 min-w-0 text-left text-[12px] font-medium leading-5 text-[#262626]"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        {meta.label}
      </span>
    </button>
  )
}

function BerryItem({ onPick }: { onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-[6px] border border-[#d1ecff] bg-[#ebf6ff] shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] hover:brightness-[0.98] transition w-[191.667px]"
    >
      <span
        className="flex items-center p-1 rounded-[4px] shrink-0"
        style={{ backgroundImage: 'linear-gradient(226deg, #35B0FF 4%, #AEDFFF 94%)' }}
      >
        <IconSparkles size={16} color="white" />
      </span>
      <span
        className="flex-1 min-w-0 text-left text-[12px] font-medium leading-5 text-[#0787ff]"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        Write with Berry AI
      </span>
      <span
        className="px-1.5 py-1 rounded-[4px] border border-[#e5e5e5] text-[10px] font-medium text-[#404040] leading-none"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        AI
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BlockToolbar — Figma 2293:4535. Sits at the top of every content block.
//
// Two variants per Figma:
//   • `content` — text-style controls: Heading dropdown · A^ · B · I · U ·
//     alignment · link.
//   • `image`   — minimal: Replace · link.
//
// Optional `showAi` adds the gradient pencil-sparkle action at the far right
// (Figma 3299:18874).
// ─────────────────────────────────────────────────────────────────────────────

export type BlockToolbarVariant = 'content' | 'image'

export function BlockToolbar({
  label,
  variant = 'content',
  showAi = false,
  currentType = 'Heading 2',
  onReplaceClick,
}: {
  label: string
  variant?: BlockToolbarVariant
  showAi?: boolean
  currentType?: string
  onReplaceClick?: (e: React.MouseEvent) => void
}) {
  return (
    <div className="flex h-[60px] items-center justify-between p-3 w-full">
      {/* Left — type label, 211px column, 6px horizontal inset (Figma 2293:4488) */}
      <div className="flex items-center px-1.5 w-[211px] shrink-0">
        <p
          className="text-[16px] font-medium leading-[1.3] text-[#171717] whitespace-nowrap"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {label}
        </p>
      </div>

      {/* Right group — controls + optional AI button (gap-4, Figma 2293:4490) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-[8px]">
          {variant === 'content' ? (
            <ContentToolbarControls currentType={currentType} />
          ) : (
            <ImageToolbarControls onReplaceClick={onReplaceClick} />
          )}
        </div>

        {showAi && (
          <button
            type="button"
            title="Berry: rewrite this block"
            className="flex items-center justify-center size-[36px] rounded-[8px] border border-[#aedfff] shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)]"
            style={{
              backgroundImage:
                'linear-gradient(263.35deg, #35B0FF 27.94%, #76CDFF 93.28%)',
            }}
          >
            <PencilSparkleIcon />
          </button>
        )}
      </div>
    </div>
  )
}

function ContentToolbarControls({ currentType = 'Heading 2' }: { currentType?: string }) {
  return (
    <>
      {/* Heading-style dropdown — Figma 2293:4603 */}
      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] hover:bg-slate-100 transition-colors"
      >
        <span
          className="text-[12px] font-medium leading-[1.5] text-[#1e293b] whitespace-nowrap"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {currentType}
        </span>
        <ChevronDownSmall />
      </button>

      <ToolbarDivider />

      {/* Text color — Figma 2293:4500 */}
      <ToolbarIconButton ariaLabel="Text color">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 13L6.5 4h.9l3.5 9" stroke="#171717" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.3 10.5h5.4" stroke="#171717" strokeWidth="1.3" strokeLinecap="round" />
          <rect x="3" y="13.5" width="10" height="1.5" rx="0.4" fill="#0787ff" />
        </svg>
      </ToolbarIconButton>

      {/* Bold — Figma 2293:4502 */}
      <ToolbarIconButton ariaLabel="Bold">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4.5 3h4a2 2 0 010 4H4.5V3zM4.5 7h4.5a2 2 0 010 4H4.5V7z" stroke="#171717" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </ToolbarIconButton>

      {/* Italic — Figma 2293:4504 */}
      <ToolbarIconButton ariaLabel="Italic">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6.5 3h6M3.5 13h6M9.5 3l-3 10" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolbarIconButton>

      {/* Underline — Figma 2293:4506 */}
      <ToolbarIconButton ariaLabel="Underline">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 3v5a4 4 0 008 0V3M3 13.5h10" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </ToolbarIconButton>

      {/* Alignment dropdown — Figma 2385:10749 */}
      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] hover:bg-slate-100 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3.5h10M2 7h7M2 10.5h10" stroke="#171717" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <ChevronDownSmall />
      </button>

      <ToolbarDivider />

      {/* Link — Figma 2293:4515 */}
      <ToolbarIconButton ariaLabel="Link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6.5 9.5l3-3M5 8l-1 1a2.83 2.83 0 004 4l1-1M10 6l1-1a2.83 2.83 0 00-4-4L6 2" stroke="#171717" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </ToolbarIconButton>
    </>
  )
}

function ImageToolbarControls({
  onReplaceClick,
}: {
  onReplaceClick?: (e: React.MouseEvent) => void
}) {
  return (
    <>
      {/* Replace pill — Figma 2293:4629 */}
      <button
        type="button"
        onClick={onReplaceClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] hover:bg-slate-100 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 4h7l-1.5-1.5M11.5 10h-7l1.5 1.5" stroke="#1e293b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className="text-[12px] font-medium leading-[1.5] text-[#1e293b] whitespace-nowrap"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Replace
        </span>
      </button>

      <ToolbarDivider />

      {/* Link — Figma 2293:4564 */}
      <ToolbarIconButton ariaLabel="Link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6.5 9.5l3-3M5 8l-1 1a2.83 2.83 0 004 4l1-1M10 6l1-1a2.83 2.83 0 00-4-4L6 2" stroke="#171717" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </ToolbarIconButton>
    </>
  )
}

function ToolbarIconButton({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="flex items-center justify-center p-1.5 rounded-[4px] hover:bg-slate-100 transition-colors"
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return (
    <div className="flex items-center h-5 px-1">
      <div className="w-px h-full bg-[#f5f5f5] rounded-[6px]" />
    </div>
  )
}

function ChevronDownSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 5l4 4 4-4" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PencilSparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M13.5 3.5l3 3-9 9-3.5.5.5-3.5 9-9z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M15.5 4.5l1.5-1.5M2 5l1.2 1.2M5 2l-1.2 1.2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ContentImageSection — Figma 2293:4390. The inner body of a filled block.
//
// `state` matches the Figma variant set. The component renders the right
// shape for the block kind:
//   • Content           — paragraph text editor + AI hint
//   • Image             — image preview + ALT/Caption/Credit + suggested grid
//   • Empty             — placeholder copy for a brand-new description
//   • Image and content — image upload + passage editor side-by-side
//   • Text and image    — short title editor + image upload side-by-side
// ─────────────────────────────────────────────────────────────────────────────

export type ContentSectionState =
  | 'content'
  | 'image'
  | 'empty'
  | 'image-and-content'
  | 'text-and-image'

export function ContentImageSection({
  state,
  value,
  onChange,
  showAiSuggestion = true,
  autoFocus = false,
  placeholder,
}: {
  state: ContentSectionState
  value: string
  onChange: (v: string) => void
  showAiSuggestion?: boolean
  autoFocus?: boolean
  placeholder?: string
}) {
  // Outer wrapper varies per state per Figma 2293:4389/4391/5204/16318/16430
  const wrapperBase = 'bg-white border-[#f5f5f5] flex flex-col items-start p-6 relative w-full'
  const wrapperVariant =
    state === 'image'
      ? 'border border-[#e5e5e5] rounded-[8px]'
      : state === 'empty'
      ? 'border-t border-[#f5f5f5] rounded-[8px] gap-3'
      : state === 'text-and-image'
      ? 'border-t border-[#f5f5f5] rounded-[8px]'
      : state === 'image-and-content'
      ? 'border border-[#e5e5e5] rounded-[8px]'
      : 'border border-[#e5e5e5] shadow-[0px_0px_4px_0px_rgba(31,38,54,0.04)] rounded-[10px]'

  if (state === 'empty') {
    return (
      <div className={`${wrapperBase} ${wrapperVariant}`}>
        <div className="flex items-start w-full">
          <p
            className="flex-1 text-[16px] leading-[1.5] text-[rgba(26,26,26,0.48)]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {placeholder ?? 'Enter the full news description here — summarize the story, highlight key updates, important details, and provide readers with clear context about the article. Keep the content informative, engaging, and easy to read.'}
          </p>
        </div>
        {showAiSuggestion && <AiHint />}
      </div>
    )
  }

  if (state === 'image') {
    return (
      <div className={`${wrapperBase} ${wrapperVariant}`}>
        <div className="flex gap-4 items-start w-full">
          <ImagePreview />
          <div className="flex flex-1 min-w-0 flex-col items-start justify-between self-stretch">
            <ImageMetaFields />
            <SuggestedImages />
          </div>
        </div>
      </div>
    )
  }

  if (state === 'image-and-content') {
    return (
      <div className={`${wrapperBase} ${wrapperVariant}`}>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex gap-6 items-start w-full">
            <ImageUploadDropzone size="lg" />
            <div className="flex-1 min-w-0 border border-[#e5e5e5] rounded-[8px] bg-white p-4 h-[269px] overflow-y-auto">
              <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Passage here.."
                autoFocus={autoFocus}
                className="w-full h-full bg-transparent outline-none resize-none text-[14px] leading-[1.5] tracking-[-0.14px] text-[rgba(26,26,26,0.6)] placeholder:text-[rgba(26,26,26,0.6)]"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>
          </div>
          {showAiSuggestion && <AiHint />}
        </div>
      </div>
    )
  }

  if (state === 'text-and-image') {
    return (
      <div className={`${wrapperBase} ${wrapperVariant}`}>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex gap-4 items-start w-full">
            <div className="flex-1 min-w-0 border border-[#e5e5e5] rounded-[6px] bg-white p-4 h-[269px]">
              <div className="flex items-center justify-center border-b border-[rgba(26,26,26,0.06)] h-[40px] pb-2 w-full">
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  placeholder="Supporting title"
                  autoFocus={autoFocus}
                  className="flex-1 w-full bg-transparent outline-none text-[14px] leading-[1.5] tracking-[-0.14px] text-[#171717] placeholder:text-[rgba(26,26,26,0.2)] text-center"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
              </div>
            </div>
            <ImageUploadDropzone size="lg" />
          </div>
          {showAiSuggestion && <AiHint />}
        </div>
      </div>
    )
  }

  // 'content' — default text editor
  return (
    <div className={`${wrapperBase} ${wrapperVariant}`}>
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-start w-full">
          <AutosizingTextarea
            value={value}
            onChange={onChange}
            placeholder={placeholder ?? 'Enter the full news description here — summarize the story, highlight key updates, important details, and provide readers with clear context about the article. Keep the content informative, engaging, and easy to read.'}
            autoFocus={autoFocus}
            className="text-[16px] leading-[1.5] text-[#262626]"
          />
        </div>
        {showAiSuggestion && <AiHint />}
      </div>
    </div>
  )
}

function AiHint() {
  return (
    <div className="flex items-center w-full">
      <p
        className="text-[14px] leading-[1.5] tracking-[-0.14px] text-[#737373] whitespace-nowrap"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        Press &lsquo;Space&rsquo; for AI or &lsquo;/&rsquo; for Quick property..
      </p>
    </div>
  )
}

function AutosizingTextarea({
  value, onChange, placeholder, className = '', autoFocus = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const ta = ref.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [value])
  useEffect(() => { if (autoFocus) ref.current?.focus() }, [autoFocus])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`w-full bg-transparent outline-none resize-none placeholder:text-[#a3a3a3] ${className}`}
      style={{ fontFamily: 'var(--font-inter)' }}
    />
  )
}

// ── Image building blocks — preview, meta inputs, suggested grid, dropzone ──

function ImagePreview() {
  // Solid gradient stand-in keeps the layout dimensions exact even when the
  // Figma-hosted asset link expires. Replace with the user's chosen image
  // once upload is wired.
  return (
    <div className="relative shrink-0 h-[330px] w-[585px] rounded-[6px] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #b91c1c 0%, #ef4444 45%, #b45309 100%)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="1.6" />
          <path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2" fill="white" />
        </svg>
      </div>
    </div>
  )
}

function ImageMetaField({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2 h-[40px] px-3 py-2.5 w-full border-b border-[#e2e8f0] shadow-[0px_1px_0.5px_rgba(29,41,61,0.02)]">
      <input
        placeholder={placeholder}
        className="flex-1 min-w-0 text-[14px] leading-[1.2] bg-transparent outline-none text-[#171717] placeholder:text-[#a3a3a3]"
        style={{ fontFamily: 'var(--font-inter)' }}
      />
    </div>
  )
}

function ImageMetaFields() {
  return (
    <div className="flex flex-col gap-2 items-start justify-end w-full">
      <ImageMetaField placeholder="ALT tag" />
      <ImageMetaField placeholder="Caption" />
      <ImageMetaField placeholder="Photo Credit" />
    </div>
  )
}

function SuggestedImages() {
  // Six 98×75 thumbnails per Figma 2293:4421 — wired to placeholder swatches
  // until the suggestion endpoint lands.
  const swatches = [
    'linear-gradient(135deg, #f97316, #be185d)',
    'linear-gradient(135deg, #0ea5e9, #1e3a8a)',
    'linear-gradient(135deg, #404040, #171717)',
    'linear-gradient(135deg, #dc2626, #7c2d12)',
    'linear-gradient(135deg, #475569, #0f172a)',
    'linear-gradient(135deg, #0d9488, #14532d)',
  ]
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between w-full">
        <p
          className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#171717]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Suggested image
        </p>
        <button type="button" className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11 3l2 2-2 2M11 9l2 2-2 2M3 5l8 0M3 11l4 0M9 11l-2.5-3" stroke="#171717" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#171717]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Shuffle
          </span>
        </button>
      </div>
      <div className="flex flex-wrap gap-3 items-start h-[162px] w-full">
        {swatches.map((g, i) => (
          <div
            key={i}
            className="aspect-[98/75] h-[75px] rounded-[4px] shrink-0"
            style={{ background: g }}
          />
        ))}
      </div>
    </div>
  )
}

function ImageUploadDropzone({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const isLg = size === 'lg'
  return (
    <div
      className={`relative bg-[#f8fafc] border border-dashed border-[#e5e5e5] rounded-[8px] shrink-0 ${
        isLg ? 'h-[269px] w-[396px]' : 'h-[174px] w-[310px]'
      }`}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-3 items-center w-[216px]">
        <div
          className="flex items-center justify-center p-3 rounded-[12px] border-2 border-white drop-shadow-[0px_0px_4px_rgba(17,24,39,0.08)]"
          style={{
            backgroundImage: 'linear-gradient(155deg, #dbeafe 8%, #bfdbfe 88%)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 12V3M5 6l4-4 4 4" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 13v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex flex-col gap-1 items-center w-full">
          <p
            className="text-[14px] font-semibold leading-[1.5] text-[#171717] whitespace-nowrap"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Drop an image, or click to upload
          </p>
          <p
            className="text-[12px] leading-[1.5] text-[#737373] text-center w-full"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            PNG, JPG, WEBP &mdash;up to 8MP
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ContentBlock — Figma 2293:4328. The block wrapper that frames the toolbar
// + body. Uses Default state when there's no toolbar (initial empty), or
// Filled when a section type has been chosen.
//
// Exposed as `BlockEditor` to keep the existing import surface, but the
// internal structure now mirrors the Figma component exactly.
// ─────────────────────────────────────────────────────────────────────────────

// Maps a Section.type to the ContentImageSection state + toolbar label/variant
// used to render it. Anything not listed falls back to a Content body.
function blockRenderConfig(type: SectionType): {
  bodyState: ContentSectionState
  toolbarVariant: BlockToolbarVariant
  label: string
} {
  switch (type) {
    case 'image':
      return { bodyState: 'image', toolbarVariant: 'image', label: 'Image' }
    case 'normal':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Paragraph' }
    case 'h1':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Heading 1' }
    case 'h2':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Heading 2' }
    case 'h3':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Heading 3' }
    case 'quote':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Pull quote' }
    case 'embed':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Embed link' }
    case 'numbered':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Numbered list' }
    case 'bullet':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Bulleted list' }
    case 'file':
      return { bodyState: 'image-and-content', toolbarVariant: 'image', label: 'File attachment' }
    case 'berry':
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Berry draft' }
    default:
      return { bodyState: 'content', toolbarVariant: 'content', label: 'Paragraph' }
  }
}

export function BlockEditor({
  block,
  isActive,
  onFocus,
  onChange,
  onReplaceRequest,
  onTemplateCellChange,
  onTemplateImageChange,
}: {
  block: Section
  isActive: boolean
  onFocus: () => void
  onChange: (content: string) => void
  onReplaceRequest: (anchor: PickerAnchor) => void
  onTemplateCellChange?: (cellIndex: number, value: string) => void
  onTemplateImageChange?: (url: string | undefined) => void
}) {
  const cfg = blockRenderConfig(block.type)

  function handleReplaceTpl(e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onReplaceRequest({ top: r.bottom + 6, left: r.left, triggerTop: r.top })
  }

  // Templates use the SAME outer block wrapper (neutral-100 panel + thin
  // border + 2px inset) and the SAME BlockToolbar as every other block, so
  // they read as siblings in the editor list. Only the body differs.
  if (block.type === 'tpl-img-txt' || block.type === 'tpl-txt-img' || block.type === 'tpl-3col') {
    const label = block.type === 'tpl-img-txt' ? 'Image and Text'
                : block.type === 'tpl-txt-img' ? 'Text and Image'
                : 'Three column'
    return (
      <div
        onClick={onFocus}
        className="flex flex-col items-center w-full border border-[#e5e5e5] rounded-[12px] overflow-hidden bg-[#f5f5f5] p-[2px]"
      >
        <BlockToolbar
          label={label}
          variant="image"
          showAi={false}
          onReplaceClick={handleReplaceTpl}
        />
        <TemplateBlock
          block={block}
          onCellChange={onTemplateCellChange}
          onImageChange={onTemplateImageChange}
        />
      </div>
    )
  }

  function handleReplace(e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onReplaceRequest({ top: r.bottom + 6, left: r.left, triggerTop: r.top })
  }

  // Filled wrapper per Figma 2293:4327 — neutral-100 background with 2px
  // padding so the inner toolbar/body cards float on a thin border-like band.
  return (
    <div
      onClick={onFocus}
      className="flex flex-col items-center w-full border border-[#e5e5e5] rounded-[12px] overflow-hidden bg-[#f5f5f5] p-[2px]"
    >
      <BlockToolbar
        label={cfg.label}
        variant={cfg.toolbarVariant}
        showAi={isActive && cfg.toolbarVariant === 'content'}
        onReplaceClick={handleReplace}
      />
      <BlockTypeBody
        type={block.type}
        bodyState={cfg.bodyState}
        value={block.title}
        onChange={onChange}
        autoFocus={isActive}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Template block — side-by-side cells matching Figma 40000081:28825 (three
// column) and 2752:16318 (image+text). Each cell is a self-contained card so
// the user can fill cells independently. Image cells expose the same "Drop /
// click to upload" affordance as the standalone Image block, but laid out at
// half-width inside the row.
// ─────────────────────────────────────────────────────────────────────────────
function TemplateBlock({
  block,
  onCellChange,
  onImageChange,
}: {
  block: Section
  onCellChange?: (cellIndex: number, value: string) => void
  onImageChange?: (url: string | undefined) => void
}) {
  const isImgTxt = block.type === 'tpl-img-txt'
  const isTxtImg = block.type === 'tpl-txt-img'
  const isThreeCol = block.type === 'tpl-3col'
  const cells = block.cells ?? []

  const handleImagePick = () => {
    if (!onImageChange) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) onImageChange(URL.createObjectURL(file))
    }
    input.click()
  }

  const PassageCell = ({ index }: { index: number }) => (
    <div className="flex-1 min-w-0 bg-white border border-[#e5e5e5] rounded-[12px] p-4">
      <textarea
        value={cells[index] ?? ''}
        onChange={e => onCellChange?.(index, e.target.value)}
        placeholder="Passage here.."
        rows={6}
        className="w-full bg-transparent outline-none resize-none text-[14px] leading-[1.5] tracking-[-0.14px] text-[#171717] placeholder:text-[#94a3b8]"
        style={{ fontFamily: 'var(--font-inter)' }}
      />
    </div>
  )

  const ImageCell = () => (
    <div
      onClick={handleImagePick}
      className="flex-1 min-w-0 h-[280px] flex flex-col items-center justify-center gap-2 bg-[#f8fafc] border border-[#e5e5e5] rounded-[12px] cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden"
    >
      {block.imageUrl ? (
        <img src={block.imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <>
          <div className="flex items-center justify-center size-10 rounded-[10px] bg-[#dbeafe]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 12V4M9 4l-3 3M9 4l3 3M3 12v1.5A1.5 1.5 0 004.5 15h9a1.5 1.5 0 001.5-1.5V12" stroke="#0787ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[14px] font-medium text-[#171717]" style={{ fontFamily: 'var(--font-inter)' }}>
            Drop an image, or click to upload
          </p>
          <p className="text-[12px] text-[#737373]" style={{ fontFamily: 'var(--font-inter)' }}>
            PNG, JPG, WEBP — up to 8MP
          </p>
        </>
      )}
    </div>
  )

  // Inner white card mirrors the body card every other block uses (see the
  // ContentImageSection wrapper). The toolbar above already lives in the
  // parent BlockEditor.
  return (
    <div className="flex flex-col gap-2 w-full bg-white rounded-[10px] p-4">
      <div className="flex gap-3 w-full items-stretch">
        {isImgTxt && (<><ImageCell /><PassageCell index={0} /></>)}
        {isTxtImg && (<><PassageCell index={0} /><ImageCell /></>)}
        {isThreeCol && (<><PassageCell index={0} /><PassageCell index={1} /><PassageCell index={2} /></>)}
      </div>
      <p
        className="text-[12px] text-[#94a3b8] px-1"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        Press &lsquo;Space&rsquo; for AI or &lsquo;/&rsquo; for commands..
      </p>
    </div>
  )
}

// Per-type body rendering layered on top of ContentImageSection. Headings,
// quote, embed, lists all share the Content state but with type-specific
// typography and placeholders applied to the textarea.
function BlockTypeBody({
  type, bodyState, value, onChange, autoFocus,
}: {
  type: SectionType
  bodyState: ContentSectionState
  value: string
  onChange: (v: string) => void
  autoFocus: boolean
}) {
  // Headings, quote, embed, lists: render the Content state with a
  // type-styled textarea instead of the default paragraph styling.
  if (bodyState === 'content' && type !== 'normal') {
    return <TypedContentBody type={type} value={value} onChange={onChange} autoFocus={autoFocus} />
  }
  return (
    <ContentImageSection
      state={bodyState}
      value={value}
      onChange={onChange}
      autoFocus={autoFocus}
    />
  )
}

function TypedContentBody({
  type, value, onChange, autoFocus,
}: {
  type: SectionType
  value: string
  onChange: (v: string) => void
  autoFocus: boolean
}) {
  const { className, placeholder } = (() => {
    switch (type) {
      case 'h1': return { className: 'text-[28px] font-medium leading-[1.25] text-[#171717]', placeholder: 'Heading 1' }
      case 'h2': return { className: 'text-[22px] font-medium leading-[1.3] text-[#171717]', placeholder: 'Heading 2' }
      case 'h3': return { className: 'text-[18px] font-medium leading-[1.35] text-[#171717]', placeholder: 'Heading 3' }
      case 'quote': return { className: 'text-[18px] italic leading-[1.5] text-[#171717] border-l-[3px] border-[#0787ff] pl-4', placeholder: 'Pull a quote…' }
      case 'embed': return { className: 'text-[14px] leading-[1.5] text-[#171717]', placeholder: 'Paste a link to embed…' }
      case 'numbered': return { className: 'text-[16px] leading-[1.6] text-[#171717]', placeholder: '1. Type list item, press Enter for next' }
      case 'bullet': return { className: 'text-[16px] leading-[1.6] text-[#171717]', placeholder: '• Type list item, press Enter for next' }
      case 'berry': return { className: 'text-[16px] leading-[1.6] text-[#171717]', placeholder: 'Berry is drafting from your sources…' }
      default: return { className: 'text-[16px] leading-[1.5] text-[#171717]', placeholder: 'Type something…' }
    }
  })()

  return (
    <div className="bg-white border border-[#e5e5e5] shadow-[0px_0px_4px_0px_rgba(31,38,54,0.04)] rounded-[10px] flex flex-col items-start p-6 w-full">
      <div className="flex flex-col gap-3 w-full">
        <AutosizingTextarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={className}
        />
        <AiHint />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyBlockPlaceholder — Figma 2293:5210 (ContentBlock Default state).
// Shown above the picker before any block exists; clicking it opens the
// section picker so the user can pick the first block type.
// ─────────────────────────────────────────────────────────────────────────────

export function EmptyBlockPlaceholder({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="w-full border border-[#e5e5e5] rounded-[12px] overflow-hidden bg-[#f8fafc] cursor-text"
    >
      <div className="bg-[#fafafa] border border-[#f5f5f5] rounded-[8px] p-4 m-0 flex flex-col gap-3 w-full">
        <p
          className="text-[16px] leading-[1.5] text-[#a3a3a3]"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Enter the full news description here &mdash; summarize the story, highlight key updates, important details, and provide readers with clear context about the article. Keep the content informative, engaging, and easy to read.
        </p>
        <div className="flex items-center h-8">
          <p
            className="text-[14px] leading-[1.5] tracking-[-0.14px] text-[#737373] whitespace-nowrap"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Press &lsquo;Space&rsquo; for AI or &lsquo;/&rsquo; for Quick property..
          </p>
        </div>
      </div>
    </div>
  )
}
