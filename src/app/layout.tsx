import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FluxIO - IIoT Flow Monitoring Platform',
  description:
    'Real-time monitoring and analytics for Nivus flow transmitters',
  keywords: [
    'IIoT',
    'flow monitoring',
    'Nivus',
    'Teltonika',
    'industrial monitoring',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
