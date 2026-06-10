'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Layers,
  Newspaper,
  FileText,
  Tag,
  Layout,
  BookOpen,
  Archive,
  MessageSquare,
  ListChecks,
  BarChart2,
  Image as ImageIcon,
  Users,
  Wrench,
  Settings,
  Plus,
  ChevronUp,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@ui/Button'

// ─── Assets ──────────────────────────────────────────────────────────────────
const LOGO_WORDMARK = '/logo-wordmark.svg'
const LOGO_MARK     = '/logo-mark.svg'

// ─── Nav config ──────────────────────────────────────────────────────────────

export type NavChild = {
  id: string
  label: string
  Icon: LucideIcon
  href: string
}

export type NavItem = {
  id: string
  label: string
  Icon: LucideIcon
  href?: string
  expandable?: boolean
  children?: NavChild[]
}

export const NAV: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',          Icon: LayoutDashboard, href: '/' },
  {
    id: 'content', label: 'Content', Icon: Layers, expandable: true,
    children: [
      { id: 'news',     label: 'News',          Icon: Newspaper, href: '/news'     },
      { id: 'drafts',   label: 'Drafts',        Icon: FileText,  href: '/drafts'   },
      { id: 'category', label: 'Category',      Icon: Tag,       href: '/category' },
      { id: 'pages',    label: 'Pages',         Icon: Layout,    href: '/pages'    },
      { id: 'series',   label: 'Series',        Icon: BookOpen,  href: '/series'   },
      { id: 'archived', label: 'Archived news', Icon: Archive,   href: '/archived' },
    ],
  },
  { id: 'engagement',  label: 'Engagement',         Icon: MessageSquare, expandable: true, children: [] },
  { id: 'task',        label: 'Task',               Icon: ListChecks,    href: '/task'        },
  { id: 'performance', label: 'Performance',         Icon: BarChart2,     href: '/performance' },
  { id: 'media',       label: 'Media',              Icon: ImageIcon,     href: '/media'       },
  { id: 'people',      label: 'People and User',    Icon: Users,         href: '/people'      },
  { id: 'siteconfig',  label: 'Site configuration', Icon: Wrench,        expandable: true, children: [] },
  { id: 'settings',    label: 'General Settings',   Icon: Settings,      href: '/settings'    },
]

export const PINNED: NavChild[] = [
  { id: 'pinned-news',   label: 'News',   Icon: Newspaper, href: '/news'   },
  { id: 'pinned-drafts', label: 'Drafts', Icon: FileText,  href: '/drafts' },
]

// ─── Shared label classes ─────────────────────────────────────────────────────
// Figma: Inter Medium 14px / lh 1.25 / tracking -0.14px
const LABEL_CLS = 'flex-1 min-w-0 font-sans text-[14px] font-medium tracking-[-0.14px] leading-[1.25] truncate'

// ─── Primitives ───────────────────────────────────────────────────────────────

type NavButtonProps = {
  Icon: LucideIcon
  label: string
  active?: boolean
  chevron?: 'up' | 'down'
  onClick: () => void
}

function NavButton({ Icon, label, active, chevron, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-1 h-9 w-full px-2 rounded-lg',
        'transition-colors duration-150 select-none text-left',
        active
          ? 'bg-brand-50 text-brand-600'
          : 'text-slate-800 hover:bg-slate-50',
      ].join(' ')}
    >
      <Icon size={18} strokeWidth={1.5} className="shrink-0" />
      <span className={LABEL_CLS}>{label}</span>
      {chevron === 'up'   && <ChevronUp   size={14} strokeWidth={1.5} className="shrink-0 text-slate-400" />}
      {chevron === 'down' && <ChevronDown size={14} strokeWidth={1.5} className="shrink-0 text-slate-400" />}
    </button>
  )
}

type SubNavButtonProps = {
  Icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}

function SubNavButton({ Icon, label, active, onClick }: SubNavButtonProps) {
  return (
    <div className="flex items-center h-9 pl-2">
      {/* Vertical connector — Figma: neutral/300 */}
      <div className="flex items-center justify-center h-full shrink-0 w-4 px-[7px]">
        <div className="h-full w-px bg-neutral-300" />
      </div>
      <button
        type="button"
        onClick={onClick}
        className={[
          'flex flex-1 items-center gap-1 min-w-0 p-2 rounded-lg',
          'transition-colors duration-150 select-none text-left',
          active
            ? 'bg-brand-50 text-brand-600'
            : 'text-slate-800 hover:bg-slate-50',
        ].join(' ')}
      >
        <Icon size={18} strokeWidth={1.5} className="shrink-0" />
        <span className={LABEL_CLS}>{label}</span>
      </button>
    </div>
  )
}

type IconNavButtonProps = {
  Icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}

function IconNavButton({ Icon, label, active, onClick }: IconNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={[
        'flex items-center justify-center w-9 h-9 rounded-lg',
        'transition-colors duration-150',
        active
          ? 'bg-brand-50 text-brand-600'
          : 'text-slate-600 hover:bg-slate-50',
      ].join(' ')}
    >
      <Icon size={18} strokeWidth={1.5} />
    </button>
  )
}

type SectionLabelProps = { label: string }

function SectionLabel({ label }: SectionLabelProps) {
  return (
    <div className="flex items-center px-1 py-2">
      <span className="font-sans text-xs font-medium text-slate-500 whitespace-nowrap leading-[1.5]">
        {label}
      </span>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [collapsed,    setCollapsed]    = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['content']))

  function toggleSection(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const isActive = (href?: string) => !!href && pathname === href

  /* ── Collapsed ─────────────────────────────────────────────────────────── */
  if (collapsed) {
    return (
      <aside
        className="flex flex-col gap-4 items-start px-3 py-4 border-r border-slate-200 bg-white shrink-0 h-full overflow-y-auto"
        style={{ width: 60 }}
      >
        {/* Logo mark — hover: subtle fade, click → home */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="pb-3.5 border-b border-slate-200 w-full flex items-center justify-center hover:opacity-75 transition-opacity"
          aria-label="Go to homepage"
        >
          <img src={LOGO_MARK} alt="Snowberry" className="w-[30px] h-[30px]" />
        </button>

        {/* New article icon — Figma collapsed: rounded-[8px], border, subtle shadow */}
        <button
          type="button"
          onClick={() => router.push('/news/new')}
          title="New article (⌘N)"
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600
            shadow-[0px_0px_8px_0px_rgba(0,0,0,0.04),0px_1px_0.5px_0px_rgba(29,41,61,0.02)]
            hover:bg-slate-50 transition-colors duration-150"
        >
          <Plus size={18} strokeWidth={1.5} />
        </button>

        {/* Nav icons */}
        <nav className="flex flex-col gap-0.5 w-full">
          {NAV.map(item => (
            <IconNavButton
              key={item.id}
              Icon={item.Icon}
              label={item.label}
              active={isActive(item.href)}
              onClick={() => item.href ? router.push(item.href) : setCollapsed(false)}
            />
          ))}
        </nav>

        {/* Pinned icons */}
        <nav className="flex flex-col gap-0.5 w-full">
          {PINNED.map(item => (
            <IconNavButton
              key={item.id}
              Icon={item.Icon}
              label={item.label}
              active={isActive(item.href)}
              onClick={() => router.push(item.href)}
            />
          ))}
        </nav>

        {/* Expand toggle */}
        <div className="mt-auto w-full flex justify-center">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400
              hover:text-slate-600 hover:bg-slate-50 transition-colors duration-150"
          >
            <PanelLeftOpen size={16} strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    )
  }

  /* ── Expanded ──────────────────────────────────────────────────────────── */
  return (
    <aside
      className="flex flex-col gap-3 p-3 border-r border-slate-200 bg-white shrink-0 h-full overflow-y-auto"
      style={{ width: 235 }}
    >
      {/* Logo wordmark — hover: subtle fade, click → home */}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="flex items-center pb-3 pl-2 pr-1 pt-1.5 select-none hover:opacity-75 transition-opacity"
        aria-label="Go to homepage"
      >
        <img src={LOGO_WORDMARK} alt="Snowberry" className="h-[22px]" />
      </button>

      {/* New article + collapse toggle */}
      <div className="flex items-center gap-1 w-full">
        <Button
          color="tertiary"
          size="base"
          leftIcon={<Plus size={20} strokeWidth={1.5} />}
          kbd="⌘N"
          onClick={() => router.push('/news/new')}
          className="flex-1 min-w-0 justify-start"
        >
          New article
        </Button>

        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Collapse sidebar"
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400
            hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150 shrink-0"
        >
          <PanelLeftClose size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-2 w-full flex-1 min-h-0">

        {/* Main nav */}
        <nav className="flex flex-col w-full">
          {NAV.map(item => {
            const isOpen    = openSections.has(item.id)
            const active    = isActive(item.href)
            const hasChildren = item.expandable && !!item.children?.length

            return (
              <div key={item.id}>
                <NavButton
                  Icon={item.Icon}
                  label={item.label}
                  active={active}
                  chevron={item.expandable ? (isOpen ? 'up' : 'down') : undefined}
                  onClick={() => {
                    if (hasChildren) toggleSection(item.id)
                    else if (item.href) router.push(item.href)
                  }}
                />

                {hasChildren && isOpen && item.children!.map(child => (
                  <SubNavButton
                    key={child.id}
                    Icon={child.Icon}
                    label={child.label}
                    active={isActive(child.href)}
                    onClick={() => router.push(child.href)}
                  />
                ))}
              </div>
            )
          })}
        </nav>

        {/* Pinned section */}
        <nav className="flex flex-col w-full">
          <SectionLabel label="Pinned" />
          {PINNED.map(item => (
            <NavButton
              key={item.id}
              Icon={item.Icon}
              label={item.label}
              active={isActive(item.href)}
              onClick={() => router.push(item.href)}
            />
          ))}
        </nav>
      </div>
    </aside>
  )
}
