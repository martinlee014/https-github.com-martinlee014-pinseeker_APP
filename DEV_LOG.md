# PinSeeker Web - Development Log

## Version: V7.14.0 (Interaction Layer Optimization)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Interaction Bug Fix**: 
  - Fixed an issue where long-pressing inside the dispersion ellipse (blue circle) had no reaction.
  - Set `interactive: false` for decorative map layers (Ellipses, Guide Lines) to allow touch events to pass through to the map controller.
- **State Synchronization**:
  - Confirmed all current navigation and GPS logic is stable.
- **Deferred Fixes**:
  - The coordinate offset issue for marker dragging in rotated maps remains on the backlog for the next session per user request.

## Version: V7.13.0 (GPS Logic Stabilization & State Sync)
**Date:** 2024-06-04
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **GPS Interaction Fixes**:
  - Re-implemented `handleGPSButtonStart` and `handleGPSButtonEnd` to fix ReferenceErrors in the mobile HUD.
  - Corrected long-press logic for updating the Tee position via the GPS button.
- **Annotation Logic Fixes**:
  - Re-introduced `deleteAnnotation` logic with confirmation dialogs.
  - Fixed event propagation issues when clicking/long-pressing annotations in "Note Mode".

[... remainder of previous logs ...]