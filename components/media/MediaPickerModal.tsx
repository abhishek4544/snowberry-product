'use client'

/**
 * MediaPickerModal — compact Finder-style media library for inserting an
 * image into a story (news writing flow).
 *
 * Scope-reduced on purpose: folders are browsable but not creatable, and
 * there is no storage usage / insights — this is a picker, not a manager.
 * Uploads (button or drag-and-drop anywhere on the modal) land in the open
 * folder as a ghost tile with progress, then auto-select ready to insert.
 * Visual language follows /media (white cards, slate hairlines, brand blue).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, X, Check, ChevronLeft, ChevronRight, LayoutGrid, List,
  Clock, Image as ImageIcon, Film, Music, Folder, Plus, Upload,
  Sparkles, AlertTriangle,
} from 'lucide-react'
import { FOLDERS, ARTICLE_IMAGES, type ImageAsset, type MediaFolder } from './folders'

export type PickedImage = Pick<ImageAsset, 'src' | 'title' | 'dims' | 'size'>

type Source = 'recents' | MediaFolder['slug']

type UploadItem = {
  id: string
  name: string
  src: string
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  folder: MediaFolder['slug']
  dims: string
  size: string
  alt: string
}

const FOLDER_TINT = {
  blue:   'bg-brand-50 text-brand-500',
  violet: 'bg-violet-50 text-violet-500',
  amber:  'bg-amber-50 text-amber-500',
  teal:   'bg-teal-50 text-teal-500',
} as const

const FOLDER_GLYPH = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  folder: Folder,
} as const

function imagesFor(source: Source): ImageAsset[] {
  if (source === 'recents' || source === 'article-images') return ARTICLE_IMAGES
  return []
}

function sourceLabel(source: Source) {
  if (source === 'recents') return 'Recents'
  return FOLDERS.find((f) => f.slug === source)?.name ?? 'Recents'
}

function humanSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function suggestAlt(fileName: string) {
  const base = fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim()
  if (!base) return 'Uploaded image'
  return base.charAt(0).toUpperCase() + base.slice(1)
}

let uploadSeq = 0

export default function MediaPickerModal({
  open, onClose, onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (img: PickedImage) => void
}) {
  const [source, setSource] = useState<Source>('recents')
  const [past, setPast] = useState<Source[]>([])
  const [future, setFuture] = useState<Source[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastFolderRef = useRef<MediaFolder['slug']>('article-images')
  const dragDepth = useRef(0)
  const autoSelected = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setSource('recents')
    setPast([])
    setFuture([])
    setQuery('')
    setPicked(null)
    setDragging(false)
    dragDepth.current = 0
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* simulated upload progress */
  useEffect(() => {
    if (!uploads.some((u) => u.status === 'uploading')) return
    const t = setInterval(() => {
      setUploads((prev) =>
        prev.map((u) => {
          if (u.status !== 'uploading') return u
          const next = u.progress + 9 + Math.random() * 15
          return next >= 100
            ? { ...u, progress: 100, status: 'done' as const }
            : { ...u, progress: Math.round(next) }
        }),
      )
    }, 170)
    return () => clearInterval(t)
  }, [uploads])

  /* auto-select an upload the moment it finishes */
  useEffect(() => {
    const done = uploads.find((u) => u.status === 'done' && !autoSelected.current.has(u.id))
    if (done) {
      autoSelected.current.add(done.id)
      setPicked(done.id)
    }
  }, [uploads])

  const targetFolder = (): MediaFolder['slug'] =>
    source === 'recents' ? lastFolderRef.current : source

  function handleFiles(files: FileList | File[]) {
    const list = [...files]
    if (list.length === 0) return
    const folder = targetFolder()
    for (const file of list) {
      const id = `up-${++uploadSeq}`
      if (!file.type.startsWith('image/')) {
        setUploads((prev) => [
          { id, name: file.name, src: '', progress: 0, status: 'error', error: 'Only images can be inserted here', folder, dims: '—', size: humanSize(file.size), alt: '' },
          ...prev,
        ])
        continue
      }
      const src = URL.createObjectURL(file)
      const item: UploadItem = {
        id, name: file.name, src, progress: 4, status: 'uploading', folder,
        dims: '…', size: humanSize(file.size), alt: suggestAlt(file.name),
      }
      setUploads((prev) => [item, ...prev])
      const probe = new window.Image()
      probe.onload = () =>
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, dims: `${probe.naturalWidth} × ${probe.naturalHeight}` } : u)),
        )
      probe.src = src
    }
  }

  const q = query.trim().toLowerCase()
  const images = useMemo(() => {
    const all = imagesFor(source)
    if (!q) return all
    return all.filter(
      (i) => i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q),
    )
  }, [source, q])

  const visibleUploads = useMemo(() => {
    const inSource = source === 'recents' ? uploads : uploads.filter((u) => u.folder === source)
    if (!q) return inSource
    return inSource.filter((u) => u.name.toLowerCase().includes(q))
  }, [uploads, source, q])

  const selectedUpload = visibleUploads.find((u) => u.id === picked && u.status === 'done') ?? null
  const selectedImage = images.find((i) => i.title === picked) ?? null
  const selectionInfo = selectedUpload
    ? { src: selectedUpload.src, title: selectedUpload.alt || selectedUpload.name, name: selectedUpload.name, dims: selectedUpload.dims, size: selectedUpload.size, date: 'just now' }
    : selectedImage
    ? { src: selectedImage.src, title: selectedImage.title, name: selectedImage.title, dims: selectedImage.dims, size: selectedImage.size, date: `uploaded ${selectedImage.date}` }
    : null

  function navigate(next: Source) {
    if (next === source) return
    if (next !== 'recents') lastFolderRef.current = next
    setPast((p) => [...p, source])
    setFuture([])
    setSource(next)
    setPicked(null)
    setQuery('')
  }

  function goBack() {
    setPast((p) => {
      if (p.length === 0) return p
      const prev = p[p.length - 1]
      setFuture((f) => [source, ...f])
      setSource(prev)
      setPicked(null)
      return p.slice(0, -1)
    })
  }

  function goForward() {
    setFuture((f) => {
      if (f.length === 0) return f
      const next = f[0]
      setPast((p) => [...p, source])
      setSource(next)
      setPicked(null)
      return f.slice(1)
    })
  }

  function insertSelected() {
    if (!selectionInfo) return
    onSelect({ src: selectionInfo.src, title: selectionInfo.title, dims: selectionInfo.dims, size: selectionInfo.size })
  }

  function insertImage(img: ImageAsset) {
    onSelect({ src: img.src, title: img.title, dims: img.dims, size: img.size })
  }

  if (!open) return null

  const uploadLabel = source === 'recents' ? 'Upload new' : `Upload to ${sourceLabel(source)}`
  const isEmpty = images.length === 0 && visibleUploads.length === 0

  return (
    <div className="fixed inset-0 z-[60]" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[6px]" />
      <div className="relative flex h-full w-full items-center justify-center p-6">
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onDragEnter={(e) => {
            e.preventDefault()
            dragDepth.current += 1
            setDragging(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => {
            dragDepth.current = Math.max(0, dragDepth.current - 1)
            if (dragDepth.current === 0) setDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            dragDepth.current = 0
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Add an image from the media library"
          className="relative flex h-[580px] max-h-[86vh] w-[880px] max-w-[94vw] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0px_32px_80px_-20px_rgba(31,57,99,0.30)] ring-1 ring-slate-200/80"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />

          {/* drop overlay */}
          {dragging && (
            <div className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-[16px] border-2 border-dashed border-brand-400 bg-brand-50/90">
              <div className="flex flex-col items-center gap-2 text-brand-600">
                <Upload size={26} strokeWidth={2} />
                <p className="text-[14px] font-semibold">
                  Drop to upload to {sourceLabel(source === 'recents' ? lastFolderRef.current : source)}
                </p>
              </div>
            </div>
          )}

          {/* ─── Toolbar ─────────────────────────────────────────── */}
          <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-0.5">
              <button
                onClick={goBack}
                disabled={past.length === 0}
                aria-label="Back"
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors enabled:hover:bg-slate-100 enabled:hover:text-slate-800 disabled:text-slate-300"
              >
                <ChevronLeft size={16} strokeWidth={2.25} />
              </button>
              <button
                onClick={goForward}
                disabled={future.length === 0}
                aria-label="Forward"
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors enabled:hover:bg-slate-100 enabled:hover:text-slate-800 disabled:text-slate-300"
              >
                <ChevronRight size={16} strokeWidth={2.25} />
              </button>
            </div>

            <h2 className="min-w-0 flex-1 truncate pl-1 text-[14px] font-semibold text-slate-900">
              {sourceLabel(source)}
            </h2>

            <div className="relative w-[220px]">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search images..."
                className="h-8 w-full rounded-lg bg-slate-50 pl-8 pr-3 text-[12.5px] text-slate-800 outline-none ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-brand-400"
              />
            </div>

            <div className="inline-flex items-center gap-0.5 rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
              <button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                className={[
                  'flex size-7 items-center justify-center rounded-md transition-colors',
                  view === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800',
                ].join(' ')}
              >
                <LayoutGrid size={12} strokeWidth={2.25} />
              </button>
              <button
                onClick={() => setView('list')}
                aria-label="List view"
                className={[
                  'flex size-7 items-center justify-center rounded-md transition-colors',
                  view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800',
                ].join(' ')}
              >
                <List size={12} strokeWidth={2.25} />
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="ml-1 flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={15} strokeWidth={2.25} />
            </button>
          </header>

          {/* ─── Body: sidebar + files ───────────────────────────── */}
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-[196px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-100 bg-slate-50/70 px-2.5 py-3.5">
              <nav>
                <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  Library
                </p>
                <SidebarItem
                  icon={<Clock size={14} strokeWidth={2.25} />}
                  tint="bg-slate-200/70 text-slate-500"
                  label="Recents"
                  active={source === 'recents'}
                  onClick={() => navigate('recents')}
                />
              </nav>
              <nav>
                <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  Folders
                </p>
                {FOLDERS.map((f) => {
                  const Glyph = FOLDER_GLYPH[f.icon]
                  const added = uploads.filter((u) => u.folder === f.slug && u.status === 'done').length
                  return (
                    <SidebarItem
                      key={f.slug}
                      icon={<Glyph size={14} strokeWidth={2.25} />}
                      tint={FOLDER_TINT[f.tint]}
                      label={f.name}
                      count={f.files + added}
                      bumped={added > 0}
                      active={source === f.slug}
                      onClick={() => navigate(f.slug)}
                    />
                  )
                })}
              </nav>
            </aside>

            <div className="min-w-0 flex-1 overflow-y-auto p-4">
              {isEmpty ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <ImageIcon size={20} strokeWidth={1.75} />
                  </span>
                  <p className="mt-3 text-[13.5px] font-semibold text-slate-700">
                    {q ? 'No images match your search' : `No images in ${sourceLabel(source)}`}
                  </p>
                  <p className="mt-1 max-w-[280px] text-[12px] text-slate-400">
                    {q ? 'Try a different keyword.' : 'Only images can be inserted into a story — upload one below or drag it here.'}
                  </p>
                </div>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
                  {visibleUploads.map((u) => (
                    <UploadTile
                      key={u.id}
                      item={u}
                      selected={picked === u.id}
                      onSelect={() => u.status === 'done' && setPicked(u.id)}
                      onInsert={() => u.status === 'done' && setPicked(u.id)}
                      onDismiss={() => setUploads((prev) => prev.filter((x) => x.id !== u.id))}
                    />
                  ))}
                  {images.map((img) => {
                    const isSel = picked === img.title
                    return (
                      <button
                        key={img.title}
                        type="button"
                        onClick={() => setPicked(img.title)}
                        onDoubleClick={() => insertImage(img)}
                        className="group flex flex-col items-center gap-1.5 rounded-xl p-2 text-center outline-none"
                      >
                        <span
                          className={[
                            'relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 transition-shadow',
                            isSel
                              ? 'ring-2 ring-brand-500 ring-offset-2'
                              : 'ring-1 ring-slate-200 group-hover:ring-slate-300',
                          ].join(' ')}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.src} alt="" className="size-full object-cover" loading="lazy" />
                          {isSel && (
                            <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          )}
                        </span>
                        <span
                          className={[
                            'max-w-full truncate rounded-md px-2 py-0.5 text-[11.5px] font-medium leading-tight',
                            isSel ? 'bg-brand-500 text-white' : 'text-slate-700',
                          ].join(' ')}
                        >
                          {img.title}
                        </span>
                        <span className="text-[10.5px] leading-none text-slate-400 tabular-nums">{img.size}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="grid grid-cols-[minmax(180px,1.6fr)_90px_110px_90px] items-center gap-3 border-b border-slate-100 px-2 pb-2 text-[10.5px] font-medium uppercase tracking-wide text-slate-400">
                    <span>Name</span>
                    <span>Size</span>
                    <span>Dimensions</span>
                    <span>Date</span>
                  </div>
                  {visibleUploads.filter((u) => u.status !== 'error').map((u) => {
                    const isSel = picked === u.id
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => u.status === 'done' && setPicked(u.id)}
                        className={[
                          'grid w-full grid-cols-[minmax(180px,1.6fr)_90px_110px_90px] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
                          isSel ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="size-8 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                            {u.src && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.src} alt="" className="size-full object-cover" />
                            )}
                          </span>
                          <span className={`truncate text-[12.5px] font-medium ${isSel ? 'text-brand-700' : 'text-slate-800'}`}>
                            {u.name}
                          </span>
                        </span>
                        <span className="text-[12px] text-slate-500 tabular-nums">
                          {u.status === 'uploading' ? `${u.progress}%` : u.size}
                        </span>
                        <span className="text-[12px] text-slate-500 tabular-nums">{u.dims}</span>
                        <span className="text-[12px] text-slate-500">just now</span>
                      </button>
                    )
                  })}
                  {images.map((img) => {
                    const isSel = picked === img.title
                    return (
                      <button
                        key={img.title}
                        type="button"
                        onClick={() => setPicked(img.title)}
                        onDoubleClick={() => insertImage(img)}
                        className={[
                          'grid w-full grid-cols-[minmax(180px,1.6fr)_90px_110px_90px] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors',
                          isSel ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="size-8 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.src} alt="" className="size-full object-cover" loading="lazy" />
                          </span>
                          <span className={`truncate text-[12.5px] font-medium ${isSel ? 'text-brand-700' : 'text-slate-800'}`}>
                            {img.title}
                          </span>
                        </span>
                        <span className="text-[12px] text-slate-500 tabular-nums">{img.size}</span>
                        <span className="text-[12px] text-slate-500 tabular-nums">{img.dims}</span>
                        <span className="text-[12px] text-slate-500 tabular-nums">{img.date}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─── Alt-text strip (fresh uploads only) ─────────────── */}
          {selectedUpload && (
            <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <span className="shrink-0 text-[11.5px] font-medium text-slate-500">Alt text</span>
              <div className="relative min-w-[220px] flex-1">
                <input
                  value={selectedUpload.alt}
                  onChange={(e) =>
                    setUploads((prev) =>
                      prev.map((u) => (u.id === selectedUpload.id ? { ...u, alt: e.target.value } : u)),
                    )
                  }
                  placeholder="Describe the image for readers"
                  className="h-8 w-full rounded-lg bg-white pl-3 pr-[76px] text-[12.5px] text-slate-800 outline-none ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:ring-brand-400"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 ring-1 ring-violet-100">
                  <Sparkles size={9} strokeWidth={2.5} /> Berry
                </span>
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-slate-500">
                Saved to
                <select
                  value={selectedUpload.folder}
                  onChange={(e) =>
                    setUploads((prev) =>
                      prev.map((u) =>
                        u.id === selectedUpload.id ? { ...u, folder: e.target.value as MediaFolder['slug'] } : u,
                      ),
                    )
                  }
                  className="h-8 rounded-lg bg-white px-2 text-[12px] font-medium text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-brand-400"
                >
                  {FOLDERS.map((f) => (
                    <option key={f.slug} value={f.slug}>{f.name}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* ─── Footer ──────────────────────────────────────────── */}
          <footer className="flex items-center gap-3 border-t border-slate-100 px-4 py-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12px] font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            >
              <Plus size={12} strokeWidth={2.5} /> {uploadLabel}
            </button>

            {selectionInfo ? (
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="size-9 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectionInfo.src} alt="" className="size-full object-cover" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-slate-900">{selectionInfo.name}</p>
                  <p className="truncate text-[11px] text-slate-400 tabular-nums">
                    {selectionInfo.dims} · {selectionInfo.size} · {selectionInfo.date}
                  </p>
                </div>
              </div>
            ) : (
              <span className="hidden min-w-0 flex-1 truncate text-[12px] text-slate-400 sm:inline">
                {images.length + visibleUploads.filter((u) => u.status === 'done').length} images · double-click to insert, or drag files here
              </span>
            )}

            <button
              onClick={onClose}
              className="shrink-0 rounded-lg bg-white px-4 py-2 text-[12.5px] font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={insertSelected}
              disabled={!selectionInfo}
              className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(7,135,255,0.35)] transition-colors enabled:hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              Add image
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}

/* ─── Upload ghost tile (grid view) ────────────────────────────────── */

function UploadTile({
  item, selected, onSelect, onInsert, onDismiss,
}: {
  item: UploadItem
  selected: boolean
  onSelect: () => void
  onInsert: () => void
  onDismiss: () => void
}) {
  if (item.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center">
        <span className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg bg-rose-50 ring-1 ring-rose-200">
          <AlertTriangle size={16} className="text-rose-500" strokeWidth={2} />
          <span className="px-2 text-[10px] font-medium leading-tight text-rose-600">{item.error}</span>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm hover:bg-rose-100"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        </span>
        <span className="max-w-full truncate text-[11.5px] font-medium text-slate-500">{item.name}</span>
      </div>
    )
  }

  const ring = 2 * Math.PI * 10
  const dash = (item.progress / 100) * ring

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onInsert}
      className="group flex flex-col items-center gap-1.5 rounded-xl p-2 text-center outline-none"
    >
      <span
        className={[
          'relative block aspect-[4/3] w-full overflow-hidden rounded-lg transition-shadow',
          item.status === 'uploading'
            ? 'border-[1.5px] border-dashed border-brand-400 bg-brand-50'
            : selected
            ? 'bg-slate-100 ring-2 ring-brand-500 ring-offset-2'
            : 'bg-slate-100 ring-1 ring-slate-200 group-hover:ring-slate-300',
        ].join(' ')}
      >
        {item.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.src}
            alt=""
            className={`size-full object-cover transition-opacity ${item.status === 'uploading' ? 'opacity-30' : 'opacity-100'}`}
          />
        )}
        {item.status === 'uploading' && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <circle cx="13" cy="13" r="10" fill="none" stroke="#AEDFFF" strokeWidth="3" />
              <circle
                cx="13" cy="13" r="10" fill="none" stroke="#0787FF" strokeWidth="3"
                strokeDasharray={`${dash} ${ring - dash}`} strokeLinecap="round"
                transform="rotate(-90 13 13)"
              />
            </svg>
            <span className="text-[10px] font-semibold text-brand-600 tabular-nums">{item.progress}%</span>
          </span>
        )}
        {item.status === 'done' && selected && (
          <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm">
            <Check size={11} strokeWidth={3} />
          </span>
        )}
      </span>
      <span
        className={[
          'max-w-full truncate rounded-md px-2 py-0.5 text-[11.5px] font-medium leading-tight',
          selected && item.status === 'done' ? 'bg-brand-500 text-white' : 'text-slate-700',
        ].join(' ')}
      >
        {item.name}
      </span>
      <span className="text-[10.5px] leading-none text-slate-400 tabular-nums">
        {item.status === 'uploading' ? 'uploading…' : item.size}
      </span>
    </button>
  )
}

/* ─── Sidebar item ─────────────────────────────────────────────────── */

function SidebarItem({
  icon, tint, label, count, active, bumped = false, onClick,
}: {
  icon: React.ReactNode
  tint: string
  label: string
  count?: number
  active: boolean
  bumped?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
        active ? 'bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80' : 'hover:bg-white/70',
      ].join(' ')}
    >
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-md ${tint}`}>{icon}</span>
      <span className={`min-w-0 flex-1 truncate text-[12.5px] font-medium ${active ? 'text-slate-900' : 'text-slate-600'}`}>
        {label}
      </span>
      {typeof count === 'number' && (
        <span className={`shrink-0 text-[10.5px] tabular-nums ${bumped ? 'font-semibold text-emerald-600' : 'text-slate-400'}`}>
          {count.toLocaleString()}
        </span>
      )}
    </button>
  )
}
