
# PinSeeker Web - Development Log

## Version: V7.12.0 (UI Stability & Mobile UX Fixes)
**Date:** 2024-06-03
**Branch:** `main`
**Status:** ✅ RELEASED

### Features & Fixes
- **Mobile Context Menu Suppression**:
  - Implemented aggressive CSS and JS event interception to prevent native "Save Image" and "View Image" popups during long-press on the map.
  - Added `-webkit-touch-callout: none` and `-webkit-user-drag: none` to all interactive elements.
- **Club Management Robustness**:
  - **Add Button**: Moved the "Add New Club" button from a floating fixed position to a dedicated card at the bottom of the list. This ensures it is always visible and clickable regardless of viewport simulation or mobile browser chrome.
  - **Delete Action**: Fixed a bug where clicking the delete icon would trigger the parent "Edit" event. Added `e.stopPropagation()` and improved `window.confirm` reliability.
- **Build Compatibility**:
  - Explicitly added `import React` to several TSX files to resolve "Cannot find namespace React" errors in specific build environments.
- **UX Refinement**:
  - Improved touch target sizes for all list-view actions (Edit/Delete).

## Version: V7.11.0 (Real-Time GPS & Precision)
**Date:** 2024-06-02
**Branch:** `main`
**Status:** ✅ RELEASED

### Features
- **Zero-Latency GPS (Background Tracking)**: 
  - Switched from single-request `getCurrentPosition` to continuous `watchPosition`.
  - The GPS hardware now "warms up" as soon as the map loads, ensuring that when the user taps "Record Shot" or "GPS Tee", the coordinate is available instantly without the previous 2-5 second delay.
- **Live Location Confidence**:
  - Added a **Pulsing Blue Dot** on the map to show real-time user location relative to the course.
  - Added a **Signal Strength Indicator** (Bars + Accuracy in meters) to the top header. Users can now see if their GPS lock is precise (Green/High) before recording a shot.
- **Manual Measurement Correction**:
  - In Measurement Mode, the start point (User Location) is now **draggable**.
- **UX Refinement**:
  - Increased the touch target size for the draggable measurement handle (48x48px hit area).

[... remainder of previous logs ...]
