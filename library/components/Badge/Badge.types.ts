import * as React from 'react'

export type BadgeTheme = 'brand' | 'success' | 'danger' | 'gray' | 'white'
export type BadgeSize  = 'sm' | 'lg'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual color theme. Defaults to 'gray'. */
  theme?: BadgeTheme
  /** Size variant — sm=20px lg=24px. Defaults to 'sm'. */
  size?: BadgeSize
  /** Shows a colored dot before the label. Dot color follows theme. */
  dot?: boolean
  /** Icon rendered before the label. Ignored when `dot` or `avatar` is set. */
  icon?: React.ReactNode
  /** Avatar/image node rendered before the label. Takes priority over dot and icon. */
  avatar?: React.ReactNode
}
