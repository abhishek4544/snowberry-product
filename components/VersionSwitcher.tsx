'use client'

import { useState, useEffect, useRef } from 'react'

type Version = {
  id: string
  label: string
  tag: string
  note: string
  date: string
  current?: boolean
}

const INITIAL_VERSIONS: Version[] = [
  { id: 'v1', label: 'v1', tag: 'Initial',     note: 'Dashboard + basic layout',         date: 'Jun 1, 2026' },
  { id: 'v2', label: 'v2', tag: 'News flow',   note: 'Add source panel + linked sources', date: 'Jun 5, 2026' },
  { id: 'v3', label: 'v3', tag: 'Performance', note: 'Performance page + Massive AI',     date: 'Jun 9, 2026', current: true },
]

const STORAGE_KEY = 'snowberry_versions'
const ACTIVE_KEY  = 'snowberry_active_version'

function loadVersions(): Version[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? INITIAL_VERSIONS }
  catch { return INITIAL_VERSIONS }
}

function saveVersions(v: Version[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}

const TAG_COLORS: Record<string, string> = {
  Initial:     '#737373',
  'News flow': '#8B5CF6',
  Performance: '#0787ff',
  New:         '#16a34a',
}

export default function VersionSwitcher() {
  const [versions, setVersions] = useState<Version[]>(INITIAL_VERSIONS)
  const [activeId, setActiveId] = useState<string>('v3')
  const [open, setOpen]         = useState(false)
  const [pushing, setPushing]   = useState(false)
  const [pushed, setPushed]     = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const v = loadVersions()
    setVersions(v)
    setActiveId(localStorage.getItem(ACTIVE_KEY) ?? (v.find(x => x.current)?.id ?? v[v.length - 1].id))
  }, [])

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const active = versions.find(v => v.id === activeId) ?? versions[versions.length - 1]

  function switchTo(id: string) {
    setActiveId(id)
    localStorage.setItem(ACTIVE_KEY, id)
    setOpen(false)
  }

  function pushNext() {
    setPushing(true)
    setTimeout(() => {
      const next = versions.length + 1
      const id   = `v${next}`
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const updated: Version[] = [
        ...versions.map(v => ({ ...v, current: false })),
        { id, label: `v${next}`, tag: 'New', note: 'Pushed from current build', date: today, current: true },
      ]
      setVersions(updated)
      saveVersions(updated)
      setActiveId(id)
      localStorage.setItem(ACTIVE_KEY, id)
      setPushing(false)
      setPushed(true)
      setTimeout(() => setPushed(false), 2200)
    }, 900)
  }

  return (
    /* Fixed anchor — bottom-left, always visible */
    <div ref={ref} className="fixed bottom-4 left-4 z-[9999]" style={{ fontFamily: 'var(--font-inter)' }}>

      {/* ── Popup panel (opens upward) ── */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-[248px] bg-white border border-[#e5e5e5] rounded-[14px] shadow-[0px_12px_32px_-6px_rgba(0,0,0,0.18),0px_0px_1px_rgba(0,0,0,0.10)] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#f0f0f0]">
            <p className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
              Build versions
            </p>
            <button
              onClick={pushNext}
              disabled={pushing}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all ${
                pushed   ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]' :
                pushing  ? 'bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed' :
                           'bg-[#0787ff] text-white hover:bg-[#0061ff] active:scale-95'
              }`}
            >
              {pushed   ? '✓ Pushed' :
               pushing  ? <><span className="inline-block animate-spin">↻</span>&nbsp;Pushing…</> :
                          `↑ Push v${versions.length + 1}`}
            </button>
          </div>

          {/* Version list */}
          <div className="flex flex-col py-1 max-h-[260px] overflow-y-auto">
            {[...versions].reverse().map((v, idx, arr) => {
              const isActive = v.id === activeId
              return (
                <button
                  key={v.id}
                  onClick={() => switchTo(v.id)}
                  className={`flex items-start gap-2.5 w-full px-3.5 py-2 text-left transition-colors hover:bg-[#fafafa] ${isActive ? 'bg-[#f8faff]' : ''}`}
                >
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center shrink-0" style={{ width: 10 }}>
                    <div className={`size-2 rounded-full mt-[5px] shrink-0 ${isActive ? 'bg-[#0787ff]' : 'bg-[#d4d4d4]'}`} />
                    {idx < arr.length - 1 && (
                      <div className="w-px bg-[#efefef] flex-1 mt-1" style={{ minHeight: 16 }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[13px] font-bold leading-none ${isActive ? 'text-[#0787ff]' : 'text-[#171717]'}`}>
                        {v.label}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-[2px] rounded-full text-white leading-none"
                        style={{ background: TAG_COLORS[v.tag] ?? '#737373' }}
                      >
                        {v.tag}
                      </span>
                      {v.current && (
                        <span className="text-[10px] font-medium text-[#16a34a]">latest</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#737373] mt-0.5 leading-snug">{v.note}</p>
                    <p className="text-[10px] text-[#b0b0b0] mt-0.5">{v.date}</p>
                  </div>

                  {isActive && (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 mt-1">
                      <path d="M2.5 6.5l3 3 5-5" stroke="#0787ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Trigger pill ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border shadow-[0px_2px_8px_rgba(0,0,0,0.10)] transition-all active:scale-95 ${
          open
            ? 'bg-white border-[#bfdbfe] shadow-[0px_2px_12px_rgba(7,135,255,0.18)]'
            : 'bg-white border-[#e5e5e5] hover:border-[#d0d0d0] hover:shadow-[0px_3px_12px_rgba(0,0,0,0.13)]'
        }`}
      >
        {/* Version badge */}
        <div className="flex items-center justify-center size-[22px] rounded-full bg-[#0787ff] shrink-0">
          <span className="text-[10px] font-bold text-white leading-none" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {active.label}
          </span>
        </div>
        {/* Label */}
        <span className="text-[12px] font-semibold text-[#262626] whitespace-nowrap leading-none">
          {active.tag}
        </span>
        {/* Chevron */}
        <svg
          width="11" height="11" viewBox="0 0 11 11" fill="none"
          className={`text-[#a3a3a3] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l3.5 3.5L9 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
