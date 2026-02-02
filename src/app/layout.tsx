import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fluxio.work'),
  title: {
    default:
      'FluxIO - Industrial IoT Flow Monitoring | Real-Time Nivus Transmitter Analytics',
    template: '%s | FluxIO Industrial IoT Platform',
  },
  description:
    'FluxIO is the leading Industrial IoT platform for real-time monitoring of Nivus flow transmitters. Get instant alerts, comprehensive analytics, and remote management for wastewater and industrial flow measurement. Compatible with NivuFlow 550, 600, 650, 750, 1000 series. Start monitoring today.',
  keywords: [
    'industrial iot platform',
    'flow monitoring system',
    'nivus flow transmitter monitoring',
    'real-time flow measurement',
    'wastewater monitoring solution',
    'industrial flow meter software',
    'scada system',
    'teltonika trb245 gateway',
    'modbus rtu monitoring',
    'remote flow monitoring',
    'iiot dashboard',
    'flow data analytics',
    'industrial automation software',
    'cloud-based monitoring',
    'smart water management',
    'nivuflow monitoring',
    'flow transmitter alerts',
    'industrial telemetry system',
    'water treatment monitoring',
    'sewage flow monitoring',
  ],
  authors: [{ name: 'FluxIO Team', url: 'https://www.fluxio.work' }],
  creator: 'FluxIO Industrial IoT Solutions',
  publisher: 'FluxIO',
  applicationName: 'FluxIO',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'Industrial IoT',
  classification: 'Industrial Monitoring Software',
  openGraph: {
    title: 'FluxIO - Industrial IoT Flow Monitoring Platform',
    description:
      'Monitor Nivus flow transmitters in real-time with intelligent alerts, comprehensive analytics, and cloud-based dashboard. Perfect for wastewater and industrial applications.',
    url: 'https://www.fluxio.work',
    siteName: 'FluxIO',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.fluxio.work/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FluxIO Industrial IoT Flow Monitoring Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FluxIO - Industrial IoT Flow Monitoring Platform',
    description:
      'Real-time monitoring of Nivus flow transmitters with instant alerts and comprehensive analytics.',
    creator: '@fluxio',
    site: '@fluxio',
    images: ['https://www.fluxio.work/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.fluxio.work',
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    other: {
      'msvalidate.01': 'bing-verification-code',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FluxIO',
    url: 'https://www.fluxio.work',
    logo: 'https://www.fluxio.work/logo.png',
    description:
      'FluxIO provides industrial IoT solutions for real-time flow monitoring and management.',
    sameAs: [
      'https://twitter.com/fluxio',
      'https://linkedin.com/company/fluxio',
      'https://github.com/chatgptnotes/fluxio',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FluxIO',
    url: 'https://www.fluxio.work',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.fluxio.work/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className={inter.className}>
          <Providers>{children}</Providers>
        </body>
    </html>
  )
}
