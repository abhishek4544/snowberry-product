'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'

const LOGO_WORDMARK = '/logo-wordmark.svg'

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.93v2.33A9 9 0 009 18z" fill="#34A853" />
      <path d="M3.97 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.93A9 9 0 000 9c0 1.45.35 2.83.93 4.05l3.04-2.33z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.93 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function MicrosoftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <rect x="1"  y="1"  width="7.5" height="7.5" fill="#F25022" />
      <rect x="9.5" y="1"  width="7.5" height="7.5" fill="#7FBA00" />
      <rect x="1"  y="9.5" width="7.5" height="7.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setTimeout(() => router.push('/'), 600)
  }

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 80% at 50% -10%, #EBF6FF 0%, #F8FAFC 55%, #F3F4F6 100%)',
      }}
    >
      {/* Soft brand pattern — subtle, no distraction */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(7,135,255,0.08) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />

      <div
        className="relative w-full max-w-[420px] bg-white rounded-base border border-slate-200 shadow-card p-8"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <img src={LOGO_WORDMARK} alt="Snowberry" className="h-[26px]" />
        </div>

        {/* Heading */}
        <div className="mt-6 text-center">
          <h1 className="font-display text-[22px] font-semibold text-slate-900 leading-tight">
            Welcome to Snowberry
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to continue
          </p>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-slate-200" />

        {/* SSO buttons */}
        <div className="flex flex-col gap-2.5">
          <Button
            color="tertiary"
            size="base"
            leftIcon={<GoogleIcon />}
            onClick={() => router.push('/')}
            className="w-full justify-center"
          >
            Continue with Google
          </Button>
          <Button
            color="tertiary"
            size="base"
            leftIcon={<MicrosoftIcon />}
            onClick={() => router.push('/')}
            className="w-full justify-center"
          >
            Continue with Microsoft
          </Button>
        </div>

        {/* "or" divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleContinue} className="flex flex-col gap-3">
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Work email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="reporter@yourpaper.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            color="brand"
            size="base"
            rightIcon={<ArrowRight size={16} strokeWidth={2} />}
            loading={submitting}
            disabled={!email.trim()}
            className="w-full justify-center mt-1"
          >
            Continue
          </Button>
        </form>

        {/* Register link */}
        <p className="mt-5 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <a
            href="#"
            className="font-medium text-brand-500 hover:text-brand-600 hover:underline underline-offset-2"
          >
            Register
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-4 text-xs text-slate-400">
        <span>© {new Date().getFullYear()} Snowberry</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <a href="#" className="hover:text-slate-600">Terms</a>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <a href="#" className="hover:text-slate-600">Privacy</a>
      </div>
    </main>
  )
}
