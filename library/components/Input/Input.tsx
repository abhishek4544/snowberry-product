'use client'

import * as React from 'react'
import type { InputProps, InputSize } from './Input.types'

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

// ─── Size tokens ── height and horizontal padding on the wrapper ──────────────
const SIZE: Record<InputSize, { height: string; px: string }> = {
  sm: { height: 'h-9',  px: 'px-3'   },
  md: { height: 'h-10', px: 'px-3.5' },
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({
  size      = 'md',
  error     = false,
  type      = 'text',
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword   = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type
  const s = SIZE[size]

  return (
    <div
      className={[
        // Layout
        'flex items-center gap-2 w-full',
        // Shape
        'border rounded-base transition-colors duration-150',
        s.height,
        s.px,
        // Border & focus ring
        error
          ? 'border-danger-500 focus-within:border-danger-500 focus-within:shadow-[0px_0px_0px_4px_rgba(239,68,68,0.12)]'
          : 'border-slate-200 focus-within:border-brand-500 focus-within:shadow-focus',
        // Background
        disabled ? 'bg-neutral-50 opacity-60 cursor-not-allowed' : 'bg-white',
        className,
      ].filter(Boolean).join(' ')}
    >
      {leftIcon && (
        <span className="shrink-0 flex items-center justify-center w-4 h-4 text-slate-400" aria-hidden>
          {leftIcon}
        </span>
      )}

      <input
        type={resolvedType}
        disabled={disabled}
        className="flex-1 min-w-0 bg-transparent focus:outline-none font-sans text-sm font-normal text-slate-800 placeholder:text-slate-400 disabled:cursor-not-allowed"
        {...props}
      />

      {/* Password show/hide toggle */}
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(v => !v)}
          className="shrink-0 flex items-center justify-center w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}

      {rightIcon && !isPassword && (
        <span className="shrink-0 flex items-center justify-center w-4 h-4 text-slate-400" aria-hidden>
          {rightIcon}
        </span>
      )}
    </div>
  )
}
