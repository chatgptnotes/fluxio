# IRAI Dam SCADA Visualization Skill

## Overview
This skill documents the static IRAI Dam SCADA visualization with CSS animation overlays for the FluxIO IIoT platform.

## Static Image Location
- Path: `public/images/irai-dam-scada.png`
- Served at: `/images/irai-dam-scada.png`
- Format: PNG (recommended for SCADA diagrams)

## Page Location
- Route: `/generate-dam-svg`
- File: `src/app/generate-dam-svg/page.tsx`

## Animation Component
- File: `src/components/DamAnimationOverlay.tsx`

### Animation Features

#### 1. Water Flow Animation (6 Pipelines)
- Animated cyan particles moving left-to-right
- 3-second cycle per animation
- Multiple particle layers for continuous flow effect
- Glow effects with box-shadow

Pipeline positions (percentage from top):
- L-01: 18%
- L-02: 28%
- L-03: 38%
- L-04: 48%
- L-05: 58%
- L-06: 68%

#### 2. Water Ripple Animation
- Dam reservoir (left side): subtle wave ripples
- CSTPS reservoir (center): wave animation on water surface
- CSS transform with Y movement and background animation

#### 3. Smoke Animation (Cooling Towers)
- 3 cooling tower positions
- Multiple smoke plumes per tower
- White/gray gradient with fade-out
- Randomized timing for natural effect

## Transmitter Overlays
Clickable overlays for flow transmitters:
- FT-001 through FT-006
- Shows flow rate in GPM
- Status indicators (online/warning/offline)
- Hover tooltips with details
- Click navigates to transmitter detail page

## Controls
- **Animations On/Off**: Toggle button to enable/disable all animations
- **Layers Toggle**: Show/hide transmitter overlays
- **Drag & Resize**: Image can be dragged and resized

## Usage Instructions

### Adding the Static Image
1. Generate the perfect IRAI Dam SCADA visualization using AI
2. Take a screenshot or save the generated image
3. Save to: `public/images/irai-dam-scada.png`
4. Refresh the page at `/generate-dam-svg`

### Customizing Animation Positions
Edit `src/components/DamAnimationOverlay.tsx` to adjust:
- `pipelinePositions`: Array of pipeline Y coordinates and X ranges
- `coolingTowerPositions`: Array of cooling tower X/Y positions
- `reservoirPositions`: Object with dam and CSTPS reservoir bounds

### CSS Animation Keyframes
- `flowRight`: Particle movement through pipes
- `flowPulse`: Glow pulsing effect
- `ripple`: Water surface movement
- `waveMotion`: Horizontal wave movement
- `smokeRise`: Vertical smoke rise with fade
- `smokeDrift`: Horizontal smoke drift

## Testing
1. Navigate to: http://localhost:3002/generate-dam-svg
2. Verify static image loads
3. Check animations are visible:
   - Cyan flow through pipelines
   - Water ripples on reservoirs
   - Smoke rising from cooling towers
4. Test animation toggle button
5. Test transmitter overlay clicks

## Version
- Version: 1.9
- Date: January 21, 2026
- Repository: fluxio
