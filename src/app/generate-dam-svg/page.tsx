'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface ImageState {
  x: number
  y: number
  width: number
  height: number
}

interface EditPoint {
  x: number
  y: number
  relativeX: number
  relativeY: number
}

export default function Generate3DVisualizationPage() {
  // Store images separately for 2D and 3D modes
  const [images, setImages] = useState<{
    '2d': { imageUrl: string; svgCode: string; contentType: 'svg' | 'image' | '' };
    '3d': { imageUrl: string; svgCode: string; contentType: 'svg' | 'image' | '' };
  }>({
    '2d': { imageUrl: '', svgCode: '', contentType: '' },
    '3d': { imageUrl: '', svgCode: '', contentType: '' }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generationTime, setGenerationTime] = useState(0)

  // Edit mode state
  const [editMode, setEditMode] = useState(false)
  const [editPoint, setEditPoint] = useState<EditPoint | null>(null)
  const [editText, setEditText] = useState('')
  const [editHistory, setEditHistory] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Visualization mode state (2d or 3d)
  const [visualizationMode, setVisualizationMode] = useState<'2d' | '3d'>('3d')

  // Computed values for current mode
  const currentImage = images[visualizationMode]
  const svgCode = currentImage.svgCode
  const imageUrl = currentImage.imageUrl
  const contentType = currentImage.contentType

  // Drag and resize state - full screen by default
  const [imageState, setImageState] = useState<ImageState>({
    x: 20,
    y: 20,
    width: typeof window !== 'undefined' ? window.innerWidth - 40 : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight - 80 : 700
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const generateDamImage = async () => {
    setLoading(true)
    setError('')
    const startTime = Date.now()

    try {
      const response = await fetch('/api/generate-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: visualizationMode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      // Store the generated image for the current mode
      if (data.type === 'image' && data.image) {
        setImages(prev => ({
          ...prev,
          [visualizationMode]: {
            imageUrl: data.image,
            svgCode: '',
            contentType: 'image' as const
          }
        }))
      } else if (data.svg) {
        setImages(prev => ({
          ...prev,
          [visualizationMode]: {
            imageUrl: '',
            svgCode: data.svg,
            contentType: 'svg' as const
          }
        }))
      }

      setGenerationTime((Date.now() - startTime) / 1000)

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setImageState({
          x: 20,
          y: 60,
          width: rect.width - 40,
          height: rect.height - 100
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      setIsResizing(true)
    } else {
      setIsDragging(true)
    }
    setDragStart({ x: e.clientX - imageState.x, y: e.clientY - imageState.y })
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setImageState(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }))
    } else if (isResizing) {
      const newWidth = Math.max(300, e.clientX - imageState.x)
      const newHeight = Math.max(200, e.clientY - imageState.y)
      setImageState(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    const relativeX = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const relativeY = Math.round(((e.clientY - rect.top) / rect.height) * 100)

    setEditPoint({ x, y, relativeX, relativeY })
    setEditText('')
  }

  const submitEdit = async () => {
    if (!editText.trim() || !editPoint) return

    const editInstruction = `At position (${editPoint.relativeX}%, ${editPoint.relativeY}%): ${editText}`
    setEditHistory(prev => [...prev, editInstruction])

    setLoading(true)
    setEditPoint(null)
    setEditText('')
    const startTime = Date.now()

    try {
      const allEdits = [...editHistory, editInstruction].join('\n- ')

      const response = await fetch('/api/generate-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: visualizationMode,
          edits: allEdits
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      // Store the generated image for the current mode
      if (data.type === 'image' && data.image) {
        setImages(prev => ({
          ...prev,
          [visualizationMode]: {
            imageUrl: data.image,
            svgCode: '',
            contentType: 'image' as const
          }
        }))
      } else if (data.svg) {
        setImages(prev => ({
          ...prev,
          [visualizationMode]: {
            imageUrl: '',
            svgCode: data.svg,
            contentType: 'svg' as const
          }
        }))
      }

      setGenerationTime((Date.now() - startTime) / 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditPoint(null)
    setEditText('')
  }

  const clearEditHistory = () => {
    setEditHistory([])
  }

  const saveAsTemplate = async () => {
    if (!imageUrl) {
      setSaveMessage('No image to save')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    setSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/save-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageUrl,
          filename: 'scada-template.png'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      setSaveMessage('Template saved to public/images/scada-template.png')
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(''), 5000)
    }
  }

  return (
    <div
      className="h-screen w-screen bg-gradient-to-br from-sky-100 via-blue-50 to-green-50 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={containerRef}
    >
      {/* Landscape Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sky */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-sky-200 via-sky-100 to-transparent"></div>

        {/* Sun */}
        <div className="absolute top-16 right-20 w-24 h-24 bg-yellow-200 rounded-full opacity-60 blur-sm"></div>
        <div className="absolute top-16 right-20 w-20 h-20 bg-yellow-100 rounded-full opacity-80"></div>

        {/* Clouds */}
        <div className="absolute top-20 left-[10%] flex space-x-1">
          <div className="w-16 h-8 bg-white rounded-full opacity-70"></div>
          <div className="w-20 h-10 bg-white rounded-full opacity-70 -mt-2"></div>
          <div className="w-14 h-7 bg-white rounded-full opacity-70"></div>
        </div>
        <div className="absolute top-32 left-[30%] flex space-x-1">
          <div className="w-12 h-6 bg-white rounded-full opacity-60"></div>
          <div className="w-16 h-8 bg-white rounded-full opacity-60 -mt-1"></div>
          <div className="w-10 h-5 bg-white rounded-full opacity-60"></div>
        </div>
        <div className="absolute top-24 right-[40%] flex space-x-1">
          <div className="w-14 h-7 bg-white rounded-full opacity-50"></div>
          <div className="w-18 h-9 bg-white rounded-full opacity-50 -mt-1"></div>
          <div className="w-12 h-6 bg-white rounded-full opacity-50"></div>
        </div>

        {/* Mountains */}
        <div className="absolute bottom-0 left-0 right-0 h-64">
          <svg viewBox="0 0 1920 300" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,300 L0,200 Q200,100 400,180 Q600,80 800,150 Q1000,60 1200,140 Q1400,70 1600,160 Q1800,90 1920,180 L1920,300 Z" fill="#94a3b8" opacity="0.3"/>
            <path d="M0,300 L0,220 Q150,140 300,200 Q500,120 700,190 Q900,100 1100,180 Q1300,110 1500,190 Q1700,130 1920,200 L1920,300 Z" fill="#64748b" opacity="0.3"/>
            <path d="M0,300 L0,250 Q100,200 250,240 Q400,190 600,230 Q800,180 1000,220 Q1200,170 1400,210 Q1600,160 1800,200 Q1900,180 1920,220 L1920,300 Z" fill="#22c55e" opacity="0.25"/>
          </svg>
        </div>

        {/* Trees */}
        <div className="absolute bottom-0 left-0 w-32 h-48">
          <svg viewBox="0 0 100 150" className="w-full h-full">
            <ellipse cx="30" cy="100" rx="25" ry="40" fill="#166534" opacity="0.4"/>
            <ellipse cx="60" cy="110" rx="30" ry="35" fill="#15803d" opacity="0.35"/>
            <ellipse cx="15" cy="120" rx="20" ry="25" fill="#14532d" opacity="0.3"/>
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-40 h-56">
          <svg viewBox="0 0 120 180" className="w-full h-full">
            <ellipse cx="90" cy="130" rx="30" ry="45" fill="#166534" opacity="0.4"/>
            <ellipse cx="50" cy="140" rx="35" ry="40" fill="#15803d" opacity="0.35"/>
            <ellipse cx="100" cy="150" rx="25" ry="30" fill="#14532d" opacity="0.3"/>
          </svg>
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-green-300/40 to-transparent"></div>
      </div>

      {/* Control Panel */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        {/* 2D/3D Toggle Switch */}
        <div className="flex items-center bg-white/90 rounded-lg shadow-lg border border-slate-200 p-1">
          <button
            onClick={() => setVisualizationMode('2d')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              visualizationMode === '2d'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-icons text-base">grid_on</span>
            <span>2D</span>
          </button>
          <button
            onClick={() => setVisualizationMode('3d')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              visualizationMode === '3d'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-icons text-base">view_in_ar</span>
            <span>3D</span>
          </button>
        </div>

        <button
          onClick={generateDamImage}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all shadow-lg ${
            loading
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-xl hover:shadow-blue-300/50 hover:scale-105'
          }`}
        >
          {loading ? (
            <>
              <span className="material-icons animate-spin text-base">refresh</span>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span className="material-icons text-base">{visualizationMode === '2d' ? 'grid_on' : 'view_in_ar'}</span>
              <span>Generate {visualizationMode.toUpperCase()} Dam</span>
            </>
          )}
        </button>

        {(svgCode || imageUrl) && (
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all shadow-lg ${
              editMode
                ? 'bg-orange-500 text-white'
                : 'bg-white/90 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="material-icons text-base">{editMode ? 'edit_off' : 'edit'}</span>
          </button>
        )}

        {editHistory.length > 0 && (
          <button
            onClick={clearEditHistory}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-white/90 text-slate-600 hover:bg-slate-100 transition-all shadow-lg border border-slate-200"
          >
            <span className="material-icons text-base">history</span>
            <span className="text-xs">{editHistory.length}</span>
          </button>
        )}

        {imageUrl && (
          <button
            onClick={saveAsTemplate}
            disabled={saving}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all shadow-lg ${
              saving
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl hover:shadow-green-300/50'
            }`}
          >
            {saving ? (
              <>
                <span className="material-icons animate-spin text-base">refresh</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-icons text-base">save</span>
                <span>Save as Template</span>
              </>
            )}
          </button>
        )}

        {(svgCode || imageUrl) && (
          <span className="text-green-600 flex items-center text-sm bg-white/90 px-3 py-2 rounded-lg shadow-lg border border-slate-200">
            <span className="material-icons text-base mr-1">check_circle</span>
            {generationTime.toFixed(1)}s
          </span>
        )}

        <Link
          href="/cstps-pipeline"
          className="flex items-center space-x-1 bg-white/90 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all shadow-lg border border-slate-200"
        >
          <span className="material-icons text-base">arrow_back</span>
          <span>Back</span>
        </Link>
      </div>

      {/* Main Area */}
      <main className="relative z-10 h-full w-full">
        {/* Initial State */}
        {!svgCode && !imageUrl && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 flex items-center justify-center mb-6 mx-auto">
                <span className="material-icons text-5xl text-blue-500">
                  {visualizationMode === '2d' ? 'grid_on' : 'view_in_ar'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Generate {visualizationMode.toUpperCase()} IRAI Dam
              </h2>
              <p className="text-slate-600 mb-6 max-w-md">
                {visualizationMode === '2d'
                  ? 'Click the button above to generate a flat 2D schematic diagram using Google Gemini.'
                  : 'Click the button above to generate a realistic 3D visualization using Google Gemini.'}
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-base">open_with</span>
                  <span>Drag to move</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-base">aspect_ratio</span>
                  <span>Corner to resize</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
              <div className="relative mx-auto mb-6">
                <div className="w-32 h-32 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-icons text-4xl text-blue-500 animate-pulse">
                    {visualizationMode === '2d' ? 'grid_on' : 'water'}
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Creating {visualizationMode.toUpperCase()} Dam Visualization
              </h2>
              <p className="mt-2 text-blue-600">Gemini AI is rendering...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6 mx-auto">
                <span className="material-icons text-4xl text-red-500">error_outline</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Generation Failed</h2>
              <p className="text-red-500 mb-6">{error}</p>
              <button
                onClick={generateDamImage}
                className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 mx-auto"
              >
                <span className="material-icons">refresh</span>
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {/* Image Display */}
        {(svgCode || imageUrl) && !loading && (
          <div
            className={`absolute select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              left: imageState.x,
              top: imageState.y,
              width: imageState.width,
              height: imageState.height,
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="w-full h-full rounded-xl overflow-hidden border-2 border-blue-300/60 shadow-2xl shadow-blue-200/50 bg-white">
              <div
                className={`w-full h-full flex items-center justify-center overflow-hidden relative bg-slate-50 ${
                  editMode ? 'cursor-crosshair' : ''
                }`}
                onClick={handleImageClick}
              >
                {contentType === 'image' && imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Generated IRAI Dam Visualization"
                    className="max-w-full max-h-full object-contain"
                    draggable={false}
                  />
                ) : svgCode ? (
                  <div dangerouslySetInnerHTML={{ __html: svgCode }} />
                ) : null}

                {editMode && (
                  <div className="absolute inset-0 bg-orange-500/10 pointer-events-none flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-lg border border-orange-300 shadow-lg">
                      <span className="text-orange-600 text-sm flex items-center">
                        <span className="material-icons text-base mr-2">touch_app</span>
                        Click anywhere to edit
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center"
              style={{ transform: 'translate(50%, 50%)' }}
            >
              <div className="w-4 h-4 rounded-sm bg-blue-500 border-2 border-white shadow-lg"></div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      {editPoint && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80"
          style={{
            left: Math.min(editPoint.x, window.innerWidth - 340),
            top: Math.min(editPoint.y + 10, window.innerHeight - 200),
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="material-icons text-orange-500">edit_location</span>
              <span className="text-slate-800 font-medium">Edit Area</span>
            </div>
            <span className="text-xs text-slate-500">
              ({editPoint.relativeX}%, {editPoint.relativeY}%)
            </span>
          </div>

          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Describe what you want to change..."
            className="w-full h-24 bg-slate-50 text-slate-800 text-sm rounded-lg p-3 border border-slate-200 focus:border-blue-400 focus:outline-none resize-none placeholder-slate-400"
            autoFocus
          />

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={cancelEdit}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all text-sm"
            >
              <span className="material-icons text-base">close</span>
              <span>Cancel</span>
            </button>
            <button
              onClick={submitEdit}
              disabled={!editText.trim()}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                editText.trim()
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="material-icons text-base">auto_fix_high</span>
              <span>Apply</span>
            </button>
          </div>
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${
          saveMessage.includes('saved')
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="material-icons text-base">
              {saveMessage.includes('saved') ? 'check_circle' : 'error'}
            </span>
            <span>{saveMessage}</span>
          </div>
        </div>
      )}

      {/* Edit History */}
      {editHistory.length > 0 && (
        <div className="fixed top-16 right-4 z-30 bg-white/95 backdrop-blur-sm rounded-lg border border-slate-200 p-3 max-w-xs shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="material-icons text-blue-500 text-sm">history</span>
            <span className="text-xs text-slate-600 font-medium">Edit History</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {editHistory.map((edit, index) => (
              <div key={index} className="text-[10px] text-slate-600 bg-slate-50 rounded px-2 py-1">
                {index + 1}. {edit.length > 50 ? edit.substring(0, 50) + '...' : edit}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="fixed bottom-2 left-1/2 -translate-x-1/2 z-20 text-center px-4 py-1 text-[10px] text-slate-500 bg-white/60 rounded-full backdrop-blur-sm border border-slate-200">
        Version 2.3 | January 21, 2026 | fluxio
      </footer>
    </div>
  )
}
