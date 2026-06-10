import * as React from 'react'

export type KbdVariant = 'default' | 'key'

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Visual variant.
   * 'default' = subtle chip (used inline in buttons).
   * 'key'     = physical key appearance with border and shadow. */
  variant?: KbdVariant
}
