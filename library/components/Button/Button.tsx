'use client'

import * as React from 'react'
import type { ButtonProps, ButtonColor, ButtonSize } from './Button.types'
import { Kbd } from '../Kbd'

// ─── Size tokens ── derived from Figma frame measurements ─────────────────────
// text:   px/py for label buttons
// square: fixed w×h for icon-only  xs=32 sm=36 base=40 l=44
// icon:   inner icon box (16px across all sizes — confirmed Figma)
const SIZE: Record<ButtonSize, { text: string; square: string; gap: string; icon: string }> = {
  xs:   { text: 'px-3 py-1.5',      square: 'w-8 h-8',   gap: 'gap-1.5', icon: 'w-4 h-4' },
  sm:   { text: 'px-3.5 py-2',      square: 'w-9 h-9',   gap: 'gap-1.5', icon: 'w-4 h-4' },
  base: { text: 'px-4 py-2.5',      square: 'w-10 h-10', gap: 'gap-1.5', icon: 'w-4 h-4' },
  l:    { text: 'px-[18px] py-3.5', square: 'w-11 h-11', gap: 'gap-1.5', icon: 'w-4 h-4' },
}

// ─── Color tokens ─────────────────────────────────────────────────────────────
type ColorConfig = {
  base: string
  hover: string
  focus: string
  disabled: string
  style?: React.CSSProperties
}

const COLOR: Record<ButtonColor, ColorConfig> = {
  brand: {
    base:     'bg-brand-500 text-white shadow-button',
    hover:    'hover:bg-brand-600',
    focus:    'focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-1',
    disabled: 'disabled:bg-neutral-400 disabled:shadow-none',
  },
  secondary: {
    base:     'bg-slate-50 text-slate-800 border border-slate-200 shadow-tertiary',
    hover:    'hover:bg-slate-100',
    focus:    'focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1',
    disabled: 'disabled:opacity-50',
  },
  tertiary: {
    base:     'bg-white text-slate-800 border border-slate-200 shadow-xs',
    hover:    'hover:bg-slate-50',
    focus:    'focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1',
    disabled: 'disabled:opacity-50',
  },
  ai: {
    base:     'text-slate-50 border border-brand-200 shadow-xs',
    hover:    'hover:brightness-105',
    focus:    'focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1',
    disabled: 'disabled:opacity-50',
    // 245.27° gradient — can't be expressed as a Tailwind utility
    style:    { background: 'linear-gradient(245deg, #35B0FF 28%, #76CDFF 93%)' },
  },
  dark: {
    base:     'bg-slate-900 text-white shadow-xs',
    hover:    'hover:bg-slate-800',
    focus:    'focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-1',
    disabled: 'disabled:opacity-50',
  },
  ghost: {
    base:     'bg-transparent text-slate-800',
    hover:    'hover:bg-slate-50',
    focus:    'focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-1',
    disabled: 'disabled:opacity-50',
  },
  danger: {
    base:     'bg-transparent text-[#B91C1C] border border-[#B91C1C] shadow-xs',
    hover:    'hover:bg-[#FEF2F2]',
    focus:    'focus-visible:ring-2 focus-visible:ring-[#FCA5A5] focus-visible:ring-offset-1',
    disabled: 'disabled:opacity-50',
  },
  'link-danger': {
    base:     'bg-transparent text-[#B91C1C]',
    hover:    'hover:bg-[#FEF2F2]',
    focus:    'focus-visible:ring-2 focus-visible:ring-[#FCA5A5] focus-visible:ring-offset-1',
    disabled: 'disabled:opacity-50',
  },
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={['animate-spin shrink-0', className].filter(Boolean).join(' ')}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({
  type     = 'button',
  color    = 'brand',
  size     = 'base',
  iconOnly = false,
  leftIcon,
  rightIcon,
  kbd,
  loading  = false,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const s = SIZE[size]
  const c = COLOR[color]

  const classes = [
    'relative inline-flex items-center justify-center',
    'rounded-base',
    // Figma: Inter Medium 14px / lh 1.25 / tracking -0.14px
    'font-sans font-medium text-sm leading-[1.25] tracking-[-0.14px]',
    'select-none whitespace-nowrap',
    'transition-colors duration-150',
    'focus-visible:outline-none',
    'disabled:cursor-not-allowed',
    s.gap,
    iconOnly ? s.square : s.text,
    c.base,
    c.hover,
    c.focus,
    c.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      style={{ ...c.style, ...style }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* Leading: spinner when loading, left icon otherwise */}
      {loading ? (
        <Spinner className={s.icon} />
      ) : (
        leftIcon && !iconOnly && (
          <span className={`shrink-0 flex items-center justify-center ${s.icon}`} aria-hidden>
            {leftIcon}
          </span>
        )
      )}

      {/* Label */}
      {!iconOnly && children}

      {/* Icon-only content */}
      {iconOnly && !loading && (
        <span className={`shrink-0 flex items-center justify-center ${s.icon}`} aria-hidden>
          {children}
        </span>
      )}

      {/* Trailing icon */}
      {!iconOnly && !loading && rightIcon && (
        <span className={`shrink-0 flex items-center justify-center ${s.icon}`} aria-hidden>
          {rightIcon}
        </span>
      )}

      {/* KBD badge — hidden while loading */}
      {!iconOnly && !loading && kbd && (
        <Kbd>{kbd}</Kbd>
      )}
    </button>
  )
}
