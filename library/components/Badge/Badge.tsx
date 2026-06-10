'use client'

import * as React from 'react'
import type { BadgeProps, BadgeTheme, BadgeSize } from './Badge.types'

// ─── Theme tokens ── bg / text / border / dot-color ──────────────────────────
type ThemeConfig = { badge: string; dot: string }

const THEME: Record<BadgeTheme, ThemeConfig> = {
  brand:   { badge: 'bg-brand-50 text-brand-900 border border-brand-200',                     dot: 'bg-brand-500'   },
  success: { badge: 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]',                    dot: 'bg-success-500' },
  danger:  { badge: 'bg-[#FEF2F2] text-danger-600 border border-[#FECACA]',                   dot: 'bg-danger-500'  },
  gray:    { badge: 'bg-slate-100 text-slate-700 border border-slate-200',                     dot: 'bg-slate-400'   },
  white:   { badge: 'bg-white text-slate-700 border border-slate-200 shadow-xs',              dot: 'bg-slate-400'   },
}

// ─── Size tokens ── height / padding / leading element sizes ─────────────────
type SizeConfig = { wrap: string; text: string; dot: string; icon: string; avatar: string }

const SIZE: Record<BadgeSize, SizeConfig> = {
  sm: { wrap: 'h-5 px-2 gap-1',     text: 'text-xs font-medium leading-none', dot: 'w-1.5 h-1.5', icon: 'w-3 h-3',     avatar: '-ml-0.5 w-4 h-4'  },
  lg: { wrap: 'h-6 px-2.5 gap-1.5', text: 'text-xs font-medium leading-none', dot: 'w-2 h-2',     icon: 'w-3.5 h-3.5', avatar: '-ml-1 w-5 h-5'    },
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({
  theme   = 'gray',
  size    = 'sm',
  dot     = false,
  icon,
  avatar,
  children,
  className,
  ...props
}: BadgeProps) {
  const t = THEME[theme]
  const s = SIZE[size]

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-sans select-none whitespace-nowrap',
        s.wrap,
        t.badge,
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {/* Avatar takes priority */}
      {avatar && (
        <span className={`shrink-0 overflow-hidden rounded-full ${s.avatar}`} aria-hidden>
          {avatar}
        </span>
      )}

      {/* Dot — shown when no avatar */}
      {dot && !avatar && (
        <span className={`shrink-0 rounded-full ${s.dot} ${t.dot}`} aria-hidden />
      )}

      {/* Icon — shown when no dot and no avatar */}
      {icon && !dot && !avatar && (
        <span className={`shrink-0 flex items-center justify-center ${s.icon}`} aria-hidden>
          {icon}
        </span>
      )}

      <span className={s.text}>{children}</span>
    </span>
  )
}
