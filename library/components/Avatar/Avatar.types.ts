import * as React from 'react'

export type AvatarSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image URL for the avatar. Falls back to initials → placeholder if absent. */
  src?: string
  /** Full name used to derive initials when no src is provided. */
  name?: string
  /** Alt text for the image. Defaults to name if provided. */
  alt?: string
  /** Size variant — xs=18px sm=24px base=32px lg=44px xl=56px */
  size?: AvatarSize
}

export type AvatarGroupSize = 'sm' | 'base' | 'lg'

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of avatar items to display. */
  avatars: Pick<AvatarProps, 'src' | 'name' | 'alt'>[]
  /** Size variant. Defaults to 'base'. */
  size?: AvatarGroupSize
  /** Overflow count shown in the trailing counter bubble (e.g. 10 → "+10"). */
  overflowCount?: number
  /** Max visible avatars before truncating. Defaults to 4. */
  max?: number
}

export type AvatarGroupLabelType = 'heading-helper' | 'text'
export type AvatarGroupLabelSize = 'sm' | 'base' | 'lg' | 'xl'

export interface AvatarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Avatar image URL. */
  src?: string
  /** User's full name. */
  name: string
  /** Secondary line (email, role, etc.). Only shown in 'heading-helper' type. */
  helper?: string
  /** Layout type. 'heading-helper' = name + email, 'text' = name only. */
  type?: AvatarGroupLabelType
  /** Size variant. Defaults to 'base'. */
  size?: AvatarGroupLabelSize
}

// ─── Avatar Dot ───────────────────────────────────────────────────────────────

export type AvatarDotSize   = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
export type AvatarDotStatus = 'online' | 'offline' | 'alternative'

export interface AvatarDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Online = green, Offline = gray, Alternative = brand blue. Defaults to 'online'. */
  status?: AvatarDotStatus
  /** Matches the companion avatar's size. Defaults to 'base'. */
  size?: AvatarDotSize
}

// ─── Avatar Remove Button ─────────────────────────────────────────────────────

export type AvatarRemoveSize = 'xs' | 'sm' | 'base' | 'lg'

export interface AvatarRemoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Matches the companion avatar's size — xs=18px sm=24px base=32px lg=44px. Defaults to 'base'. */
  size?: AvatarRemoveSize
}
