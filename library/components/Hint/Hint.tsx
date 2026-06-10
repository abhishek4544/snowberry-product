'use client'

import * as React from 'react'
import type { HintProps, HintState } from './Hint.types'

const STATE_COLOR: Record<HintState, string> = {
  default:  'text-slate-500',
  error:    'text-danger-500',
  disabled: 'text-slate-400',
}

export function Hint({ state = 'default', icon, children, className, ...props }: HintProps) {
  return (
    <p
      className={[
        'flex items-start gap-1 font-sans text-xs font-normal leading-[1.5]',
        STATE_COLOR[state],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {icon && (
        <span className="shrink-0 mt-px flex items-center" aria-hidden>
          {icon}
        </span>
      )}
      {children}
    </p>
  )
}
