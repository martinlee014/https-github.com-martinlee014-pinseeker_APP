# PinSeeker Web - Development Log

## Version: V7.14.1 (Full Interaction Pass-through)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Map Interaction Fix**: 
  - Resolved persistent issue where long-pressing inside the dispersion ellipse was blocked.
  - Discovery: Markers (Arrow Icon and Distance Labels) were capturing events even if the Polygon was set to non-interactive.
  - Fixed by setting `interactive={false}` on the landing arrow Marker and the distance label Marker.
- **Onboarding**: No changes.
- **Known Issue**: Marker dragging in Measurement Mode still uses non-rotated screen coordinates (Fix deferred per user request).

## Version: V7.14.0 (Interaction Pass-through Optimization)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED
[... remainder of previous logs ...]