# PinSeeker Web

**PinSeeker** is a professional Golf Analytics and Strategy Application providing satellite mapping, shot dispersion analysis, and round tracking. It is built with React, Leaflet, and Tailwind CSS.

## 🚀 Features

- **Satellite Mapping**: View detailed hole layouts using ESRI World Imagery.
- **Shot Tracking**: Record shots using GPS or manual placement.
- **Dispersion Analysis**: Visualize expected landing zones based on club statistics and wind conditions.
- **Replay Mode**: Review past rounds shot-by-shot.
- **Scorecard**: Track strokes, putts, and penalties.

## 📱 Important: Mobile & GPS Support

**Crucial**: To use the GPS Location features (`navigator.geolocation`) on a mobile device (iOS/Android), this application **must be served over HTTPS**.

Mobile browsers block GPS access on insecure (HTTP) connections (except for `localhost` on the device itself).

### Recommended Deployment (Free & Automatic HTTPS)

#### Option 1: Vercel (Easiest)
1. Push this code to GitHub.
2. Import the repository on [Vercel](https://vercel.com).
3. Vercel automatically detects the build settings. Click **Deploy**.
4. Use the provided `https://...vercel.app` link on your phone.

#### Option 2: GitHub Pages
1. Ensure `react-router-dom` is using `HashRouter` (Already configured in `App.tsx`).
2. Add `"homepage": "https://<username>.github.io/pinseeker_web"` to `package.json`.
3. Run `npm install gh-pages --save-dev`.
4. Add `"deploy": "gh-pages -d dist"` to scripts in `package.json`.
5. Run `npm run deploy`.

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
