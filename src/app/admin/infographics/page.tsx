'use client'

import { useState } from 'react'

interface InfographicState {
  page1: { imageUrl: string; loading: boolean; error: string }
  page2: { imageUrl: string; loading: boolean; error: string }
}

export default function InfographicsPage() {
  const [state, setState] = useState<InfographicState>({
    page1: { imageUrl: '', loading: false, error: '' },
    page2: { imageUrl: '', loading: false, error: '' }
  })
  const [generationTime, setGenerationTime] = useState<{ page1: number; page2: number }>({
    page1: 0,
    page2: 0
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const generateInfographic = async (page: 1 | 2) => {
    const pageKey = `page${page}` as 'page1' | 'page2'

    setState(prev => ({
      ...prev,
      [pageKey]: { ...prev[pageKey], loading: true, error: '' }
    }))

    const startTime = Date.now()

    try {
      const response = await fetch('/api/generate-infographic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate infographic')
      }

      if (data.type === 'image' && data.image) {
        setState(prev => ({
          ...prev,
          [pageKey]: { imageUrl: data.image, loading: false, error: '' }
        }))
        setGenerationTime(prev => ({
          ...prev,
          [pageKey]: (Date.now() - startTime) / 1000
        }))
      } else {
        throw new Error(data.error || 'No image generated. Try again.')
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          loading: false,
          error: err instanceof Error ? err.message : 'An error occurred'
        }
      }))
    }
  }

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateBoth = async () => {
    await Promise.all([
      generateInfographic(1),
      generateInfographic(2)
    ])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FlowNexus Infographics</h1>
          <p className="text-gray-600 mt-1">
            Generate professional presentation infographics using Gemini AI
          </p>
        </div>
        <button
          onClick={generateBoth}
          disabled={state.page1.loading || state.page2.loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            state.page1.loading || state.page2.loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-200'
          }`}
        >
          <span className="material-icons">auto_awesome</span>
          Generate Both Pages
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="material-icons text-blue-600">info</span>
          <div>
            <h3 className="font-medium text-blue-900">About Infographic Generation</h3>
            <p className="text-sm text-blue-700 mt-1">
              These infographics are generated using Google Gemini 3.0 image generation API.
              Each generation takes approximately 15-30 seconds. The images are optimized for
              presentation slides (1080x1920 portrait orientation). Page 1 now includes
              multi-protocol support visualization (Modbus, DNP3, OPC UA, MQTT, and more).
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page 1 Card */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Page 1: FlowNexus Overview</h2>
                <p className="text-sm text-gray-600">Platform features and protocol support</p>
              </div>
              <span className="material-icons text-3xl text-blue-500">hub</span>
            </div>
          </div>

          <div className="p-4">
            {/* Content Preview */}
            <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm">
              <h4 className="font-medium text-gray-700 mb-2">Content includes:</h4>
              <ul className="space-y-1 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  FlowNexus hero branding and tagline
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  Protocol hub diagram (8 protocols)
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  Modbus RTU, Modbus TCP, DNP3, IEC 61850
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  OPC UA, MQTT, BACnet, SNMP
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  6 key features with icons
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  Tech stack and performance metrics
                </li>
              </ul>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => generateInfographic(1)}
              disabled={state.page1.loading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                state.page1.loading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {state.page1.loading ? (
                <>
                  <span className="material-icons animate-spin">refresh</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-icons">auto_awesome</span>
                  Generate Page 1
                </>
              )}
            </button>

            {/* Error Display */}
            {state.page1.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="material-icons text-sm">error</span>
                  <span className="text-sm">{state.page1.error}</span>
                </div>
              </div>
            )}

            {/* Generated Image Preview */}
            {state.page1.imageUrl && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                    Generated in {generationTime.page1.toFixed(1)}s
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedImage(state.page1.imageUrl)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span className="material-icons text-sm">fullscreen</span>
                      View
                    </button>
                    <button
                      onClick={() => downloadImage(state.page1.imageUrl, 'flownexus-overview-infographic.png')}
                      className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <span className="material-icons text-sm">download</span>
                      Download
                    </button>
                  </div>
                </div>
                <div
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedImage(state.page1.imageUrl)}
                >
                  <img
                    src={state.page1.imageUrl}
                    alt="FlowNexus Overview Infographic"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page 2 Card */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Page 2: FlowNexus vs Traditional</h2>
                <p className="text-sm text-gray-600">Comparison with traditional SCADA</p>
              </div>
              <span className="material-icons text-3xl text-gray-500">compare</span>
            </div>
          </div>

          <div className="p-4">
            {/* Content Preview */}
            <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm">
              <h4 className="font-medium text-gray-700 mb-2">Content includes:</h4>
              <ul className="space-y-1 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  Split comparison visual
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  7-row feature comparison table
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  4 advantage pillars
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-icons text-xs text-green-500">check_circle</span>
                  ROI statistics callout
                </li>
              </ul>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => generateInfographic(2)}
              disabled={state.page2.loading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                state.page2.loading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              {state.page2.loading ? (
                <>
                  <span className="material-icons animate-spin">refresh</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-icons">auto_awesome</span>
                  Generate Page 2
                </>
              )}
            </button>

            {/* Error Display */}
            {state.page2.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="material-icons text-sm">error</span>
                  <span className="text-sm">{state.page2.error}</span>
                </div>
              </div>
            )}

            {/* Generated Image Preview */}
            {state.page2.imageUrl && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                    Generated in {generationTime.page2.toFixed(1)}s
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedImage(state.page2.imageUrl)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span className="material-icons text-sm">fullscreen</span>
                      View
                    </button>
                    <button
                      onClick={() => downloadImage(state.page2.imageUrl, 'flownexus-comparison-infographic.png')}
                      className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <span className="material-icons text-sm">download</span>
                      Download
                    </button>
                  </div>
                </div>
                <div
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedImage(state.page2.imageUrl)}
                >
                  <img
                    src={state.page2.imageUrl}
                    alt="FlowNexus vs Traditional SCADA Infographic"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="material-icons text-blue-600">help_outline</span>
          How to Use These Infographics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="material-icons text-blue-600">slideshow</span>
            </div>
            <h4 className="font-medium text-gray-800">Presentations</h4>
            <p className="text-sm text-gray-600">
              Add to PowerPoint, Google Slides, or Keynote for investor pitches and sales decks.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="material-icons text-green-600">print</span>
            </div>
            <h4 className="font-medium text-gray-800">Print Materials</h4>
            <p className="text-sm text-gray-600">
              Use in brochures, flyers, and trade show materials. PNG format is print-ready.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="material-icons text-purple-600">web</span>
            </div>
            <h4 className="font-medium text-gray-800">Digital Marketing</h4>
            <p className="text-sm text-gray-600">
              Share on social media, embed in website, or include in email campaigns.
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
            >
              <span className="material-icons">close</span>
            </button>
            <img
              src={selectedImage}
              alt="Infographic Preview"
              className="max-w-full h-auto rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4">
        <p className="text-xs text-gray-400">
          FlowNexus v1.7 | February 19, 2026 | flownexus
        </p>
      </footer>
    </div>
  )
}
