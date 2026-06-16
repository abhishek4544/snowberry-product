'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/* ─── Version registry ─────────────────────────────────────────────────────────
   Hardcoded route map. Each version is a real, navigable build of the app.
   Adding a new version = add a row here. No "push" — versions are checked in
   with the code.
   ────────────────────────────────────────────────────────────────────────── */
type Version = {
  id:    string         // stable key
  label: string         // "v1", "v2", …
  tag:   string         // short descriptor shown as colored chip
  note:  string         // one-line description
  date:  string         // when this version was added
  route: string         // route this version represents
  match?: (pathname: string) => boolean  // optional override for "is current"
}

const VERSIONS: Version[] = [
  { id: 'v1', label: 'v1', tag: 'Dashboard',  note: 'Initial dashboard + sidebar', date: 'Jun 1, 2026',  route: '/' },
  { id: 'v2', label: 'v2', tag: 'News list',  note: 'News index page',             date: 'Jun 5, 2026',  route: '/news' },
  { id: 'v3', label: 'v3', tag: 'Creation',   note: 'News creation flow (legacy)', date: 'Jun 9, 2026',  route: '/news/new' },
  { id: 'v4', label: 'v4', tag: 'New design', note: 'News creation v4',            date: 'Jun 15, 2026', route: '/news/new-v4' },
  { id: 'v5', label: 'v5', tag: 'Berry AI',   note: 'AI-first vibrant theme',      date: 'Jun 15, 2026', route: '/news/new-v5' },
]

const TAG_COLORS: Record<string, string> = {
  Dashboard:    '#737373',
  'News list':  '#8B5CF6',
  Creation:     '#0787ff',
  'New design': '#16a34a',
  'Berry AI':   '#7c3aed',
}

/** Pick the version whose route best matches the current pathname.
 *  Longest-prefix match wins so /news/new-v4 picks v4 and not v3.  */
function pickActive(pathname: string): Version {
  const matches = VERSIONS
    .filter(v => v.match ? v.match(pathname) : pathname === v.route || pathname.startsWith(v.route + '/'))
    .sort((a, b) => b.route.length - a.route.length)
  return matches[0] ?? VERSIONS[VERSIONS.length - 1]
}

export default function VersionSwitcher() {
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = pickActive(pathname)

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Keyboard shortcut: ⌘+[ / ⌘+] cycles versions
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key !== '[' && e.key !== ']') return
      const i = VERSIONS.findIndex(v => v.id === active.id)
      const next = e.key === ']'
        ? VERSIONS[(i + 1) % VERSIONS.length]
        : VERSIONS[(i - 1 + VERSIONS.length) % VERSIONS.length]
      router.push(next.route)
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active.id, router])

  function switchTo(v: Version) {
    router.push(v.route)
    setOpen(false)
  }

  return (
    <div ref={ref} className="fixed bottom-4 left-4 z-[9999]" style={{ fontFamily: 'var(--font-inter)' }}>

      {/* ── Popup panel (opens upward) ── */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-[280px] bg-white border border-[#e5e5e5] rounded-[14px] shadow-[0px_12px_32px_-6px_rgba(0,0,0,0.18),0px_0px_1px_rgba(0,0,0,0.10)] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#f0f0f0]">
            <p className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
              Build versions
            </p>
            <span className="text-[10px] font-medium text-[#a3a3a3]">
              ⌘[ / ⌘]
            </span>
          </div>

          {/* Version list */}
          <div className="flex flex-col py-1 max-h-[320px] overflow-y-auto">
            {[...VERSIONS].reverse().map((v, idx, arr) => {
              const isActive = v.id === active.id
              return (
                <button
                  key={v.id}
                  onClick={() => switchTo(v)}
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
                      {idx === 0 && (
                        <span className="text-[10px] font-medium text-[#16a34a]">latest</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#737373] mt-0.5 leading-snug">{v.note}</p>
                    <p className="text-[10px] text-[#b0b0b0] mt-0.5 font-mono">{v.route}</p>
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
