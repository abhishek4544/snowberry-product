'use client'

import * as React from 'react'
import type { KbdProps, KbdVariant } from './Kbd.types'

const VARIANT: Record<KbdVariant, string> = {
  // Subtle chip — same appearance as the badge inside Button
  default: 'bg-[rgba(26,26,26,0.06)] border-transparent text-slate-800',
  // Physical key — bordered, slightly raised
  key:     'bg-white border-slate-300 text-slate-700 shadow-xs',
}

export function Kbd({ variant = 'default', children, className, ...props }: KbdProps) {
  return (
    <kbd
      className={[
        'inline-flex items-center gap-0.5 border px-1 py-0.5 rounded-[4px]',
        'font-sans text-[11px] font-normal leading-none select-none',
        VARIANT[variant],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </kbd>
  )
}
