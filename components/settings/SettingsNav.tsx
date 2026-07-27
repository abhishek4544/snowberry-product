'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings2, Zap, Globe, CreditCard, Palette, Search,
  Shield, FileClock, Sparkles, HelpCircle,
} from 'lucide-react'

const PRIMARY = [
  { href: '/settings/general',       label: 'General',         icon: Settings2  },
  { href: '/settings/integration',   label: 'Integration',     icon: Zap        },
  { href: '/settings/custom-domain', label: 'Custom Domain',   icon: Globe      },
  { href: '/settings/billing',       label: 'Billing & Usage', icon: CreditCard },
  { href: '/settings/brand-kit',     label: 'Brand Kit',       icon: Palette    },
  { href: '/settings/seo',           label: 'SEO',             icon: Search     },
  { href: '/settings/security',      label: 'Security',        icon: Shield     },
  { href: '/settings/audit-logs',    label: 'Audit Logs',      icon: FileClock  },
] as const

const SECONDARY = [
  { href: '/settings/whats-new', label: "What's New", icon: Sparkles    },
  { href: '/settings/help',      label: 'Help',       icon: HelpCircle  },
] as const

export default function SettingsNav() {
  const path = usePathname() ?? ''
  return (
    <nav className="flex flex-col gap-0.5">
      {PRIMARY.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              active
                ? 'bg-white text-slate-900 ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900',
            ].join(' ')}
          >
            <Icon size={15} strokeWidth={1.75} className={active ? 'text-brand-500' : 'text-slate-400'} />
            {label}
          </Link>
        )
      })}

      <div className="mt-5 flex flex-col gap-0.5 border-t border-slate-200/60 pt-3">
        {SECONDARY.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
          >
            <Icon size={15} strokeWidth={1.75} className="text-slate-400" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
