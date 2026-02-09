# SCADA 2D Bird's Eye View Skill

## Overview
This skill implements a 2D bird's eye view / aerial visualization of the IRAI Dam to CSTPS water supply system using a template background image with interactive overlays.

## Template Image
- File: `/public/images/scada-2d-template.png`
- Source: Custom designed aerial/satellite-style view
- Aspect Ratio: 16:9 (paddingBottom: 56.25%)

## Visual Layout
The template shows a top-down aerial view with:

### Left Side (0-20%)
- **IRAI DAM** water reservoir
- Blue water body with irregular lake shape
- Dam wall structure at the outlet

### Center (20-65%)
- **6 Pipelines** running diagonally from dam to reservoir
- Dark blue/teal colored pipe routes
- Green terrain/landscape visible
- Roads and infrastructure

### Center-Right (50-70%)
- **CSTPS RESERVOIR** - Circular water tank
- Blue water visible inside
- 6 pipeline connections entering

### Right Side (70-100%)
- **CHANDRAPUR SUPER THERMAL POWER STATION**
- 4 circular cooling towers (2x2 grid)
- Main power plant buildings
- Industrial infrastructure

## Interactive Features

### FT Value Overlays
Positioned at flow meter locations on each pipeline:
```javascript
const ftPositions2D = [
  { left: 47, top: 35 },   // FT-001 - top pipeline
  { left: 44, top: 41 },   // FT-002
  { left: 41, top: 47 },   // FT-003
  { left: 38, top: 53 },   // FT-004
  { left: 35, top: 59 },   // FT-005
  { left: 32, top: 65 },   // FT-006 - bottom pipeline
]
```

Each FT box displays:
- FT label (FT-001 to FT-006)
- Flow rate value with unit (m3/h)
- Status LED (green/yellow/red)
- Hover tooltip with additional details (velocity, water level)
- Click to navigate to detail page

### Animations

#### Water Ripple - Dam Reservoir
- Position: left 2%, top 15%, width 18%, height 55%
- Water shimmer effect with gradient animation
- Concentric ripple circles

#### Water Ripple - CSTPS Reservoir
- Position: left 52%, top 28%, width 14%, height 28%
- Circular ripples in the round reservoir
- Wave animation effect

#### Smoke - Cooling Towers
4 cooling towers with smoke animations:
```javascript
const towerPositions2D = [
  { left: 82, top: 18 },  // Top-left tower
  { left: 90, top: 18 },  // Top-right tower
  { left: 82, top: 32 },  // Bottom-left tower
  { left: 90, top: 32 },  // Bottom-right tower
]
```
- Multiple smoke layers with radial gradients
- smokeRise and smokeDrift animations

### Overlay Displays

#### Total Flow (Bottom-Left)
- Dark background with cyan border
- Shows sum of all pipe flow rates
- Large font for visibility

#### Status Summary (Bottom-Right)
- Online count (green)
- Warning count (yellow)
- Offline count (red)
- Compact horizontal layout

## Color Palette
- Background/Terrain: Green (#4CAF50, #81C784)
- Water bodies: Blue (#2196F3, #03A9F4)
- Pipelines: Dark blue/teal (visible in template)
- FT boxes: Dark navy (#0D1B2A) with cyan border (#00ACC1)
- Flow values: Cyan (#00E5FF)
- Status LEDs: Green (#4CAF50), Yellow (#FFC107), Red (#F44336)
- Cooling towers: Light gray with white smoke

## CSS Animations Used
- `ripple` - Expanding circles for water
- `wave` - Horizontal wave movement
- `waterShimmer` - Gradient shimmer effect
- `smokeRise` - Vertical smoke rise
- `smokeDrift` - Horizontal smoke drift
- `pulse` - Status LED pulsing

## Usage
1. Navigate to `/cstps-pipeline`
2. Click the "2D" toggle button in the header
3. View switches to bird's eye aerial perspective
4. Hover over FT boxes for additional sensor details
5. Click any FT box to navigate to detailed sensor page

## Page Integration
- File: `src/app/cstps-pipeline/page.tsx`
- View mode: `viewMode === '2d'`
- Uses same state management as 3D view (hoveredPipe, router)
- Responsive design with aspect ratio container

## Differences from 3D View
| Feature | 2D View | 3D View |
|---------|---------|---------|
| Perspective | Top-down aerial | Isometric 3D |
| Template | scada-2d-template.png | scada-3d-template.png |
| FT Positions | Diagonal line pattern | Scattered based on 3D terrain |
| Cooling Towers | 2x2 grid, top-right | Horizontal row |
| Water Animation | Circular ripples | Elongated ripples |

## Version
- Version: 2.9
- Date: January 22, 2026
- Repository: flownexus
