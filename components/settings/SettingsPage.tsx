'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  Bell,
  Lock,
  Building2,
  CreditCard,
  Users,
  ChevronLeft,
  Camera,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SectionId =
  | 'profile'
  | 'notifications'
  | 'security'
  | 'newsroom'
  | 'billing'
  | 'team'

const NAV: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile',       label: 'Profile',         icon: User },
  { id: 'notifications', label: 'Notifications',   icon: Bell },
  { id: 'security',      label: 'Security',        icon: Lock },
  { id: 'newsroom',      label: 'Newsroom',        icon: Building2 },
  { id: 'billing',       label: 'Billing',         icon: CreditCard },
  { id: 'team',          label: 'Team & access',   icon: Users },
]

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>('profile')

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-6">
          <Link
            href="/newsroom"
            className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ChevronLeft className="size-4" />
            Back
          </Link>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <h1 className="font-display text-lg font-medium">Settings</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-[220px_1fr] gap-8 px-6 py-8">
        {/* Left rail */}
        <aside className="sticky top-20 self-start">
          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm transition-colors ${
                  active === id
                    ? 'bg-brand-50 text-brand-950 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-6">
          {active === 'profile'       && <ProfileSection />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'security'      && <SecuritySection />}
          {active === 'newsroom'      && <NewsroomSection />}
          {active === 'billing'       && <BillingSection />}
          {active === 'team'          && <TeamSection />}
        </main>
      </div>
    </div>
  )
}

/* ─── Profile ─────────────────────────────────────────────────────────── */

function ProfileSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          How you appear across the Snowberry newsroom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src="" alt="Profile photo" />
              <AvatarFallback className="bg-brand-100 text-brand-950">
                AT
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border border-neutral-200 bg-white shadow-xs hover:bg-neutral-50"
              aria-label="Upload photo"
            >
              <Camera className="size-3" />
            </button>
          </div>
          <div className="text-sm text-neutral-600">
            PNG or JPG, up to 2 MB.
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline">Upload</Button>
              <Button size="sm" variant="ghost">Remove</Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input defaultValue="Abhishek" />
          </Field>
          <Field label="Last name">
            <Input defaultValue="Thapa" />
          </Field>
          <Field label="Email">
            <Input type="email" defaultValue="abhishek@snowberry.io" />
          </Field>
          <Field label="Role">
            <Select defaultValue="editor">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Bio" hint="A short blurb shown on your author page.">
          <Textarea
            rows={3}
            defaultValue="Editor covering politics and business at Snowberry."
          />
        </Field>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  )
}

/* ─── Notifications ───────────────────────────────────────────────────── */

function NotificationsSection() {
  const rows: { title: string; hint: string; on?: boolean }[] = [
    { title: 'New article published',   hint: 'When any article is published to the site.', on: true },
    { title: 'Comments on my articles', hint: 'Only articles you authored or edited.',      on: true },
    { title: 'Mentions',                hint: 'When another editor @mentions you.',        on: true },
    { title: 'Weekly digest',           hint: 'Every Monday, 8am local time.',              on: false },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what shows up in your inbox.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-neutral-100">
        {rows.map((r) => (
          <div key={r.title} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-900">{r.title}</div>
              <div className="text-sm text-neutral-500">{r.hint}</div>
            </div>
            <Switch defaultChecked={r.on} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ─── Security ────────────────────────────────────────────────────────── */

function SecuritySection() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Use at least 12 characters.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password">
            <Input type="password" />
          </Field>
          <div />
          <Field label="New password">
            <Input type="password" />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" />
          </Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button>Update password</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Adds a step at sign-in using an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm text-neutral-600">Currently <span className="text-neutral-900 font-medium">disabled</span>.</div>
          <Button variant="outline">Enable 2FA</Button>
        </CardContent>
      </Card>
    </>
  )
}

/* ─── Newsroom ────────────────────────────────────────────────────────── */

function NewsroomSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsroom</CardTitle>
        <CardDescription>Public-facing settings for your site.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Newsroom name">
          <Input defaultValue="Snowberry" />
        </Field>
        <Field label="Public URL">
          <Input defaultValue="snowberry.io" />
        </Field>
        <Field label="Default language">
          <Select defaultValue="en">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ne">नेपाली</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Timezone">
          <Select defaultValue="asia-kathmandu">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asia-kathmandu">Asia/Kathmandu (UTC+5:45)</SelectItem>
              <SelectItem value="asia-kolkata">Asia/Kolkata (UTC+5:30)</SelectItem>
              <SelectItem value="utc">UTC</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  )
}

/* ─── Billing ─────────────────────────────────────────────────────────── */

function BillingSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Plan, invoices, and payment method.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between rounded-[10px] border border-neutral-200 bg-neutral-50 p-4">
        <div>
          <div className="text-sm font-medium">Growth · monthly</div>
          <div className="text-sm text-neutral-500">Renews on 1 Aug 2026.</div>
        </div>
        <Button variant="outline">Manage plan</Button>
      </CardContent>
    </Card>
  )
}

/* ─── Team ────────────────────────────────────────────────────────────── */

function TeamSection() {
  const members = [
    { name: 'Sagar Sharma',   role: 'Editor', email: 'sagar@snowberry.io' },
    { name: 'Aayush Karki',   role: 'Author', email: 'aayush@snowberry.io' },
    { name: 'Sarushna Karki', role: 'Admin',  email: 'sarushna@snowberry.io' },
  ]
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Team & access</CardTitle>
          <CardDescription>People with access to this newsroom.</CardDescription>
        </div>
        <Button size="sm">Invite</Button>
      </CardHeader>
      <CardContent className="divide-y divide-neutral-100">
        {members.map((m) => (
          <div key={m.email} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Avatar className="size-8">
              <AvatarFallback className="bg-neutral-100 text-neutral-700 text-xs">
                {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{m.name}</div>
              <div className="truncate text-sm text-neutral-500">{m.email}</div>
            </div>
            <div className="text-sm text-neutral-500">{m.role}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ─── Field helper ────────────────────────────────────────────────────── */

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm text-neutral-700">{label}</Label>
      {children}
      {hint && <div className="text-xs text-neutral-500">{hint}</div>}
    </div>
  )
}
