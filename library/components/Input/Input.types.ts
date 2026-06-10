import * as React from 'react'

export type InputSize = 'sm' | 'md'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant — sm=36px md=40px. Defaults to 'md'. */
  size?: InputSize
  /** Renders a red border and error focus ring. */
  error?: boolean
  /** Icon on the leading (left) edge. */
  leftIcon?: React.ReactNode
  /** Icon on the trailing (right) edge. Ignored when type="password". */
  rightIcon?: React.ReactNode
}
