import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://fluxio-three.vercel.app'),
  title: {
    default: 'FluxIO - Real-Time Industrial IoT Flow Monitoring Platform',
    template: '%s | FluxIO',
  },
  description:
    'Monitor Nivus flow transmitters in real-time with FluxIO. Cloud-based IIoT platform with intelligent alerts, historical analytics, and multi-device support. Get started free.',
  keywords: [
    'flow monitoring',
    'industrial iot',
    'nivus transmitters',
    'teltonika gateway',
    'modbus monitoring',
    'water flow monitoring',
    'scada',
    'real-time monitoring',
    'cloud iot platform',
    'industrial automation',
    'flow meter',
    'wastewater monitoring',
  ],
  authors: [{ name: 'FluxIO Team' }],
  creator: 'FluxIO',
  publisher: 'FluxIO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'FluxIO - Real-Time Industrial IoT Flow Monitoring',
    description:
      'Monitor your Nivus flow transmitters in real-time. Intelligent alerts, powerful analytics, enterprise security.',
    url: 'https://fluxio-three.vercel.app',
    siteName: 'FluxIO',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FluxIO - Real-Time Industrial IoT Flow Monitoring',
    description:
      'Monitor your Nivus flow transmitters in real-time with cloud-based IIoT platform.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
