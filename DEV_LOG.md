# PinSeeker Web - Development Log

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

---

## Version: V6.2
**Date:** 2024-05-25
**Branch:** `V6.2`
**Summary:** PWA 支持与安装功能 (PWA Support & App Installation)

### 1. 核心特性 (Key Features)
- **PWA (Progressive Web App)**:
  - 添加了 `manifest.json` 和 `sw.js` (Service Worker)。
  - 支持全屏显示 (`display: standalone`)。
- **安装引导 (Install Flow)**:
  - **Settings 页面**: 新增 "Install App" 按钮。

### 2. 关键修复 (Critical Fixes)
- **依赖冲突清理**: 尝试移除 `index.html` 中的 `importmap` (在 V6.3 中彻底完成)。

---

## Version: V6.1
**Date:** 2024-05-24
**Branch:** `V6.1`
**Summary:** UI 玻璃拟态重构与下一杆策略预测 (Glassmorphism UI Redesign & Next Shot Prediction Engine)

### 1. 核心特性 (Key Features)
- **下一杆预测引擎 (Next Shot Prediction)**: 自动推荐下一杆球杆。
- **沉浸式地图体验 (Immersive Map UI)**: 地图全屏化，UI 改为悬浮玻璃拟态。

---

## Version: V6.0
**Date:** 2024-05-23
**Branch:** `V6.0`
**Summary:** 新增球杆管理系统与落点可视化 (Club Management & Dispersion Visualization)

### 1. 新特性 (New Features)
- **球杆管理**: 支持添加/编辑球杆，新增落点散布可视化编辑器。
- **Global Context**: 球杆数据全局化。

---

## Version: V5.0
**Date:** 2024-05-22
**Branch:** `V5.0`
**Summary:** 修复复盘问题，重构代码 (Fix replay issues, refactor code)

- 修复屏幕抖动 (Map Shake)。
- 优化发球台标记图标。
- 智能视野缩放 (Auto-fit Bounds)。