import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { imageData, filename } = await request.json()

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Extract base64 data from data URL
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Ensure the public/images directory exists
    const imagesDir = path.join(process.cwd(), 'public', 'images')
    await mkdir(imagesDir, { recursive: true })

    // Save the file
    const outputFilename = filename || 'scada-template.png'
    const filePath = path.join(imagesDir, outputFilename)
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      message: `Template saved successfully as ${outputFilename}`,
      path: `/images/${outputFilename}`
    })
  } catch (error) {
    console.error('Save template error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save template' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST with { imageData: "base64 data URL", filename: "optional-name.png" } to save template'
  })
}
