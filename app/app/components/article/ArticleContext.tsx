'use client'

import {
  createContext, useContext, useReducer, useEffect, useRef, useState,
  type ReactNode, type Dispatch,
} from 'react'
import type { Article, ArticleStatus, ContentBlock, NewsType, SourceFile } from '@/types/article'

// ─── Actions ──────────────────────────────────────────────────────────────────
export type Action =
  | { type: 'SET_TITLE';        title: string }
  | { type: 'SET_NEWS_TYPE';    newsType: NewsType }
  | { type: 'SET_NEWS_CONTEXT'; newsContext: string }
  | { type: 'SET_CATEGORIES';   categories: string[] }
  | { type: 'SET_AUTHOR';       author: string | null }
  | { type: 'SET_COVER';        coverImage: string | null }
  | { type: 'ADD_SOURCE';       source: SourceFile }
  | { type: 'REMOVE_SOURCE';    id: string }
  | { type: 'ADD_BLOCK';        block: ContentBlock }
  | { type: 'UPDATE_BLOCK';     id: string; content: string; attrs?: Record<string, unknown> }
  | { type: 'REMOVE_BLOCK';     id: string }
  | { type: 'SET_STATUS';       status: ArticleStatus }
  | { type: 'HYDRATE';          article: Article }

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state: Article, action: Action): Article {
  const now = new Date().toISOString()
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.title, updatedAt: now }
    case 'SET_NEWS_TYPE':
      return { ...state, newsType: action.newsType, updatedAt: now }
    case 'SET_NEWS_CONTEXT':
      return { ...state, newsContext: action.newsContext, updatedAt: now }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.categories, updatedAt: now }
    case 'SET_AUTHOR':
      return { ...state, author: action.author, updatedAt: now }
    case 'SET_COVER':
      return { ...state, coverImage: action.coverImage, updatedAt: now }
    case 'ADD_SOURCE':
      return { ...state, sources: [...state.sources, action.source], updatedAt: now }
    case 'REMOVE_SOURCE':
      return { ...state, sources: state.sources.filter(s => s.id !== action.id), updatedAt: now }
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block], updatedAt: now }
    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === action.id
            ? { ...b, content: action.content, ...(action.attrs && { attrs: action.attrs }) }
            : b
        ),
        updatedAt: now,
      }
    case 'REMOVE_BLOCK':
      return { ...state, blocks: state.blocks.filter(b => b.id !== action.id), updatedAt: now }
    case 'SET_STATUS':
      return { ...state, status: action.status, updatedAt: now }
    case 'HYDRATE':
      return action.article
    default:
      return state
  }
}

// ─── Autosave ─────────────────────────────────────────────────────────────────
export type SaveState = 'idle' | 'saving' | 'saved' | 'offline'

function useAutosave(article: Article): SaveState {
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    setSaveState('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(`snowberry:article:${article.id}`, JSON.stringify(article))
        setSaveState('saved')
      } catch {
        setSaveState('offline')
      }
    }, 1000)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [article])

  return saveState
}

// ─── Context ──────────────────────────────────────────────────────────────────
type ArticleContextValue = {
  article: Article
  dispatch: Dispatch<Action>
  saveState: SaveState
}

const ArticleContext = createContext<ArticleContextValue | null>(null)

export function useArticle() {
  const ctx = useContext(ArticleContext)
  if (!ctx) throw new Error('useArticle must be used inside ArticleProvider')
  return ctx
}

// ─── Blank article factory ────────────────────────────────────────────────────
export function createBlankArticle(id: string): Article {
  const now = new Date().toISOString()
  return {
    id,
    title: '',
    newsType: 'normal',
    newsContext: '',
    categories: [],
    author: null,
    coverImage: null,
    sources: [],
    blocks: [{ id: 'block-0', type: 'paragraph', content: '' }],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ArticleProvider({ id, children }: { id: string; children: ReactNode }) {
  const [article, dispatch] = useReducer(reducer, undefined, () => createBlankArticle(id))
  const saveState = useAutosave(article)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(`snowberry:article:${id}`)
    if (!raw) return
    try {
      dispatch({ type: 'HYDRATE', article: JSON.parse(raw) as Article })
    } catch {
      // Corrupt data — start fresh
    }
  }, [id])

  return (
    <ArticleContext.Provider value={{ article, dispatch, saveState }}>
      {children}
    </ArticleContext.Provider>
  )
}
