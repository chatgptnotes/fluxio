import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, type, edits } = await request.json()

    // Use provided apiKey or fall back to environment variable
    const geminiKey = apiKey || process.env.GEMINI_API_KEY

    if (!geminiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required. Set GEMINI_API_KEY in .env.local or provide it in the request.' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiKey)

    // Choose prompt based on type
    let prompt: string
    if (type === 'realistic-dam' || type === '3d') {
      prompt = getRealisticDamPrompt()
    } else if (type === '2d') {
      prompt = get2DVisualizationPrompt()
    } else {
      prompt = getPipelinePrompt()
    }

    // Add edits to prompt if provided
    if (edits) {
      prompt += `

IMPORTANT MODIFICATIONS REQUESTED:
The user has requested the following specific changes to the image:
- ${edits}

Please incorporate ALL of the above modifications while maintaining the overall SCADA infographic style and layout.`
    }

    if (type === 'realistic-dam' || type === '3d' || type === '2d') {
      // Use image generation model for dam visualization
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
            type: 'image'
          })
        }
      }

      // Fallback to text response
      const responseText = response.text()
      return NextResponse.json({ svg: responseText, type: 'text' })
    } else {
      // Use text model for SVG generation
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      // Extract SVG from response
      let svgCode = responseText
      const svgMatch = responseText.match(/<svg[\s\S]*<\/svg>/i)
      if (svgMatch) {
        svgCode = svgMatch[0]
      }

      svgCode = svgCode.trim()
      return NextResponse.json({ svg: svgCode, type: 'svg' })
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate SVG' },
      { status: 500 }
    )
  }
}

function getRealisticDamPrompt(): string {
  return `
Create a CLEAN TEMPLATE image showing the water supply system from IRAI DAM to CHANDRAPUR SUPER THERMAL POWER STATION (CSTPS) in isometric 3D style set in a beautiful natural outdoor landscape.

=== CRITICAL TEXT/LABEL REQUIREMENTS ===
*** THIS IMAGE MUST HAVE ONLY 3 TEXT LABELS - NO OTHER TEXT ALLOWED ***

THE ONLY 3 LABELS ALLOWED IN THIS IMAGE:
1. "IRAI DAM" - displayed on the dam structure
2. "CSTPS RESERVOIR" - displayed on the reservoir tank
3. "CHANDRAPUR SUPER THERMAL POWER STATION" - displayed on the power plant

*** DO NOT INCLUDE ANY OF THE FOLLOWING TEXT/LABELS ***
- NO water level percentages (no "LEVEL: 85%" or similar)
- NO pipeline labels (no L-01, L-02, L-03, L-04, L-05, L-06)
- NO flow transmitter labels (no FT-001, FT-002, etc.)
- NO GPM readings or flow rates
- NO "NIVUS 750" labels
- NO capacity percentages (no "CAPACITY: 78%")
- NO building labels (no "COOLING TOWERS", "TURBINE HALL", "COAL YARD")
- NO megawatt ratings (no "2340 MW")
- NO data panels or dashboards
- NO "SCADA MONITORING ACTIVE" text
- NO timestamps
- NO "ONLINE" indicators
- NO status dots or indicator lights
- NO numerical values of any kind except in the 3 allowed labels

STYLE: Clean industrial illustration in a natural outdoor environment with light blue sky and green landscape. NOT a dark blueprint. This is a TEMPLATE image for future overlays.

THE COMPLETE SYSTEM MUST SHOW (LEFT TO RIGHT):

1. IRAI DAM AND RESERVOIR (Left side):
   - Large water reservoir with blue gradient water (#0277BD to #29B6F6)
   - Concrete gravity dam wall with 6 outlet gates
   - Dam structure in gray concrete (#546e7a)
   - ONLY LABEL: "IRAI DAM" in white text on the dam wall
   - 6 outlet pipes emerging from the dam wall
   - Show water surface with ripple/glow effect
   - NO water level indicators or percentages

2. SIX PARALLEL PIPELINES (Center):
   - 6 separate parallel pipelines running horizontally
   - All 6 pipes shown in dark blue (#01579B) with metallic sheen
   - All 6 pipes clearly visible, evenly spaced, and parallel
   - Blue water flow visible inside pipes (glowing cyan #00E5FF)
   - NO labels on any pipeline (no L-01 through L-06)

3. SIX FLOW TRANSMITTERS (One per pipeline):
   - 6 circular instrument devices mounted on pipelines
   - One transmitter at the center of each pipeline
   - Show as circular instruments with housings
   - NO labels, NO "NIVUS 750" text, NO GPM readings
   - NO digital displays showing numbers
   - NO status indicator dots

4. CSTPS RESERVOIR (Center-right):
   - Large industrial water storage reservoir/tank
   - Rectangular concrete structure with water inside
   - ONLY LABEL: "CSTPS RESERVOIR" on the tank
   - 6 inlet connections from the 6 pipelines
   - Show water surface with blue glow
   - NO capacity percentages

5. CHANDRAPUR SUPER THERMAL POWER STATION (Right side):
   - Large thermal power plant complex
   - 3-4 cooling towers with steam rising
   - Main power plant building
   - Coal storage yard area
   - Smoke stacks/chimneys
   - Electrical transmission towers
   - ONLY LABEL: "CHANDRAPUR SUPER THERMAL POWER STATION" on the facility
   - NO sub-labels for buildings (no "COOLING TOWERS", "TURBINE HALL", etc.)
   - NO megawatt ratings

6. NO DATA PANEL:
   - DO NOT include any data panel
   - DO NOT include any dashboard
   - DO NOT include any readings display
   - DO NOT include any status indicators

7. VISUAL STYLE:
   - Light outdoor scene with natural sky (NOT dark blueprint)
   - Realistic blue water in reservoir and dam
   - Gray concrete structures
   - Metallic blue/silver pipes
   - Isometric 3D perspective (30 degree angle)
   - Professional industrial aesthetic in outdoor setting
   - Clean, uncluttered appearance suitable as a template

8. LANDSCAPE AND NATURAL ENVIRONMENT:
   - Sky: Light blue gradient sky with white fluffy clouds at the top
   - Mountains: Distant mountain range behind the dam (blue-gray silhouettes)
   - Hills: Green rolling hills surrounding the reservoir and power plant
   - Trees: Groups of trees scattered around the facilities
   - Grass: Green grass fields around all structures
   - Ground: Natural terrain with grass and earth tones
   - Natural sunlight illumination from above

COLOR PALETTE:
- Sky: #87CEEB to #E0F7FA (light blue gradient)
- Clouds: #FFFFFF, #F5F5F5
- Mountains: #607D8B, #78909C (blue-gray distant)
- Hills/Grass: #4CAF50, #8BC34A, #66BB6A (greens)
- Trees: #2E7D32, #388E3C, #43A047 (forest greens)
- Ground: #8D6E63, #A1887F (earth tones)
- Water: #0277BD, #29B6F6, #4FC3F7 (bright blue)
- Concrete: #546e7a, #78909c, #90a4ae
- Pipes: #01579B, #1565C0, #455a64
- Labels: #FFFFFF (white) for the 3 allowed labels

=== FINAL CHECKLIST (VERIFY BEFORE GENERATING) ===
[ ] ONLY 3 text labels exist: "IRAI DAM", "CSTPS RESERVOIR", "CHANDRAPUR SUPER THERMAL POWER STATION"
[ ] NO other text, numbers, percentages, or labels anywhere
[ ] Light blue sky with clouds visible at top
[ ] Green hills and grass around the structures
[ ] Trees/forest visible around facilities
[ ] Mountains visible in the distance
[ ] 6 separate parallel pipelines visible (NO labels on them)
[ ] 6 flow transmitters visible (NO labels, NO readings on them)
[ ] NO data panel or dashboard anywhere in the image
[ ] Clean template appearance suitable for overlay graphics

Create a CLEAN TEMPLATE industrial illustration showing water transmission from IRAI DAM through 6 pipelines with 6 flow transmitters to CSTPS thermal power station reservoir. The image must have ONLY 3 TEXT LABELS and NO other text, numbers, or indicators. This will serve as a static background template.
`
}

function get2DVisualizationPrompt(): string {
  return `
Create a beautiful BIRD'S EYE VIEW / AERIAL VIEW 2D INFOGRAPHIC illustration showing the water supply system from IRAI DAM to CHANDRAPUR SUPER THERMAL POWER STATION (CSTPS). This should be a modern, clean infographic style viewed from directly above like a drone or satellite view.

=== AERIAL VIEW INFOGRAPHIC STYLE ===
- BIRD'S EYE VIEW perspective (looking straight down from above)
- Like a Google Maps satellite view or drone aerial photography
- Modern flat 2D infographic design
- Clean, professional, visually appealing illustration
- Soft gradients and colors for visual appeal
- Show the entire system layout from above
- Green landscape/terrain visible around structures
- Roads, paths, and infrastructure visible from above

=== CRITICAL TEXT/LABEL REQUIREMENTS ===
*** THIS IMAGE MUST HAVE ONLY 3 TEXT LABELS ***

THE ONLY 3 LABELS ALLOWED:
1. "IRAI DAM" - on the dam/reservoir area
2. "CSTPS RESERVOIR" - on the reservoir tank
3. "CHANDRAPUR SUPER THERMAL POWER STATION" - on the power plant complex

*** NO OTHER TEXT ALLOWED ***
- NO percentages, NO numbers, NO equipment labels
- NO pipeline labels, NO flow rates, NO data panels

=== AERIAL LAYOUT (LEFT TO RIGHT) ===

1. IRAI DAM AND RESERVOIR (Left side - 25% of image):
   - Large blue water body seen from above (irregular natural lake shape)
   - Dam wall as a curved or straight line across the water outlet
   - Concrete dam structure visible from top
   - 6 outlet gates/pipes emerging from the dam
   - Label: "IRAI DAM" floating above the reservoir
   - Surrounding green terrain, trees, hills visible from above
   - Water appears as bright blue with subtle texture

2. SIX PIPELINES (Center - 35% of image):
   - 6 parallel pipelines running horizontally across green terrain
   - Pipelines seen from above as 6 parallel lines
   - Dark blue/teal colored pipe routes
   - Cutting through green landscape
   - 6 circular flow meter stations on the pipes (one per pipeline)
   - Flow meters appear as small circles from above
   - Pipeline corridor with cleared land around it

3. CSTPS RESERVOIR (Center-right - 15% of image):
   - Large circular or rectangular water tank seen from above
   - Blue water visible inside the tank
   - Tank walls/edges clearly visible
   - Label: "CSTPS RESERVOIR" floating above
   - 6 pipeline connections entering the tank
   - Positioned RIGHT NEXT TO the power station
   - Concrete pad/foundation visible around it

4. CHANDRAPUR SUPER THERMAL POWER STATION (Right side - 25% of image):
   - Large industrial complex seen from above
   - 4 circular cooling towers (seen as circles from above with steam)
   - Main buildings as rectangular shapes from above
   - Coal storage yard (dark rectangular area)
   - Turbine hall building
   - Electrical switchyard with transmission lines
   - Label: "CHANDRAPUR SUPER THERMAL POWER STATION"
   - Roads and infrastructure connecting buildings
   - Adjacent to the CSTPS Reservoir

=== COLOR PALETTE FOR AERIAL INFOGRAPHIC ===
- Background/Terrain: Green landscape (#4CAF50, #81C784, #A5D6A7)
- Water bodies: Vibrant blue (#2196F3, #03A9F4, #00BCD4)
- Dam structure: Gray/concrete (#78909C, #90A4AE)
- Pipelines: Dark blue/teal lines (#0097A7, #00838F)
- Flow meters: Cyan circles (#00E5FF)
- Reservoir tank: Steel blue circle/rectangle (#546E7A)
- Power station buildings: Gray rectangles (#455A64, #37474F)
- Cooling towers: Light gray circles (#CFD8DC, #ECEFF1)
- Coal yard: Dark brown/black (#3E2723, #212121)
- Roads: Light gray lines (#BDBDBD)
- Labels: White text with dark shadow for visibility

=== VISUAL STYLE DETAILS ===
- Aerial/satellite view perspective (straight down)
- Like an illustrated map or infographic map
- Green terrain with texture (fields, trees as dots)
- Clean vector-style graphics
- Professional infographic aesthetic
- Suitable for presentations or control rooms
- Modern corporate visual style
- Clear flow direction from left to right
- Shadows beneath structures for depth

=== FINAL CHECKLIST ===
[ ] BIRD'S EYE VIEW / AERIAL perspective (looking down from above)
[ ] Beautiful 2D infographic map style
[ ] Green terrain/landscape visible
[ ] IRAI DAM with blue water reservoir on the left
[ ] 6 parallel pipelines crossing the terrain
[ ] 6 flow meters as circles on the pipelines
[ ] CSTPS RESERVOIR as circular/rectangular tank (next to power station)
[ ] CHANDRAPUR SUPER THERMAL POWER STATION complex on the right
[ ] Cooling towers appear as circles from above
[ ] Buildings appear as rectangles from above
[ ] ONLY 3 text labels visible
[ ] NO other text, numbers, or data displays
[ ] Clean, professional aerial infographic

Create a stunning AERIAL VIEW 2D INFOGRAPHIC showing the water system from above: IRAI DAM reservoir on the left, 6 pipelines crossing green terrain with 6 flow meters, leading to CSTPS RESERVOIR which is positioned right next to CHANDRAPUR SUPER THERMAL POWER STATION on the right. Bird's eye view, beautiful colors, professional infographic style with ONLY 3 labels.
`
}

function getPipelinePrompt(): string {
  return `
Create a complete industrial SCADA P&ID (Piping and Instrumentation Diagram) SVG for a gravity-fed water transmission system from IRAI DAM to CSTPS RESERVOIR.

CRITICAL: Output ONLY valid SVG code. No markdown, no explanation. Start with <svg and end with </svg>.

SVG SPECIFICATIONS:
- ViewBox: "0 0 1000 550"
- Background: Light gray (#FAFAFA) with subtle grid pattern

REQUIRED ELEMENTS (LEFT TO RIGHT):

1. IRAI DAM (Left side, x: 0-140):
   - Water reservoir: Blue shape (#0277BD to #29B6F6 gradient)
   - Dam wall: Vertical gray bar at x=120
   - 6 outlet ports at Y positions: 130, 188, 246, 304, 362, 420
   - "IRAI DAM" label box at top
   - Animated water ripples

2. SIX HORIZONTAL PIPELINES (x: 138-880):
   - 6 parallel pipes at Y positions: 130, 188, 246, 304, 362, 420
   - Dark outline (#263238, 18px) with blue fill (#01579B, 14px)
   - Pipe labels: L-01 through L-06
   - Animated flow particles (#00E5FF)

3. CONTROL VALVES (CV-01 to CV-06) at x: ~220:
   - Bowtie shape, green (#4CAF50) when open
   - Actuator circle above
   - Labels below

4. FLOW TRANSMITTERS (FT-001 to FT-006) at x: ~420:
   - Circle symbol with blue border
   - "FT" text inside
   - Digital display showing flow rate

5. CSTPS RESERVOIR (Right side, x: 880-970):
   - Rectangular tank with green border
   - Water fill with animated surface
   - Level markings
   - "CSTPS RESERVOIR" label

6. LEGEND BOX (Bottom):
   - Symbols for all elements
   - Status indicators

Include gradients, filters, and smooth animations.

Remember: Output ONLY the complete SVG code.
`
}

export async function GET() {
  return NextResponse.json({
    message: 'POST with { type: "realistic-dam" } for 3D dam or no type for pipeline diagram'
  })
}
