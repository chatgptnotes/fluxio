'use client'

import { useEffect, useState } from 'react'

interface DamAnimationOverlayProps {
  enabled: boolean
  imageWidth: number
  imageHeight: number
}

// Pipeline positions (percentage based, matching the SCADA image layout)
const pipelinePositions = [
  { id: 'L-01', y: 18, xStart: 25, xEnd: 75 },
  { id: 'L-02', y: 28, xStart: 25, xEnd: 75 },
  { id: 'L-03', y: 38, xStart: 25, xEnd: 75 },
  { id: 'L-04', y: 48, xStart: 25, xEnd: 75 },
  { id: 'L-05', y: 58, xStart: 25, xEnd: 75 },
  { id: 'L-06', y: 68, xStart: 25, xEnd: 75 },
]

// Cooling tower positions for smoke effects
const coolingTowerPositions = [
  { id: 'CT-1', x: 82, y: 35 },
  { id: 'CT-2', x: 86, y: 35 },
  { id: 'CT-3', x: 90, y: 35 },
]

// Reservoir positions for ripple effects
const reservoirPositions = {
  dam: { x: 8, y: 45, width: 15, height: 30 },
  cstps: { x: 55, y: 75, width: 20, height: 15 },
}

export default function DamAnimationOverlay({ enabled, imageWidth: _imageWidth, imageHeight: _imageHeight }: DamAnimationOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !enabled) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* CSS Animation Definitions */}
      <style jsx>{`
        /* Water flow animation - particles moving through pipes */
        @keyframes flowRight {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes flowPulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        /* Water ripple animation */
        @keyframes ripple {
          0% {
            transform: translateX(0) scaleY(1);
          }
          25% {
            transform: translateX(2px) scaleY(1.02);
          }
          50% {
            transform: translateX(0) scaleY(1);
          }
          75% {
            transform: translateX(-2px) scaleY(0.98);
          }
          100% {
            transform: translateX(0) scaleY(1);
          }
        }

        @keyframes waveMotion {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        /* Smoke rising animation */
        @keyframes smokeRise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-30px) scale(1.5);
            opacity: 0.4;
          }
          100% {
            transform: translateY(-60px) scale(2);
            opacity: 0;
          }
        }

        @keyframes smokeDrift {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(10px);
          }
          100% {
            transform: translateX(0);
          }
        }

        .water-flow {
          animation: flowRight 3s linear infinite;
        }

        .water-flow-delayed-1 {
          animation: flowRight 3s linear infinite;
          animation-delay: -1s;
        }

        .water-flow-delayed-2 {
          animation: flowRight 3s linear infinite;
          animation-delay: -2s;
        }

        .flow-glow {
          animation: flowPulse 2s ease-in-out infinite;
        }

        .water-ripple {
          animation: ripple 2s ease-in-out infinite, waveMotion 4s linear infinite;
        }

        .smoke-plume {
          animation: smokeRise 4s ease-out infinite, smokeDrift 3s ease-in-out infinite;
        }

        .smoke-plume-delayed-1 {
          animation: smokeRise 4.5s ease-out infinite, smokeDrift 3.5s ease-in-out infinite;
          animation-delay: -1.5s;
        }

        .smoke-plume-delayed-2 {
          animation: smokeRise 5s ease-out infinite, smokeDrift 4s ease-in-out infinite;
          animation-delay: -2.5s;
        }
      `}</style>

      {/* Water Flow Animations - 6 Pipelines */}
      {pipelinePositions.map((pipeline, index) => (
        <div
          key={pipeline.id}
          className="absolute"
          style={{
            left: `${pipeline.xStart}%`,
            top: `${pipeline.y}%`,
            width: `${pipeline.xEnd - pipeline.xStart}%`,
            height: '8px',
            transform: 'translateY(-50%)',
          }}
        >
          {/* Pipeline glow effect */}
          <div
            className="absolute inset-0 rounded-full flow-glow"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.2), transparent)',
              animationDelay: `${index * 0.3}s`,
            }}
          />

          {/* Flow particles - multiple for continuous effect */}
          <div
            className="absolute inset-y-0 w-16 water-flow"
            style={{
              background: 'linear-gradient(90deg, transparent, #00E5FF, #00E5FF, transparent)',
              borderRadius: '4px',
              boxShadow: '0 0 10px #00E5FF, 0 0 20px rgba(0, 229, 255, 0.5)',
              animationDelay: `${index * 0.5}s`,
            }}
          />
          <div
            className="absolute inset-y-0 w-12 water-flow-delayed-1"
            style={{
              background: 'linear-gradient(90deg, transparent, #4FC3F7, #4FC3F7, transparent)',
              borderRadius: '4px',
              boxShadow: '0 0 8px #4FC3F7',
              animationDelay: `${index * 0.5 + 1}s`,
            }}
          />
          <div
            className="absolute inset-y-0 w-10 water-flow-delayed-2"
            style={{
              background: 'linear-gradient(90deg, transparent, #00BCD4, #00BCD4, transparent)',
              borderRadius: '4px',
              boxShadow: '0 0 6px #00BCD4',
              animationDelay: `${index * 0.5 + 2}s`,
            }}
          />
        </div>
      ))}

      {/* Dam Reservoir Ripples */}
      <div
        className="absolute water-ripple"
        style={{
          left: `${reservoirPositions.dam.x}%`,
          top: `${reservoirPositions.dam.y}%`,
          width: `${reservoirPositions.dam.width}%`,
          height: `${reservoirPositions.dam.height}%`,
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 229, 255, 0.1) 30%, rgba(0, 188, 212, 0.15) 50%, rgba(0, 229, 255, 0.1) 70%, transparent 100%)',
          backgroundSize: '200% 100%',
          borderRadius: '4px',
        }}
      />

      {/* CSTPS Reservoir Ripples */}
      <div
        className="absolute water-ripple"
        style={{
          left: `${reservoirPositions.cstps.x}%`,
          top: `${reservoirPositions.cstps.y}%`,
          width: `${reservoirPositions.cstps.width}%`,
          height: `${reservoirPositions.cstps.height}%`,
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 229, 255, 0.08) 40%, rgba(0, 188, 212, 0.12) 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          borderRadius: '4px',
          animationDelay: '-1s',
        }}
      />

      {/* Cooling Tower Smoke Effects */}
      {coolingTowerPositions.map((tower, index) => (
        <div
          key={tower.id}
          className="absolute"
          style={{
            left: `${tower.x}%`,
            top: `${tower.y}%`,
            width: '20px',
            height: '60px',
            transform: 'translate(-50%, -100%)',
          }}
        >
          {/* Multiple smoke plumes per tower for fuller effect */}
          <div
            className="absolute bottom-0 left-1/2 w-4 h-4 smoke-plume"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(200,200,200,0.3) 50%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              animationDelay: `${index * 0.7}s`,
            }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-3 h-3 smoke-plume-delayed-1"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(180,180,180,0.2) 50%, transparent 70%)',
              borderRadius: '50%',
              animationDelay: `${index * 0.7 + 0.5}s`,
            }}
          />
          <div
            className="absolute bottom-0 left-2/3 w-3 h-3 smoke-plume-delayed-2"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(160,160,160,0.15) 50%, transparent 70%)',
              borderRadius: '50%',
              animationDelay: `${index * 0.7 + 1}s`,
            }}
          />
        </div>
      ))}

      {/* Animation Status Indicator */}
      <div className="absolute bottom-2 right-2 flex items-center space-x-1 bg-[#0D1B2A]/80 backdrop-blur-sm rounded-full px-2 py-1">
        <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></span>
        <span className="text-[8px] text-[#00E5FF] font-medium">ANIMATIONS ACTIVE</span>
      </div>
    </div>
  )
}
