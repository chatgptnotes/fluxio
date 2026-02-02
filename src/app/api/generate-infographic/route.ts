import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, page } = await request.json()

    // Use provided apiKey or fall back to environment variable
    const geminiKey = apiKey || process.env.GEMINI_API_KEY

    if (!geminiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required. Set GEMINI_API_KEY in .env.local or provide it in the request.' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiKey)

    // Choose prompt based on page number
    let prompt: string
    if (page === 1) {
      prompt = getPage1Prompt()
    } else if (page === 2) {
      prompt = getPage2Prompt()
    } else {
      return NextResponse.json(
        { error: 'Invalid page number. Use 1 or 2.' },
        { status: 400 }
      )
    }

    // Use image generation model
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      } as any
    })

    const result = await model.generateContent(prompt)
    const response = result.response
    const parts = response.candidates?.[0]?.content?.parts || []

    // Look for image in response
    for (const part of parts) {
      if ((part as any).inlineData) {
        const inlineData = (part as any).inlineData
        return NextResponse.json({
          image: `data:${inlineData.mimeType};base64,${inlineData.data}`,
          type: 'image',
          page
        })
      }
    }

    // If no image, return text response
    const responseText = response.text()
    return NextResponse.json({
      text: responseText,
      type: 'text',
      page,
      error: 'Image generation did not produce an image. Try again or check API quota.'
    })

  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate infographic' },
      { status: 500 }
    )
  }
}

function getPage1Prompt(): string {
  return `
Create a professional, visually stunning infographic for FluxIO cloud SCADA platform.

=== DESIGN SPECIFICATIONS ===
- Style: Modern, clean, corporate design with professional gradients
- Primary Color: Deep Blue (#2563EB) with accents of Cyan (#06B6D4)
- Secondary Colors: White, Light Gray (#F3F4F6), Dark Blue (#1E3A8A)
- Layout: Portrait orientation, optimized for 1080x1920 pixels presentation slide
- Font Style: Clean sans-serif, bold headers, readable body text
- Overall Aesthetic: Tech startup, modern SaaS, enterprise software

=== CONTENT TO INCLUDE ===

**HEADER SECTION (Top 12%)**
- Large title: "FluxIO" in bold blue gradient
- Tagline below: "Next-Gen Cloud SCADA for Industrial Flow Monitoring"
- Subtitle: "Real-Time. Cloud-Native. Multi-Protocol."
- Include subtle cloud/water iconography in background

**HERO VISUAL (12-28%)**
- Modern isometric or flat illustration showing:
  - Cloud servers with connected industrial devices
  - Flow meters, pipelines, water treatment visuals
  - Data flowing to cloud dashboard
  - Mobile and desktop devices showing dashboards

**PROTOCOL SUPPORT SECTION (28-45%)**
Central hub diagram with FluxIO at center, protocols radiating outward:
- Title: "Universal Protocol Gateway"
- Show 8 protocol icons in a circular/hub arrangement:

1. Modbus RTU (orange) - "RS-485 Serial"
2. Modbus TCP/IP (blue) - "Ethernet"
3. DNP3 (green) - "SCADA Secure"
4. IEC 61850 (purple) - "Power Grid"
5. OPC UA (teal) - "Industry 4.0"
6. MQTT (cyan) - "IoT Messaging"
7. BACnet (yellow) - "Building Automation"
8. SNMP (red) - "Network Monitoring"

Each protocol should have a small colored icon/badge connected to central FluxIO hub

**KEY FEATURES GRID (45-72%)**
Six feature boxes arranged in 2x3 grid, each with icon and description:

1. Real-Time Monitoring
   - Icon: Live pulse/heartbeat monitor
   - Text: "WebSocket updates with <500ms latency"

2. Multi-Device Support
   - Icon: Connected devices network
   - Text: "100+ concurrent Nivus flow transmitters"

3. Protocol Translation
   - Icon: Bi-directional arrows / converter
   - Text: "Seamless conversion between protocols"

4. Automated Alerts
   - Icon: Bell with warning badge
   - Text: "High/low/zero flow, offline detection"

5. Multi-Company
   - Icon: Building/organization chart
   - Text: "Multi-tenant with role-based access"

6. Edge Processing
   - Icon: Microchip/gateway
   - Text: "Local compute, cloud sync"

**TECH STACK STRIP (72-82%)**
Horizontal strip showing tech logos/badges:
- Next.js + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Realtime)
- Teltonika TRB245/TRB246 Gateways
- Nivus Flow Transmitters

**PERFORMANCE STATS BAR (82-92%)**
Four metric badges in a horizontal row:
- "<200ms API Response"
- "8+ Protocols Supported"
- "99.9% Uptime"
- "Zero Servers to Manage"

**FOOTER (92-100%)**
- FluxIO logo small
- Website: fluxio.work
- "One Platform. Every Protocol."

=== VISUAL STYLE GUIDELINES ===
- Use depth and shadows for modern card-based design
- Include subtle gradient backgrounds (blue to cyan)
- Color-code each protocol consistently
- Icons should be outlined or filled flat style
- Use whitespace effectively for readability
- Include subtle grid or dot pattern in background
- Professional, enterprise-ready appearance
- No cartoon or childish elements
- Clean data visualization aesthetic

=== IMPORTANT ===
- All text must be crisp and readable
- Protocol hub diagram should be visually prominent
- Use proper visual hierarchy
- Balance between visuals and text
- Corporate presentation quality
- Suitable for boardroom or investor presentation
`
}

function getPage2Prompt(): string {
  return `
Create a professional comparison infographic: FluxIO Cloud vs Traditional SCADA Systems.

=== DESIGN SPECIFICATIONS ===
- Style: Split-screen comparison design, modern corporate
- Left Side: Gray tones (#6B7280, #9CA3AF) representing Traditional SCADA (old, complex)
- Right Side: Blue gradient (#2563EB, #06B6D4) representing FluxIO (modern, simple)
- Layout: Portrait orientation, optimized for 1080x1920 pixels presentation slide
- Font Style: Clean sans-serif, bold headers
- Overall Aesthetic: Before/After transformation, clear contrast

=== CONTENT TO INCLUDE ===

**HEADER (Top 10%)**
- Title: "Why Choose FluxIO Over Traditional SCADA?"
- Subtitle: "Modernize Your Industrial Monitoring"

**SPLIT COMPARISON VISUAL (10-35%)**
Left Side (Traditional - Gray/Dated):
- Server room with racks, cables, complexity
- IT staff maintaining hardware
- VPN connection icons, firewalls
- Label: "Traditional SCADA"

Right Side (FluxIO - Blue/Modern):
- Clean cloud icon, mobile devices
- Simple, elegant dashboard
- Anywhere access icons
- Label: "FluxIO Cloud"

**COMPARISON TABLE (35-70%)**
Side-by-side comparison table with 6 rows:

| Aspect | Traditional SCADA | FluxIO Cloud |
|--------|-------------------|--------------|
| Infrastructure | On-premise servers, VPNs, firewalls | Zero hardware, cloud-hosted |
| Access | Office network only, VPN required | Any device, anywhere, anytime |
| Scaling | Hardware upgrades, downtime | Automatic, zero-downtime |
| Maintenance | IT staff, manual updates | Automatic updates, managed |
| Security | Perimeter-based, manual patches | TLS 1.3, RLS, auto-patching |
| Updates | Manual deployment windows | CI/CD, instant rollouts |

Use X marks (red) for Traditional negatives
Use checkmarks (green) for FluxIO positives

**FOUR ADVANTAGE PILLARS (70-85%)**
Four boxes with icons at bottom:

1. No Server Room
   - Icon: Server with X or cloud replacing server
   - Text: "Cloud-native eliminates infrastructure"

2. Mobile Access
   - Icon: Smartphone with dashboard
   - Text: "Responsive web app on any device"

3. Real-Time Alerts
   - Icon: Bell with notification
   - Text: "Email + WebSocket instant notifications"

4. Multi-Protocol
   - Icon: Hub with connections
   - Text: "Modbus, DNP3, OPC UA, MQTT support"

**KEY BENEFITS BOX (85-92%)**
Highlighted box with key statistics:
- "Zero IT maintenance overhead"
- "Instant global accessibility"
- "8+ industrial protocols supported"
- Use green/blue gradient background
- Bold, impactful typography

**FOOTER CTA (92-100%)**
- "Modernize Your SCADA Today"
- Website: fluxio.work
- Include QR code placeholder area
- FluxIO logo

=== VISUAL STYLE GUIDELINES ===
- Clear visual contrast between old (gray) and new (blue)
- Use icons consistently throughout
- Red X for negatives, Green checkmarks for positives
- Professional business presentation quality
- Include subtle data visualization elements
- Modern gradient backgrounds
- Card-based design with shadows
- Corporate, investor-presentation ready

=== IMPORTANT ===
- The comparison must be visually obvious at a glance
- Traditional SCADA should look complex/outdated
- FluxIO should look simple/modern
- All text must be readable
- Professional enterprise aesthetic
- Suitable for sales presentations
`
}

export async function GET() {
  return NextResponse.json({
    message: 'POST with { page: 1 } for FluxIO overview with protocol support, or { page: 2 } for comparison infographic'
  })
}
