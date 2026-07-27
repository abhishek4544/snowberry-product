/**
 * SettingsShell — wraps every /settings/* page.
 * Glass panel with left sub-nav + right content pane. Same page chrome
 * (TopBar, Sidebar) as the Performance pages — Sidebar's Settings gear
 * is active. TopBar and Sidebar are duplicated here for now; when we
 * touch this again we should extract them to a shared shell module.
 */

import {
  Search, Bell, Settings, Home, Plus, MessageSquare, MessagesSquare,
  ListChecks, Gauge, ImageIcon, Users as UsersIcon, Wrench, TrendingUp,
} from 'lucide-react'
import SettingsNav from './SettingsNav'

export default function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#EEF4FE]">
      <TopBar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0 px-6 pb-14 pt-4">
          <div className="mt-4 rounded-[20px] bg-white/60 p-6 ring-1 ring-white/80 backdrop-blur-md">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="md:sticky md:top-6 md:self-start">
                <SettingsNav />
              </aside>
              <section className="min-w-0">
                {children}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ─── Top bar ────────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/70 backdrop-blur-md px-6 py-2.5">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-[22px] font-bold tracking-tight text-brand-500">snowberry</span>
          <sup className="text-[9px] font-semibold text-brand-400">TM</sup>
        </div>
        <span className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <TrendingUp size={16} className="text-teal-600" strokeWidth={2.25} />
          <span className="text-[16px] font-semibold text-teal-700 font-display">उकालो</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-[420px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles, authors, tags…"
            className="w-full rounded-lg border border-black/10 bg-white/70 py-2.5 pl-9 pr-14 text-[14px] text-slate-800 placeholder:text-black/40 outline-none focus:border-slate-300 transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded bg-slate-900/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700">⌘K</kbd>
        </div>
        <button className="flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell size={18} strokeWidth={1.75} />
        </button>
        <button className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          <Settings size={18} strokeWidth={1.75} />
        </button>
        <div className="size-10 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&auto=format&fit=crop"
            alt="Mohan"
            className="size-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}

/* ─── Sidebar (Settings is active) ───────────────────────────────────── */

function Sidebar() {
  const primary = [
    { icon: Home,           label: 'Home',        active: false },
    { icon: Plus,           label: 'New',         active: false },
    { icon: MessageSquare,  label: 'Messages',    active: false },
    { icon: MessagesSquare, label: 'Chats',       active: false },
    { icon: ListChecks,     label: 'Tasks',       active: false },
    { icon: Gauge,          label: 'Performance', active: false },
    { icon: ImageIcon,      label: 'Media',       active: false },
    { icon: UsersIcon,      label: 'Team',        active: false },
    { icon: Wrench,         label: 'Tools',       active: false },
  ]
  const bottom = [
    { icon: UsersIcon, label: 'People',   active: false },
    { icon: Settings,  label: 'Settings', active: true  },
  ]
  return (
    <aside className="sticky top-[57px] flex h-[calc(100vh-57px)] w-[64px] shrink-0 flex-col items-center justify-between py-3">
      <nav className="flex flex-col items-center gap-2">
        {primary.map(({ icon: Icon, label, active }) => (
          <button
            key={label} title={label}
            className={[
              'flex size-11 items-center justify-center rounded-full transition-colors',
              active
                ? 'bg-brand-50 text-brand-500 shadow-[0_0_0_1px_rgba(7,135,255,0.15)]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={20} strokeWidth={1.75} />
          </button>
        ))}
      </nav>
      <nav className="flex flex-col items-center gap-2">
        {bottom.map(({ icon: Icon, label, active }) => (
          <button
            key={label} title={label}
            className={[
              'flex size-11 items-center justify-center rounded-full transition-colors',
              active
                ? 'bg-brand-50 text-brand-500 shadow-[0_0_0_1px_rgba(7,135,255,0.15)]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={20} strokeWidth={1.75} />
          </button>
        ))}
      </nav>
    </aside>
  )
}
