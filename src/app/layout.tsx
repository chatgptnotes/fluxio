import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.flownexus.work'),
  title: {
    default:
      'FlowNexus - Industrial IoT Flow Monitoring | Real-Time Nivus Transmitter Analytics',
    template: '%s | FlowNexus Industrial IoT Platform',
  },
  description:
    'FlowNexus is the leading Industrial IoT platform for real-time monitoring of Nivus flow transmitters. Get instant alerts, comprehensive analytics, and remote management for wastewater and industrial flow measurement. Compatible with NivuFlow 550, 600, 650, 750, 1000 series. Start monitoring today.',
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
  authors: [{ name: 'FlowNexus Team', url: 'https://www.flownexus.work' }],
  creator: 'FlowNexus Industrial IoT Solutions',
  publisher: 'FlowNexus',
  applicationName: 'FlowNexus',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'Industrial IoT',
  classification: 'Industrial Monitoring Software',
  openGraph: {
    title: 'FlowNexus - Industrial IoT Flow Monitoring Platform',
    description:
      'Monitor Nivus flow transmitters in real-time with intelligent alerts, comprehensive analytics, and cloud-based dashboard. Perfect for wastewater and industrial applications.',
    url: 'https://www.flownexus.work',
    siteName: 'FlowNexus',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.flownexus.work/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FlowNexus Industrial IoT Flow Monitoring Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowNexus - Industrial IoT Flow Monitoring Platform',
    description:
      'Real-time monitoring of Nivus flow transmitters with instant alerts and comprehensive analytics.',
    creator: '@flownexus',
    site: '@flownexus',
    images: ['https://www.flownexus.work/twitter-image.png'],
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
    canonical: 'https://www.flownexus.work',
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
    name: 'FlowNexus',
    url: 'https://www.flownexus.work',
    logo: 'https://www.flownexus.work/logo.png',
    description:
      'FlowNexus provides industrial IoT solutions for real-time flow monitoring and management.',
    sameAs: [
      'https://twitter.com/flownexus',
      'https://linkedin.com/company/flownexus',
      'https://github.com/chatgptnotes/flownexus',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FlowNexus',
    url: 'https://www.flownexus.work',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.flownexus.work/search?q={search_term_string}',
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
