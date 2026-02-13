'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface InfographicSlide {
  id: string
  title: string
  subtitle: string
  icon: string
  prompt: string
  color: string
}

const SLIDES: InfographicSlide[] = [
  {
    id: 'system-arch',
    title: 'System Architecture',
    subtitle: 'End-to-end IIoT data pipeline',
    icon: 'architecture',
    color: 'from-cyan-500 to-blue-600',
    prompt: `Create a professional, stunning SYSTEM ARCHITECTURE INFOGRAPHIC for FlowNexus IIoT Platform.

STYLE: Modern tech infographic, dark background (#0F172A), glowing neon accents, clean vector style.

LAYOUT (Left to Right flow):
1. FIELD LAYER (Left 25%):
   - 3 Nivus flow meter instruments (sleek industrial sensors)
   - Connected via RS-485/Modbus RTU cables
   - Labels: "Nivus 750 Flow Transmitters"
   - Measurements shown: Flow Rate, Water Level, Temperature, Velocity
   - Color: Cyan (#06B6D4) glow

2. EDGE LAYER (Center-Left 25%):
   - Teltonika TRB246 gateway device (compact industrial router)
   - Shows Modbus TCP/RTU input on left
   - Shows 4G/LTE antenna on top
   - Shows HTTPS/JSON output on right
   - Label: "TRB246 Industrial Gateway"
   - Color: Blue (#3B82F6) glow

3. CLOUD LAYER (Center-Right 25%):
   - Cloud shape with FlowNexus logo
   - Inside cloud: REST API, Real-time Engine, PostgreSQL DB
   - Hosted on Vercel + Supabase badges
   - Label: "FlowNexus Cloud Platform"
   - Color: Violet (#8B5CF6) glow

4. USER LAYER (Right 25%):
   - Dashboard on laptop screen showing charts/gauges
   - Mobile phone showing alerts
   - Email notification icon
   - Label: "Monitoring & Alerts"
   - Color: Emerald (#10B981) glow

CONNECTING ARROWS between each layer with protocol labels:
- Field to Edge: "Modbus RTU/TCP" with data packet animation dots
- Edge to Cloud: "HTTPS + JSON" with encrypted lock icon
- Cloud to User: "WebSocket Real-time" with live pulse

BOTTOM BAR: Key metrics strip
- "<500ms Latency" | "100+ Devices" | "99.9% Uptime" | "End-to-End Encrypted"

NO watermarks. Professional enterprise quality. Dark theme with neon glows.`,
  },
  {
    id: 'data-journey',
    title: 'The Data Journey',
    subtitle: 'From sensor to insight in real-time',
    icon: 'timeline',
    color: 'from-violet-500 to-purple-600',
    prompt: `Create a beautiful DATA JOURNEY INFOGRAPHIC showing how a single flow measurement travels from an underwater sensor to a manager's phone alert.

STYLE: Modern storytelling infographic, dark gradient background (#0F172A to #1E1B4B), cinematic feel with glowing elements.

LAYOUT: Vertical timeline flowing top to bottom with 6 stages, each connected by glowing data path lines.

STAGE 1 (Top) - "MEASUREMENT"
- Underwater ultrasonic sensor in a pipe cross-section
- Sound waves bouncing off water flow (cyan waves)
- Caption: "Ultrasonic pulses measure flow velocity"
- Time indicator: "T+0ms"

STAGE 2 - "DIGITIZATION"
- Nivus 750 transmitter converts analog to Modbus registers
- Show register values: Flow=124.7, Level=1580, Temp=24.2
- Caption: "Analog signal converted to Modbus registers"
- Time: "T+10ms"

STAGE 3 - "TRANSMISSION"
- TRB246 gateway reads Modbus, packages as JSON
- Shows JSON payload being encrypted (lock icon)
- 4G tower sending data to cloud
- Caption: "Gateway encrypts and transmits via 4G"
- Time: "T+1s"

STAGE 4 - "INGESTION"
- Cloud API receiving POST request
- Data validated, stored in PostgreSQL
- Real-time engine broadcasts to subscribers
- Caption: "API validates, stores, and broadcasts"
- Time: "T+1.2s"

STAGE 5 - "VISUALIZATION"
- Dashboard showing live gauge updating
- Chart line extending with new data point
- Map pin showing device location
- Caption: "Dashboard updates in real-time"
- Time: "T+1.5s"

STAGE 6 (Bottom) - "ACTION"
- Phone receiving push notification
- Email alert with high-flow warning
- Engineer's tablet showing alert details
- Caption: "Intelligent alerts trigger instant action"
- Time: "T+2s"

GLOWING DATA PATH: A continuous glowing cyan line connecting all 6 stages, with animated particle dots flowing downward.

SIDE LABEL: "From sensor to action in under 2 seconds"

Professional, cinematic, enterprise quality. No watermarks.`,
  },
  {
    id: 'scada-compare',
    title: 'Cloud vs Traditional SCADA',
    subtitle: 'Why modern beats legacy',
    icon: 'compare',
    color: 'from-emerald-500 to-teal-600',
    prompt: `Create a striking COMPARISON INFOGRAPHIC: FlowNexus Cloud SCADA vs Traditional On-Premise SCADA.

STYLE: Split-screen design. Left side dark/gray/dated, Right side vibrant blue/modern. Dark background.

HEADER: "The SCADA Evolution" in bold white text

LEFT SIDE - "Traditional SCADA" (Gray tones, #374151, #4B5563):
- Cluttered server room illustration with cable spaghetti
- Old desktop computer with basic HMI screen
- VPN icon with padlock (complicated)
- IT technician frustrated with hardware
- Price tag showing "$$$" for hardware costs
- Calendar showing "3-6 month deployment"

RIGHT SIDE - "FlowNexus Cloud" (Blue/Cyan tones, #06B6D4, #3B82F6):
- Clean cloud icon with connected devices
- Modern responsive dashboard on laptop + phone
- Globe icon showing "access anywhere"
- Happy engineer using tablet in field
- Price tag showing "$" (affordable SaaS)
- Clock showing "30 min setup"

CENTER COMPARISON TABLE (6 rows):
| Feature | Traditional (X red) | FlowNexus (checkmark green) |
|---------|--------------------|-----------------------------|
| Setup Time | 3-6 months | 30 minutes |
| Hardware | Servers + UPS + HVAC | Zero hardware |
| Access | VPN from office only | Any browser, anywhere |
| Updates | Manual, risky downtime | Automatic, zero downtime |
| Scaling | Buy more servers | Click to add devices |
| Cost | $50K+ upfront | Pay as you grow |

BOTTOM SECTION:
Big bold text: "100x Faster to Deploy. 10x Lower Cost. Zero Maintenance."
FlowNexus logo and "flownexus.work"

Make the contrast dramatic and obvious. Traditional side should feel heavy and outdated. FlowNexus side should feel light, modern, and effortless.

Professional enterprise quality. No watermarks.`,
  },
]

export default function ExploreInfographics() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [autoGenerated, setAutoGenerated] = useState(false)

  const generateImage = useCallback(async (slide: InfographicSlide) => {
    if (images[slide.id] || loading[slide.id]) return

    setLoading(prev => ({ ...prev, [slide.id]: true }))
    setErrors(prev => ({ ...prev, [slide.id]: '' }))

    try {
      const response = await fetch('/api/generate-infographic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 0, prompt: slide.prompt }),
      })

      const data = await response.json()

      if (data.image) {
        setImages(prev => ({ ...prev, [slide.id]: data.image }))
      } else {
        setErrors(prev => ({ ...prev, [slide.id]: data.error || 'Failed to generate image' }))
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [slide.id]: 'Network error. Try again.' }))
    } finally {
      setLoading(prev => ({ ...prev, [slide.id]: false }))
    }
  }, [images, loading])

  // Auto-generate first slide on mount
  useEffect(() => {
    if (!autoGenerated) {
      setAutoGenerated(true)
      generateImage(SLIDES[0])
    }
  }, [autoGenerated, generateImage])

  // Pre-generate next slide when current one is loaded
  useEffect(() => {
    const nextIdx = (currentSlide + 1) % SLIDES.length
    const nextSlide = SLIDES[nextIdx]
    if (images[SLIDES[currentSlide]?.id] && !images[nextSlide.id] && !loading[nextSlide.id]) {
      generateImage(nextSlide)
    }
  }, [currentSlide, images, loading, generateImage])

  const slide = SLIDES[currentSlide]
  const hasImage = !!images[slide.id]
  const isLoading = !!loading[slide.id]
  const error = errors[slide.id]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <span className="material-icons text-white text-xl">auto_awesome</span>
          </div>
          <div>
            <h2 className="text-base font-bold">AI-Generated Platform Visualizations</h2>
            <p className="text-xs text-white/40">Powered by Gemini, generated in real-time</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 px-3 py-1">
          <span className="material-icons text-violet-400 text-sm">auto_awesome</span>
          <span className="text-xs text-violet-300">AI Generated</span>
        </div>
      </div>

      {/* Slide Tabs */}
      <div className="flex border-b border-white/5 bg-white/3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentSlide(i)
              if (!images[s.id] && !loading[s.id]) {
                generateImage(s)
              }
            }}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-xs font-medium transition-all ${
              i === currentSlide
                ? 'bg-white/5 text-white border-b-2 border-cyan-400'
                : 'text-white/40 hover:text-white/60 hover:bg-white/3'
            }`}
          >
            <span className="material-icons text-sm">{s.icon}</span>
            <span className="hidden sm:inline">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Image Display */}
      <div className="relative">
        <div className="relative aspect-[16/10] w-full bg-gray-950/50">
          {hasImage ? (
            <Image
              src={images[slide.id]}
              alt={slide.title}
              fill
              className="object-contain"
              unoptimized
            />
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center material-icons text-cyan-400 text-xl">auto_awesome</span>
              </div>
              <p className="mt-4 text-sm text-white/50">Gemini is creating your visualization...</p>
              <p className="mt-1 text-xs text-white/30">This takes 15-30 seconds</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
              <span className="material-icons text-4xl text-amber-400 mb-3">image_not_supported</span>
              <p className="text-sm text-white/60 text-center">{error}</p>
              <button
                onClick={() => generateImage(slide)}
                className="mt-4 inline-flex items-center space-x-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/15 transition-all"
              >
                <span className="material-icons text-sm">refresh</span>
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`material-icons text-5xl bg-gradient-to-r ${slide.color} bg-clip-text text-transparent`}>
                {slide.icon}
              </span>
              <p className="mt-3 text-base font-semibold">{slide.title}</p>
              <p className="mt-1 text-xs text-white/40">{slide.subtitle}</p>
              <button
                onClick={() => generateImage(slide)}
                className="mt-4 inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/25"
              >
                <span className="material-icons text-sm">auto_awesome</span>
                <span>Generate with AI</span>
              </button>
            </div>
          )}
        </div>

        {/* Slide info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-5 py-4">
          <div className={`inline-flex items-center rounded-full bg-gradient-to-r ${slide.color} px-3 py-1 text-xs font-semibold text-white`}>
            <span className="material-icons mr-1 text-sm">{slide.icon}</span>
            {slide.title}
          </div>
          <p className="mt-1 text-sm text-white/60">{slide.subtitle}</p>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 bg-black/20 px-4 py-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentSlide(i)
              if (!images[s.id] && !loading[s.id]) {
                generateImage(s)
              }
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === currentSlide ? 'w-8 bg-cyan-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
        {hasImage && (
          <button
            onClick={() => generateImage(slide)}
            className="ml-4 flex items-center space-x-1 rounded-full bg-white/10 px-3 py-1 text-[10px] text-white/50 hover:bg-white/15 hover:text-white/70 transition-all"
          >
            <span className="material-icons text-xs">refresh</span>
            <span>Regenerate</span>
          </button>
        )}
      </div>
    </div>
  )
}
