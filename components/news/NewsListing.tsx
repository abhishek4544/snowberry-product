'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, LayoutGrid, List, ChevronLeft, ChevronRight,
  MoreHorizontal, TrendingUp, Sparkles, Filter,
} from 'lucide-react'

type Category = {
  id: string
  name: string
  subNews: number
  articles: string
  authors: string
  views30d: string
  topThisMonth: string
}

const CATEGORIES: Category[] = [
  { id: 'politics',   name: 'Politics',   subNews: 12,  articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
  { id: 'culture',    name: 'Culture',    subNews: 10,  articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
  { id: 'opinion',    name: 'Opinion',    subNews: 6,   articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
  { id: 'business',   name: 'Business',   subNews: 32,  articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
  { id: 'world',      name: 'World',      subNews: 21,  articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
  { id: 'sports',     name: 'Sports',     subNews: 8,   articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
  { id: 'science',    name: 'Science',    subNews: 5,   articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
  { id: 'technology', name: 'Technology', subNews: 18,  articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
  { id: 'lifestyle',  name: 'Lifestyle',  subNews: 4,   articles: '4.6k', authors: '1.2M', views30d: '116.4k', topThisMonth: 'Govt notifies safe-harbour rules for online gaming platforms' },
]

const PAGE_SIZE = 9

export default function NewsListing() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CATEGORIES
    return CATEGORIES.filter(c => c.name.toLowerCase().includes(q))
  }, [query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="relative min-h-screen w-full font-sans text-slate-900">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-[#f4f6fa]" />
      <div className="absolute -z-10 -left-40 top-0 h-[720px] w-[720px] rounded-full bg-[radial-gradient(closest-side,_rgba(7,135,255,0.12),_transparent_70%)]" />
      <div className="absolute -z-10 right-[-260px] top-[420px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(closest-side,_rgba(0,205,255,0.10),_transparent_70%)]" />

      <div className="flex flex-col gap-6 px-4 py-6">
        {/* Page header */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-8 tracking-[-0.4px] text-slate-950">News</h1>
          <p className="text-sm text-slate-500">Top best beats for the newsroom · drag to reorder, click to edit</p>
        </header>

        {/* Insight banner */}
        <section className="flex items-center justify-between rounded-xl border border-white bg-white/70 p-4 backdrop-blur-sm shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <TrendingUp className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-900">Top performing this week</p>
              <p className="text-xs text-slate-500">Top performing pieces per audience surface, last 7 days</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-700">8 highlights</span>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
              Berry summary
            </button>
          </div>
        </section>

        {/* Toolbar */}
        <section className="flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-[0_1px_0.5px_0_rgba(15,23,42,0.04)]">
              <Search className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
              <input
                className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
                placeholder="Search Category name"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1) }}
              />
              <span className="hidden items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-flex">
                <span>⌘</span>K
              </span>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Filter className="h-4 w-4" strokeWidth={1.8} />
              Filter
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setView('grid')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-sm ${view === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                aria-pressed={view === 'grid'}
              >
                <LayoutGrid className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <span className="w-px bg-slate-200" />
              <button
                onClick={() => setView('list')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-sm ${view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                aria-pressed={view === 'list'}
              >
                <List className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-[inset_0_0_4px_0_rgba(255,255,255,0.24)] hover:bg-brand-600">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add new category
            </button>
          </div>
        </section>

        {/* Content */}
        {filtered.length === 0 ? (
          <EmptyState query={query} onClear={() => setQuery('')} />
        ) : view === 'grid' ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map(c => (
              <CategoryCard
                key={c.id}
                category={c}
                menuOpen={openMenu === c.id}
                onToggleMenu={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                onCloseMenu={() => setOpenMenu(null)}
              />
            ))}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Sub-News</th>
                  <th className="px-4 py-3 text-left">Articles</th>
                  <th className="px-4 py-3 text-left">Authors</th>
                  <th className="px-4 py-3 text-left">30d Views</th>
                  <th className="w-8 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.subNews}</td>
                    <td className="px-4 py-3 text-slate-600">{c.articles}</td>
                    <td className="px-4 py-3 text-slate-600">{c.authors}</td>
                    <td className="px-4 py-3 text-slate-600">{c.views30d}</td>
                    <td className="px-4 py-3">
                      <button className="text-slate-400 hover:text-slate-700"><MoreHorizontal className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <section className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            Previous
          </button>

          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>10 per page</span>
            <div className="inline-flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? 'page' : undefined}
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-medium ${n === currentPage ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </section>
      </div>
    </div>
  )
}

function CategoryCard({ category, menuOpen, onToggleMenu, onCloseMenu }: {
  category: Category
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
}) {
  const router = useRouter()

  return (
    <li className="group relative flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.08)]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-950">{category.name}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {category.subNews} Sub-News
          </span>
        </div>
        <div className="relative">
          <button
            onClick={onToggleMenu}
            aria-label="Category actions"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={onCloseMenu} />
              <div className="absolute right-0 top-full z-20 mt-1 flex w-32 flex-col rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button className="rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">Edit</button>
                <button className="rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">Open feed</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50/70 p-2.5">
        <Stat label="Articles" value={category.articles} />
        <Stat label="Authors" value={category.authors} />
        <Stat label="30d Views" value={category.views30d} />
      </div>

      {/* Top this month */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Top this month</p>
        <button
          onClick={() => router.push(`/news/${category.id}`)}
          className="text-left text-sm leading-snug text-slate-800 hover:text-brand-600"
        >
          {category.topThisMonth}
        </button>
      </div>
    </li>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Search className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900">No categories match &ldquo;{query}&rdquo;</p>
        <p className="text-xs text-slate-500">Try a different search or clear to see all.</p>
      </div>
      <button onClick={onClear} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
        Clear search
      </button>
    </div>
  )
}
