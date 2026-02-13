import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FlowNexus - Real-Time Industrial IoT Flow Monitoring | Nivus Transmitters',
  description:
    'Monitor Nivus flow transmitters in real-time with FlowNexus. Cloud-based IIoT platform with intelligent alerts, historical analytics, and multi-device support. Get started free.',
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
  ],
  authors: [{ name: 'FlowNexus Team' }],
  creator: 'FlowNexus',
  publisher: 'FlowNexus',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'FlowNexus - Real-Time Industrial IoT Flow Monitoring',
    description:
      'Monitor your Nivus flow transmitters in real-time. Intelligent alerts, powerful analytics, enterprise security. Start your free trial today.',
    url: 'https://www.flownexus.work',
    siteName: 'FlowNexus',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FlowNexus - Industrial IoT Monitoring Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowNexus - Real-Time Industrial IoT Flow Monitoring',
    description:
      'Monitor your Nivus flow transmitters in real-time with cloud-based IIoT platform.',
    images: ['/og-image.png'],
    creator: '@flownexus',
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
  verification: {
    google: 'verification_token',
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'FlowNexus',
            applicationCategory: 'IndustrialSoftware',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            operatingSystem: 'Web',
            description:
              'Real-time industrial IoT monitoring platform for Nivus flow transmitters with intelligent alerts and powerful analytics.',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '127',
            },
            featureList: [
              'Real-time monitoring',
              'Intelligent alerts',
              'Historical analytics',
              'Multi-device support',
              'Cloud-based platform',
              'Enterprise security',
            ],
          }),
        }}
      />
      {children}
    </>
  )
}
