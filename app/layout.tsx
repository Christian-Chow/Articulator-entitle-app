import type { Metadata } from 'next'
import './globals.css'

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
      <body className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
