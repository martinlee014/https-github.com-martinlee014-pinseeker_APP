# PinSeeker Web - Development Log

## Version: V6.2
**Date:** 2024-05-25
**Branch:** `V6.2`
**Summary:** PWA 支持与安装功能 (PWA Support & App Installation)

### 1. 核心特性 (Key Features)
- **PWA (Progressive Web App)**:
  - 添加了 `manifest.json` 和 `sw.js` (Service Worker)，使应用符合可安装标准。
  - 支持离线缓存基础框架（目前采用 Network-first 策略）。
  - 支持全屏显示 (`display: standalone`)，移除浏览器地址栏，提供原生 APP 体验。
- **安装引导 (Install Flow)**:
  - **Settings 页面**: 新增 "Install App" 按钮。
  - **Android/Desktop**: 点击按钮直接触发浏览器的安装提示。
  - **iOS**: 由于系统限制，点击按钮会弹出模态框，图文指导用户使用 Safari 的 "Add to Home Screen" 功能。

### 2. 关键修复 (Critical Fixes)
- **依赖冲突清理**:
  - 彻底移除了 `index.html` 中的 `importmap` 脚本。该脚本曾强制引入 React 19，与项目本地的 React 18 依赖产生冲突，导致 `useRef` 等 Hooks 运行时崩溃。现在完全使用 Vite 打包的本地依赖。

---

## Version: V6.1
**Date:** 2024-05-24
**Branch:** `V6.1`
**Summary:** UI 玻璃拟态重构与下一杆策略预测 (Glassmorphism UI Redesign & Next Shot Prediction Engine)

### 1. 核心特性 (Key Features)
- **下一杆预测引擎 (Next Shot Prediction)**:
  - 在选择当前球杆时，系统会自动计算落点剩余距离，并推荐**下一杆**需要使用的球杆（例如："选 Driver -> 剩余 120码 -> 下一杆推荐 PW"）。
  - 增强了策略卡片的信息密度，清晰展示 "Total Carry" (飞行距离) 和 "Leaves" (剩余距离)。
- **沉浸式地图体验 (Immersive Map UI)**:
  - 地图容器调整为全屏显示 (`absolute inset-0`)。
  - 顶部状态栏和底部操作面板改为**悬浮半透明玻璃拟态 (Glassmorphism)** 风格，大幅增加了地图的可视区域，解决了操作面板遮挡发球台的问题。
  - 优化了文字排版和对比度，确保在深色半透明背景下的可读性。

### 2. 关键修复 (Critical Fixes)
- **React 版本冲突修复**:
  - 移除了 `index.html` 中多余的 `importmap` 脚本。该脚本强制浏览器加载 React 19，与项目依赖的 React 18 发生冲突，曾导致 Hooks (`useRef`) 报错崩溃。

---

## Version: V6.0
**Date:** 2024-05-23
**Branch:** `V6.0`
**Summary:** 新增球杆管理系统与落点可视化，修复交互Bug (Added Club Management System & Dispersion Visualization, Fixed Interaction Bugs)

### 1. 新特性 (New Features)
- **球杆管理 (Club Management)**:
  - 在设置菜单中新增入口。
  - 支持添加、编辑、删除球杆。
  - **落点可视化 (Dispersion Visualizer)**: 新增 SVG 网络坐标系编辑器，可视化调整球杆的左右偏差 (Width Scatter) 和距离偏差 (Depth Scatter)。
  - **全局应用**: 设置中的球杆数据实时同步至打球策略 (Strategy Engine) 和地图落点预测 (Predicted Landing Zone)。
- **用户手册更新**: 增加了球杆管理相关的使用说明。

### 2. 问题修复 (Bug Fixes)
- **确认击球无反应 (Unresponsive Confirm Shot)**:
  - 修复了 `ModalOverlay` 的事件冒泡问题，导致点击 "Confirm" 按钮被 Backdrop 点击事件拦截。
  - 增强了 `confirmShot` 函数的错误捕获和空值检查。
- **渲染崩溃**:
  - 修复了 `PlayRound` 组件在球洞数据未加载完成时尝试渲染地图导致的崩溃问题。

### 3. 代码重构 (Refactoring)
- **Global Context**: 将球杆数据 (`bag`) 移至全局 Context，替换了原有的硬编码 `DEFAULT_BAG` 常量。
- **Storage Service**: 增加了 `getBag/saveBag` 接口用于持久化用户自定义球杆数据。

---

## Version: V5.0
**Date:** 2024-05-22
**Branch:** `V5.0`
**Summary:** 修复复盘问题，重构代码 (Fix replay issues, refactor code)

## 1. 问题记录 (Issues Reported)

### Issue 1: 屏幕抖动 (Map Shake)
**描述**: 当在第一洞点击完成并切换到第二洞时，屏幕发生激烈抖动，导致无法正常操作。
**原因分析**: Leaflet 地图组件在 DOM 更新时，由于外部容器的 CSS 旋转 (`transform: rotate`) 与 Leaflet 内部的坐标定位逻辑发生冲突。当 React 尝试在现有的 Map 实例中平移视图时，坐标计算出现震荡。

### Issue 2: 发球台标记美化 (Aesthetics)
**描述**: 原有的拟物化 Tee 图标与整体 UI 风格不符。
**需求**: 去除 Tee 图标，设计更简洁的起始点标记。

### Issue 3: 复盘位置显示不全 (Replay Bounds)
**描述**: 在复盘模式下，部分击球距离较远或球道弯曲的洞（如第14、15洞），落点超出了当前地图视野，导致看起来像“没有记录”。
**原因分析**: 地图初始化逻辑仅将视图中心固定在发球台，未根据实际击球轨迹调整缩放级别。

### Issue 4: 代码崩溃 (Runtime Error)
**描述**: `Minified React error #185` (Maximum update depth exceeded).
**原因分析**: `PlayRound.tsx` 中的 `useEffect` 依赖项包含 `currentHoleIdx`，但在 Effect 内部又调用了会触发重渲染的状态更新函数（如 `setShots`, `setCurrentBallPos`），导致在特定条件下（如带有 URL 参数 `restore=true` 时）进入死循环。

---

## 2. 解决方案与代码变更 (Solutions & Refactoring)

### Fix 1: 强制地图重载 (MapContainer Re-keying)
**文件**: `pages/PlayRound.tsx`
**修改**: 
```tsx
<MapContainer key={currentHoleIdx} ... />
```
**原理**: 通过给 `MapContainer` 添加基于洞号的 `key`，迫使 React 在切换球洞时完全销毁旧的地图实例并重新挂载新实例。这彻底消除了因平滑过渡动画和 CSS 旋转引起的坐标冲突，解决了抖动问题。

### Fix 2: 更新图标设计 (Icon Update)
**文件**: `pages/PlayRound.tsx`
**修改**: 
- 移除了 `teeIcon` HTML 定义。
- 新增 `startMarkerIcon`: 一个简洁的白色圆形标记，带有深色边框和发光效果，用于指示每一杆的起始位置（发球台或球道上的击球点）。

### Fix 3: 智能视野缩放 (Auto-fit Bounds)
**文件**: `pages/PlayRound.tsx` -> `MapInitializer` 组件
**修改**: 
- 引入了 `pointsToFit` 属性。
- 在复盘模式下，收集发球台、果岭以及所有历史落点的坐标。
- 使用 `map.fitBounds(bounds)` 自动计算最佳缩放级别和中心点，确保所有关键点都在屏幕可见范围内。

### Fix 4: React Hook 重构 (Hook Refactoring)
**文件**: `pages/PlayRound.tsx`
**修改**: 
- 将“初始化/恢复比赛”的逻辑从主 Effect 中剥离，放入一个仅在组件挂载时执行一次的 `useEffect(() => { ... }, [])`。
- 移除了导致循环依赖的状态更新逻辑，确保状态变更流向清晰。

---

## 3. 部署注意事项 (Deployment Note)

**重要**: 
为了确保 GPS 功能 (`navigator.geolocation`) 在移动端浏览器（Safari/Chrome）中正常工作，必须使用 **HTTPS** 协议部署应用。
- **推荐**: 使用 Vercel 或 Netlify 进行托管。
- **本地调试**: 局域网 HTTP 地址可能会被浏览器阻止获取位置权限。

---

## 4. 下一步计划 (Next Steps)
- 验证所有 18 洞的 GPS 记录功能。
- 测试离线状态下的数据持久化。