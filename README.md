
# PinSeeker Web

**PinSeeker** is a professional Golf Analytics and Strategy Application providing satellite mapping, shot dispersion analysis, and round tracking. It acts as a "Smart Electronic Caddie," visualizing your game plan based on real data, wind conditions, and strategic preferences.

## 🎯 Product Positioning
PinSeeker is not just a GPS rangefinder. It is a precision tool built for golfers who want to visualize their strategy, manage their misses, and curate their own course data.

## ✨ Key Highlights

### 1. Professional Dispersion Analysis
*   **Plan for the Miss**: Input your carry distance, side error, and depth error for every club.
*   **Visual Confidence**: See your potential landing zones (blue ellipses) on the map. Avoid hazards by understanding your statistical spread, not just the perfect number.

### 2. Advanced Rangefinder & Planning
*   **Measurement Mode**: Built-in "My Location" snapping allows instant measurements from where you stand to any layup point or the pin.
*   **Plays-Like Distance**: Integrated Visual Wind Compass calculates environmental adjustments automatically.

### 3. Interactive Strategy Board
*   **Coach's Eye**: Draw flight paths, mark hazards, or drop strategy pins directly on the satellite map.
*   **Quick Editing**: Includes an Eraser tool and intuitive touch gestures to manage your notes on the fly.

### 4. DIY Course Editor
*   **Limitless Database**: Create high-precision maps for any course in the world using the built-in editor.
*   **Precision Control**: Deep zoom (Level 22) and drag-and-drop markers allow for exact Tee and Green placement.

### 5. Seamless Tracking
*   **Smart GPS**: One-tap shot recording and long-press Tee updates.
*   **Replay Mode**: Review every shot of your round on the map after you finish, analyzing your performance hole-by-hole.

## 👥 Target Audience
*   **Strategic Players**: Golfers who ask "Where is the safe miss?" rather than just "How far?".
*   **Data Enthusiasts**: Players who tweak their bag setup based on real performance data.
*   **Private/Rural Course Members**: Users who need to map courses that aren't available in mainstream apps.
*   **Coaches**: Use the annotation tools to explain course management to students.

## 📱 Mobile & GPS Support (HTTPS Required)

**Crucial**: To use the GPS Location features (`navigator.geolocation`) on a mobile device (iOS/Android), this application **must be served over HTTPS**.

## 🌐 Deployment & Sync to GitHub

To update your remote GitHub repository with the latest changes from this project, run the following commands in your terminal:

```bash
# 1. Initialize git if you haven't already
git init

# 2. Add all files to the staging area
git add .

# 3. Commit the changes (Version 7.18.2)
git commit -m "feat: redesign hud to vertical stack with larger fonts v7.18.2"

# 4. Ensure you are on the main branch
git branch -M main

# 5. Add your remote repository (replace with your actual URL)
# git remote add origin https://github.com/YOUR_USERNAME/pinseeker-web.git

# 6. Push changes to GitHub
git push -u origin main
```

To deploy the live app to GitHub Pages:

```bash
npm run deploy
```

## 🛠 Local Development

```bash
npm install
npm run dev
```

## 📜 Version History

See [DEV_LOG.md](./docs/DEV_LOG.md) for detailed development logs.
