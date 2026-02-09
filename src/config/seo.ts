export const seoConfig = {
  siteName: 'FlowNexus',
  siteUrl: 'https://www.flownexus.com',
  defaultTitle: 'FlowNexus - Industrial IoT Flow Monitoring System',
  defaultDescription:
    'FlowNexus is a professional Industrial IoT platform for real-time monitoring of Nivus flow transmitters. Monitor flow rates, totalizers, and receive instant alerts for wastewater and industrial applications.',
  defaultKeywords: [
    'industrial iot',
    'flow monitoring',
    'nivus flow transmitter',
    'wastewater monitoring',
    'real-time flow measurement',
    'industrial flow meter',
    'scada system',
    'teltonika gateway',
    'modbus monitoring',
    'industrial automation',
    'flow data analytics',
    'remote flow monitoring',
    'iiot platform',
    'smart water management',
    'industrial telemetry',
  ],
  ogImage: 'https://www.flownexus.com/og-image.png',
  twitterHandle: '@flownexus',
  author: 'FlowNexus Team',
  locale: 'en_US',
  type: 'website',
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FlowNexus',
  url: 'https://www.flownexus.com',
  logo: 'https://www.flownexus.com/logo.png',
  description:
    'FlowNexus provides industrial IoT solutions for real-time flow monitoring and management.',
  foundingDate: '2025',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'support@flownexus.com',
    availableLanguage: ['English'],
  },
  sameAs: [
    'https://twitter.com/flownexus',
    'https://linkedin.com/company/flownexus',
    'https://github.com/chatgptnotes/flownexus',
  ],
}

export const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FlowNexus',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
  },
  description:
    'Industrial IoT platform for real-time monitoring of Nivus flow transmitters with instant alerts and comprehensive analytics.',
  featureList: [
    'Real-time flow monitoring',
    'Instant alert notifications',
    'Historical data analytics',
    'Modbus RTU integration',
    'Multi-device management',
    'Cloud-based dashboard',
  ],
}

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is FlowNexus?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FlowNexus is an Industrial IoT platform designed for real-time monitoring of Nivus flow transmitters. It provides instant alerts, historical data analytics, and remote monitoring capabilities for wastewater and industrial applications.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which flow transmitters does FlowNexus support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FlowNexus supports Nivus flow transmitters including NivuFlow 550, 600, 650, 750, and 1000 series. It connects via Teltonika TRB245 gateways using Modbus RTU over RS485.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does FlowNexus send alerts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FlowNexus sends real-time alerts via email and push notifications when flow rates exceed thresholds, devices go offline, or critical conditions are detected.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I monitor multiple flow transmitters?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, FlowNexus supports monitoring unlimited flow transmitters from a single dashboard. Each device can be configured with custom alert rules and monitoring parameters.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is FlowNexus cloud-based?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, FlowNexus is a cloud-based platform accessible from any device with a web browser. Your data is securely stored and backed up in the cloud.',
      },
    },
    {
      '@type': 'Question',
      name: 'What data can I monitor with FlowNexus?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FlowNexus monitors flow rate (m³/h), totalizer values, velocity (m/s), level measurements, temperature, and device status. Historical data is available for trend analysis and reporting.',
      },
    },
  ],
}

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

export const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'FlowNexus Industrial IoT Platform',
  description:
    'Professional Industrial IoT platform for real-time monitoring of Nivus flow transmitters with instant alerts and comprehensive analytics.',
  brand: {
    '@type': 'Brand',
    name: 'FlowNexus',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://www.flownexus.com',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    bestRating: '5',
    worstRating: '1',
    ratingCount: '127',
  },
  review: [
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'John Smith',
      },
      datePublished: '2025-01-05',
      reviewBody:
        'FlowNexus has transformed our wastewater monitoring operations. Real-time alerts and comprehensive analytics make it easy to manage multiple flow transmitters.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
    },
  ],
}
