
# PinSeeker Web - Development Log

## Version: V7.9.2 (Navigation & Flow)
**Date:** 2024-05-30
**Branch:** `main`
**Status:** ✅ RELEASED

### Features
- **Quick Exit Navigation**: Added a **Home** button to the top-left control stack in both **Play Round** and **Course Editor** modes.
  - Allows users to quickly exit the immersive view to adjust global settings (like Bag setup) or switch tasks without using browser back buttons multiple times.
  - Game state is automatically preserved via the existing temp-storage mechanism, allowing seamless resumption.

## Version: V7.9.1 (Measurement & Interactions)
**Date:** 2024-05-30
**Branch:** `main`
**Status:** ✅ RELEASED

### Features
- **GPS Measurement Button**: Added a dedicated **"MY LOC"** button in Measurement Mode.
  - Previously, Measurement Mode always started from the *last recorded shot*. Users can now instantly snap the start point to their *current physical location* to measure layup distances from where they are standing.
- **Annotation Interactions**:
  - **Eraser Tool**: Added a dedicated Eraser tool (Red Icon) to the Annotation Toolbar. When selected, tapping any annotation (Text, Flag, or Drawing) deletes it immediately.
  - **Pointer Events**: Refactored map event handling to support `PointerEvent`, ensuring consistent "Long Press" and "Click" behavior across Android, iOS, and Desktop touchscreens.
- **Multi-Touch Fix**: 
  - Fixed an issue where pinch-zooming (two fingers) would accidentally place a measurement point or manual ball drop. The app now detects multi-touch gestures and invalidates click events until the fingers are lifted.

## Version: V7.9.0 (Precision & Privacy)
**Date:** 2024-05-29
**Branch:** `main`
**Status:** ✅ RELEASED

### Features
- **Feedback 2.0 (Privacy Focused)**: Replaced the external email link with an integrated **In-App Feedback Form**.
  - Users can now submit bugs, suggestions, or course data issues directly within the app via a modal.
  - Supports **anonymous submission** (email field is optional).
  - Data is structured to be sent to the operations team (`Mypinseeker@gmail.com`).
- **Course Editor Precision**:
  - **Deep Zoom**: Increased maximum map zoom level from 19 to **22**. This allows for ultra-precise placement of markers on specific tee boxes or green tiers.
  - **Draggable Markers**: Tee and Green icons are now draggable in edit mode. Users can drag them to refine positions pixel-by-pixel instead of relying solely on clicks.

### Fixes
- **Measurement Mode Coordinates**: Fixed a critical bug where clicking on the map in Measurement Mode resulted in a target point offset from the finger/cursor location.
  - **Root Cause**: The CSS `transform: rotate()` used for the dynamic camera view was interfering with Leaflet's default coordinate projection.
  - **Fix**: Implemented a calibrated inverse transformation matrix in `RotatedMapHandler` to map screen pixels accurately back to map coordinates, regardless of rotation or scale.

## Version: V7.8.0 (Shot Undo & Refinement)
**Date:** 2024-05-28
**Branch:** `main`
**Status:** ✅ RELEASED

### Features
- **Shot Deletion / Undo**: Added the ability to correct mistakes during a round.
  - **Interaction**: Long-press (mobile) or Right-click (desktop) on any past shot marker (yellow dots) to bring up the delete dialog.
  - **Logic**: Deleting the most recent shot acts as an "Undo" function, resetting the player's current ball position and shot count to the state before that shot was taken. Deleting older shots removes them from the scorecard history.
- **User Manual Update**: comprehensively updated the manual to include instructions for the new Course Editor, Measurement Mode, Wind Compass, and Shot Undo features.

## Version: V7.7.2 (Course Editor Overhaul)
**Date:** 2024-05-28
**Branch:** `main`
**Status:** ✅ RELEASED

### Features
- **Full Course Visualization**: The Course Editor now renders all 18 holes simultaneously. Users can see the entire course layout, hole-to-hole flow, and distances at a glance.
- **Visual Cues**:
  - **Connection Lines**: Dashed lines connect Tee to Green (White for active hole, Yellow for recorded history).
  - **Direction Arrows**: Added directional markers to visual lines to indicate the line of play clearly.
  - **Info Labels**: Floating labels display Hole #, Par, and Distance for every recorded hole on the map.
- **Ergonomic UI Redesign**:
  - **Compact Control Panel**: Reduced the height of the editor's bottom panel by ~40% to maximize map visibility.
  - **Integrated Par Controls**: Par adjustment is now directly accessible in the header.
- **Pre-Save Verification**: Added a "Course Summary" modal that appears before finishing. It provides a table view of all holes to verify Par and Distances, and calculates the total course stats automatically.

## Version: V7.6.0 (Visual Wind Vane)
**Date:** 2024-05-28
**Branch:** `main`
**Status:** ✅ RELEASED

### Features
- **Visual Wind Vane Control**: Replaced the abstract wind direction slider with an interactive, visual compass interface.
  - **Compass Ring**: A 360-degree interactive ring. Tap or drag to set wind direction relative to the screen/shot.
  - **True North Indicator**: A red "N" indicator rotates dynamically with the map, helping players maintain orientation relative to geographic North.
  - **Flow Arrow**: A central blue arrow visualizes the wind flow direction (e.g., pointing up = downwind/tailwind, pointing down = into the wind).

## Version: V7.5.0 (Rangefinder Mode)
**Date:** 2024-05-28
**Branch:** `main`
**Status:** ✅ RELEASED

### Features
- **Measurement Mode (Rangefinder)**: Added a dedicated mode to measure distances on the map.
  - **New Interface**: A distinct Blue Ruler icon is now available in the top-right control stack (separate from other controls for visibility).
  - **Interaction**: Tapping the map in this mode sets a measurement target point.
  - **Visuals**: Displays a solid blue line from the ball to the target, and a white dashed line from the target to the green.
  - **Data**: The bottom control panel transforms to show large, readable distances ("Distance" and "Remaining") when active.
  - **GPS Integration**: The measurement starts from the current `ballPos`. Users can use the GPS long-press feature to update their ball position to their physical location before measuring.

## Version: V7.4.0 (Simplified UI & Smart GPS)
**Date:** 2024-05-28
**Branch:** `main`

### Features
- **UI Simplification**: Refactored the bottom control panel to a strict 1:1 split layout for better visual balance.
  - **Colors**: Reduced color palette to Greyscale + White + Emerald Green for a cleaner, professional look.
  - **Typography**: Improved legibility with consistent font sizes and spacing.
- **Dual-Function GPS Button**: 
  - **Short Press (Tap)**: Records the current location as the landing spot (Shot result).
  - **Long Press (>800ms)**: Updates the *Starting* position (Tee box) to the current GPS location. Includes haptic feedback (vibration) for confirmation.
- **Ergonomics**: 
  - Optimized the Club Selector overlay to maximize touch target size.
  - Removed redundant "REC" text, favoring clear iconography.

## Version: V7.3.0 (UI/UX Refinement & Ergonomics)
**Date:** 2024-05-28
**Branch:** `main`

### Features
- **Map Visibility**: Removed the bulky "Projected Outcome" panel. Key statistics (Total Carry, Leaves Distance, Rec. Club) are now displayed in a **transparent overlay bar** at the very bottom of the screen to minimize map obstruction.
- **Visual Guides**: Added a dashed **Guide Line** connecting the predicted landing zone to the green.
  - Includes a floating label at the 1/3 mark showing the exact "Leaves" distance to the pin.
- **Control Layout**: Reorganized the bottom control area:
  - **Aim Slider**: Moved to a dedicated row above the main controls.
  - **Action Row**: Club Selector and GPS Record button are now side-by-side for easier one-handed access.

## Version: V7.2.0 (Strategy & Visual Overhaul)
**Date:** 2024-05-28
**Branch:** `main`

### Features
- **Strategy Visualization**: Replaced curved lines in the active round view with a cleaner **Straight Line + Directional Arrow** design. This simplifies the view when planning shots.
- **Dispersion Analysis (Plan vs. Actual)**: 
  - The app now records the *planned* dispersion ellipse at the moment a shot is confirmed.
  - **Replay Mode** now renders this "Planned Dispersion" (as a dashed yellow circle) alongside the actual shot result. This allows players to visually verify if their shot landed within their expected margin of error.

### Fixes
- **Map Interaction**: Fixed a frustration where pinch-to-zoom gestures on touch devices would accidentally trigger the "Long Press" manual drop logic. Added multi-touch detection to cancel the drop timer.
- **Club Editor UI**: Resized the Dispersion Visualizer and made it sticky at the top of the screen. This fixes an issue where the bottom save/setting controls would obscure the graph while adjusting sliders on mobile devices.

## Version: V7.1.2 (Touch Input Calibration)
**Date:** 2024-05-27
**Branch:** `main`

### Fixes
- **Long Press Sensitivity**: Reduced the movement tolerance from 10px to **5px** for touch gestures. This ensures that intentional dragging does not accidentally trigger a "long press" drop, making the interaction much more stable.
- **Coordinate Calculation**: Fixed a critical bug where the "Manual Drop" location was offset significantly from the finger position. This was caused by the CSS `transform: rotate() scale(1.4)` on the map container. Implemented an inverse transformation algorithm in `RotatedMapHandler` to correctly map screen pixels back to the map's internal coordinate system.

## Version: V7.1.1 (UX Fix)
**Date:** 2024-05-27
**Branch:** `main`

### Fixes
- **Mobile Interaction**: Resolved an issue where long-pressing to drop a ball manually on the map would not trigger on touch devices. Implemented a custom long-press detection logic within `RotatedMapHandler` that works alongside the map panning gestures, while preserving right-click functionality for desktop users.

## Version: V7.1.0 (Stable Release)
**Date:** 2024-05-27
**Branch:** `main`
**Status:** ✅ DEPLOYMENT SUCCESSFUL

### Summary
Successfully resolved all build pipeline and runtime type errors. The application is now fully stable on Vercel/GitHub Pages with a clean build process.

### Final Fixes (from v7.0.3)
- **Type Compatibility**: Fixed `react-leaflet` v4 type errors (TS2322) by refactoring `Polyline` and `Marker` props. Specifically moved style props (color, weight) into `pathOptions` to satisfy strict TypeScript definitions.
- **Missing Definitions**: Added `@types/leaflet` to `devDependencies` to ensure correct TypeScript resolution for map components.
- **Sanitization**: Confirmed removal of conflicting `importmap` scripts to ensure the production bundle (React 18) is the single source of truth.

## Version: V7.0.2 (Build Fix)
**Date:** 2024-05-27
**Branch:** `main`

### Fixes
- **Build Error (TS2688)**: Added `@types/node` to `devDependencies`. The TypeScript compiler was looking for Node.js type definitions (likely for `vite.config.ts` or implicit global inclusions) but couldn't find them.
- **Runtime Stability**: Confirmed removal of `importmap` from `index.html` to prevent React 19 (CDN) vs React 18 (Bundle) conflicts.

## Version: V7.0.0 (Clean Slate)
**Date:** 2024-05-27
**Branch:** `main`
**Summary:** Architecture Reset for Deployment Stability

### 1. Build Architecture Change (The "New Path")
- **Removed .npmrc Dependency**: Abandoned the attempt to use `.npmrc` for configuration due to persistent environment/encoding corruption issues.
- **Implemented Native Overrides**: Updated `package.json` with an `"overrides"` section.
  - **Effect**: This instructs NPM to resolve *all* nested React dependencies to the root project's version (18.2.0). This bypasses the upstream peer dependency conflict in `lucide-react` without needing fragile command-line flags.

### 2. Runtime Stability
- **Cleaned Index.html**: 
  - **Removed Importmap**: Deleted the code block that was forcing the browser to load React 19 from `esm.sh`.
  - **Why**: The project is compiled with Vite using React 18. Loading React 19 via CDN caused a "Dual React Instance" crash.
- **Tailwind Strategy**: Kept the Tailwind CDN script to ensure styling works immediately without needing a complex PostCSS build pipeline setup on the server.

### 3. Versioning
- **Major Bump**: Bumped to `7.0.0` to signal a breaking change in the build strategy and ensure all deployment caches are invalidated.
