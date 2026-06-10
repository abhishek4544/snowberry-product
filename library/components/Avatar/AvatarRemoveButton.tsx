'use client'

import * as React from 'react'
import type { AvatarRemoveButtonProps, AvatarRemoveSize } from './Avatar.types'

// ─── Size tokens ── button matches the companion avatar's pixel dimensions ────
const SIZE: Record<AvatarRemoveSize, { container: string; iconSize: number }> = {
  xs:   { container: 'w-[18px] h-[18px]', iconSize: 8  },
  sm:   { container: 'w-6 h-6',           iconSize: 10 },
  base: { container: 'w-8 h-8',           iconSize: 12 },
  lg:   { container: 'w-11 h-11',         iconSize: 16 },
}

// ─── AvatarRemoveButton ───────────────────────────────────────────────────────
// Circular × button rendered as an overlay on an avatar (positioned by the consumer).
export function AvatarRemoveButton({
  size = 'base',
  className,
  ...props
}: AvatarRemoveButtonProps) {
  const s = SIZE[size]

  return (
    <button
      type="button"
      aria-label="Remove"
      className={[
        'inline-flex items-center justify-center rounded-full',
        'bg-slate-900 text-white',
        'hover:bg-slate-700 transition-colors duration-150',
        'focus-visible:outline-none focus-visible:shadow-focus',
        s.container,
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <svg width={s.iconSize} height={s.iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  )
}
