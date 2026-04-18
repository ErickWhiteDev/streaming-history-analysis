# Spotify Listening History Web App

This is a TypeScript web app for analyzing Spotify listening history.

## Repository Status

[![Deploy To GitHub Pages](https://github.com/erickwhitedev/streaming-history-analysis/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/erickwhitedev/streaming-history-analysis/actions/workflows/deploy-pages.yml)

GitHub Pages URL: [https://erickwhitedev.github.io/streaming-history-analysis/](https://erickwhitedev.github.io/streaming-history-analysis/)

## Features

- Upload a Spotify export `.zip` containing `Streaming_History_Audio_*.json`
- Date-range analysis with an `All Time` toggle that snaps to the full dataset
- Filter panel controls for timezone, statistic depth, and frequency-window sizing
- Separate `Time` and `Other` filter groups, plus collapsible filter and statistic panels
- Charts for:
   - Top songs, artists, and albums by time, count, and frequency
   - Cumulative songs, artists, and albums
   - Listening by hour and weekday
   - Overall listening frequency
   - Insights overview
- Save the current plot as PNG
- Worker-backed chart generation for smoother rendering
- Dark Spotify-style UI with compact top bars when the control panels are minimized

## Stack

- React + TypeScript + Vite
- Plotly (`react-plotly.js`)
- ZIP parsing with `jszip`
- Timezone conversion with `luxon`
- Chart building in a Web Worker
- GitHub Pages deployment with GitHub Actions
- Bundle budget check in CI (`npm run bundle:check`)

## Run

1. Install a current Node.js LTS release (includes `npm`).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Build production bundle:

   ```bash
   npm run build
   ```

## Deployment

The app is deployed to GitHub Pages from the `main` branch through the workflow in `.github/workflows/deploy-pages.yml`.
