# PinSeeker Web

**PinSeeker** is a professional Golf Analytics and Strategy Application providing satellite mapping, shot dispersion analysis, and round tracking. It is built with React, Leaflet, and Tailwind CSS.

## 🚀 Features

- **Satellite Mapping**: View detailed hole layouts using ESRI World Imagery.
- **Shot Tracking**: Record shots using GPS or manual placement.
- **Dispersion Analysis**: Visualize expected landing zones based on club statistics and wind conditions.
- **Replay Mode**: Review past rounds shot-by-shot.
- **Scorecard**: Track strokes, putts, and penalties.

## 📱 Mobile & GPS Support (HTTPS Required)

**Crucial**: To use the GPS Location features (`navigator.geolocation`) on a mobile device (iOS/Android), this application **must be served over HTTPS**.

## 🌐 Deployment & Anonymity Guide

To share this app with friends **without exposing your GitHub username** (e.g., avoiding URLs like `username.github.io`), use Vercel.

### Step 1: Deploy to Vercel
1. Push your code to your GitHub repository.
2. Go to [Vercel.com](https://vercel.com) and sign up/login.
3. Click **"Add New..."** -> **"Project"**.
4. Import your `pinseeker-web` repository.
5. Click **Deploy**.

### Step 2: Anonymize the URL (Important)
By default, Vercel might generate a URL based on your GitHub project name. To make it completely neutral:

1. Go to your Project Dashboard on Vercel.
2. Click **Settings** (top navigation bar).
3. Click **Domains** (left sidebar).
4. Find your current domain (e.g., `pinseeker-web.vercel.app`).
5. Click **Edit** and change it to a generic name (e.g., `golf-app-demo-v1.vercel.app`).
6. Share this new URL with your friends. It contains no link to your GitHub profile.

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

*Note: If testing on mobile via local network IP (e.g., `http://192.168.1.5:5173`), GPS will likely NOT work due to browser security policies. Use the deployment options above for real device testing.*

## 📜 Version History

See [DEV_LOG.md](./DEV_LOG.md) for detailed development logs, bug fixes, and refactoring notes.