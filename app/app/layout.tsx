import type { Metadata } from 'next'
import { Inter, DM_Sans, Mukta } from 'next/font/google'
import './globals.css'
import VersionSwitcher from '@/components/VersionSwitcher'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' })
const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'], display: 'swap' })
const mukta = Mukta({ variable: '--font-mukta', subsets: ['devanagari', 'latin'], weight: ['400', '500', '600', '700'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Snowberry — New News',
  description: 'Snowberry news editor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} ${mukta.variable} h-full`}>
      <body className="h-full antialiased bg-[#f3f4f6]">
        {children}
        <VersionSwitcher />
      </body>
    </html>
  )
}
