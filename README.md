# Spotify Listening History Web App

This is a TypeScript web app for analyzing Spotify listening history.

## Repository Status

[![Deploy To GitHub Pages](https://github.com/erickwhitedev/streaming-history-analysis/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/erickwhitedev/streaming-history-analysis/actions/workflows/deploy-pages.yml)

GitHub Pages URL: `https://erickwhitedev.github.io/streaming-history-analysis/`

## Features

- Upload Spotify export `.zip` containing `Streaming_History_Audio_*.json`
- Analysis filters:
  - Start year
  - End year
  - Statistic depth (Top N)
  - Timezone selector with UTC offsets
- All chart actions from the desktop app:
  - Top songs/artists/albums by time and count
  - Cumulative songs/artists
  - Listening by hour
  - Listening by weekday
  - Skip rate by year
  - Insights overview
- Save current plot as PNG
- Matching dark-themed UI and light plot style

## Stack

- React + TypeScript + Vite
- Plotly (`react-plotly.js`)
- ZIP parsing with `jszip`
- Timezone conversion with `luxon`

## Run

1. Install Node.js 18+ (includes `npm`).
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
