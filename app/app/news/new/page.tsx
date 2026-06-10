'use client'

import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import {
  LeftViewToggle, TableOfContents, SectionPicker, BlockEditor, EmptyBlockPlaceholder,
  type Section, type SectionType, type LeftPanelView, type PickerAnchor,
} from './toc'

// ── Figma asset URLs ───────────────────────────────────────────────────────────
const LOGO          = 'https://www.figma.com/api/mcp/asset/0979b626-e0e5-4aa9-95ee-0a0a3472c900'
const ICON_SPARKLES = 'https://www.figma.com/api/mcp/asset/99576e04-3330-43fc-a792-7bca2aca0617'
const ICON_PLAY     = 'https://www.figma.com/api/mcp/asset/db081b88-b7bc-476c-accf-5b92c9edc8a1'

// ── Author data ────────────────────────────────────────────────────────────────
const AUTHORS = [
  { id: '1', name: 'अर्जुन पौडेल',   avatar: 'https://www.figma.com/api/mcp/asset/63644c82-f70a-4673-b622-070cdc5195e1' },
  { id: '2', name: 'बिपिन कार्की',   avatar: 'https://www.figma.com/api/mcp/asset/f9a95292-44f2-47b1-bca5-6aee833cd7c7' },
  { id: '3', name: 'कुशल अधिकारी',  avatar: 'https://www.figma.com/api/mcp/asset/065c3090-3c17-4266-8fd6-d521d651ffcf' },
  { id: '4', name: 'प्रतिक खड्का',   avatar: 'https://www.figma.com/api/mcp/asset/f22e42b3-bf42-4918-b080-ff6dce96dba9' },
  { id: '5', name: 'स्मृति थापा',    avatar: 'https://www.figma.com/api/mcp/asset/97607603-fd94-4df7-a1e2-1e2506d0de6b' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
type SourceFile = {
  id: string
  name: string
  type: string
  date: string
  size: string
  url?: string
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IconPlus({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconChevronDown({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClose({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconUpload({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 12V3M5 6l4-4 4 4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconImport({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 3v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconSidebar({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="#64748B" strokeWidth="1.5" />
      <path d="M6 2v12" stroke="#64748B" strokeWidth="1.5" />
    </svg>
  )
}

function IconTrash({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2 4h10M5 4V3h4v1M4 4l.5 7h5L10 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconLink({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M5.5 8.5l3-3M4 7l-1 1a2.83 2.83 0 004 4l1-1M9 5l1-1a2.83 2.83 0 00-4-4L5 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

// ── File icon (blue document matching Figma) ───────────────────────────────────
function FileIcon({ type = 'text' }: { type?: 'text' | 'link' | 'pdf' }) {
  const bg = type === 'link' ? '#6366F1' : '#2979FF'
  return (
    <div
      className="relative size-[36px] shrink-0 rounded-[7px] overflow-hidden flex items-center justify-center"
      style={{ background: bg }}
    >
      {/* corner fold */}
      <div className="absolute top-0 right-0 w-[9px] h-[9px]" style={{
        background: 'rgba(255,255,255,0.25)',
        clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
      }} />
      {type === 'link' ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 10l4-4M4.5 8.5l-1 1a3 3 0 004.24 4.24l1-1M9.5 5.5l1-1a3 3 0 00-4.24-4.24l-1 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 2h6L13 5.5V14a.5.5 0 01-.5.5h-9A.5.5 0 013 14V2.5A.5.5 0 013.5 2z" stroke="white" strokeWidth="1.2" fill="none" />
          <path d="M9.5 2v3.5H13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M5.5 8.5h5M5.5 11h3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

// ── Dot separator ─────────────────────────────────────────────────────────────
function Dot() {
  return <span className="text-[#a3a3a3] text-[10px] leading-none select-none">·</span>
}

// View toggle moved to ./toc.tsx (LeftViewToggle) — controlled by the page
// so AddSourcePanel and TableOfContents can share the same tab state.

// ── Doc illustration SVG ──────────────────────────────────────────────────────
// 3-document stack — Figma project-knowledge icon (40000003:34631).
// Rendered at native 85×45 so spacing matches the modal proportions.
function DocStackIcon() {
  return (
    <svg width="85" height="46" viewBox="0 0 85 46" fill="none" aria-hidden>
      {/* Bottom-left doc — slight tilt */}
      <g transform="translate(6 18) rotate(-8)">
        <rect x="0.5" y="0.5" width="22" height="24" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M16 0v6h6" stroke="#cbd5e1" strokeWidth="1" fill="#f1f5f9" />
        <path d="M4 10h14M4 13h12M4 16h10M4 19h8" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
      </g>
      {/* Middle doc — flat */}
      <g transform="translate(31 16)">
        <rect x="0.5" y="0.5" width="22" height="24" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M16 0v6h6" stroke="#cbd5e1" strokeWidth="1" fill="#f1f5f9" />
        <path d="M4 10h14M4 13h12M4 16h10M4 19h8" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
      </g>
      {/* Top-right doc — slight tilt, blue tint */}
      <g transform="translate(55 14) rotate(8)">
        <rect x="0.5" y="0.5" width="22" height="24" rx="3" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
        <path d="M16 0v6h6" stroke="#bfdbfe" strokeWidth="1" fill="#dbeafe" />
        <path d="M4 10h14M4 13h12M4 16h10M4 19h8" stroke="#93c5fd" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  )
}

function DocIllustration() {
  return (
    <svg width="117" height="62" viewBox="0 0 117 62" fill="none">
      {/* shadow/base */}
      <rect x="36" y="10" width="44" height="48" rx="4" fill="#D8E9FF" />
      {/* back-right page */}
      <rect x="64" y="6" width="38" height="50" rx="4" fill="#EEF5FF" stroke="#D4E4FF" strokeWidth="0.8" />
      <path d="M88 6h10a4 4 0 014 4v4H88V6z" fill="#D4E4FF" />
      <rect x="69" y="22" width="22" height="2.5" rx="1.2" fill="#BAD0FA" />
      <rect x="69" y="28" width="18" height="2" rx="1" fill="#CCDCFC" />
      <rect x="69" y="33" width="20" height="2" rx="1" fill="#CCDCFC" />
      {/* back-left page */}
      <rect x="15" y="6" width="38" height="50" rx="4" fill="#EEF5FF" stroke="#D4E4FF" strokeWidth="0.8" />
      <path d="M39 6h10a4 4 0 014 4v4H39V6z" fill="#D4E4FF" />
      <rect x="20" y="22" width="22" height="2.5" rx="1.2" fill="#BAD0FA" />
      <rect x="20" y="28" width="14" height="2" rx="1" fill="#CCDCFC" />
      <rect x="20" y="33" width="18" height="2" rx="1" fill="#CCDCFC" />
      {/* front center page */}
      <rect x="39" y="2" width="40" height="54" rx="4" fill="white" stroke="#D4E4FF" strokeWidth="0.8" />
      <path d="M65 2h10a4 4 0 014 4v4H65V2z" fill="#D4E4FF" />
      <rect x="45" y="20" width="24" height="3" rx="1.5" fill="#93B8F8" />
      <rect x="45" y="27" width="20" height="2" rx="1" fill="#C9D9FB" />
      <rect x="45" y="32" width="24" height="2" rx="1" fill="#C9D9FB" />
      <rect x="45" y="37" width="16" height="2" rx="1" fill="#C9D9FB" />
    </svg>
  )
}

// ── Source file row ───────────────────────────────────────────────────────────
function SourceRow({ source, onRemove }: { source: SourceFile; onRemove: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`flex items-center gap-2 px-2 py-[6px] rounded-[8px] group cursor-pointer transition-colors ${hovered ? 'bg-slate-50' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <FileIcon type={source.type === 'link' ? 'link' : 'text'} />
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p
          className="text-[14px] font-medium leading-[1.5] text-[#171717] truncate"
          style={{ fontFamily: 'var(--font-inter)' }}
          title={source.name}
        >
          {source.name}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] leading-[1.5] text-[#737373]" style={{ fontFamily: 'var(--font-inter)' }}>
            {source.type === 'link' ? 'Web link' : 'Text file'}
          </span>
          <Dot />
          <span className="text-[12px] leading-[1.5] text-[#737373]" style={{ fontFamily: 'var(--font-inter)' }}>
            {source.date}
          </span>
          <Dot />
          <span className="text-[12px] leading-[1.5] text-[#737373]" style={{ fontFamily: 'var(--font-inter)' }}>
            {source.size}
          </span>
        </div>
      </div>
      {/* Remove button — visible on hover */}
      <button
        className={`shrink-0 flex items-center justify-center size-6 rounded-[6px] transition-all ${hovered ? 'opacity-100 bg-red-50 hover:bg-red-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => { e.stopPropagation(); onRemove(source.id) }}
        title="Remove source"
      >
        <IconTrash size={13} className="text-red-400" />
      </button>
    </div>
  )
}

// ── Drop zone ─────────────────────────────────────────────────────────────────
function DropZone({ onOpenModal, onFileDrop }: { onOpenModal: () => void; onFileDrop: (files: FileList) => void }) {
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) onFileDrop(e.dataTransfer.files)
  }

  return (
    <div
      className={`flex flex-col gap-5 items-center justify-center p-4 rounded-[12px] border border-dashed transition-colors cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-50/60' : 'border-slate-200'}`}
      style={{
        minHeight: 202,
        backgroundImage: dragOver
          ? undefined
          : `url("data:image/svg+xml;utf8,<svg viewBox='0 0 283 202' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='141.5' cy='-10' r='180'><stop stop-color='rgba(3,181,237,0.09)' offset='0'/><stop stop-color='rgba(3,181,237,0)' offset='1'/></radialGradient></defs></svg>")`
      }}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={onOpenModal}
    >
      <div className="flex flex-col gap-2 items-center w-full">
        <DocIllustration />
        <p
          className="text-[12px] leading-[1.5] text-center text-[#737373]"
          style={{ fontFamily: 'var(--font-inter)', maxWidth: 211 }}
        >
          Add PDFs, documents, or other text to reference in this article.
        </p>
      </div>
      <button
        className="flex items-center justify-center w-full px-3 py-[6px] rounded-[8px] bg-white border border-slate-200 shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] hover:bg-slate-50 transition-colors"
        onClick={e => { e.stopPropagation(); onOpenModal() }}
      >
        <span
          className="text-[12px] font-medium leading-[1.5] text-slate-800"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Click here to add source
        </span>
      </button>
    </div>
  )
}

// ── Add source panel (middle) ─────────────────────────────────────────────────
function AddSourcePanel({
  onOpenModal,
  sources,
  onRemoveSource,
  onFileDrop,
  view,
  onChangeView,
  sections,
  activeSectionId,
  onSelectSection,
  onReorderSections,
  onRequestAddSection,
}: {
  onOpenModal: () => void
  sources: SourceFile[]
  onRemoveSource: (id: string) => void
  onFileDrop: (files: FileList) => void
  view: LeftPanelView
  onChangeView: (v: LeftPanelView) => void
  sections: Section[]
  activeSectionId: string | null
  onSelectSection: (id: string) => void
  onReorderSections: (from: number, to: number) => void
  onRequestAddSection: (anchor: PickerAnchor) => void
}) {
  const [showAICard, setShowAICard] = useState(true)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[70px] border-b border-slate-200 shrink-0">
        <button className="flex items-center justify-center size-[36px] rounded-[8px] hover:bg-slate-100 transition-colors">
          <IconSidebar size={16} />
        </button>
        <LeftViewToggle value={view} onChange={onChangeView} />
      </div>

      {view === 'toc' ? (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <TableOfContents
            sections={sections}
            activeId={activeSectionId}
            onSelect={onSelectSection}
            onReorder={onReorderSections}
            onAddRequest={onRequestAddSection}
          />
        </div>
      ) : (
      /* Body — flex-col, inner content grows, AI card pins to bottom */
      <div className="flex flex-col flex-1 gap-6 p-4 overflow-y-auto min-h-0">

        {/* Top section — grows to fill space */}
        <div className="flex flex-col flex-1 gap-4 min-h-0">

          {/* "Add source" label */}
          <p
            className="text-[14px] font-medium leading-[1.3] text-[#171717] px-2"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Add source
          </p>

          {/* Drop zone */}
          <DropZone onOpenModal={onOpenModal} onFileDrop={onFileDrop} />

          {/* Only show linked sources section when there are sources */}
          {sources.length > 0 && (
            <>
              <div className="w-full h-px bg-slate-200 shrink-0" />

              {/* "Linked sources" label + count */}
              <div className="flex items-center justify-between px-2">
                <p
                  className="text-[14px] font-medium leading-[1.3] text-[#171717]"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Linked sources
                </p>
                <span
                  className="text-[11px] font-medium text-[#737373] bg-slate-100 rounded-full px-2 py-0.5 leading-none"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {sources.length}
                </span>
              </div>

              {/* Source rows */}
              <div className="flex flex-col gap-0.5">
                {sources.map(src => (
                  <SourceRow key={src.id} source={src} onRemove={onRemoveSource} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Berry AI card — pinned to bottom */}
        {showAICard && (
          <div
            className="relative flex flex-col gap-4 p-3 rounded-[16px] border border-slate-200 shrink-0"
            style={{ background: 'linear-gradient(135deg, #eff8ff 0%, #e8f4ff 100%)' }}
          >
            {/* Close */}
            <button
              className="absolute top-2 right-2 flex items-center justify-center size-7 rounded-[8px] hover:bg-blue-100 transition-colors"
              onClick={() => setShowAICard(false)}
            >
              <IconClose size={14} className="text-slate-500" />
            </button>

            <div className="flex flex-col gap-3">
              {/* Sparkle badge */}
              <div className="flex items-center p-1.5 bg-[#d1ecff] rounded-[6px] w-fit">
                <img src={ICON_SPARKLES} alt="" className="size-5 object-contain" />
              </div>
              <div className="flex flex-col gap-1">
                <p
                  className="text-[16px] font-semibold leading-[1.4] text-[#171717] pr-6"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  From sources to story.
                </p>
                <p
                  className="text-[13px] leading-[1.5] text-[#737373]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Upload docs, audio, video, or links. Berry drafts a news article quickly.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#aedfff]"
                style={{ background: 'linear-gradient(243.79deg, #35B0FF 27.94%, #76CDFF 93.28%)' }}
                onClick={onOpenModal}
              >
                <img src={ICON_SPARKLES} alt="" className="size-3.5 object-contain brightness-[10]" />
                <span
                  className="text-[12px] font-medium leading-5 text-white whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Use berry AI
                </span>
              </button>
              <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                <img src={ICON_PLAY} alt="" className="size-3.5 object-contain" />
                <span
                  className="text-[12px] font-medium leading-5 text-slate-800 whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Watch demo
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}

// ── Metadata row ──────────────────────────────────────────────────────────────
function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-[54px] py-1 w-full">
      <div className="flex items-center gap-1.5 w-[113px] shrink-0 pt-1">
        {icon}
        <span
          className="text-[14px] font-medium leading-[1.25] text-[#404040] tracking-[-0.14px] whitespace-nowrap"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

// ── AI Auto-write — Apple Intelligence-style thinking + streaming ─────────────
type AiPhase = 'idle' | 'thinking' | 'writing'

function useAiAutoWrite() {
  const [phase, setPhase] = useState<AiPhase>('idle')
  const cleanupRef = useRef<(() => void) | null>(null)

  const stop = useCallback(() => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }
    setPhase('idle')
  }, [])

  const start = useCallback((target: string, onUpdate: (t: string) => void) => {
    if (cleanupRef.current) cleanupRef.current()
    setPhase('thinking')
    onUpdate('')

    let cancelled = false
    let thinkingTimer: ReturnType<typeof setTimeout> | null = null
    let writingTimer: ReturnType<typeof setInterval> | null = null

    cleanupRef.current = () => {
      cancelled = true
      if (thinkingTimer) clearTimeout(thinkingTimer)
      if (writingTimer) clearInterval(writingTimer)
    }

    thinkingTimer = setTimeout(() => {
      if (cancelled) return
      setPhase('writing')
      let i = 0
      // Use Array.from for proper Unicode (Devanagari) grapheme handling
      const graphemes = Array.from(target)
      writingTimer = setInterval(() => {
        if (cancelled) { if (writingTimer) clearInterval(writingTimer); return }
        i++
        onUpdate(graphemes.slice(0, i).join(''))
        if (i >= graphemes.length) {
          if (writingTimer) clearInterval(writingTimer)
          setPhase('idle')
          cleanupRef.current = null
        }
      }, 32)
    }, 1100)
  }, [])

  useEffect(() => () => { if (cleanupRef.current) cleanupRef.current() }, [])

  return { phase, start, stop }
}

// Sample suggestions — in production these would be generated from source content
const SAMPLE_TITLE = 'ल्हारक्याल लामाको निजी निवासले हडपेको २ रोपनी सार्वजनिक जग्गा: खाली गर्न नगरपालिकाकै अनिच्छा'
const SAMPLE_SUBTITLE = 'नगरपालिकाले पटक पटक नोटिस दिए पनि निवास मालिकले जग्गा खाली गर्ने प्रतिबद्धता नदेखाएको स्थानीयको गुनासो'

function SparklesIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M7 1l1.05 2.45L10.5 4.5l-2.45 1.05L7 8l-1.05-2.45L3.5 4.5l2.45-1.05L7 1z" fill="white" />
      <path d="M11 8l.55 1.3L12.85 10l-1.3.7L11 12l-.55-1.3L9.15 10l1.3-.7L11 8z" fill="white" opacity="0.85" />
      <path d="M3 8.5l.4 1L4.5 10l-1.1.5L3 11.5l-.4-1L1.5 10l1.1-.5L3 8.5z" fill="white" opacity="0.7" />
    </svg>
  )
}

// ── Floating Berry toolbar (Figma 40000003:38950) ─────────────────────────────
// Appears just above the focused text field, non-disruptive. Berry writing is
// the only fully-wired action for plain-text fields; format buttons are
// visually present and ready to wire to a rich-text editor later.
function ToolbarBtn({
  onClick, children, className = '',
}: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className={`flex items-center justify-center p-[8px] rounded-[4px] hover:bg-slate-50 active:bg-slate-100 transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

function FloatingBerryToolbar({
  onBerryWrite, berryPhase,
}: { onBerryWrite: () => void; berryPhase: AiPhase }) {
  const berryActive = berryPhase !== 'idle'
  const berryLabel = berryPhase === 'thinking' ? 'Thinking' : berryPhase === 'writing' ? 'Writing' : 'Berry writing'

  return (
    <div
      className="inline-flex items-center gap-[2px] p-[4px] bg-white rounded-[8px] berry-toolbar-in"
      style={{ boxShadow: '0px 8px 12px rgba(0,0,0,0.16), 0px 0px 0.5px rgba(0,0,0,0.18)' }}
      onMouseDown={e => e.preventDefault()}
    >
      {/* Berry writing */}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onBerryWrite}
        className={`flex items-center gap-[6px] p-[8px] rounded-[6px] transition-colors ${
          berryActive ? 'bg-[#d1ecff]' : 'bg-[#ebf6ff] hover:bg-[#d1ecff]'
        }`}
      >
        {berryPhase === 'thinking' ? (
          <span className="flex items-center gap-[3px]">
            <span className="size-[4px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '0ms' }} />
            <span className="size-[4px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '180ms' }} />
            <span className="size-[4px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '360ms' }} />
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5l1.2 2.8L12 5.5l-2.8 1.2L8 9.5 6.8 6.7 4 5.5l2.8-1.2L8 1.5z" fill="#0787ff"/>
            <path d="M12.5 9l.55 1.3L14.3 11l-1.45.65L12.5 13l-.55-1.35L10.7 11l1.45-.7L12.5 9z" fill="#0787ff" opacity="0.85"/>
          </svg>
        )}
        <span
          className="text-[12px] font-medium leading-[1.2] text-[#0787ff] whitespace-nowrap"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {berryLabel}
        </span>
      </button>

      {/* Divider */}
      <div className="h-[20px] flex items-center px-[4px]"><div className="w-px h-full bg-[#f5f5f5]" /></div>

      {/* Text style dropdown */}
      <ToolbarBtn className="gap-[2px]">
        <span className="text-[12px] font-medium leading-[1.2] text-[#171717] px-[2px]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Text</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </ToolbarBtn>

      {/* A^ — text style */}
      <ToolbarBtn>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2.5 12L6 4h.8l3.5 8M3.8 9.5h5.2" stroke="#171717" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.5 3l1 2.5M11.5 5.5h2" stroke="#171717" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>

      {/* Bold */}
      <ToolbarBtn>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4.5 3h4a2 2 0 010 4H4.5V3zM4.5 7h4.5a2 2 0 010 4H4.5V7z" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolbarBtn>

      {/* Italic */}
      <ToolbarBtn>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3h6M4 13h6M9.5 3l-3 10" stroke="#171717" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>

      {/* Underline */}
      <ToolbarBtn>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 3v5a4 4 0 008 0V3M3 13.5h10" stroke="#171717" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>

      {/* Blockquote */}
      <ToolbarBtn>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M5.5 6.5c-1 .4-1.7 1.2-1.7 2.3 0 1.1.85 1.7 1.7 1.7s1.5-.6 1.5-1.5c0-.9-.6-1.4-1.3-1.4M11 6.5c-1 .4-1.7 1.2-1.7 2.3 0 1.1.85 1.7 1.7 1.7s1.5-.6 1.5-1.5c0-.9-.6-1.4-1.3-1.4" stroke="#171717" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>

      {/* Align dropdown */}
      <ToolbarBtn className="gap-[2px]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 4h10M3 7.5h7M3 11h10M3 14h7" stroke="#171717" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </ToolbarBtn>

      {/* Divider */}
      <div className="h-[20px] flex items-center px-[4px]"><div className="w-px h-full bg-[#f5f5f5]" /></div>

      {/* Link */}
      <ToolbarBtn>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6.5 9.5l3-3M5 8l-1 1a2.83 2.83 0 004 4l1-1M10 6l1-1a2.83 2.83 0 00-4-4L6 2" stroke="#171717" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </ToolbarBtn>
    </div>
  )
}

// ── Slash command menu (Notion / ClickUp style) ───────────────────────────────
type SlashCommand = {
  id: string
  label: string
  hint: string
  icon: React.ReactNode
  keywords: string[]
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'berry-write',
    label: 'Berry write',
    hint: 'Draft content from your sources',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5l1.2 2.8L12 5.5l-2.8 1.2L8 9.5 6.8 6.7 4 5.5l2.8-1.2L8 1.5z" fill="#0787ff"/>
        <path d="M12.5 9l.55 1.3L14.3 11l-1.45.65L12.5 13l-.55-1.35L10.7 11l1.45-.7L12.5 9z" fill="#0787ff" opacity="0.85"/>
      </svg>
    ),
    keywords: ['ai', 'berry', 'write', 'generate', 'auto', 'draft'],
  },
  {
    id: 'text',
    label: 'Text',
    hint: 'Just start writing with plain text',
    icon: <span className="text-[13px] font-medium text-slate-700">T</span>,
    keywords: ['text', 'paragraph', 'plain'],
  },
  {
    id: 'h1',
    label: 'Heading 1',
    hint: 'Big section heading',
    icon: <span className="text-[13px] font-bold text-slate-700">H1</span>,
    keywords: ['heading', 'h1', 'title', 'big'],
  },
  {
    id: 'h2',
    label: 'Heading 2',
    hint: 'Medium section heading',
    icon: <span className="text-[12px] font-bold text-slate-700">H2</span>,
    keywords: ['heading', 'h2', 'subtitle'],
  },
  {
    id: 'quote',
    label: 'Quote',
    hint: 'Highlight a passage from a source',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M4 5.5C3 5.9 2.4 6.6 2.4 7.6c0 1 .8 1.6 1.6 1.6s1.4-.6 1.4-1.4c0-.8-.6-1.3-1.2-1.3M10 5.5c-1 .4-1.6 1.1-1.6 2.1 0 1 .8 1.6 1.6 1.6s1.4-.6 1.4-1.4c0-.8-.6-1.3-1.2-1.3" stroke="#525252" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    keywords: ['quote', 'blockquote', 'citation'],
  },
  {
    id: 'link',
    label: 'Link',
    hint: 'Insert a URL',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5.5 8.5l3-3M4 7l-1 1a2.83 2.83 0 004 4l1-1M9 5l1-1a2.83 2.83 0 00-4-4L5 1" stroke="#525252" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    keywords: ['link', 'url', 'href'],
  },
]

function SlashMenu({
  query, anchor, onSelect, onClose,
}: {
  query: string
  anchor: { top: number; left: number }
  onSelect: (cmd: SlashCommand) => void
  onClose: () => void
}) {
  const filtered = (() => {
    if (!query) return SLASH_COMMANDS
    const q = query.toLowerCase()
    return SLASH_COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q))
    )
  })()

  const [activeIndex, setActiveIndex] = useState(0)
  useEffect(() => { setActiveIndex(0) }, [query])

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        if (filtered[activeIndex]) {
          e.preventDefault()
          onSelect(filtered[activeIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [filtered, activeIndex, onSelect, onClose])

  if (filtered.length === 0) {
    return (
      <div
        className="fixed z-50 bg-white border border-slate-200 rounded-[10px] p-3 w-[280px] berry-toolbar-in"
        style={{ top: anchor.top, left: anchor.left, boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px rgba(0,0,0,0.05)' }}
      >
        <p className="text-[12px] text-slate-500" style={{ fontFamily: 'var(--font-inter)' }}>No commands match &quot;{query}&quot;</p>
      </div>
    )
  }

  return (
    <div
      className="fixed z-50 bg-white border border-slate-200 rounded-[10px] p-[6px] w-[280px] max-h-[320px] overflow-y-auto berry-toolbar-in"
      style={{ top: anchor.top, left: anchor.left, boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px rgba(0,0,0,0.05)' }}
      onMouseDown={e => e.preventDefault()}
    >
      {filtered.map((cmd, i) => (
        <button
          key={cmd.id}
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => onSelect(cmd)}
          onMouseEnter={() => setActiveIndex(i)}
          className={`flex items-center gap-[10px] w-full p-[8px] rounded-[6px] text-left transition-colors ${
            i === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
          }`}
        >
          <div className="shrink-0 size-[28px] rounded-[6px] flex items-center justify-center bg-slate-50">
            {cmd.icon}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-medium leading-[1.3] text-slate-900 truncate" style={{ fontFamily: 'var(--font-inter)' }}>
              {cmd.label}
            </span>
            <span className="text-[11px] leading-[1.3] text-slate-500 truncate" style={{ fontFamily: 'var(--font-inter)' }}>
              {cmd.hint}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Caret position measurement (mirror-div technique) ────────────────────────
// Computes where the caret in a textarea is, so the Berry pill can follow it.
function getCaretCoords(ta: HTMLTextAreaElement, position: number) {
  const style = window.getComputedStyle(ta)
  const mirror = document.createElement('div')
  const marker = document.createElement('span')

  const props = [
    'direction', 'boxSizing', 'width',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch',
    'fontSize', 'fontFamily', 'lineHeight',
    'textAlign', 'textTransform', 'textIndent', 'textDecoration',
    'letterSpacing', 'wordSpacing', 'tabSize',
  ] as const

  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.overflow = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.top = '0'
  mirror.style.left = '-9999px'
  props.forEach(p => { (mirror.style as CSSStyleDeclaration)[p as never] = (style as CSSStyleDeclaration)[p as never] })

  mirror.textContent = ta.value.substring(0, position)
  marker.textContent = ta.value.substring(position) || '.'
  mirror.appendChild(marker)
  document.body.appendChild(mirror)

  const lineHeightPx = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4
  const result = {
    left: marker.offsetLeft,
    top: marker.offsetTop,
    lineHeight: lineHeightPx,
  }
  document.body.removeChild(mirror)
  return result
}

function useEndOfTextPosition(
  taRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  enabled: boolean,
): { left: number; top: number; lineHeight: number } | null {
  const [pos, setPos] = useState<{ left: number; top: number; lineHeight: number } | null>(null)
  useLayoutEffect(() => {
    if (!enabled || !taRef.current) { setPos(null); return }
    const ta = taRef.current
    // Anchor to the END of typed text (last word), not the live caret —
    // keeps the suggestion stable as the user moves the cursor.
    const trimmed = value.replace(/\s+$/, '')
    setPos(getCaretCoords(ta, trimmed.length))
  }, [enabled, value, taRef])
  return pos
}

// ── Inline Berry suggestion link ──────────────────────────────────────────────
// Subtle text-style AI suggestion next to the caret. Used on the supporting
// title only — title is kept clean per design.
function InlineBerrySuggestion({ onClick, phase }: { onClick: () => void; phase: AiPhase }) {
  const label = phase === 'thinking' ? 'Thinking' : phase === 'writing' ? 'Writing' : 'Berry suggestion'
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className="flex items-center gap-[4px] px-[4px] py-[2px] rounded-[4px] hover:bg-[#ebf6ff] active:bg-[#d1ecff] transition-colors shrink-0"
    >
      {phase === 'thinking' ? (
        <span className="flex items-center gap-[2.5px]">
          <span className="size-[3.5px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '0ms' }} />
          <span className="size-[3.5px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '180ms' }} />
          <span className="size-[3.5px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '360ms' }} />
        </span>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1l1.05 2.45L10.5 4.5l-2.45 1.05L7 8l-1.05-2.45L3.5 4.5l2.45-1.05L7 1z" fill="#0787ff"/>
          <path d="M11 8l.55 1.3L12.85 10l-1.3.7L11 12l-.55-1.3L9.15 10l1.3-.7L11 8z" fill="#0787ff" opacity="0.85"/>
        </svg>
      )}
      <span
        className="text-[14px] font-medium leading-[1.5] text-[#0787ff] underline underline-offset-[3px] whitespace-nowrap"
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        {label}
      </span>
    </button>
  )
}

// ── News editor (right panel) ─────────────────────────────────────────────────
function NewsEditor({
  sources,
  onRequestAddSection,
  sections,
  activeSectionId,
  onSelectSection,
  onUpdateSection,
  onReplaceSection,
}: {
  sources: SourceFile[]
  onRequestAddSection: (anchor: PickerAnchor, query?: string) => void
  sections: Section[]
  activeSectionId: string | null
  onSelectSection: (id: string) => void
  onUpdateSection: (id: string, content: string) => void
  onReplaceSection: (id: string, anchor: PickerAnchor) => void
}) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [newsType, setNewsType] = useState('Normal news')
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([])
  const [authorSearch, setAuthorSearch] = useState('')
  const [showAuthorMenu, setShowAuthorMenu] = useState(false)
  const [authorsExpanded, setAuthorsExpanded] = useState(false)

  // AI Auto-write per field
  const titleAi = useAiAutoWrite()
  const subtitleAi = useAiAutoWrite()
  const hasSources = sources.length > 0

  // Floating Berry toolbar — appears above the currently-focused text field
  const [focusedField, setFocusedField] = useState<'title' | 'subtitle' | null>(null)

  // Slash command menu — opens when user types "/" in a tracked field
  type SlashState = {
    field: 'title' | 'subtitle'
    slashPos: number
    query: string
    anchor: { top: number; left: number }
  }
  const [slashState, setSlashState] = useState<SlashState | null>(null)

  function closeSlash() { setSlashState(null) }

  // Selection-triggered command menu (Notion-style bubble menu)
  type SelectionState = {
    field: 'title' | 'subtitle'
    start: number
    end: number
    anchor: { top: number; left: number }
  }
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null)
  function closeSelectionMenu() { setSelectionState(null) }

  function handleEditableSelect(
    field: 'title' | 'subtitle',
    e: React.SyntheticEvent<HTMLTextAreaElement>,
  ) {
    const ta = e.currentTarget
    const { selectionStart: start, selectionEnd: end } = ta
    if (start === end) {
      // Collapse → close any open selection menu owned by this field
      setSelectionState(s => (s && s.field === field ? null : s))
      return
    }
    // Don't fight the slash menu if it's already open
    if (slashState) return
    const rect = ta.getBoundingClientRect()
    setSelectionState({
      field, start, end,
      anchor: { top: rect.bottom + 6, left: rect.left },
    })
  }

  // Handles textarea change for both fields: updates value AND tracks slash menu lifecycle
  function handleEditableChange(
    field: 'title' | 'subtitle',
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    const value = e.target.value
    const caret = e.target.selectionStart
    const prev = field === 'title' ? title : subtitle
    const setter = field === 'title' ? setTitle : setSubtitle
    setter(value)

    // Open slash menu when a fresh "/" is typed
    if (!slashState && value.length > prev.length && value[caret - 1] === '/') {
      const rect = e.target.getBoundingClientRect()
      setSlashState({
        field,
        slashPos: caret - 1,
        query: '',
        anchor: { top: rect.bottom + 6, left: rect.left },
      })
      return
    }

    // Keep menu in sync; close on invalid states
    if (slashState && slashState.field === field) {
      if (caret <= slashState.slashPos || value[slashState.slashPos] !== '/') {
        closeSlash(); return
      }
      const query = value.slice(slashState.slashPos + 1, caret)
      if (/[\s\n]/.test(query)) { closeSlash(); return }
      setSlashState({ ...slashState, query })
    }
  }

  function handleSlashSelect(cmd: SlashCommand) {
    if (!slashState) return
    const { field, slashPos, query } = slashState
    const currentValue = field === 'title' ? title : subtitle
    const setter = field === 'title' ? setTitle : setSubtitle

    // Strip the "/query" trigger from the field before running the command
    const cleaned = currentValue.slice(0, slashPos) + currentValue.slice(slashPos + 1 + query.length)
    setter(cleaned)
    closeSlash()

    if (cmd.id === 'berry-write') {
      if (field === 'title') runTitleAutoWrite()
      else runSubtitleAutoWrite()
    }
    // Other format commands wait on a rich-text editor (description block) — no-op for plain title/subtitle
  }

  function runFocusedBerryWrite() {
    if (focusedField === 'title') runTitleAutoWrite()
    else if (focusedField === 'subtitle') runSubtitleAutoWrite()
  }

  function handleSelectionCommand(cmd: SlashCommand) {
    if (!selectionState) return
    const { field } = selectionState
    if (cmd.id === 'berry-write') {
      if (field === 'title') runTitleAutoWrite()
      else runSubtitleAutoWrite()
    }
    // Format commands (bold/italic/etc.) require a rich-text editor — no-op on plain title/subtitle
    closeSelectionMenu()
  }

  // Auto-resize textareas as their content (or AI stream) changes
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [title])

  useEffect(() => {
    const el = subtitleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [subtitle, showSubtitle])

  function runTitleAutoWrite() {
    if (titleAi.phase !== 'idle') { titleAi.stop(); return }
    if (!hasSources) return
    titleAi.start(SAMPLE_TITLE, setTitle)
  }

  function runSubtitleAutoWrite() {
    if (subtitleAi.phase !== 'idle') { subtitleAi.stop(); return }
    if (!hasSources) return
    setShowSubtitle(true)
    subtitleAi.start(SAMPLE_SUBTITLE, setSubtitle)
  }
  const [dragOver, setDragOver] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typeMenuRef = useRef<HTMLDivElement>(null)
  const authorMenuRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const subtitleRef = useRef<HTMLTextAreaElement>(null)

  // Track end-of-text position for the Berry suggestion (supporting title only).
  // Hidden during AI writing so the underline doesn't shift mid-stream.
  const subtitleSuggestionVisible =
    focusedField === 'subtitle' && hasSources && !selectionState && subtitleAi.phase === 'idle'
  const subtitlePillPos = useEndOfTextPosition(
    subtitleRef, subtitle, subtitleSuggestionVisible,
  )

  // News context — auto-derives a single tag from sources once both title
  // and supporting title have content. Derives once; user can clear and pick.
  const [newsContext, setNewsContext] = useState('')
  const [newsContextPhase, setNewsContextPhase] = useState<'idle' | 'thinking' | 'done'>('idle')
  const [contextDerived, setContextDerived] = useState(false)

  useEffect(() => {
    if (contextDerived || !hasSources) return
    if (!title.trim() || !subtitle.trim()) return
    setNewsContextPhase('thinking')
    setContextDerived(true)
    const t = setTimeout(() => {
      // In production this would be generated from the source content via Berry.
      setNewsContext('सार्वजनिक जग्गा विवाद')
      setNewsContextPhase('done')
    }, 1500)
    return () => clearTimeout(t)
  }, [title, subtitle, hasSources, contextDerived])

  function clearNewsContext() {
    setNewsContext('')
    setNewsContextPhase('idle')
  }

  const newsTypes = ['Normal news', 'Video news', 'Audio news']

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setShowTypeMenu(false)
      }
      if (authorMenuRef.current && !authorMenuRef.current.contains(e.target as Node)) {
        setShowAuthorMenu(false)
        setAuthorSearch('')
        setAuthorsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleCoverDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) setCoverPreview(URL.createObjectURL(file))
  }

  function handleCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCoverPreview(URL.createObjectURL(file))
  }

  function toggleAuthor(id: string) {
    setSelectedAuthorIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Selected authors preserved in selection order
  const selectedAuthors = selectedAuthorIds
    .map(id => AUTHORS.find(a => a.id === id))
    .filter((a): a is typeof AUTHORS[number] => a !== undefined)

  // Hard cap at 3 visible badges; the rest live behind an avatar-group + popover
  const visibleSelectedAuthors = selectedAuthors.slice(0, 3)
  const overflowAuthors = selectedAuthors.slice(3)
  const overflowCount = overflowAuthors.length

  const filteredAuthors = AUTHORS.filter(a =>
    authorSearch === '' || a.name.includes(authorSearch)
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[72px] border-b border-slate-200 shrink-0">
        <div className="px-1.5">
          <h1
            className="text-[18px] font-medium leading-[1.5] text-[#262626]"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            New news
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] hover:bg-slate-100 transition-colors">
            <span className="text-[14px] font-medium leading-5 text-slate-800 whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
              Save as Draft
            </span>
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-white border border-slate-200 shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] hover:bg-slate-50 transition-colors">
            <span className="text-[14px] font-medium leading-5 text-slate-800 whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
              Preview
            </span>
          </button>
          <button className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] overflow-hidden">
            <div className="absolute inset-0 bg-[#0787ff] rounded-[12px]" />
            <div className="absolute inset-0 rounded-[12px] shadow-[inset_0px_0px_4px_0px_rgba(255,255,255,0.64)]" />
            <span className="relative text-[14px] font-medium leading-5 text-white whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
              Continue to review
            </span>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex flex-col gap-6 p-8 overflow-y-auto flex-1">

        {/* Title */}
        <div className="flex flex-col gap-3 w-full">
          <label
            className="text-[14px] font-medium leading-[1.3] text-black"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Title
          </label>

          <div className="flex flex-col gap-3 w-full">
            {/* Main title — Mukta for Devanagari + Latin. Wraps at 60% width */}
            <div className="relative flex items-start gap-[10px] pb-[6px] w-full border-b border-[rgba(26,26,26,0.06)]">
              <textarea
                ref={titleRef}
                value={title}
                onChange={e => handleEditableChange('title', e)}
                onSelect={e => handleEditableSelect('title', e)}
                onFocus={() => { setShowSubtitle(true); setFocusedField('title') }}
                onBlur={() => setFocusedField(f => f === 'title' ? null : f)}
                rows={1}
                placeholder="Write a news title here..."
                disabled={titleAi.phase !== 'idle'}
                className="w-[60%] resize-none overflow-hidden text-[24px] leading-[1.4] bg-transparent outline-none placeholder:text-[rgba(26,26,26,0.2)] text-black disabled:cursor-default"
                style={{ fontFamily: 'var(--font-mukta)', fontWeight: 600 }}
              />

              {/* AI shimmer bar — replaces the static bottom border while AI is active */}
              {titleAi.phase !== 'idle' && (
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] overflow-hidden pointer-events-none">
                  <div className="ai-shimmer-bar w-full h-full" />
                </div>
              )}
            </div>

            {/* Supporting title — appears on title focus. Also wraps at 60% */}
            {showSubtitle && (
              <div className="relative flex items-start gap-[10px] pb-[8px] w-full border-b border-[rgba(26,26,26,0.06)]">
                <textarea
                  ref={subtitleRef}
                  value={subtitle}
                  onChange={e => handleEditableChange('subtitle', e)}
                  onSelect={e => handleEditableSelect('subtitle', e)}
                  onFocus={() => setFocusedField('subtitle')}
                  onBlur={() => setFocusedField(f => f === 'subtitle' ? null : f)}
                  rows={1}
                  placeholder="Supporting title"
                  disabled={subtitleAi.phase !== 'idle'}
                  className="w-[60%] resize-none overflow-hidden text-[14px] leading-[1.5] bg-transparent outline-none placeholder:text-[rgba(26,26,26,0.2)] text-black disabled:cursor-default"
                  style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 400 }}
                />

                {/* Inline Berry suggestion — anchored to end of last word, 24px gap.
                    Hidden during AI writing and on blur, smooth fade on appear. */}
                {subtitleSuggestionVisible && subtitlePillPos && (
                  <div
                    key={`berry-${subtitle.length}`}
                    className="absolute z-10 berry-toolbar-in"
                    style={{
                      left: `${subtitlePillPos.left + 24}px`,
                      top: `${subtitlePillPos.top + (subtitlePillPos.lineHeight - 22) / 2}px`,
                    }}
                  >
                    <InlineBerrySuggestion onClick={runSubtitleAutoWrite} phase={subtitleAi.phase} />
                  </div>
                )}

                {subtitleAi.phase !== 'idle' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] overflow-hidden pointer-events-none">
                    <div className="ai-shimmer-bar w-full h-full" />
                  </div>
                )}
              </div>
            )}

            {/* Slash command list (Notion-style) — only when "/" is typed */}
            {slashState && (
              <SlashMenu
                query={slashState.query}
                anchor={slashState.anchor}
                onSelect={handleSlashSelect}
                onClose={closeSlash}
              />
            )}

            {/* Full Berry toolbar — only when text is selected (editing words) */}
            {!slashState && selectionState && (
              <div
                className="fixed z-50 berry-toolbar-in"
                style={{ top: selectionState.anchor.top, left: selectionState.anchor.left }}
              >
                <FloatingBerryToolbar
                  onBerryWrite={() => handleSelectionCommand({ id: 'berry-write' } as SlashCommand)}
                  berryPhase={selectionState.field === 'title' ? titleAi.phase : subtitleAi.phase}
                />
              </div>
            )}
          </div>
        </div>

        {/* Metadata rows */}
        <div className="flex flex-col gap-0.5 w-full">

          {/* News context — Berry derives one tag from the sources */}
          <MetaRow
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h10" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            label="News context"
          >
            {newsContextPhase === 'thinking' ? (
              <div className="berry-toolbar-in flex items-center gap-2 px-3 py-1.5">
                <span className="flex items-center gap-[3px]">
                  <span className="size-[4px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '0ms' }} />
                  <span className="size-[4px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '180ms' }} />
                  <span className="size-[4px] rounded-full bg-[#0787ff] thinking-dot" style={{ animationDelay: '360ms' }} />
                </span>
                <span
                  className="text-[12px] font-medium leading-[1.5] text-[#0787ff] whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Reading sources
                </span>
              </div>
            ) : newsContext ? (
              <div className="group berry-toolbar-in flex items-center gap-[6px] pl-[8px] pr-[6px] py-[4px] bg-[#ebf6ff] border border-[#aedfff] rounded-[8px] hover:bg-[#d1ecff] transition-colors">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1l1.05 2.45L10.5 4.5l-2.45 1.05L7 8l-1.05-2.45L3.5 4.5l2.45-1.05L7 1z" fill="#0787ff"/>
                  <path d="M11 8l.55 1.3L12.85 10l-1.3.7L11 12l-.55-1.3L9.15 10l1.3-.7L11 8z" fill="#0787ff" opacity="0.85"/>
                </svg>
                <span
                  className="text-[12px] font-medium leading-[1.5] text-[#062365] whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {newsContext}
                </span>
                <button
                  type="button"
                  onClick={clearNewsContext}
                  aria-label="Clear context"
                  className="flex items-center justify-center size-[16px] rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#aedfff] transition-opacity"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2l6 6M8 2l-6 6" stroke="#062365" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <button className="flex items-center px-3 py-1.5 rounded-[8px] hover:bg-slate-100 transition-colors">
                <span className="text-[12px] font-medium leading-[1.5] text-slate-300 whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
                  Empty
                </span>
              </button>
            )}
          </MetaRow>

          {/* News type — with dropdown */}
          <MetaRow
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#6B7280" strokeWidth="1.5"/><path d="M5 7h4M5 9.5h2" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            label="News type"
          >
            <div className="relative" ref={typeMenuRef}>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] hover:bg-slate-100 transition-colors"
                onClick={() => setShowTypeMenu(v => !v)}
              >
                <span className="text-[12px] font-medium leading-[1.5] text-slate-800 whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
                  {newsType}
                </span>
                <IconChevronDown size={14} className={`text-slate-500 transition-transform ${showTypeMenu ? 'rotate-180' : ''}`} />
              </button>
              {showTypeMenu && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#e2e8f0] rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.05)] p-[6px] min-w-[160px]">
                  <div className="flex flex-col">
                    {newsTypes.map(t => (
                      <button
                        key={t}
                        className={`flex items-center w-full h-[36px] px-[8px] rounded-[6px] transition-colors text-left ${
                          t === newsType ? 'bg-[#f5f5f5]' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => { setNewsType(t); setShowTypeMenu(false) }}
                      >
                        <span
                          className={`text-[14px] font-normal leading-[1.5] tracking-[-0.14px] ${
                            t === newsType ? 'text-[#0a0a0a]' : 'text-[#334155]'
                          }`}
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          {t}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </MetaRow>

          {/* Categories */}
          <MetaRow
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="#6B7280" strokeWidth="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="#6B7280" strokeWidth="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="#6B7280" strokeWidth="1.5"/><circle cx="11.5" cy="11.5" r="2.5" stroke="#6B7280" strokeWidth="1.5"/></svg>}
            label="Categories"
          >
            <button className="flex items-center px-3 py-1.5 rounded-[8px] hover:bg-slate-100 transition-colors">
              <span className="text-[12px] font-medium leading-[1.5] text-slate-300 whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
                Empty
              </span>
            </button>
          </MetaRow>

          {/* Author */}
          <MetaRow
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="#6B7280" strokeWidth="1.5"/><path d="M2.5 14c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            label="Author"
          >
            <div className="relative flex flex-wrap items-center gap-[6px]" ref={authorMenuRef}>
              {/* Selected author badges (× shows on hover) */}
              {visibleSelectedAuthors.map(author => (
                <div
                  key={author.id}
                  className="group flex items-center gap-[6px] pl-[6px] pr-[6px] py-[4px] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[12px] transition-colors"
                >
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="shrink-0 size-[24px] rounded-full object-cover"
                  />
                  <span
                    className="text-[14px] font-normal leading-[1.5] tracking-[-0.14px] text-[#171717] whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {author.name}
                  </span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); toggleAuthor(author.id) }}
                    aria-label={`Remove ${author.name}`}
                    className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full hover:bg-[#d4d4d4] transition-colors -mr-[2px]"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Overflow: stacked avatar group + count, click → popover */}
              {overflowCount > 0 && (
                <div className="relative">
                  <button
                    onClick={() => { setAuthorsExpanded(v => !v); setShowAuthorMenu(false) }}
                    className={`flex items-center gap-[6px] pl-[4px] pr-[10px] py-[4px] rounded-[12px] transition-colors ${
                      authorsExpanded ? 'bg-[#ebebeb]' : 'bg-[#f5f5f5] hover:bg-[#ebebeb]'
                    }`}
                  >
                    {/* Stacked avatar preview (up to 3) */}
                    <div className="flex">
                      {overflowAuthors.slice(0, 3).map((a, i) => (
                        <img
                          key={a.id}
                          src={a.avatar}
                          alt=""
                          className="shrink-0 size-[22px] rounded-full object-cover ring-2 ring-[#f5f5f5]"
                          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[14px] font-normal leading-[1.5] tracking-[-0.14px] text-[#171717] whitespace-nowrap"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      +{overflowCount}
                    </span>
                  </button>

                  {/* Overflow popover — list of hidden authors with hover-remove */}
                  {authorsExpanded && (
                    <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#e5e7eb] rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.05)] p-[6px] min-w-[220px]">
                      <div className="flex flex-col gap-[2px]">
                        {overflowAuthors.map(author => (
                          <div
                            key={author.id}
                            className="group flex items-center gap-[6px] p-[8px] rounded-[6px] hover:bg-slate-50 transition-colors"
                          >
                            <img
                              src={author.avatar}
                              alt={author.name}
                              className="shrink-0 size-[24px] rounded-full object-cover"
                            />
                            <span
                              className="flex-1 text-[14px] font-normal leading-[1.5] tracking-[-0.14px] text-[#262626] whitespace-nowrap"
                              style={{ fontFamily: 'var(--font-inter)' }}
                            >
                              {author.name}
                            </span>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); toggleAuthor(author.id) }}
                              aria-label={`Remove ${author.name}`}
                              className="flex items-center justify-center size-[20px] rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#e5e5e5] transition-opacity"
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 2l6 6M8 2l-6 6" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Add Author trigger + dropdown (anchored to button) */}
              <div className="relative">
                <button
                  onClick={() => { setShowAuthorMenu(v => !v); setAuthorsExpanded(false) }}
                  className={`flex items-center gap-[6px] px-[12px] py-[6px] rounded-[8px] transition-colors outline-none ${
                    showAuthorMenu
                      ? 'bg-slate-100 shadow-[0px_0px_0px_3px_rgba(7,135,255,0.18)]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2.5v9M2.5 7h9" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span
                    className="text-[12px] font-medium leading-[1.5] text-[#1e293b] whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Add Author
                  </span>
                </button>

                {showAuthorMenu && (
                  <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#e5e7eb] rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.05)] p-[6px] w-[260px]">
                  {/* Search */}
                  <div className="p-[6px] pb-[10px]">
                    <div className="flex items-center gap-2 px-[10px] py-[6px] bg-white border border-[#d4d4d4] rounded-[8px]">
                      <input
                        type="text"
                        value={authorSearch}
                        onChange={e => setAuthorSearch(e.target.value)}
                        placeholder="Search..."
                        className="flex-1 text-[14px] font-normal leading-[1.5] tracking-[-0.14px] text-[#525252] outline-none bg-transparent placeholder:text-[#a3a3a3]"
                        style={{ fontFamily: 'var(--font-inter)' }}
                        onMouseDown={e => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Authors list */}
                  <div className="flex flex-col gap-[2px]">
                    {filteredAuthors.map(author => {
                      const isSelected = selectedAuthorIds.includes(author.id)
                      return (
                        <button
                          key={author.id}
                          className={`flex items-center gap-[6px] w-full p-[8px] rounded-[6px] transition-colors text-left ${
                            isSelected ? 'bg-[#f5f5f5]' : 'hover:bg-slate-50'
                          }`}
                          onClick={() => toggleAuthor(author.id)}
                        >
                          <img
                            src={author.avatar}
                            alt={author.name}
                            className="shrink-0 size-[24px] rounded-full object-cover"
                          />
                          <span
                            className={`flex-1 text-[14px] font-normal leading-[1.5] tracking-[-0.14px] ${
                              isSelected ? 'text-[#262626]' : 'text-[#334155]'
                            }`}
                            style={{ fontFamily: 'var(--font-inter)' }}
                          >
                            {author.name}
                          </span>
                          {/* Checkbox */}
                          <div className={`shrink-0 size-[18px] rounded-[5px] flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#0787ff]'
                              : 'border-[1.4px] border-[rgba(0,0,0,0.09)] bg-gradient-to-b from-[#f2f2f4] to-white'
                          }`}>
                            {isSelected && (
                              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                    {filteredAuthors.length === 0 && (
                      <p
                        className="px-[8px] py-3 text-[13px] text-[#a3a3a3] text-center"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        No authors found
                      </p>
                    )}
                  </div>
                </div>
                )}
              </div>
            </div>
          </MetaRow>

          {/* Cover image */}
          <MetaRow
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#6B7280" strokeWidth="1.5"/><circle cx="5.5" cy="6.5" r="1" fill="#6B7280"/><path d="M2 11l3.5-3 3 2.5 2-2L14 11" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            label="Cover Image"
          >
            <div
              className={`relative flex items-center justify-center border border-dashed rounded-[8px] w-[310px] h-[174px] cursor-pointer transition-colors bg-slate-50 overflow-hidden ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-[#d4d4d4]'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleCoverDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverPick} />
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    className="absolute top-2 right-2 flex items-center justify-center size-6 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    onClick={e => { e.stopPropagation(); setCoverPreview(null) }}
                  >
                    <IconClose size={12} className="text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3 items-center">
                  <div
                    className="flex items-center p-3 rounded-[12px] border-2 border-white shadow-[0px_0px_4px_rgba(17,24,39,0.08)]"
                    style={{ background: 'linear-gradient(154.94deg, #dbeafe 8.02%, #bfdbfe 87.94%)' }}
                  >
                    <IconUpload size={18} />
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-[14px] font-semibold leading-[1.5] text-[#171717] whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
                      Drop an image, or click to upload
                    </span>
                    <span className="text-[12px] leading-[1.5] text-[#737373] text-center" style={{ fontFamily: 'var(--font-inter)' }}>
                      PNG, JPG, WEBP — up to 8MP
                    </span>
                  </div>
                </div>
              )}
            </div>
          </MetaRow>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-200" />

        {/* Description — header + block list */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between w-full">
            <span className="text-[14px] font-medium leading-[1.3] text-black" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Description
            </span>
            <button className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] border border-slate-200 overflow-hidden hover:bg-slate-50 transition-colors">
              <div className="absolute inset-0 bg-slate-50 rounded-[12px]" />
              <div className="absolute inset-0 rounded-[12px] shadow-[inset_0px_0px_12px_0px_rgba(29,41,61,0.04)]" />
              <IconImport size={16} className="relative text-slate-700" />
              <span className="relative text-[14px] font-medium leading-5 text-slate-800 whitespace-nowrap" style={{ fontFamily: 'var(--font-inter)' }}>
                Import
              </span>
            </button>
          </div>

          {sections.length === 0 ? (
            // Initial state — Figma ContentBlock Default (2293:5210). Clicking
            // the empty placeholder opens the section picker anchored beneath.
            <EmptyBlockPlaceholder
              onClick={e => {
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                onRequestAddSection({ top: r.bottom + 6, left: r.left, width: r.width })
              }}
            />
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {sections.map(s => (
                <BlockEditor
                  key={s.id}
                  block={s}
                  isActive={s.id === activeSectionId}
                  onFocus={() => onSelectSection(s.id)}
                  onChange={c => onUpdateSection(s.id, c)}
                  onReplaceRequest={anchor => onReplaceSection(s.id, anchor)}
                />
              ))}
            </div>
          )}
        </div>

        {/* "+ Add new section" pill — only shown once there's at least one block */}
        {sections.length > 0 && (
          <button
            onClick={e => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              onRequestAddSection({ top: r.bottom + 6, left: r.left })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-slate-50 border border-slate-200 self-start hover:bg-slate-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[12px] font-medium leading-[1.5] text-slate-800" style={{ fontFamily: 'var(--font-inter)' }}>
              Add new section
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── Add source modal ──────────────────────────────────────────────────────────
function AddSourceModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (source: SourceFile) => void
}) {
  const [url, setUrl] = useState('')
  const [dragging, setDragging] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setPendingFiles(prev => [...prev, ...files])
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)])
  }

  function handleRemovePending(index: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    // Add each picked file as a source
    pendingFiles.forEach(file => {
      onAdd({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // strip extension for display
        type: 'text',
        date: formatDate(new Date()),
        size: formatSize(file.size),
      })
    })
    // Add URL as a source if provided
    if (url.trim()) {
      const hostname = (() => { try { return new URL(url).hostname } catch { return url } })()
      onAdd({
        id: `url-${Date.now()}`,
        name: hostname,
        type: 'link',
        date: formatDate(new Date()),
        size: '—',
        url: url.trim(),
      })
    }
    onClose()
  }

  const canSave = pendingFiles.length > 0 || url.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-[6px] bg-white/20" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-[655px] bg-white border border-[#e5e5e5] rounded-[16px] overflow-hidden shadow-[0px_8px_24px_-6px_rgba(0,0,0,0.16),0px_0px_1px_0px_rgba(0,0,0,0.18)]">

        {/* Gradient header — exact two-layer radial gradient from Figma
            (40000003:34624). The base layer is a large off-canvas radial that
            fades blue → light → white top-down; the overlay adds a soft cool-
            white highlight near the upper middle. Stops match Figma exactly. */}
        <div
          className="relative flex flex-col items-center w-full"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 655 423' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(1.85 39.183 -60.533 0.89338 327 19.496)'><stop stop-color='rgb(240,246,255)' offset='0'/><stop stop-color='rgb(228,244,255)' stop-opacity='0' offset='1'/></radialGradient></defs></svg>"), url("data:image/svg+xml;utf8,<svg viewBox='0 0 655 423' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-0.5 103.65 -160.75 -0.77545 341.5 -771.33)'><stop stop-color='rgb(7,135,255)' offset='0.45'/><stop stop-color='rgb(21,142,255)' offset='0.475'/><stop stop-color='rgb(34,148,255)' offset='0.5'/><stop stop-color='rgb(61,161,255)' offset='0.549'/><stop stop-color='rgb(88,174,255)' offset='0.599'/><stop stop-color='rgb(115,187,255)' offset='0.649'/><stop stop-color='rgb(169,213,255)' offset='0.748'/><stop stop-color='rgb(223,240,255)' offset='0.847'/><stop stop-color='rgb(255,255,255)' offset='1'/></radialGradient></defs></svg>")`,
            backgroundSize: '100% 100%, 100% 100%',
            backgroundRepeat: 'no-repeat, no-repeat',
          }}
        >
          {/* Subtle noise overlay — Figma `Noise & Texture` layer at 50%
              opacity, mix-blend-overlay. Inline fractal noise keeps things
              self-contained (the Figma-hosted texture URL would expire). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
              backgroundSize: '320px 320px',
            }}
          />
          <div className="relative flex items-center justify-center pb-4 pt-8 px-8 w-full">
            <p className="text-[18px] font-medium leading-[1.4] text-[#1f1f1f] text-center w-[314px]" style={{ fontFamily: 'var(--font-inter)' }}>
              Create Audio and Video Overviews from{' '}
              <span className="text-[#60a5fa]">docs, audio, video, or links.</span>
            </p>
          </div>

          {/* File drop zone */}
          <div className="relative flex flex-col gap-6 items-center justify-center px-6 pb-6 w-full">
            <div
              className={`flex flex-col gap-3 items-center justify-center px-8 py-6 rounded-[16px] w-full border-[1.5px] border-dashed transition-colors cursor-pointer ${dragging ? 'border-blue-400 bg-blue-50/40' : 'border-[#e5e5e5] bg-white/[0.28]'}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilePick} />
              <DocStackIcon />
              <div className="flex flex-col gap-0.5 items-center px-4 py-3 text-center">
                <span className="text-[18px] font-medium leading-[1.4] text-[#1b1b1c]" style={{ fontFamily: 'var(--font-inter)' }}>
                  {dragging ? 'Drop files here' : 'or drop your files'}
                </span>
                <span className="text-[14px] leading-[1.5] tracking-[-0.14px] text-[#5e5e5e]" style={{ fontFamily: 'var(--font-inter)' }}>
                  pdf, images, docs, audio, and more
                </span>
              </div>
            </div>

            {/* Pending files list */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-col gap-1 w-full">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-[8px] border border-slate-100">
                    <FileIcon />
                    <span className="flex-1 text-[13px] text-[#262626] truncate min-w-0" style={{ fontFamily: 'var(--font-inter)' }}>
                      {file.name}
                    </span>
                    <span className="text-[12px] text-[#737373] shrink-0" style={{ fontFamily: 'var(--font-inter)' }}>
                      {formatSize(file.size)}
                    </span>
                    <button
                      className="shrink-0 flex items-center justify-center size-5 rounded hover:bg-red-50 transition-colors"
                      onClick={e => { e.stopPropagation(); handleRemovePending(i) }}
                    >
                      <IconClose size={12} className="text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* URL input */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-[12px] leading-[1.5] text-[#181b25]" style={{ fontFamily: 'var(--font-inter)' }}>
                URL
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#d4d4d4] rounded-[12px] w-full">
                <IconLink size={14} className="shrink-0 text-[#525252]" />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canSave && handleSave()}
                  placeholder="Enter the url of the website"
                  className="flex-1 text-[14px] leading-[1.5] tracking-[-0.14px] text-[#525252] outline-none bg-transparent placeholder:text-[#525252]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
                <button
                  type="button"
                  onClick={() => url.trim() && canSave && handleSave()}
                  disabled={!url.trim()}
                  title="Add URL"
                  className="shrink-0 flex items-center justify-center size-4 text-[#171717] disabled:text-[#a3a3a3] hover:opacity-80 transition-opacity"
                >
                  <IconPlus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pt-3 pb-6 bg-white w-full">
          <button
            onClick={onClose}
            className="flex items-center justify-center px-4 py-2.5 rounded-[12px] bg-white border border-slate-200 shadow-[0px_1px_0.25px_rgba(29,41,61,0.02)] hover:bg-slate-50 transition-colors"
          >
            <span className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#1e293b]" style={{ fontFamily: 'var(--font-inter)' }}>
              Close
            </span>
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`relative flex items-center justify-center px-4 py-2.5 rounded-[12px] overflow-hidden transition-opacity ${canSave ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'}`}
          >
            <div className="absolute inset-0 bg-[#0787ff] rounded-[12px]" />
            <div className="absolute inset-0 rounded-[12px] shadow-[inset_0px_0px_4px_0px_rgba(255,255,255,0.64)]" />
            <span className="relative text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-white" style={{ fontFamily: 'var(--font-inter)' }}>
              Save
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Left icon sidebar ─────────────────────────────────────────────────────────
function Sidebar() {
  const navIcons = [
    <svg key="home" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1" stroke="#64748B" strokeWidth="1.5"/><rect x="10" y="2" width="6" height="6" rx="1" stroke="#64748B" strokeWidth="1.5"/><rect x="2" y="10" width="6" height="6" rx="1" stroke="#64748B" strokeWidth="1.5"/><rect x="10" y="10" width="6" height="6" rx="1" stroke="#64748B" strokeWidth="1.5"/></svg>,
    <svg key="news" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="#64748B" strokeWidth="1.5"/><path d="M5 7h8M5 10h5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    <svg key="file" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10 2H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7l-5-5z" stroke="#64748B" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2v5h5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    <svg key="cal" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2" stroke="#64748B" strokeWidth="1.5"/><path d="M6 2v2M12 2v2M2 7h14" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    <svg key="users" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6" r="2.5" stroke="#64748B" strokeWidth="1.5"/><path d="M2 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 8a2 2 0 000-4M16 15c0-2-1.34-3.7-3.2-4.3" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    <svg key="settings" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="#64748B" strokeWidth="1.5"/><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.1 4.1l1.4 1.4M12.5 12.5l1.4 1.4M4.1 13.9l1.4-1.4M12.5 5.5l1.4-1.4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    <svg key="chart" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-5 3 2 4-6 3 4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    <svg key="bell" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z" stroke="#64748B" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7.5 14.5a1.5 1.5 0 003 0" stroke="#64748B" strokeWidth="1.5"/></svg>,
    <svg key="bm" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 2h10a1 1 0 011 1v12l-6-3-6 3V3a1 1 0 011-1z" stroke="#64748B" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  ]

  return (
    <div className="flex flex-col h-full px-3 py-4 gap-4">
      <div className="flex items-center justify-center border-b border-slate-200 pb-3.5 pt-1.5">
        <img src={LOGO} alt="Snowberry" className="w-[30px] h-[30px] object-contain" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center size-[36px] rounded-[8px] border border-slate-200 bg-white shadow-[0px_0px_8px_0px_rgba(0,0,0,0.04),0px_1px_0.5px_0px_rgba(29,41,61,0.02)] cursor-pointer hover:bg-slate-50 transition-colors">
          <IconPlus size={20} className="text-slate-700" />
        </div>
        <div className="flex flex-col">
          {navIcons.map((icon, i) => (
            <div key={i} className="flex items-center justify-center size-[36px] rounded-[8px] hover:bg-slate-100 cursor-pointer transition-colors p-[9px]">
              {icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewNewsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [sources, setSources] = useState<SourceFile[]>([
    { id: '1', name: 'सरकारसँग जनताको मुख्य अपेक्षा के छ ?', type: 'text', date: 'Nov 21, 2025', size: '5MB' },
    { id: '2', name: 'सरकारसँग जनताको मुख्य अपेक्षा के छ ?', type: 'text', date: 'Nov 21, 2025', size: '5MB' },
  ])

  // Left-panel tab: 'sources' (Add source) | 'toc' (Table of contents)
  const [leftView, setLeftView] = useState<LeftPanelView>('sources')

  // Table-of-contents sections + the picker popover.
  const [sections, setSections] = useState<Section[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  // Picker can be opened to add a new section ("mode: 'add'") or to replace
  // the type of an existing one ("mode: 'replace'") via the block's Replace
  // button. The replace flow swaps the section's type without losing content.
  const [picker, setPicker] = useState<
    | { mode: 'add';     anchor: PickerAnchor; query: string }
    | { mode: 'replace'; anchor: PickerAnchor; query: string; targetId: string }
    | null
  >(null)

  const handleRequestAddSection = useCallback((anchor: PickerAnchor, query = '') => {
    setPicker({ mode: 'add', anchor, query })
  }, [])

  const handleReplaceSection = useCallback((id: string, anchor: PickerAnchor) => {
    setPicker({ mode: 'replace', anchor, query: '', targetId: id })
  }, [])

  const handlePickSection = useCallback((type: SectionType) => {
    setPicker(curr => {
      if (curr?.mode === 'replace') {
        setSections(prev => prev.map(s => s.id === curr.targetId ? { ...s, type } : s))
        return null
      }
      const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      // Title starts empty so the user can begin typing immediately; the TOC
      // falls back to the type label for unedited blocks.
      setSections(prev => [...prev, { id, type, title: '' }])
      setActiveSectionId(id)
      // Adding a section auto-switches the left panel to the TOC view so the
      // user sees the new entry land in the outline.
      setLeftView('toc')
      return null
    })
  }, [])

  const handleUpdateSection = useCallback((id: string, content: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, title: content } : s))
  }, [])

  const handleReorderSections = useCallback((from: number, to: number) => {
    setSections(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const handleAddSource = useCallback((source: SourceFile) => {
    setSources(prev => [...prev, source])
  }, [])

  const handleRemoveSource = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id))
  }, [])

  const handleFileDrop = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      setSources(prev => [...prev, {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: 'text',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)}KB` : `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
      }])
    })
  }, [])

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#f3f4f6]">
      {/* Left icon sidebar */}
      <div className="flex flex-col shrink-0 w-[60px] h-full">
        <Sidebar />
      </div>

      {/* Add source panel */}
      <div className="shrink-0 w-[315px] mt-[10px] mb-[10px] bg-white border border-slate-200 rounded-[14px] shadow-[0px_0px_8px_0px_rgba(31,38,54,0.04)] overflow-hidden flex flex-col">
        <AddSourcePanel
          onOpenModal={() => setModalOpen(true)}
          sources={sources}
          onRemoveSource={handleRemoveSource}
          onFileDrop={handleFileDrop}
          view={leftView}
          onChangeView={setLeftView}
          sections={sections}
          activeSectionId={activeSectionId}
          onSelectSection={setActiveSectionId}
          onReorderSections={handleReorderSections}
          onRequestAddSection={handleRequestAddSection}
        />
      </div>

      {/* Main editor panel */}
      <div className="flex-1 mt-[10px] mr-[10px] mb-[10px] ml-[10px] bg-white border border-slate-200 rounded-[14px] shadow-[0px_0px_8px_0px_rgba(31,38,54,0.04)] overflow-hidden flex flex-col min-w-0">
        <NewsEditor
          sources={sources}
          onRequestAddSection={handleRequestAddSection}
          sections={sections}
          activeSectionId={activeSectionId}
          onSelectSection={setActiveSectionId}
          onUpdateSection={handleUpdateSection}
          onReplaceSection={handleReplaceSection}
        />
      </div>

      {modalOpen && (
        <AddSourceModal
          onClose={() => setModalOpen(false)}
          onAdd={handleAddSource}
        />
      )}

      {picker && (
        <SectionPicker
          anchor={picker.anchor}
          initialQuery={picker.query}
          onPick={handlePickSection}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
