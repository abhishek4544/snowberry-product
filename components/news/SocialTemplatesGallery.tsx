'use client'

/**
 * SocialTemplatesGallery — Figma frame 40000134:18792.
 *
 * Template picker that precedes SocialComposer. User chooses a layout,
 * lands in the composer to fill its content in.
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Check } from 'lucide-react'

type Template = {
  id: string
  name: string
  category: 'Sports' | 'Politics' | 'Business' | 'Lifestyle'
  type: 'Square' | 'Story' | 'Portrait'
  image: string
  popularity: number
}

const TEMPLATES: Template[] = [
  { id: 'dark-fade-1',          name: 'Dark Fade',                  category: 'Sports',   type: 'Portrait', popularity: 98,
    image: 'https://www.figma.com/api/mcp/asset/21c00acd-9f4f-4bc5-b831-5aceefa37863' },
  { id: 'breaking-circular',    name: 'Breaking news with circular photo', category: 'Sports', type: 'Portrait', popularity: 95,
    image: 'https://www.figma.com/api/mcp/asset/ba02804d-a597-4846-9586-71ba84702204' },
  { id: 'light-fade-1',         name: 'Light Fade',                 category: 'Politics', type: 'Portrait', popularity: 90,
    image: 'https://www.figma.com/api/mcp/asset/9f195296-ac75-47e4-ac12-eab560d563bf' },
  { id: 'bottom-socials-1',     name: 'News with bottom socials',   category: 'Politics', type: 'Portrait', popularity: 88,
    image: 'https://www.figma.com/api/mcp/asset/01a5edd5-6e85-45b4-9063-bd1964421195' },
  { id: 'bottom-socials-2',     name: 'News with bottom socials',   category: 'Politics', type: 'Story',    popularity: 82,
    image: 'https://www.figma.com/api/mcp/asset/01a5edd5-6e85-45b4-9063-bd1964421195' },
  { id: 'dark-fade-2',          name: 'Dark Fade',                  category: 'Sports',   type: 'Square',   popularity: 76,
    image: 'https://www.figma.com/api/mcp/asset/21c00acd-9f4f-4bc5-b831-5aceefa37863' },
  { id: 'bottom-socials-3',     name: 'News with bottom socials',   category: 'Business', type: 'Square',   popularity: 70,
    image: 'https://www.figma.com/api/mcp/asset/93b9405e-7e41-4482-92c7-c45d6f14c99b' },
]

const TYPES = ['All', 'Square', 'Story', 'Portrait'] as const
const SORTS = ['Popular', 'Newest', 'A → Z'] as const

export default function SocialTemplatesGallery() {
  const router = useRouter()
  const [typeFilter, setTypeFilter] = useState<typeof TYPES[number]>('All')
  const [sort, setSort]             = useState<typeof SORTS[number]>('Popular')
  const [typeOpen, setTypeOpen]     = useState(false)
  const [sortOpen, setSortOpen]     = useState(false)

  const items = useMemo(() => {
    const out = TEMPLATES.filter((t) => typeFilter === 'All' || t.type === typeFilter)
    if (sort === 'Popular') return [...out].sort((a, b) => b.popularity - a.popularity)
    if (sort === 'A → Z')   return [...out].sort((a, b) => a.name.localeCompare(b.name))
    return out
  }, [typeFilter, sort])

  const choose = (t: Template) => {
    router.push(`/news/templates/${encodeURIComponent(t.id)}`)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden px-8 py-6">
      {/* ── Background ────────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#fafaf9]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, black 40%, transparent 100%)',
          }}
        />
        <div className="absolute top-0 inset-x-0 h-[280px] bg-gradient-to-b from-white to-transparent" />
      </div>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-[1408px] items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 -ml-2 rounded-md px-2 py-1 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
      </header>

      {/* ── Page card ─────────────────────────────────────────────── */}
      <main className="mx-auto mt-5 max-w-[1408px] rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
        {/* Hero copy */}
        <div className="flex flex-col items-center gap-3 px-8 pt-16 pb-12 text-center">
          <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Newsroom-ready · 13 templates
          </span>
          <h1 className="max-w-[600px] text-[30px] font-medium leading-[1.15] tracking-[-0.01em] text-slate-950">
            Ship a publish-ready news poster in under 60 seconds
          </h1>
          <p className="max-w-[460px] text-[14px] leading-[1.55] text-slate-500">
            Pick a layout your desk already trusts. Type once, see it in every
            feed format, and hand off to the social team without leaving the CMS.
          </p>
        </div>

        {/* Gallery section */}
        <section className="px-8 pb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-medium tracking-[-0.005em] text-slate-900">
              Trending Templates
            </h2>

            <div className="flex items-center gap-2">
              <FilterMenu
                label="Type"
                value={typeFilter}
                options={[...TYPES]}
                open={typeOpen}
                setOpen={setTypeOpen}
                onChange={(v) => setTypeFilter(v as typeof TYPES[number])}
              />
              <FilterMenu
                label="Sort"
                value={sort}
                options={[...SORTS]}
                open={sortOpen}
                setOpen={setSortOpen}
                onChange={(v) => setSort(v as typeof SORTS[number])}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-3 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((t) => (
              <button
                key={t.id}
                onClick={() => choose(t)}
                className="group flex flex-col items-start text-left outline-none focus:outline-none"
              >
                <div className="relative w-full overflow-hidden rounded-lg bg-slate-200 ring-1 ring-slate-200/70 transition-all duration-300 group-hover:ring-slate-300 group-hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]">
                  <div className="aspect-[208/260] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.image}
                      alt={t.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 via-black/15 to-transparent px-3 py-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="text-[12px] font-medium text-white/90">Use template</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-900">Select →</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-0.5 px-1">
                  <p className="text-[15px] font-medium text-slate-950">{t.name}</p>
                  <p className="text-[13px] text-slate-500">{t.category}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

/* ─── Filter menu ────────────────────────────────────────────────── */

function FilterMenu({
  label, value, options, open, setOpen, onChange,
}: {
  label: string
  value: string
  options: string[]
  open: boolean
  setOpen: (v: boolean) => void
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span className="text-slate-400">{label}</span>
        <span>{value}</span>
        <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-[0_4px_8px_-2px_rgba(15,23,42,0.06),0_16px_32px_-12px_rgba(15,23,42,0.12)]">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>{opt}</span>
                {opt === value && <Check className="size-3.5 text-slate-900" strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
