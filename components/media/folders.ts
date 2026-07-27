/**
 * Folder catalog + demo asset data for /media/[slug] routes.
 * Slug is the canonical key used in URLs.
 */

export type FolderTint = 'blue' | 'violet' | 'amber' | 'teal'
export type FolderIconKind = 'image' | 'video' | 'audio' | 'folder'

export type MediaFolder = {
  slug: string
  name: string
  files: number
  size: string
  tint: FolderTint
  icon: FolderIconKind
  updated: string
}

export const FOLDERS: MediaFolder[] = [
  { slug: 'article-images',   name: 'Article Images',   files: 1428, size: '492 GB', tint: 'blue',   icon: 'image',  updated: '2 hours ago'  },
  { slug: 'video-clips',      name: 'Video Clips',      files: 342,  size: '168 GB', tint: 'violet', icon: 'video',  updated: '5 hours ago'  },
  { slug: 'audio-podcasts',   name: 'Audio & Podcasts', files: 128,  size: '38 GB',  tint: 'amber',  icon: 'audio',  updated: 'yesterday'    },
  { slug: 'document',         name: 'Document',         files: 864,  size: '98 GB',  tint: 'teal',   icon: 'folder', updated: '3 days ago'   },
]

export function getFolder(slug: string): MediaFolder | undefined {
  return FOLDERS.find((f) => f.slug === slug)
}

/* ─── Article Images — demo assets ─────────────────────────────────── */

export type ImageAsset = {
  title: string
  src: string
  dims: string
  size: string
  uploader: string
  avatar: string
  date: string
  usedIn: number
  category: 'Politics' | 'Business' | 'Sports' | 'Opinion' | 'World' | 'Culture'
}

export const ARTICLE_IMAGES: ImageAsset[] = [
  { title: 'PM Oli — press briefing',           src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80&auto=format&fit=crop', dims: '4032 × 3024', size: '4.2 MB',  uploader: 'Sagar Sharma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', date: '18 May 2025', usedIn: 47, category: 'Politics' },
  { title: 'Parliament exterior wide',          src: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80&auto=format&fit=crop', dims: '3840 × 2560', size: '3.8 MB',  uploader: 'Mohan Bhatta', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80&auto=format&fit=crop', date: '16 May 2025', usedIn: 34, category: 'Politics' },
  { title: 'Election 2025 — polling station',   src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80&auto=format&fit=crop', dims: '4000 × 2667', size: '5.4 MB',  uploader: 'Liam Johnson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', date: '12 May 2025', usedIn: 28, category: 'Politics' },
  { title: 'Kathmandu at dawn',                 src: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80&auto=format&fit=crop', dims: '5472 × 3648', size: '6.1 MB',  uploader: 'Olivia Davis', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&q=80&auto=format&fit=crop', date: '10 May 2025', usedIn: 22, category: 'Culture' },
  { title: 'NRB governor speaks',               src: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=800&q=80&auto=format&fit=crop', dims: '4032 × 2688', size: '4.7 MB',  uploader: 'Sophia Brown', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&auto=format&fit=crop', date: '09 May 2025', usedIn: 19, category: 'Business' },
  { title: 'Monsoon flooding — Terai',          src: 'https://images.unsplash.com/photo-1526711657229-e7e080ed7aa1?w=800&q=80&auto=format&fit=crop', dims: '3600 × 2400', size: '3.2 MB',  uploader: 'Sagar Sharma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', date: '08 May 2025', usedIn: 17, category: 'World'    },
  { title: 'FX reserves chart Q2',              src: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80&auto=format&fit=crop', dims: '2400 × 1600', size: '780 KB',  uploader: 'Sophia Brown', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&auto=format&fit=crop', date: '07 May 2025', usedIn: 18, category: 'Business' },
  { title: 'Cricket practice net',              src: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80&auto=format&fit=crop', dims: '4000 × 2667', size: '4.9 MB',  uploader: 'Mason Smith',  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80&auto=format&fit=crop', date: '06 May 2025', usedIn: 14, category: 'Sports'   },
  { title: 'Farmer plants paddy',               src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop', dims: '3840 × 2160', size: '4.1 MB',  uploader: 'Mohan Bhatta', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80&auto=format&fit=crop', date: '05 May 2025', usedIn: 12, category: 'Business' },
  { title: 'Everest base camp trek',            src: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800&q=80&auto=format&fit=crop', dims: '5000 × 3333', size: '5.6 MB',  uploader: 'Olivia Davis', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&q=80&auto=format&fit=crop', date: '04 May 2025', usedIn: 11, category: 'Culture'  },
  { title: 'Newsroom night shift',              src: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80&auto=format&fit=crop', dims: '4032 × 3024', size: '4.4 MB',  uploader: 'Liam Johnson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', date: '03 May 2025', usedIn: 9,  category: 'Opinion'  },
  { title: 'Kathmandu traffic snarl',           src: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80&auto=format&fit=crop', dims: '3840 × 2560', size: '3.6 MB',  uploader: 'Sagar Sharma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', date: '02 May 2025', usedIn: 8,  category: 'World'    },
]
