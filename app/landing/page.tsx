'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Editorial landing with GSAP choreography.
// – Load: hero words rise into place with stagger
// – Scroll: huge marquees scrub horizontally, chapter labels drift vertically,
//   a pinned band pushes four giant verbs sideways, closing headline flies in.

export default function LandingPage() {
  const root = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // ── Hero: word-by-word rise ──────────────────────────────────────────
      gsap.set('.hero-word', { yPercent: 120, opacity: 0 })
      gsap.to('.hero-word', {
        yPercent: 0,
        opacity: 1,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.055,
        delay: 0.15,
      })
      gsap.from('.hero-eyebrow, .hero-sub', {
        y: 20, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.9,
      })

      // ── Marquee bands: horizontal drift tied to page scroll ──────────────
      gsap.utils.toArray<HTMLElement>('.marquee-track').forEach((track) => {
        const dir = track.dataset.dir === 'right' ? 1 : -1
        gsap.to(track, {
          xPercent: 25 * dir,
          ease: 'none',
          scrollTrigger: {
            trigger: track.closest('.marquee-section'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        })
      })

      // ── Pinned horizontal-scroll band (the four verbs) ───────────────────
      const pin = document.querySelector<HTMLElement>('.pin-wrap')
      const pinTrack = document.querySelector<HTMLElement>('.pin-track')
      if (pin && pinTrack) {
        const distance = () => pinTrack.scrollWidth - window.innerWidth
        gsap.to(pinTrack, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: () => '+=' + distance(),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        })
      }

      // ── Chapter labels: vertical parallax as you pass them ───────────────
      gsap.utils.toArray<HTMLElement>('.chapter-label').forEach((el) => {
        gsap.fromTo(el,
          { y: 60 },
          {
            y: -60,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        )
      })

      // ── Prose paragraphs: soft rise-in on enter ──────────────────────────
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      })

      // ── Closing headline: giant scale + rise ─────────────────────────────
      gsap.from('.closing-word', {
        yPercent: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.closing-headline', start: 'top 75%' },
      })

      // Recalculate once fonts have painted so no line-height jump breaks pins.
      const refresh = () => ScrollTrigger.refresh()
      if ('fonts' in document) document.fonts.ready.then(refresh)
      window.addEventListener('load', refresh)
      return () => window.removeEventListener('load', refresh)
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={root}
      className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-neutral-800 selection:bg-brand-100 selection:text-brand-950"
    >
      <Masthead />
      <Opener />
      <MarqueeBand
        words={['NEWSROOM', 'NEWSROOM', 'NEWSROOM', 'NEWSROOM']}
        dir="left"
      />
      <ChapterOne />
      <Interlude
        quote="The first draft of history used to be written by tired people at 2 a.m. It still is. We just wanted to sit beside them."
        by="From the Snowberry field notes, winter 2024"
      />
      <ChapterTwo />
      <MarqueeBand
        words={['WRITTEN·BY·HAND', 'WRITTEN·BY·HAND', 'WRITTEN·BY·HAND']}
        dir="right"
        variant="dark"
      />
      <ChapterThree />
      <VerbsPin />
      <Voices />
      <Manifesto />
      <ChapterFour />
      <Closing />
      <Colophon />
    </div>
  )
}

// ── Masthead ─────────────────────────────────────────────────────────────────

function Masthead() {
  return (
    <header className="relative z-50 border-b border-neutral-200/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/landing" className="flex items-center gap-2">
          <Image src="/logo-mark.svg" alt="Snowberry" width={22} height={22} />
          <span className="font-display text-base font-medium tracking-tight text-brand-950">Snowberry</span>
        </Link>
        <Link
          href="/signup"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-950"
        >
          Come in
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  )
}

// ── Opener ───────────────────────────────────────────────────────────────────

function Opener() {
  // Two lines, split into words so GSAP can stagger them independently.
  const l1 = ['News', 'is', 'how', 'a', 'society', 'talks', 'to', 'itself.']
  const l2 = ['We’re', 'trying', 'to', 'make', 'sure', 'the', 'conversation', 'doesn’t', 'end.']

  return (
    <section className="mx-auto max-w-6xl px-6 pt-24 pb-24 md:pt-36 md:pb-32">
      <p className="hero-eyebrow mb-10 text-xs uppercase tracking-[0.22em] text-neutral-500">
        A letter to editors
      </p>
      <h1 className="font-display text-[44px] font-medium leading-[1.02] tracking-tight text-brand-950 md:text-[92px] lg:text-[110px]">
        <span className="block">
          {l1.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pr-[0.22em] align-bottom">
              <span className="hero-word inline-block">{w}</span>
            </span>
          ))}
        </span>
        <span className="block text-neutral-400">
          {l2.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pr-[0.22em] align-bottom">
              <span className="hero-word inline-block">{w}</span>
            </span>
          ))}
        </span>
      </h1>
      <p className="hero-sub mt-12 max-w-xl text-base leading-[1.75] text-neutral-600 md:text-lg">
        Snowberry is a small company building a newsroom. Not another tool for one.
        A newsroom, in software — the room, the desk, the second pair of eyes, the person who
        remembers what you filed last April.
      </p>
    </section>
  )
}

// ── Marquee band (scroll-scrubbed horizontal drift) ──────────────────────────

function MarqueeBand({
  words,
  dir = 'left',
  variant = 'light',
}: { words: string[]; dir?: 'left' | 'right'; variant?: 'light' | 'dark' }) {
  const cls = variant === 'dark'
    ? 'bg-brand-950 text-white/95 border-brand-950'
    : 'bg-[#FBFAF7] text-brand-950 border-neutral-200/70'
  return (
    <section className={`marquee-section relative overflow-hidden border-y ${cls}`}>
      <div className="marquee-track flex whitespace-nowrap py-6 md:py-10" data-dir={dir}>
        {[...words, ...words, ...words].map((w, i) => (
          <span
            key={i}
            className="font-display text-[15vw] font-medium leading-none tracking-tight md:text-[11vw]"
          >
            <span className="mx-6 inline-block">{w}</span>
            <span className={`mx-6 inline-block ${variant === 'dark' ? 'text-brand-400/70' : 'text-brand-300'}`}>
              ·
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}

// ── Verbs pin (horizontal scroll section) ────────────────────────────────────

function VerbsPin() {
  const verbs = [
    { verb: 'DRAFTS',    line: 'The first pass, the tightened lede, the alt-headline.' },
    { verb: 'REMEMBERS', line: 'Every source, every correction, every story you’ve ever run.' },
    { verb: 'NOTICES',   line: 'The missing attribution. The date that doesn’t match.' },
    { verb: 'SHIPS',     line: 'One story, in the shape each channel wants to read it.' },
  ]
  return (
    <section className="pin-wrap relative h-screen overflow-hidden bg-brand-50/60">
      <div className="absolute left-6 top-6 z-10 flex items-center gap-3 md:left-10 md:top-10">
        <span className="font-display text-xs font-medium tracking-widest text-brand-500">
          IN VERBS →
        </span>
      </div>
      <div className="pin-track flex h-full items-center gap-[6vw] pl-[10vw] pr-[10vw] will-change-transform">
        {verbs.map((v, i) => (
          <article
            key={v.verb}
            className="flex h-full w-[80vw] flex-col justify-center md:w-[62vw]"
          >
            <div className="font-display text-xs font-medium tracking-widest text-brand-500">
              0{i + 1}
            </div>
            <div className="mt-4 font-display text-[22vw] font-medium leading-[0.9] tracking-tighter text-brand-950 md:text-[16vw]">
              {v.verb}
            </div>
            <p className="mt-6 max-w-md text-base leading-[1.7] text-neutral-600 md:text-lg">
              {v.line}
            </p>
          </article>
        ))}
        <div className="w-[10vw] shrink-0" />
      </div>
    </section>
  )
}

// ── Chapters ─────────────────────────────────────────────────────────────────

function ChapterOne() {
  return (
    <Chapter number="I" title="What broke">
      <p className="reveal">
        Sometime in the last decade, a strange thing happened to newsrooms. The desks got smaller.
        The stories got shorter. The tools got louder — dashboards, integrations, analytics tabs
        that watched you back. And somewhere in the middle of all that instrumentation, the person
        who used to walk over and say <em>&ldquo;this lede is buried&rdquo;</em> quietly disappeared.
      </p>
      <p className="reveal">
        We spent 2023 talking to editors in Kathmandu, Bengaluru, Manila and Nairobi. The same
        sentence came back, in different accents. <em>&ldquo;We&rsquo;re publishing more than ever, and
        we&rsquo;re proud of less of it.&rdquo;</em>
      </p>
      <p className="reveal">
        The tools weren&rsquo;t the whole problem. But the tools were part of it. A CMS built for a
        magazine in 2011. A moderation queue bolted on in 2017. A newsletter product acquired in 2019.
        A social scheduler that changed pricing every March. Five logins, four inboxes, three
        different definitions of &ldquo;published,&rdquo; and no time to read what you were about to send.
      </p>
    </Chapter>
  )
}

function ChapterTwo() {
  return (
    <Chapter number="II" title="Why we built it">
      <p className="reveal">
        We could have built another CMS. The world does not need another CMS.
      </p>
      <p className="reveal">
        What newsrooms told us they needed was harder: a single room where the day&rsquo;s work lived —
        the tip, the draft, the argument in the margins, the fact-check, the headline meeting,
        the send. A room where AI was a colleague, not a chat window. Where a small desk could
        cover a big beat without hiring, and a big desk could remember what it knew.
      </p>
      <p className="reveal">
        We started building Snowberry the week after the 2024 Nepal election, when a friend of ours
        — an editor of twenty years — sent us a message at 3 a.m. that just said <em>&ldquo;I&rsquo;m tired.&rdquo;</em>
        She wasn&rsquo;t asking for anything. But we couldn&rsquo;t stop thinking about it.
      </p>
    </Chapter>
  )
}

function ChapterThree() {
  return (
    <Chapter number="III" title="What it is, in verbs">
      <p className="reveal">
        Snowberry <em>drafts</em>, <em>remembers</em>, <em>notices</em>, and <em>ships</em>. The next
        section is those four verbs, at the size they deserve. Keep scrolling — they&rsquo;ll pass you sideways.
      </p>
    </Chapter>
  )
}

function ChapterFour() {
  return (
    <Chapter number="IV" title="On Berry, and on trust">
      <p className="reveal">
        The AI inside Snowberry is called Berry. She is trained on your archive, not the open web.
        She writes in the voice of your publication because she has read every piece you have ever
        published. She does not send anything. She does not decide anything. She does not learn from
        your drafts unless you say so.
      </p>
      <p className="reveal">
        We think a lot about what she should <em>not</em> do. She will not write a story from a press
        release without flagging it. She will not put words in a source&rsquo;s mouth. She will not
        soften a lede that ought to sting. If she can&rsquo;t find a second source, she says so — and
        does not fill in the gap.
      </p>
      <p className="reveal">
        We know some newsrooms will still refuse to use her. That&rsquo;s fine. Snowberry works without
        her too. What matters is that if you do use her, you never have to wonder what she did.
      </p>
    </Chapter>
  )
}

function Chapter({
  number, title, children,
}: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-neutral-200/70">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 md:grid-cols-[180px_1fr] md:py-32">
        <div className="chapter-label md:pt-2 will-change-transform">
          <div className="font-display text-sm font-medium tracking-widest text-brand-500">
            CHAPTER {number}
          </div>
          <h2 className="mt-2 max-w-[180px] font-display text-2xl font-medium leading-tight tracking-tight text-brand-950 md:text-[28px]">
            {title}
          </h2>
        </div>
        <article className="max-w-2xl space-y-7 text-[17.5px] leading-[1.85] text-neutral-700 md:text-[19px] md:leading-[1.8]">
          {children}
        </article>
      </div>
    </section>
  )
}

// ── Interlude ────────────────────────────────────────────────────────────────

function Interlude({ quote, by }: { quote: string; by: string }) {
  return (
    <section className="bg-brand-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
        <blockquote className="reveal font-display text-3xl font-medium leading-[1.25] tracking-tight md:text-[44px] md:leading-[1.2]">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div className="reveal mt-8 text-xs uppercase tracking-[0.22em] text-brand-200">{by}</div>
      </div>
    </section>
  )
}

// ── Voices ───────────────────────────────────────────────────────────────────

function Voices() {
  const voices = [
    { quote: 'It stopped feeling like software. It started feeling like a colleague who noticed things.', name: 'Anish Rimal',  role: 'Managing Editor', pub: 'Himalkhabar' },
    { quote: 'The first week, we published a correction Berry caught before anyone else did. That was the moment.', name: 'Priya Menon',  role: 'Deputy Editor',   pub: 'The Morning Context' },
    { quote: 'I stopped writing headlines at midnight. That alone justified it.', name: 'Suraj Karki',  role: 'Founding Editor', pub: 'Setopati Weekend' },
  ]
  return (
    <section className="border-t border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="reveal mb-16 max-w-xl">
          <div className="font-display text-sm font-medium tracking-widest text-brand-500">VOICES</div>
          <h2 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight text-brand-950 md:text-4xl">
            What editors said after a month.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {voices.map((v) => (
            <figure key={v.name} className="reveal space-y-6">
              <blockquote className="font-display text-xl font-medium leading-snug tracking-tight text-brand-950 md:text-[22px]">
                &ldquo;{v.quote}&rdquo;
              </blockquote>
              <figcaption className="text-sm leading-relaxed text-neutral-500">
                <div className="font-medium text-neutral-800">{v.name}</div>
                <div>{v.role}</div>
                <div className="italic">{v.pub}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Manifesto ────────────────────────────────────────────────────────────────

function Manifesto() {
  const principles = [
    { n: '01', k: 'The story is the product.',      v: 'Not the CMS. Not the dashboard. Not the AI. If our software is more interesting than what you publish with it, we have failed.' },
    { n: '02', k: 'Small desks over large teams.', v: 'The future of the news is not fewer people doing more. It is smaller rooms doing better. We build for the four-person desk.' },
    { n: '03', k: 'AI as a colleague, not a chat.', v: 'Berry is not a window you open. She is a second pair of hands on the copy in front of you. She defers to the editor, always.' },
    { n: '04', k: 'Speed at the cost of nothing.', v: 'You can publish faster with Snowberry. You cannot publish sloppier. If Berry cannot verify a claim, it will not go out under our watch.' },
    { n: '05', k: 'The archive is sacred.',        v: 'What your newsroom knows lives in what it has already published. Snowberry remembers so the next generation of editors does not start from scratch.' },
    { n: '06', k: 'Local first, everywhere.',      v: 'English works. So does नेपाली, and eight more languages this year. The news is not written from one time zone. Our tools should not be either.' },
  ]
  return (
    <section className="border-t border-neutral-200/70 bg-brand-50/60">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="reveal mb-14 max-w-2xl">
          <div className="font-display text-sm font-medium tracking-widest text-brand-500">A FEW THINGS WE BELIEVE</div>
          <h2 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight text-brand-950 md:text-4xl">
            Our principles, in six lines.
          </h2>
        </div>
        <ol className="grid grid-cols-1 gap-x-14 gap-y-10 md:grid-cols-2">
          {principles.map((p) => (
            <li key={p.n} className="reveal border-t border-brand-200/60 pt-6">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-xs font-medium tracking-widest text-brand-500">{p.n}</span>
                <h3 className="font-display text-lg font-medium tracking-tight text-brand-950 md:text-xl">
                  {p.k}
                </h3>
              </div>
              <p className="mt-3 text-[15.5px] leading-[1.75] text-neutral-600 md:pl-9">{p.v}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ── Closing ──────────────────────────────────────────────────────────────────

function Closing() {
  const l1 = ['If', 'you', 'still', 'believe', 'in', 'the', 'work,']
  const l2 = ['we’d', 'like', 'to', 'sit', 'beside', 'you.']
  return (
    <section className="border-t border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-32 text-center md:py-40">
        <h2 className="closing-headline font-display text-[44px] font-medium leading-[1.02] tracking-tight text-brand-950 md:text-[88px] lg:text-[104px]">
          <span className="block">
            {l1.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pr-[0.22em] align-bottom">
                <span className="closing-word inline-block">{w}</span>
              </span>
            ))}
          </span>
          <span className="block text-neutral-400">
            {l2.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pr-[0.22em] align-bottom">
                <span className="closing-word inline-block">{w}</span>
              </span>
            ))}
          </span>
        </h2>
        <p className="reveal mx-auto mt-10 max-w-lg text-base leading-[1.8] text-neutral-600 md:text-lg">
          Snowberry is free for the first fourteen days, and forever for reporters at
          newsrooms of fewer than five people. We are small on purpose. Write to us and
          a real person will write back.
        </p>
        <div className="reveal mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-base bg-brand-950 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-brand-900"
          >
            Open a desk
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="mailto:hello@snowberry.press"
            className="text-sm font-medium text-brand-950 underline underline-offset-4 decoration-neutral-300 hover:decoration-brand-950"
          >
            Or just write to us — hello@snowberry.press
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Colophon ─────────────────────────────────────────────────────────────────

function Colophon() {
  return (
    <footer className="border-t border-neutral-200/70">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 text-xs text-neutral-500 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Image src="/logo-mark.svg" alt="" width={16} height={16} />
          <span>Snowberry · Kathmandu · Bengaluru · a small remote company.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/about"   className="hover:text-brand-950">About</Link>
          <Link href="/press"   className="hover:text-brand-950">Press</Link>
          <Link href="/privacy" className="hover:text-brand-950">Privacy</Link>
          <Link href="/terms"   className="hover:text-brand-950">Terms</Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-10 text-xs text-neutral-400">
        Set in DM Sans &amp; Inter. Written by hand.
        © {new Date().getFullYear()} Snowberry Media Pvt. Ltd.
      </div>
    </footer>
  )
}
