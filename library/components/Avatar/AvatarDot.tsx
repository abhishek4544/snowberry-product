'use client'

import * as React from 'react'
import type { AvatarDotProps, AvatarDotSize, AvatarDotStatus } from './Avatar.types'

// ─── Size tokens ── dot dimensions + white ring thickness ────────────────────
const DOT_SIZE: Record<AvatarDotSize, string> = {
  xs:   'w-1.5 h-1.5 ring-1',
  sm:   'w-2 h-2 ring-[1.5px]',
  base: 'w-2.5 h-2.5 ring-2',
  lg:   'w-3 h-3 ring-2',
  xl:   'w-3.5 h-3.5 ring-2',
}

// ─── Status colors ────────────────────────────────────────────────────────────
const DOT_STATUS: Record<AvatarDotStatus, string> = {
  online:      'bg-success-500',
  offline:     'bg-neutral-400',
  alternative: 'bg-brand-500',
}

// ─── AvatarDot ────────────────────────────────────────────────────────────────
// Renders as an inline span; consumers position it (e.g. absolute bottom-0 right-0)
// The white ring visually separates the dot from the avatar background.
export function AvatarDot({
  status = 'online',
  size   = 'base',
  className,
  ...props
}: AvatarDotProps) {
  return (
    <span
      aria-label={status}
      role="img"
      className={[
        'inline-block rounded-full ring-white',
        DOT_SIZE[size],
        DOT_STATUS[status],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
