# SCADA 3D View Skill

## Overview
This skill provides a 3D isometric visualization of the IRAI Dam to CSTPS water supply system with animated overlays for water flow, ripples, and live sensor data.

## Static Template Image
- Path: `public/images/scada-3d-template.png`
- Served at: `/images/scada-3d-template.png`
- Format: PNG
- Style: 3D isometric landscape with sky, mountains, trees, and industrial structures

## Visual Components

### Background Elements (Static Image)
1. **IRAI DAM** (Left side)
   - Large concrete dam wall
   - Blue water reservoir behind dam
   - Hills and terrain around dam
   - 6 outlet pipes emerging from dam

2. **6 PIPELINES** (Center)
   - 6 parallel metallic blue pipes
   - Running from dam to CSTPS reservoir
   - Flow transmitters mounted on each pipe

3. **CSTPS RESERVOIR** (Center-right)
   - Large water storage tank
   - Blue water inside
   - Industrial structure

4. **CHANDRAPUR SUPER THERMAL POWER STATION** (Right)
   - 4 cooling towers with steam
   - Industrial buildings
   - Electrical transmission towers

### Animated Overlays (CSS/SVG)

#### 1. Water Flow Animation
- Cyan particles moving through 6 pipelines
- Direction: Left to right (dam to reservoir)
- Speed varies based on live flow rate
- Glow effect on particles

Pipeline overlay positions:
- L-01: top ~42%, height range 42-44%
- L-02: ~47%
- L-03: ~52%
- L-04: ~57%
- L-05: ~62%
- L-06: ~67% (bottom pipe)

#### 2. Water Ripple Animation
- Dam reservoir: Expanding circular ripples
- CSTPS reservoir: Wave motion on water surface
- Subtle opacity animation

#### 3. Smoke/Steam Animation
- Rising from 4 cooling towers
- White/gray gradient
- Fade out effect at top
- Drift motion

### Interactive Overlays

#### Flow Transmitter (FT) Indicators
6 clickable FT value displays:
- FT-001 through FT-006
- Position: Centered on each flow transmitter in image
- Display: Live flow rate value (m3/h)
- Status LED: Green (online), Yellow (warning), Red (offline)
- Click action: Navigate to `/cstps-pipeline/{pipeId}` detail page

FT overlay positions (approximate % from left, top):
- FT-001: 38%, 42%
- FT-002: 38%, 47%
- FT-003: 38%, 52%
- FT-004: 38%, 57%
- FT-005: 38%, 62%
- FT-006: 38%, 67%

## Page Integration
- File: `src/app/cstps-pipeline/page.tsx`
- Toggle: 2D/3D view switcher in header
- Default view: 3D (P&ID diagram)
- 3D template view: Uses static image with animated overlays

## Data Source
- Live data from: `@/lib/cstps-data` (cstpsPipes array)
- Parameters displayed:
  - flowRate (m3/h)
  - velocity (m/s)
  - status (online/warning/offline)

## CSS Animation Keyframes
```css
@keyframes flowRight {
  0% { transform: translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

@keyframes ripple {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes smokeRise {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
}
```

## Usage
1. Navigate to `/cstps-pipeline`
2. Click "3D" toggle button in header to switch to 3D template view
3. View animated water flow through pipelines
4. Click on any FT value to navigate to detail page

## Testing
1. Verify static template image loads
2. Check water flow animations are visible
3. Verify water ripples on reservoirs
4. Test smoke animation on cooling towers
5. Click each FT indicator to verify navigation
6. Check live data updates in FT displays

## Version
- Version: 2.3
- Date: January 21, 2026
- Repository: flownexus
