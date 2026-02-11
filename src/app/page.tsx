'use client'

import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Database,
  Droplet,
  Radio,
  Shield,
  Smartphone,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import FlowMeterSlideshow from '@/components/FlowMeterSlideshow'

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    {
      icon: Activity,
      title: 'Real-Time Monitoring',
      description:
        'Monitor flow rates, totalizers, and device status in real-time with live WebSocket updates.',
      color: 'blue',
    },
    {
      icon: AlertTriangle,
      title: 'Intelligent Alerts',
      description:
        'Configure custom alert rules for high flow, low flow, device offline, and battery levels.',
      color: 'yellow',
    },
    {
      icon: Cloud,
      title: 'Cloud-Based Platform',
      description:
        'Access your data anywhere, anytime. Fully hosted on secure cloud infrastructure.',
      color: 'purple',
    },
    {
      icon: Database,
      title: 'Historical Analytics',
      description:
        'Query and analyze time-series data with powerful filtering and aggregation capabilities.',
      color: 'green',
    },
    {
      icon: Smartphone,
      title: 'Multi-Device Support',
      description:
        'Manage hundreds of flow transmitters from a single dashboard with scalable architecture.',
      color: 'red',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'API key authentication, RLS policies, encrypted data at rest and in transit.',
      color: 'indigo',
    },
  ]

  const technicalSpecs = [
    { label: 'Supported Devices', value: 'Nivus Flow Transmitters' },
    { label: 'Gateway', value: 'Teltonika TRB245 / Compatible' },
    { label: 'Communication', value: 'Modbus RTU over RS485' },
    { label: 'Data Protocol', value: 'JSON over HTTPS' },
    { label: 'Real-time Updates', value: '< 500ms latency' },
    { label: 'API Response Time', value: '< 200ms average' },
    { label: 'Uptime SLA', value: '99.9%' },
    { label: 'Data Retention', value: 'Unlimited' },
  ]

  const faqs = [
    {
      question: 'What flow transmitters are supported?',
      answer:
        'FlowNexus is optimized for Nivus flow transmitters but works with any Modbus RTU device. We support all Nivus models including NivuFlow 550, 600, and 750 series.',
    },
    {
      question: 'Do I need special hardware?',
      answer:
        'You need a 4G/LTE gateway with Modbus Master capabilities. We recommend the Teltonika TRB245 ($160-220) which includes built-in cellular modem and Modbus support.',
    },
    {
      question: 'How is data transmitted to the cloud?',
      answer:
        'The gateway reads Modbus registers from your flow transmitters and sends JSON data via HTTPS to our cloud API. All communication is encrypted and authenticated.',
    },
    {
      question: 'Can I integrate with my existing systems?',
      answer:
        'Yes! FlowNexus provides REST APIs for all data operations. You can easily integrate with SCADA systems, ERP software, or custom applications.',
    },
    {
      question: 'What about data security?',
      answer:
        'We use industry-standard security practices including API key authentication, encrypted connections (TLS 1.3), Row Level Security policies, and data encryption at rest.',
    },
    {
      question: 'How long does setup take?',
      answer:
        'Setup takes about 30 minutes: 5 minutes to create accounts, 10 minutes to configure the gateway, and 15 minutes for testing. Our documentation guides you through every step.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 pt-16 pb-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_12%,rgba(255,255,255,.5)_13%,transparent_14%,transparent_88%,rgba(255,255,255,.5)_89%,transparent_90%)]"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <nav className="mb-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Droplet className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">FlowNexus</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/signup"
                className="text-white/90 hover:text-white"
              >
                Register
              </Link>
              <Link href="#faq" className="text-white/90 hover:text-white">
                FAQ
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-gray-100"
              >
                Get Started
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <div className="mb-4 inline-flex items-center space-x-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
                <Zap className="h-4 w-4" />
                <span>Real-time Industrial IoT Monitoring</span>
              </div>

              <h1 className="mb-6 text-5xl font-bold leading-tight text-white lg:text-6xl">
                Monitor Your Flow Transmitters in Real-Time
              </h1>

              <p className="mb-8 text-xl text-white/90">
                FlowNexus bridges the gap between your Nivus flow transmitters and
                the cloud. Get instant insights, intelligent alerts, and
                powerful analytics for your industrial water monitoring systems.
              </p>

              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 animate-slide-in-bottom">
                <Link
                  href="/explore"
                  className="group inline-flex items-center justify-center space-x-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-primary-600 shadow-2xl transition-all duration-300 hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-1 hover:scale-105"
                >
                  <span className="material-icons text-xl mr-1">play_circle</span>
                  <span>See It Live</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center space-x-2 rounded-xl border-2 border-white/50 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white/20 hover:shadow-xl hover:-translate-y-1"
                >
                  <Radio className="h-5 w-5 animate-pulse-slow" />
                  <span>Login</span>
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-8 border-t border-white/20 pt-8">
                <div>
                  <div className="text-3xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-white/70">Uptime SLA</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">200ms</div>
                  <div className="text-sm text-white/70">Avg Response</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-sm text-white/70">Monitoring</div>
                </div>
              </div>
            </div>

            {/* Flow Measurement Infographics Slideshow + Metrics Panel */}
            <div className="flex flex-col gap-4">
              <FlowMeterSlideshow />

              {/* Mini Metrics Panel below slideshow */}
              <div className="grid grid-cols-3 gap-3">
                <div className="group rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-md transition-all hover:bg-white/10">
                  <div className="mb-1 flex items-center space-x-1.5">
                    <span className="material-icons text-cyan-300 text-base">sensors</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">Measurement Types</span>
                  </div>
                  <div className="text-2xl font-bold text-white">6+</div>
                  <div className="text-[11px] text-white/50">Flow technologies</div>
                </div>
                <div className="group rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-md transition-all hover:bg-white/10">
                  <div className="mb-1 flex items-center space-x-1.5">
                    <span className="material-icons text-green-300 text-base">precision_manufacturing</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">Accuracy</span>
                  </div>
                  <div className="text-2xl font-bold text-white">0.5%</div>
                  <div className="text-[11px] text-white/50">Reading precision</div>
                </div>
                <div className="group rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-md transition-all hover:bg-white/10">
                  <div className="mb-1 flex items-center space-x-1.5">
                    <span className="material-icons text-amber-300 text-base">hub</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">Protocols</span>
                  </div>
                  <div className="text-2xl font-bold text-white">Modbus</div>
                  <div className="text-[11px] text-white/50">RTU / TCP / MQTT</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Stats Banner */}
      <section className="relative -mt-16 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 inline-flex rounded-xl bg-primary-50 p-3">
                <span className="material-icons text-primary-600 text-2xl">water_drop</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">1M+</div>
              <div className="text-sm text-gray-500">Data Points Daily</div>
            </div>
            <div className="text-center">
              <div className="mb-2 inline-flex rounded-xl bg-emerald-50 p-3">
                <span className="material-icons text-emerald-600 text-2xl">devices</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-500">Active Devices</div>
            </div>
            <div className="text-center">
              <div className="mb-2 inline-flex rounded-xl bg-blue-50 p-3">
                <span className="material-icons text-blue-600 text-2xl">public</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-500">Countries Served</div>
            </div>
            <div className="text-center">
              <div className="mb-2 inline-flex rounded-xl bg-amber-50 p-3">
                <span className="material-icons text-amber-600 text-2xl">verified</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <div className="text-sm text-gray-500">Platform Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Partners / Supported Technologies */}
      <section className="py-16 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-400">Supported Technologies and Standards</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            <div className="flex items-center space-x-2 text-gray-400 transition-colors hover:text-gray-600">
              <span className="material-icons text-xl">memory</span>
              <span className="text-sm font-semibold">Modbus RTU</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 transition-colors hover:text-gray-600">
              <span className="material-icons text-xl">cell_tower</span>
              <span className="text-sm font-semibold">4G / LTE</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 transition-colors hover:text-gray-600">
              <span className="material-icons text-xl">lan</span>
              <span className="text-sm font-semibold">MQTT</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 transition-colors hover:text-gray-600">
              <span className="material-icons text-xl">lock</span>
              <span className="text-sm font-semibold">TLS 1.3</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 transition-colors hover:text-gray-600">
              <span className="material-icons text-xl">cloud_sync</span>
              <span className="text-sm font-semibold">REST API</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 transition-colors hover:text-gray-600">
              <span className="material-icons text-xl">database</span>
              <span className="text-sm font-semibold">PostgreSQL</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 transition-colors hover:text-gray-600">
              <span className="material-icons text-xl">bolt</span>
              <span className="text-sm font-semibold">WebSocket</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Everything You Need for Industrial IoT
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Built for reliability, designed for scale. Monitor your critical
              infrastructure with confidence.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="feature-card animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`relative z-10 mb-6 inline-flex rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 p-4 shadow-lg hover-scale`}
                  >
                    <Icon
                      className={`h-7 w-7 text-primary-600`}
                    />
                  </div>
                  <h3 className="relative z-10 mb-3 text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="relative z-10 text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              How FlowNexus Works
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Simple setup, powerful results. Get started in under 30 minutes.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Connect Hardware',
                description:
                  'Wire your Nivus transmitters to the Teltonika gateway via RS485.',
              },
              {
                step: '2',
                title: 'Configure Gateway',
                description:
                  'Set up Modbus registers and point to FlowNexus API endpoint.',
              },
              {
                step: '3',
                title: 'Data Flows',
                description:
                  'Gateway automatically reads sensors and sends data to cloud.',
              },
              {
                step: '4',
                title: 'Monitor & Alert',
                description:
                  'View real-time data on dashboard and receive instant alerts.',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
                  {item.step}
                </div>
                {index < 3 && (
                  <div className="absolute left-[3rem] top-[1.5rem] hidden h-0.5 bg-primary-200 lg:block" style={{ width: 'calc(100% - 1.5rem)' }}></div>
                )}
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Technical Specifications
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Enterprise-grade infrastructure built for industrial reliability.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {technicalSpecs.map((spec, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="mb-1 text-sm font-medium text-gray-500">
                  {spec.label}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {spec.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Got questions? We have answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-white"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  <ArrowRight
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      openFaq === index ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-5xl font-bold text-white animate-scale-in">
            Ready to Transform Your Monitoring?
          </h2>
          <p className="mb-8 text-xl text-white/90 animate-slide-in-bottom">
            Join industrial operators worldwide who trust FlowNexus for their
            critical infrastructure monitoring.
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0 animate-slide-in-bottom">
            <Link
              href="/explore"
              className="group inline-flex items-center justify-center space-x-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-primary-600 shadow-2xl transition-all duration-300 hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-1 hover:scale-105 animate-glow"
            >
              <span className="material-icons text-xl mr-1">play_circle</span>
              <span>See It Live</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="https://github.com/chatgptnotes/flownexus"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 rounded-xl border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:shadow-xl hover:-translate-y-1"
            >
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <Droplet className="h-6 w-6 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">
                  FlowNexus
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Industrial IoT monitoring made simple. Real-time data from your
                flow transmitters to the cloud.
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/dashboard" className="hover:text-primary-600">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/chatgptnotes/flownexus"
                    className="hover:text-primary-600"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="https://github.com/chatgptnotes/flownexus"
                    className="hover:text-primary-600"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-primary-600">
                    FAQ
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-600">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-primary-600">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-600">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-600">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8 text-center">
            <p className="text-xs text-gray-400">
              FlowNexus v1.4 | January 9, 2025 | flownexus
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
