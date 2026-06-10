export type ArticleStatus = 'draft' | 'review' | 'approval_requested' | 'approved' | 'rejected' | 'published'
export type NewsType = 'normal' | 'video' | 'audio'
export type BlockType = 'paragraph' | 'heading' | 'image' | 'video' | 'embed' | 'quote' | 'gallery' | 'divider'

export type ContentBlock = {
  id: string
  type: BlockType
  content: string
  attrs?: Record<string, unknown>
}

export type SourceFile = {
  id: string
  name: string
  type: 'text' | 'link' | 'pdf' | 'audio'
  date: string
  size: string
  url?: string
}

export type Article = {
  id: string
  title: string
  newsType: NewsType
  newsContext: string
  categories: string[]
  author: string | null
  coverImage: string | null
  sources: SourceFile[]
  blocks: ContentBlock[]
  status: ArticleStatus
  createdAt: string
  updatedAt: string
}
