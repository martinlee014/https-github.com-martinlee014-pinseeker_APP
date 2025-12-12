# PinSeeker Web - Development Log

## Version: V6.4.6
**Date:** 2024-05-27
**Branch:** `V6.4`
**Summary:** Final Dependency Lock

### 1. Build Stabilization
- **Pinned Dependencies**: 
  - **Fix**: Removed caret `^` from `lucide-react` in `package.json` (set to exact `0.344.0`). This prevents the build server from resolving conflicting newer versions.
- **NPM Config**: 
  - **Fix**: Added `.npmrc` with `legacy-peer-deps=true`. This is the definitive fix for "ERESOLVE" errors on Vercel/GitHub Actions when using React 18 with certain UI libraries.
- **HTML Cleanup**: 
  - **Fix**: Removed `importmap` from `index.html`. This ensures the app uses the bundled React 18 code instead of trying to fetch React 19 from a CDN, which was causing runtime crashes.

---

## Version: V6.4.5
**Date:** 2024-05-27
**Branch:** `V6.4`
**Summary:** Config File Repair

### 1. Build Critical Repair
- **.npmrc Repair**: 
  - **Issue**: The previous `.npmrc` file contained corrupted/binary characters causing `npm warn Unknown project config` and subsequent install failures.
  - **Fix**: Re-wrote `.npmrc` with clean text `legacy-peer-deps=true`.
- **Importmap Removal**: 
  - **Issue**: `index.html` still contained the `importmap` pointing to React 19.
  - **Fix**: Removed the `importmap` block entirely to ensure the app uses the defined `package.json` dependencies (React 18).

---

## Version: V6.4.4
**Date:** 2024-05-27
**Branch:** `V6.4`
**Summary:** Deployment Rescue & Config Clean

### 1. Deployment Fixes
- **Pinned Dependencies**: Modified `package.json` to use exact version `"lucide-react": "0.344.0"`. This prevents the build server from resolving to newer versions that might conflict with React 18.
- **Legacy Peer Deps**: Added clean `.npmrc` to enforce `legacy-peer-deps=true`, solving the `ERESOLVE` errors on Vercel.
- **Removed Importmap**: Deleted the persistent `importmap` block in `index.html` that was forcing an incompatible React 19 version.

---

## Version: V6.4.3
**Date:** 2024-05-27
**Branch:** `V6.4`
**Summary:** Critical Deployment Fix (.npmrc)

### 1. Build & Deployment Repair
- **Force Legacy Peer Deps**: 
  - **Issue**: Deployment fails with `npm error peer react...`.
  - **Fix**: Added `.npmrc` file with `legacy-peer-deps=true`. This ensures Vercel ignores strict peer dependency conflicts and installs React 18 successfully.
- **Index.html Cleanup**:
  - **Fix**: Removed `importmap` again to prevent React 19 CDN loading.

---

## Version: V6.4.2
**Date:** 2024-05-27
**Branch:** `V6.4`
**Summary:** Deployment Repair (Legacy Peer Deps)

### 1. Build & Deployment Repair
- **NPM EOVERRIDE Fix**: 
  - **Issue**: The previous `overrides` fix caused a conflict with direct dependencies in Vercel's strict environment (`EOVERRIDE`).
  - **Fix**: Removed `overrides` from `package.json`.
  - **Fix**: Created `.npmrc` with `legacy-peer-deps=true`. This instructs the build server to ignore strict peer dependency graph validation, allowing React 18 to be installed alongside libraries that might have loose or conflicting peer requirements, solving the installation error robustly.
- **Index.html Cleanup**:
  - **Issue**: `importmap` persisted in the user's file.
  - **Fix**: Removed `importmap` block again.

---

## Version: V6.4.1
**Date:** 2024-05-27
**Branch:** `V6.4`
**Summary:** Critical Deployment Fix (NPM Peer Deps)

### 1. Build & Deployment Repair
- **NPM Install Error**: 
  - **Issue**: Deployment was failing with `npm error peer react@"^16.5.1 || ^17.0.0 || ^18.0.0" from lucide-react`. This happens when the build environment mistakenly attempts to install React 19.
  - **Fix**: Added `"overrides": { "react": "18.2.0", "react-dom": "18.2.0" }` to `package.json`. This forces npm to use React 18, satisfying all peer dependencies.
- **Index.html Cleanup**:
  - **Issue**: The `importmap` pointing to React 19 was still present, potentially causing runtime "Multiple React Instances" errors.
  - **Fix**: Removed `importmap` block completely.

---

## Version: V6.4
**Date:** 2024-05-27
**Branch:** `V6.4`
**Summary:** Refactoring & Error Handling Fixes (UI Polish & Bug Fixes)

### 1. 修复与优化 (Fixes & Improvements)
- **Modals.tsx Error Fix**:
  - **问题**: `ShotConfirmModal` 中 `clubs.find` 可能在极端情况下遭遇 `clubs` 未定义的问题，导致运行时崩溃 (Reported error at line 113).
  - **修复**: 增加了更严格的空值检查 `(clubs || []).find(...)` 并明确了 `onChange` 事件类型。
- **Index.html Cleanup**:
  - **问题**: `index.html` 中残留的 `importmap` 再次被清理。此代码块之前导致了 React 版本冲突。
- **UI Refactor**:
  - **Shot Confirm Modal**: 重新设计了击球确认弹窗。
    - 使用了更一致的 Glassmorphism 风格。
    - 增大了字体和触控区域，更适合户外操作。
    - 优化了下拉菜单的样式，添加了自定义箭头图标。

---

## Version: V6.3
**Date:** 2024-05-26
**Branch:** `V6.3`
**Summary:** PWA 安装体验优化与构建修复 (PWA UX Polish & Build Fixes)

### 1. 核心修复 (Critical Fixes)
- **移除 Importmap (Remove Importmap)**:
  - **问题**: `index.html` 中残留的 `importmap` 强制引入了 CDN 版的 React 19，导致与本地打包的 React 18 产生 "Multiple React Instances" 冲突，引发 Hooks 报错。
  - **修复**: 彻底删除了该代码块，确保应用仅使用 Vite 打包的依赖。
- **静态资源路径 (Static Assets)**:
  - 确保 `manifest.json` 和 `sw.js` 位于 `public/` 目录下，以便在构建时正确复制到根目录。
  - 更新 HTML 引用路径为相对路径 (`href="manifest.json"` 而非 `/manifest.json`)，完美支持 GitHub Pages 的子目录部署。

### 2. 功能增强 (Enhancements)
- **强制显示安装按钮 (Force Install Button)**:
  - **旧行为**: 如果浏览器未触发 `beforeinstallprompt` 事件（如 iOS 或已安装），安装按钮会隐藏。
  - **新行为**: 按钮**永远显示**。
    - **Android/Desktop**: 点击触发原生安装弹窗。
    - **iOS/其他**: 点击弹出模态框，图文指导用户手动 "添加到主屏幕"。