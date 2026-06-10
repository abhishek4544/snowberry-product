import * as React from 'react'

export type HintState = 'default' | 'error' | 'disabled'

export interface HintProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Controls text color. 'default' = muted, 'error' = red, 'disabled' = faded. */
  state?: HintState
  /** Optional icon rendered before the text. */
  icon?: React.ReactNode
}
