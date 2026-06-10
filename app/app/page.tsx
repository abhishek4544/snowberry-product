'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './components/Sidebar'

const STATS = [
  { label: "Today's Published", value: '18', change: '+12%', up: true, color: '#3B82F6' },
  { label: 'Pending Approval', value: '4', change: '-25%', up: false, color: '#EF4444' },
  { label: 'Today Subscribers', value: '84.3k', change: '+1.8%', up: true, color: '#3B82F6' },
  { label: 'VIEWS TODAY', value: '142.4k', change: '+5.6%', up: true, color: '#3B82F6' },
]

const STUDIO = [
  { label: 'Rush News', desc: 'Publish a breaking story in under a minute', color: '#EFF6FF', icon: '⚡', iconColor: '#3B82F6' },
  { label: 'Big Story', desc: 'Long-form, with hero media and pull quotes', color: '#FFFBEB', icon: '★', iconColor: '#F59E0B' },
  { label: 'Newsletter', desc: "Draft today's edition from recent stories", color: '#F0FDF4', icon: '✉', iconColor: '#22C55E' },
  { label: 'Podcast', desc: 'Upload audio with chapters and transcript', color: '#FFF1F2', icon: '🎙', iconColor: '#EF4444' },
  { label: 'Photo Story', desc: 'Sequenced gallery with captions', color: '#F5F3FF', icon: '▣', iconColor: '#8B5CF6', badge: 'BETA' },
]

const ACTIVITY = [
  { name: 'Sagar Mehta', initials: 'SM', action: 'published', title: 'RBI flags risk in unsecured retail lending...', time: '2 min ago' },
  { name: 'Riya Kapoor', initials: 'RK', action: 'scheduled', title: 'Delhi govt outlines EV-only commercial fleet by 2027', time: '14 min ago' },
  { name: 'Ananya Singh', initials: 'AS', action: 'edited', title: 'Quiet rally in semiconductor stocks...', time: '28 min ago' },
  { name: 'Dev Pillai', initials: 'DP', action: 'submitted for approval', title: 'Why the new Coastal Road tender keeps getting delayed', time: '46 min ago' },
  { name: 'Maya Gupta', initials: 'MG', action: 'published', title: 'Inside the office that reshaped Indian indie cinema', time: '1 hr ago' },
]

const NEEDS_ATTENTION = [
  { label: 'Awaiting approval', count: 4, color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Scheduled in next 24h', count: 5, color: '#3B82F6', bg: '#EFF6FF' },
  { label: 'Flagged comments', count: 12, color: '#EF4444', bg: '#FFF1F2' },
  { label: 'Drafts stale 7+ days', count: 7, color: '#6B7280', bg: '#F9FAFB' },
]

const TOP_ARTICLES = [
  { title: 'Why the rupee held steady despite oil price volatility', category: 'Business', views: '38.4k', change: '+24%', author: 'Sagar Mehta' },
  { title: "The silent revolution in India's tier-2 startup scene", category: 'Tech', views: '29.1k', change: '+18%', author: 'Riya Kapoor' },
  { title: "ISRO's next mission: what we know so far", category: 'Science', views: '21.7k', change: '+31%', author: 'Dev Pillai' },
]

function Sparkline({ color, down }: { color: string; down?: boolean }) {
  const pts = down
    ? '0,20 20,10 40,18 60,8 80,15 100,22 120,12'
    : '0,22 20,18 40,20 60,12 80,16 100,8 120,14'
  return (
    <svg viewBox="0 0 120 28" className="w-full h-8" fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Dashboard() {
  const router = useRouter()

  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: 'var(--font-inter)' }}>
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-[#F5F5F5] shrink-0">
          <span className="text-[16px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Dashboard</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-[8px] px-3 py-1.5 w-[240px]">
              <span className="text-[#A3A3A3] text-[13px]">🔍</span>
              <span className="text-[13px] text-[#A3A3A3] flex-1">Search articles, authors, tags...</span>
              <span className="text-[11px] text-[#A3A3A3]">⌘K</span>
            </div>
            <button
              onClick={() => router.push('/news/new')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#0787FF] text-white text-[13px] font-medium hover:bg-[#0061FF] transition-colors"
            >
              ✨ Rush write <span className="text-[11px] opacity-70">⌘R</span>
            </button>
            <button className="flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-[#F5F5F5] text-[#737373] transition-colors">🔔</button>
            <button className="flex items-center justify-center w-8 h-8 rounded-[8px] hover:bg-[#F5F5F5] text-[#737373] transition-colors">⚙</button>
            <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[12px] font-medium text-[#1D4ED8] cursor-pointer">A</div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#FAFAFA]">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-[20px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Good morning, Ashish</h1>
            <p className="text-[13px] text-[#737373] mt-0.5">Thursday, May 14 — here's what's happening across the newsroom.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {STATS.map(s => (
              <div key={s.label} className="bg-white rounded-[12px] border border-[#F5F5F5] p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
                <div className="text-[11px] font-medium text-[#737373] uppercase tracking-wide mb-2">{s.label}</div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-[24px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>{s.value}</span>
                  <span className={`text-[12px] font-medium ${s.up ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>{s.up ? '↑' : '↓'} {s.change}</span>
                </div>
                <Sparkline color={s.up ? s.color : '#EF4444'} down={!s.up} />
              </div>
            ))}
          </div>

          {/* Studio */}
          <div className="bg-white rounded-[12px] border border-[#F5F5F5] p-5 mb-6 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
            <div className="mb-4">
              <h2 className="text-[15px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Studio</h2>
              <p className="text-[12px] text-[#737373]">Create something — we'll set up the structure for you.</p>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {STUDIO.map(s => (
                <button key={s.label}
                  onClick={() => router.push('/news/new')}
                  className="flex flex-col gap-2 p-3 rounded-[10px] border border-[#F5F5F5] hover:border-[#E5E5E5] hover:shadow-[0px_2px_8px_rgba(0,0,0,0.06)] transition-all text-left group"
                  style={{ background: s.color }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[18px]">{s.icon}</span>
                    <span className="text-[#D4D4D4] group-hover:text-[#A3A3A3] transition-colors text-[12px]">↗</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#171717] flex items-center gap-1.5">
                      {s.label}
                      {s.badge && <span className="text-[9px] bg-[#E5E5E5] text-[#737373] px-1 rounded">BETA</span>}
                    </div>
                    <div className="text-[11px] text-[#737373] mt-0.5 leading-[1.4]">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-[1fr_300px] gap-4 mb-6">
            {/* Recent activity */}
            <div className="bg-white rounded-[12px] border border-[#F5F5F5] p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Recent activity</h2>
                <button className="text-[12px] text-[#0787FF] hover:underline">View all →</button>
              </div>
              <div className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wide mb-3">Today</div>
              <div className="flex flex-col gap-3">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[10px] font-bold text-[#1D4ED8] shrink-0">{a.initials}</div>
                    <div>
                      <p className="text-[13px] text-[#171717]">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-[#737373]"> {a.action} </span>
                        <span className="font-medium">{a.title}</span>
                      </p>
                      <p className="text-[11px] text-[#A3A3A3] mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs attention */}
            <div className="bg-white rounded-[12px] border border-[#F5F5F5] p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
              <h2 className="text-[15px] font-semibold text-[#171717] mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Needs attention</h2>
              <div className="flex flex-col gap-2">
                {NEEDS_ATTENTION.map(n => (
                  <div key={n.label} className="flex items-center justify-between p-3 rounded-[8px] cursor-pointer hover:opacity-80 transition-opacity" style={{ background: n.bg }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: n.color }} />
                      <span className="text-[13px] text-[#404040]">{n.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[14px] font-semibold" style={{ color: n.color }}>{n.count}</span>
                      <span className="text-[#A3A3A3] text-[12px]">›</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top performing */}
          <div className="bg-white rounded-[12px] border border-[#F5F5F5] p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#171717]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Top performing articles this week</h2>
              <button className="text-[12px] text-[#0787FF] hover:underline">View full analytics →</button>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F5F5F5]">
                  {['TITLE', 'CATEGORY', 'VIEWS', 'CHANGE', 'AUTHOR'].map(h => (
                    <th key={h} className="text-left pb-2 text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_ARTICLES.map((a, i) => (
                  <tr key={i} className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3 pr-4 text-[#171717] font-medium max-w-[360px] truncate">{a.title}</td>
                    <td className="py-3 pr-4 text-[#737373]">{a.category}</td>
                    <td className="py-3 pr-4 text-[#171717] font-medium">{a.views}</td>
                    <td className="py-3 pr-4 text-[#16A34A] font-medium">{a.change}</td>
                    <td className="py-3 text-[#737373]">{a.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
