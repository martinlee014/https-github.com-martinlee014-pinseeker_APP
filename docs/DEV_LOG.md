
# PinSeeker Web - Development Log

## Version: V7.17.1 (Annotation Tools Repair)
**Date:** 2024-06-06
**Branch:** `main`
**Status:** ✅ CURRENT

### Features & Fixes
- **Annotation Mode Fixed**: Restored the missing toolbar for Text, Pin, Drawing, and Eraser tools in `PlayRound`.
- **Map Interaction**: Fixed conflicts where dragging map markers or interacting with UI would accidentally pan the map (updated `RotatedMapHandler`).
- **Drawing Tools**: Added specific "Save" and "Clear" actions for the pen tool to ensure lines are committed correctly.
- **Text Input**: Implemented a modal for entering text notes on the map to prevent layout shifts.

## Version: V7.17.0 (System Stabilization & Git Sync)
**Date:** 2024-06-06
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Runtime Stability**: Cleaned up `importmap` in `index.html` to resolve "Script error" caused by conflicting React 19/18 dependencies and Vite plugins in the runtime environment.
- **Documentation**: Updated `README.md` with explicit git synchronization commands.
- **Version Control**: Synchronized `package.json` and UI version display to 7.17.0.

## Version: V7.16.1 (Documentation Sync)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **User Manual Update**: Added comprehensive guide for the new HDCP-driven auto-configuration feature.
- **Consistency Audit**: Verified that HDCP editing, modal triggers, and storage persistence are fully synchronized across Dashboard and Settings.

## Version: V7.16.0 (HDCP-Driven Strategy)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **HDCP Club Auto-Config**:
  - Users can now edit their HDCP from the Dashboard.
  - Added a smart generator that creates a full 14-club bag with realistic Carry, Side Error, and Depth Error based on skill level.
  - Higher HDCP results in shorter distances and wider dispersion ellipses.
- **Persistence**: HDCP is now saved to local storage.
- **UI/UX**: 
  - Added HDCP input modal.
  - Added club synchronization confirmation dialog.

## Version: V7.15.0 (Stable Milestone - Refactored)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED
