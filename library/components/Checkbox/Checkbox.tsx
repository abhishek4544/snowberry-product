'use client'

import * as React from 'react'
import type { CheckboxProps, CheckboxSize } from './Checkbox.types'

// ── Size tokens from Figma ─────────────────────────────────────────────────────
// sm=18px  md=20px  lg=24px  — all use radius_sm (6px)
const SIZE: Record<CheckboxSize, string> = {
  sm: 'w-[18px] h-[18px]',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

function Checkmark() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="w-[65%] h-[65%]" aria-hidden>
      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Minus() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="w-[65%] h-[65%]" aria-hidden>
      <path d="M2.5 6h7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Checkbox({
  checked: controlledChecked,
  defaultChecked = false,
  indeterminate = false,
  onChange,
  size = 'md',
  disabled = false,
  label,
  className,
  ...props
}: CheckboxProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isControlled = controlledChecked !== undefined
  const isChecked = isControlled ? controlledChecked : internalChecked

  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    const next = e.target.checked
    if (!isControlled) setInternalChecked(next)
    onChange?.(next)
  }

  let boxClasses: string
  const showCheck = !indeterminate && isChecked
  const showMinus = indeterminate

  if (disabled) {
    boxClasses = (isChecked || indeterminate)
      ? 'bg-neutral-200 border border-neutral-200'
      : 'bg-neutral-100 border border-neutral-200'
  } else if (isChecked || indeterminate) {
    boxClasses = 'bg-brand-500 border border-brand-500'
  } else {
    // Unchecked default — matches Figma: gradient + border + inner glow
    boxClasses = [
      'border-[1.4px] border-[rgba(0,0,0,0.09)]',
      'bg-gradient-to-b from-[#f2f2f4] to-white',
      'shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.03),inset_0px_3px_3px_0px_rgba(255,255,255,0.12)]',
    ].join(' ')
  }

  return (
    <label
      className={[
        'inline-flex items-center gap-2 select-none',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="relative inline-flex items-center justify-center shrink-0">
        <input
          ref={inputRef}
          type="checkbox"
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className="peer absolute inset-0 opacity-0 w-full h-full cursor-[inherit]"
          {...props}
        />
        <span
          aria-hidden
          className={[
            SIZE[size],
            'rounded-input',
            'flex items-center justify-center shrink-0 overflow-hidden',
            'transition-colors duration-150',
            boxClasses,
            'peer-focus-visible:shadow-focus',
          ].join(' ')}
        >
          {showCheck && <Checkmark />}
          {showMinus && <Minus />}
        </span>
      </span>

      {label && (
        <span className={['font-sans text-sm leading-[1.5] text-slate-900', disabled && 'text-[#9da4ae]'].filter(Boolean).join(' ')}>
          {label}
        </span>
      )}
    </label>
  )
}
