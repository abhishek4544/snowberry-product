'use client'

import { useMemo, useState, type ComponentType, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import {
  ArrowUpRight, Braces, Check, ChevronDown, Compass, Copy, Eye, Globe,
  ImageIcon, Info, RefreshCw, Rss, Send, Share2, Sparkles, Upload,
} from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════════
   Root
   ══════════════════════════════════════════════════════════════════════ */

export default function SeoSettings() {
  return (
    <div className="flex flex-col">
      <PageHeader />
      <div className="mt-10 flex flex-col gap-14">
        <BasicsSection />
        <SocialSection />
        <StructuredDataSection />
        <FeedsSection />
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <header className="sticky top-0 z-10 -mx-6 -mt-6 mb-0 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 bg-white/85 px-6 pt-6 pb-4 backdrop-blur">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Settings</p>
        <h1 className="mt-1 font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-slate-950">
          SEO configuration
        </h1>
        <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-slate-500">
          Control how your content appears in search engines and on social platforms. Applies to every article by default; individual articles can override.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 transition-colors hover:border-slate-300">
          <Eye className="size-3.5 text-slate-400" />
          Preview snippet
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-[12.5px] font-medium text-white shadow-sm transition-colors hover:bg-brand-600">
          <Check className="size-3.5" />
          Save changes
        </button>
      </div>
    </header>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   01 · Basics
   ══════════════════════════════════════════════════════════════════════ */

function BasicsSection() {
  const [titleTemplate, setTitleTemplate] = useState('{title} — {section} | {site_name}')
  const [description, setDescription] = useState(
    'Ukaalo delivers trusted Nepali journalism — politics, business, sports, opinion and world news from Kathmandu.'
  )
  const [canonicalMode, setCanonicalMode] = useState<'auto' | 'custom'>('auto')
  const [customCanonical, setCustomCanonical] = useState('https://ukaalo.com/{slug}')
  const [robots, setRobots] = useState({ index: true, follow: true, archive: true, snippet: true })
  const [maxSnippet, setMaxSnippet] = useState('-1')
  const [maxImagePreview, setMaxImagePreview] = useState('large')

  const previewTitle = titleTemplate
    .replace('{title}', 'Messi hat-trick powers Argentina')
    .replace('{section}', 'Sports')
    .replace('{site_name}', 'Ukaalo News')
    .replace('{author}', 'Prakash Giri')

  const robotsString = useMemo(() => {
    const parts: string[] = []
    parts.push(robots.index ? 'index' : 'noindex')
    parts.push(robots.follow ? 'follow' : 'nofollow')
    if (!robots.archive) parts.push('noarchive')
    if (!robots.snippet) parts.push('nosnippet')
    if (maxSnippet !== '-1') parts.push(`max-snippet:${maxSnippet}`)
    if (maxImagePreview !== 'standard') parts.push(`max-image-preview:${maxImagePreview}`)
    return parts.join(', ')
  }, [robots, maxSnippet, maxImagePreview])

  return (
    <Section
      id="basics" number="01" icon={Compass} title="Basics"
      description="Default meta tags applied to every article. Individual articles can override any of these."
    >
      <ControlCard
        title="Meta title template"
        description="The format used to build every article's <title> tag."
        status={{ label: 'Active', tone: 'ok' }}
        preview={{
          label: 'Search result preview',
          content: (
            <div>
              <p className="truncate text-[15px] font-medium text-[#1a0dab]">{previewTitle}</p>
              <p className="mt-0.5 text-[11.5px] text-emerald-700">ukaalo.com › sports › messi-hattrick</p>
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-600">{description}</p>
            </div>
          ),
        }}
      >
        <Field label="Template" hint={`${previewTitle.length} / 60 characters`}>
          <TextInput
            value={titleTemplate}
            onChange={(e) => setTitleTemplate(e.target.value)}
            className="font-mono text-[12.5px]"
          />
        </Field>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Tokens:</span>
          <TokenChip>{'{title}'}</TokenChip>
          <TokenChip>{'{section}'}</TokenChip>
          <TokenChip>{'{site_name}'}</TokenChip>
          <TokenChip>{'{author}'}</TokenChip>
        </div>
      </ControlCard>

      <ControlCard
        title="Meta description"
        description="Fallback description used when an article does not set its own."
      >
        <Field label="Default description" hint={`${description.length} / 160 characters`}>
          <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        </Field>
        <InfoNote>Google truncates snippets around 155–160 characters on desktop.</InfoNote>
      </ControlCard>

      <ControlCard
        title="Canonical URL"
        description="Tell search engines which URL is the definitive version of a page."
        preview={{
          label: 'Canonical for a sample article',
          content: (
            <code className="block break-all rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-[11.5px] text-slate-700">
              {canonicalMode === 'auto'
                ? 'https://ukaalo.com/sports/messi-hattrick'
                : customCanonical.replace('{slug}', 'sports/messi-hattrick')}
            </code>
          ),
        }}
      >
        <div className="flex flex-col gap-2">
          <RadioRow
            name="canonical" checked={canonicalMode === 'auto'}
            onChange={() => setCanonicalMode('auto')}
            title="Automatic"
            hint="Use the article's live URL — recommended for most publishers."
          />
          <RadioRow
            name="canonical" checked={canonicalMode === 'custom'}
            onChange={() => setCanonicalMode('custom')}
            title="Custom pattern"
            hint="Use when syndicating from another domain."
          >
            {canonicalMode === 'custom' && (
              <TextInput
                value={customCanonical}
                onChange={(e) => setCustomCanonical(e.target.value)}
                className="mt-2.5 font-mono text-[12px]"
              />
            )}
          </RadioRow>
        </div>
      </ControlCard>

      <ControlCard
        title="Robots meta"
        description="Tell search-engine crawlers how to handle your pages. Presets on the left, advanced limits on the right."
        preview={{
          label: 'Combined output',
          content: (
            <code className="block break-all rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-[11.5px] text-slate-700">
              &lt;meta name=&quot;robots&quot; content=&quot;{robotsString}&quot; /&gt;
            </code>
          ),
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Crawler directives</p>
            <CheckToggle label="Indexable"     on={robots.index}   onChange={(v) => setRobots({ ...robots, index: v })} />
            <CheckToggle label="Follow links"  on={robots.follow}  onChange={(v) => setRobots({ ...robots, follow: v })} />
            <CheckToggle label="Allow archive" on={robots.archive} onChange={(v) => setRobots({ ...robots, archive: v })} />
            <CheckToggle label="Allow snippet" on={robots.snippet} onChange={(v) => setRobots({ ...robots, snippet: v })} />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Preview limits</p>
            <Field label="Max snippet length">
              <Select value={maxSnippet} onChange={setMaxSnippet}>
                <option value="-1">No limit</option>
                <option value="0">No snippet</option>
                <option value="160">160 characters</option>
                <option value="200">200 characters</option>
              </Select>
            </Field>
            <Field label="Max image preview">
              <Select value={maxImagePreview} onChange={setMaxImagePreview}>
                <option value="none">None</option>
                <option value="standard">Standard</option>
                <option value="large">Large</option>
              </Select>
            </Field>
          </div>
        </div>
      </ControlCard>
    </Section>
  )
}

function RadioRow({
  name, checked, onChange, title, hint, children,
}: {
  name: string
  checked: boolean
  onChange: () => void
  title: string
  hint: string
  children?: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 transition-colors hover:border-slate-300">
      <input
        type="radio" name={name} checked={checked} onChange={onChange}
        className="mt-0.5 size-3.5 accent-brand-500"
      />
      <span className="min-w-0 flex-1">
        <span className="text-[13px] font-medium text-slate-900">{title}</span>
        <span className="ml-2 text-[11.5px] text-slate-500">{hint}</span>
        {children}
      </span>
    </label>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   02 · Social sharing
   ══════════════════════════════════════════════════════════════════════ */

function SocialSection() {
  const [ogTitle, setOgTitle] = useState("Ukaalo — Nepal's trusted news source")
  const [ogDescription, setOgDescription] = useState(
    'Independent Nepali journalism covering politics, business, sports, and world news.'
  )
  const [twitterCard, setTwitterCard] = useState('summary_large_image')
  const [twitterSite, setTwitterSite] = useState('@ukaalo')
  const [twitterCreator, setTwitterCreator] = useState('@ukaalo_news')

  return (
    <Section
      id="social" number="02" icon={Share2} title="Social sharing"
      description="How your links look when shared on Facebook, X, LinkedIn, and messaging apps."
    >
      <ControlCard
        title="Open Graph"
        description="Powers previews on Facebook, LinkedIn, WhatsApp, Slack, and most messaging apps."
        status={{ label: 'Facebook · LinkedIn · WhatsApp', tone: 'muted' }}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <Field label="Default image" hint="1200 × 630 recommended">
              <UploadBox name="og-default.png" size="1200 × 630 · 84 KB" />
            </Field>
            <Field label="Title fallback">
              <TextInput value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} />
            </Field>
            <Field label="Description fallback">
              <TextArea rows={2} value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} />
            </Field>
          </div>
          <OgPreview title={ogTitle} description={ogDescription} />
        </div>
      </ControlCard>

      <ControlCard
        title="Twitter Card"
        description="Card format shown on X (Twitter). Falls back to Open Graph when Twitter-specific tags are missing."
        status={{ label: 'X / Twitter', tone: 'muted' }}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <Field label="Card type">
              <Select value={twitterCard} onChange={setTwitterCard}>
                <option value="summary_large_image">Summary with large image</option>
                <option value="summary">Summary</option>
                <option value="app">App</option>
                <option value="player">Player</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Site handle">
                <TextInput
                  value={twitterSite}
                  onChange={(e) => setTwitterSite(e.target.value)}
                  className="font-mono text-[12.5px]"
                />
              </Field>
              <Field label="Creator handle" hint="Optional">
                <TextInput
                  value={twitterCreator}
                  onChange={(e) => setTwitterCreator(e.target.value)}
                  className="font-mono text-[12.5px]"
                />
              </Field>
            </div>
            <InfoNote>Falls back to the article author's handle when set on their profile.</InfoNote>
          </div>
          <TwitterPreview title={ogTitle} description={ogDescription} site={twitterSite} />
        </div>
      </ControlCard>
    </Section>
  )
}

function OgPreview({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">Preview</p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="aspect-[1200/630] w-full bg-gradient-to-br from-brand-400 via-brand-500 to-teal-500" />
        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">ukaalo.com</p>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  )
}

function TwitterPreview({ title, description, site }: { title: string; description: string; site: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">Preview</p>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="aspect-[2/1] w-full bg-gradient-to-br from-slate-800 via-slate-900 to-brand-900" />
        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="text-[10.5px] text-slate-500">ukaalo.com</p>
          <p className="mt-0.5 line-clamp-1 text-[12.5px] font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{description}</p>
          <p className="mt-1 font-mono text-[10.5px] text-slate-400">{site}</p>
        </div>
      </div>
    </div>
  )
}

function UploadBox({ name, size }: { name: string; size: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-md bg-white ring-1 ring-slate-200">
          <ImageIcon className="size-5 text-slate-400" />
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-slate-800">{name}</p>
          <p className="text-[11px] text-slate-500">{size}</p>
        </div>
      </div>
      <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-300">
        <Upload className="size-3.5" />
        Replace
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   03 · Structured data
   ══════════════════════════════════════════════════════════════════════ */

function StructuredDataSection() {
  const [publisherType, setPublisherType] = useState('NewsMediaOrganization')
  const [articleType, setArticleType]     = useState('NewsArticle')
  const [publisher, setPublisher]         = useState('Ukaalo News')
  const [autoGenerate, setAutoGenerate]   = useState(true)

  const jsonLd = `{
  "@context": "https://schema.org",
  "@type": "${articleType}",
  "headline": "Messi hat-trick powers Argentina",
  "datePublished": "2026-07-24T09:14:00+05:45",
  "author": { "@type": "Person", "name": "Prakash Giri" },
  "publisher": {
    "@type": "${publisherType}",
    "name": "${publisher}",
    "logo": {
      "@type": "ImageObject",
      "url": "https://ukaalo.com/logo.png",
      "width": 600, "height": 60
    }
  },
  "mainEntityOfPage": "https://ukaalo.com/sports/messi-hattrick"
}`

  return (
    <Section
      id="structured" number="03" icon={Braces} title="Structured data"
      description="Schema.org JSON-LD embedded on every article — powers Google Discover, Top Stories, and rich results."
    >
      <ControlCard
        title="Publisher & article type"
        description="Applied to the JSON-LD block Snowberry ships on every article page."
        preview={{
          label: 'JSON-LD output',
          content: (
            <div className="relative">
              <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-3.5 text-[11px] leading-relaxed text-slate-100">
                <code>{jsonLd}</code>
              </pre>
              <div className="mt-2 flex items-center justify-end gap-1.5">
                <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-300">
                  <Copy className="size-3" />
                  Copy
                </button>
                <a
                  href="https://validator.schema.org"
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-300"
                >
                  Validate <ArrowUpRight className="size-3" />
                </a>
              </div>
            </div>
          ),
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Publisher type">
            <Select value={publisherType} onChange={setPublisherType}>
              <option value="NewsMediaOrganization">NewsMediaOrganization</option>
              <option value="Organization">Organization</option>
              <option value="GovernmentOrganization">GovernmentOrganization</option>
            </Select>
          </Field>
          <Field label="Default article type">
            <Select value={articleType} onChange={setArticleType}>
              <option value="NewsArticle">NewsArticle</option>
              <option value="ReportageNewsArticle">ReportageNewsArticle</option>
              <option value="AnalysisNewsArticle">AnalysisNewsArticle</option>
              <option value="OpinionNewsArticle">OpinionNewsArticle</option>
              <option value="Article">Article</option>
              <option value="BlogPosting">BlogPosting</option>
            </Select>
          </Field>
          <Field label="Publisher name">
            <TextInput value={publisher} onChange={(e) => setPublisher(e.target.value)} />
          </Field>
          <Field label="Publisher logo" hint="600 × 60">
            <UploadBox name="publisher-logo.png" size="600 × 60 · 12 KB" />
          </Field>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3.5 py-3">
          <div>
            <p className="text-[12.5px] font-medium text-slate-900">Auto-generate for every article</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
              When off, only articles that manually opt in will include structured data.
            </p>
          </div>
          <Toggle on={autoGenerate} onChange={setAutoGenerate} label="Auto-generate JSON-LD" />
        </div>
      </ControlCard>
    </Section>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   04 · Feeds & sitemaps
   ══════════════════════════════════════════════════════════════════════ */

function FeedsSection() {
  const [news, setNews]         = useState(true)
  const [images, setImages]     = useState(true)
  const [rss, setRss]           = useState(true)
  const [rssCount, setRssCount] = useState('25')
  const [rssFull, setRssFull]   = useState(false)

  return (
    <Section
      id="feeds" number="04" icon={Rss} title="Feeds & sitemaps"
      description="Help search engines and third-party readers discover new content the moment it publishes."
    >
      <FeedCard
        title="News sitemap"
        badge="Google News"
        description="Fresh articles from the last 48 hours — required to appear in Google News."
        url="https://ukaalo.com/sitemap-news.xml"
        lastGenerated="2 hours ago"
        on={news} onToggle={setNews}
        submitToGoogle
      />
      <FeedCard
        title="Image sitemap"
        badge="Google Images"
        description="All images from published articles — helps them surface in Google Images and Discover."
        url="https://ukaalo.com/sitemap-images.xml"
        lastGenerated="6 hours ago"
        on={images} onToggle={setImages}
        submitToGoogle
      />
      <FeedCard
        title="RSS feed"
        badge="Public"
        description="Feed for readers, aggregators, and third-party apps."
        url="https://ukaalo.com/rss.xml"
        lastGenerated="12 min ago"
        on={rss} onToggle={setRss}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Items per feed">
            <Select value={rssCount} onChange={setRssCount}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <CheckToggle label="Include full article body" on={rssFull} onChange={setRssFull} />
          </div>
        </div>
      </FeedCard>

      <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3.5 py-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        <div className="flex-1 text-[12.5px] text-emerald-900">
          Berry AI pings Google, Bing, and IndexNow every time you publish. Last successful ping <span className="font-semibold tabular-nums">3 min ago</span>.
        </div>
      </div>
    </Section>
  )
}

function FeedCard({
  title, badge, description, url, lastGenerated,
  on, onToggle, submitToGoogle = false, children,
}: {
  title: string
  badge: string
  description: string
  url: string
  lastGenerated: string
  on: boolean
  onToggle: (v: boolean) => void
  submitToGoogle?: boolean
  children?: ReactNode
}) {
  return (
    <article
      className={[
        'overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] ring-1 transition-colors',
        on ? 'ring-slate-200/70' : 'opacity-70 ring-slate-200/50',
      ].join(' ')}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13.5px] font-semibold text-slate-900">{title}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
              {badge}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500">{description}</p>
        </div>
        <Toggle on={on} onChange={onToggle} label={title} />
      </header>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
          <Globe className="size-3.5 shrink-0 text-slate-400" />
          <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-slate-700">{url}</code>
          <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-300">
            <Copy className="size-3" />
            Copy
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11.5px] text-slate-500">
            Last generated <span className="font-semibold text-slate-700">{lastGenerated}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-300">
              <RefreshCw className="size-3" />
              Regenerate
            </button>
            {submitToGoogle && (
              <button className="inline-flex items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1.5 text-[11.5px] font-medium text-white transition-colors hover:bg-brand-600">
                <Send className="size-3" />
                Submit to Google
              </button>
            )}
          </div>
        </div>

        {children && <div className="border-t border-slate-100 pt-3">{children}</div>}
      </div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Primitives — Section, ControlCard
   ══════════════════════════════════════════════════════════════════════ */

function Section({
  id, number, title, description, icon: Icon, children,
}: {
  id: string
  number: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <section id={id} className="flex flex-col">
      <header className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500 ring-1 ring-brand-100">
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-400">{number}</span>
            <h2 className="font-display text-[18px] font-semibold text-slate-950">{title}</h2>
          </div>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-slate-500">{description}</p>
        </div>
      </header>
      <div className="mt-5 flex flex-col gap-3">{children}</div>
    </section>
  )
}

type StatusTone = 'ok' | 'warn' | 'muted'

function ControlCard({
  title, description, status, children, preview,
}: {
  title: string
  description?: string
  status?: { label: string; tone?: StatusTone }
  children: ReactNode
  preview?: { label: string; content: ReactNode }
}) {
  const toneCls =
    status?.tone === 'warn'  ? 'bg-amber-50 text-amber-700'  :
    status?.tone === 'muted' ? 'bg-slate-100 text-slate-600' :
                               'bg-emerald-50 text-emerald-700'
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] ring-1 ring-slate-200/70">
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[13.5px] font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500">{description}</p>}
        </div>
        {status && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneCls}`}>
            <span className="size-1.5 rounded-full bg-current opacity-70" />
            {status.label}
          </span>
        )}
      </header>

      <div className="border-t border-slate-100 px-5 py-4">{children}</div>

      {preview && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">{preview.label}</p>
          <div className="mt-2">{preview.content}</div>
        </div>
      )}
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   Primitives — form controls
   ══════════════════════════════════════════════════════════════════════ */

function Field({
  label, hint, htmlFor, children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-slate-700">{label}</span>
        {hint && <span className="text-[11px] tabular-nums text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${inputCls} ${className}`} />
}

function TextArea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${inputCls} resize-none leading-relaxed ${className}`} />
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-9`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        on ? 'bg-brand-500' : 'bg-slate-300',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block size-4 rounded-full bg-white shadow-sm transition-transform',
          on ? 'translate-x-[18px]' : 'translate-x-[2px]',
        ].join(' ')}
      />
    </button>
  )
}

function CheckToggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors hover:border-slate-300">
      <span className="text-[12.5px] font-medium text-slate-800">{label}</span>
      <Toggle on={on} onChange={onChange} label={label} />
    </label>
  )
}

function TokenChip({ children }: { children: ReactNode }) {
  return (
    <code className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-slate-700">
      {children}
    </code>
  )
}

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
      <Info className="size-3 text-slate-400" />
      {children}
    </p>
  )
}
