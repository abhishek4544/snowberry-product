import { NextResponse } from 'next/server'

// Stub queue endpoint. Swap for a real newsletter provider (Postmark,
// Mailchimp, Ghost, etc.) when wiring the CMS backend.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ ok: true, queuedAt: new Date().toISOString(), ...body })
}
