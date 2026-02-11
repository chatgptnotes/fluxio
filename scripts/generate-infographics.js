/**
 * Generate Flow Meter Infographic Images using Gemini 3.0 Pro Image Preview
 *
 * Usage: node scripts/generate-infographics.js
 *
 * Requires GEMINI_API_KEY in .env.local
 */

const fs = require('fs')
const path = require('path')

// Load env from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) envVars[match[1].trim()] = match[2].trim()
})

const API_KEY = envVars.GEMINI_API_KEY
if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not found in .env.local')
  process.exit(1)
}

const MODEL = 'gemini-3-pro-image-preview'
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'infographics')

const flowMeters = [
  {
    id: 'ultrasonic',
    name: 'Ultrasonic Flow Meter',
    prompt:
      'Create a professional technical infographic illustration of an ultrasonic flow meter. Show a detailed cross-section of a pipe with two ultrasonic transducers mounted on opposite sides. Visualize sound wave paths traveling diagonally through flowing liquid, showing the transit-time measurement principle. Include labeled arrows for flow direction and signal paths. Dark navy background with glowing cyan and blue neon lines. Digital twin aesthetic with clean wireframe style. Technical schematic look. High quality, 16:9 wide format. No text overlays.',
  },
  {
    id: 'electromagnetic',
    name: 'Electromagnetic Flow Meter',
    prompt:
      'Create a professional technical infographic illustration of an electromagnetic flow meter (mag meter). Show a pipe cross-section with magnetic coils on top and bottom creating a magnetic field perpendicular to fluid flow. Show electrodes on the sides measuring the induced voltage. Visualize electromagnetic induction with field lines. Dark navy background with glowing purple and magenta neon elements. Digital twin aesthetic with clean wireframe style. Technical schematic look. High quality, 16:9 wide format. No text overlays.',
  },
  {
    id: 'coriolis',
    name: 'Coriolis Mass Flow Meter',
    prompt:
      'Create a professional technical infographic illustration of a Coriolis mass flow meter. Show U-shaped or omega-shaped vibrating measurement tubes with fluid flowing through them. Visualize the Coriolis effect causing tube twist proportional to mass flow rate. Show vibration drivers and sensors. Dark navy background with glowing green and teal neon elements. Digital twin aesthetic with clean wireframe style. Technical schematic look. High quality, 16:9 wide format. No text overlays.',
  },
  {
    id: 'vortex',
    name: 'Vortex Flow Meter',
    prompt:
      'Create a professional technical infographic illustration of a vortex flow meter. Show a pipe with a bluff body (shedder bar) creating alternating von Karman vortices downstream. Visualize the vortex street pattern with swirling fluid elements. Show a piezoelectric sensor detecting vortex frequency. Dark navy background with glowing orange and amber neon elements. Digital twin aesthetic with clean wireframe style. Technical schematic look. High quality, 16:9 wide format. No text overlays.',
  },
  {
    id: 'turbine',
    name: 'Turbine Flow Meter',
    prompt:
      'Create a professional technical infographic illustration of a turbine flow meter. Show a pipe with a multi-blade rotor/turbine inside, with fluid flow spinning the blades. Visualize a magnetic pickup coil detecting blade passage for RPM measurement. Show flow streamlines around the rotor blades. Dark navy background with glowing red and warm coral neon elements. Digital twin aesthetic with clean wireframe style. Technical schematic look. High quality, 16:9 wide format. No text overlays.',
  },
  {
    id: 'differential-pressure',
    name: 'Differential Pressure Flow Meter',
    prompt:
      'Create a professional technical infographic illustration of a differential pressure flow meter with an orifice plate. Show a pipe with a concentric orifice plate restriction, with upstream and downstream pressure taps connected to a DP transmitter. Visualize pressure profile along the pipe showing Bernoulli principle. Show vena contracta and pressure recovery zones. Dark navy background with glowing gold and yellow neon elements. Digital twin aesthetic with clean wireframe style. Technical schematic look. High quality, 16:9 wide format. No text overlays.',
  },
]

async function generateImage(meter) {
  console.log(`\nGenerating: ${meter.name}...`)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

  const body = {
    contents: [
      {
        parts: [
          {
            text: `Generate an image: ${meter.prompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`  API error ${response.status}: ${errorText.substring(0, 300)}`)
    return false
  }

  const data = await response.json()

  if (data.candidates && data.candidates[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || 'image/png'
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png'
        const outputPath = path.join(OUTPUT_DIR, `${meter.id}.${ext}`)
        fs.writeFileSync(
          outputPath,
          Buffer.from(part.inlineData.data, 'base64')
        )
        console.log(`  Saved: public/images/infographics/${meter.id}.${ext}`)
        return true
      }
    }
  }

  console.error(`  No image data returned for ${meter.id}`)
  return false
}

async function main() {
  console.log('=== Flow Meter Infographic Generator ===')
  console.log(`Model: ${MODEL}`)
  console.log(`Output: ${OUTPUT_DIR}`)
  console.log(`Generating ${flowMeters.length} infographics...`)

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  let success = 0
  let failed = 0

  for (const meter of flowMeters) {
    const result = await generateImage(meter)
    if (result) {
      success++
    } else {
      failed++
    }
    // Delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  console.log(`\n=== Generation Complete ===`)
  console.log(`Success: ${success}/${flowMeters.length}`)
  if (failed > 0) {
    console.log(`Failed: ${failed}/${flowMeters.length}`)
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
  console.log(`\nGenerated files:`)
  files.forEach((f) => console.log(`  - public/images/infographics/${f}`))
}

main().catch(console.error)
