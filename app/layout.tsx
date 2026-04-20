import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Articulator Entitle – Collector Registry',
  description: 'Mobile-centric collector registry app',
  viewport: 'width=device-width, initial-scale=1.0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-[#FDFCFB] ${inter.variable} font-sans text-slate-900 overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
}
