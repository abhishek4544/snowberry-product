'use client'

/**
 * MediaShell — shared chrome for /media/* routes.
 * Owns background gradient, top bar and left icon rail so page components
 * only render main content.
 */

import Link from 'next/link'
import {
  TrendingUp, Search, Bell, Settings, Home, Plus, MessageSquare,
  MessagesSquare, ListChecks, Gauge, Image as ImageIcon, Users, Wrench,
} from 'lucide-react'

export function MediaShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full font-sans text-slate-900"
      style={{
        background:
          'linear-gradient(180deg, #EEF3FA 0%, #F3F6FB 40%, #F7F9FC 100%)',
      }}
    >
      <TopBar />
      <div className="flex">
        <SidebarRail />
        <main className="min-w-0 flex-1 px-5 pb-12 pt-2 sm:px-8 lg:px-12 lg:pt-4">
          {children}
        </main>
      </div>
    </div>
  )
}

/* ─── Top bar ─────────────────────────────────────────────────────────── */

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4 px-5 pt-4 sm:px-8 sm:pt-5 lg:px-10">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/media" className="flex items-center gap-1.5">
          <span className="font-display text-[20px] font-bold tracking-tight text-brand-500 sm:text-[22px]">
            snowberry
          </span>
          <sup className="text-[9px] font-semibold text-brand-400">TM</sup>
        </Link>
        <span className="hidden h-6 w-px bg-slate-300 sm:block" />
        <div className="hidden items-center gap-1.5 sm:flex">
          <TrendingUp size={15} className="text-teal-600" strokeWidth={2.25} />
          <span className="font-display text-[16px] font-semibold text-teal-700">उकालो</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden w-[280px] md:block lg:w-[420px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles, authors, tags…"
            className="w-full rounded-full bg-white/80 py-2.5 pl-10 pr-14 text-[13.5px] text-slate-800 placeholder:text-slate-400 outline-none ring-1 ring-slate-200/80 focus:bg-white focus:ring-brand-400 transition-all"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">
            ⌘K
          </kbd>
        </div>

        <button className="relative flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-white transition-colors">
          <Bell size={17} strokeWidth={1.75} />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-[#EEF3FA]" />
        </button>
        <button className="hidden size-10 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors sm:flex">
          <Settings size={17} strokeWidth={1.75} />
        </button>
        <div className="size-10 overflow-hidden rounded-full ring-2 ring-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80&auto=format&fit=crop"
            alt="Anna D."
            className="size-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}

/* ─── Sidebar rail (floating icons, no container) ────────────────────── */

export function SidebarRail() {
  const primary = [
    { icon: Home,           label: 'Home',        href: '/'      },
    { icon: Plus,           label: 'New',         href: '/news/new-v11', primary: true },
    { icon: MessageSquare,  label: 'Messages',    href: '#'      },
    { icon: MessagesSquare, label: 'Chats',       href: '#'      },
    { icon: ListChecks,     label: 'Tasks',       href: '#'      },
    { icon: Gauge,          label: 'Performance', href: '#'      },
    { icon: ImageIcon,      label: 'Media',       href: '/media', active: true },
    { icon: Users,          label: 'Audience',    href: '#'      },
    { icon: Wrench,         label: 'Tools',       href: '#'      },
  ]
  const bottom = [
    { icon: Users,    label: 'Team',     href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
  ]

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[64px] shrink-0 flex-col items-center justify-between py-3 lg:flex">
      <nav className="flex flex-col items-center gap-1.5">
        {primary.map(({ icon: Icon, label, active, primary: isPrimary, href }) => (
          <Link
            key={label}
            href={href}
            title={label}
            className={[
              'flex size-11 items-center justify-center rounded-xl transition-colors',
              active
                ? 'bg-brand-500 text-white shadow-[0_6px_14px_-4px_rgba(7,135,255,0.55)]'
                : isPrimary
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'text-slate-500 hover:bg-white hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={18} strokeWidth={active || isPrimary ? 2.25 : 1.75} />
          </Link>
        ))}
      </nav>
      <nav className="flex flex-col items-center gap-1.5">
        {bottom.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            title={label}
            className="flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
          >
            <Icon size={18} strokeWidth={1.75} />
          </Link>
        ))}
      </nav>
    </aside>
  )
}
