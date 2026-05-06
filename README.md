# 🏠 Property Scanner — Australia

Australian property investment calculator. State-specific stamp duty, FHB grants, guarantor modelling, negative gearing, 10-year projections, and AI-powered suburb research.

**[→ Live app](https://YOUR-USERNAME.github.io/property-scanner/)**

## Features

- **Calculator** — Full upfront cost breakdown (stamp duty, LMI, legal fees), weekly cashflow, negative gearing tax benefit, 10-year equity + value projection
- **FHB & Guarantor** — State-specific First Home Buyer stamp duty exemptions, FHOG grants, and guarantor (LMI waiver) modelling
- **Suburb Insights** — AI-powered research pulling live data: median prices, rental yields, vacancy, capital growth, demographics, infrastructure
- **Compare** — Save multiple scenarios and compare yields, cashflow, and equity side-by-side
- All 8 states and territories supported

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Deploy to GitHub Pages

This repo auto-deploys via GitHub Actions on every push to `main`. One-time setup:

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push any change to `main` — it'll build and deploy automatically (~1 min)

Your app will be live at: `https://YOUR-USERNAME.github.io/REPO-NAME/`

## Suburb Insights API key

The AI suburb research tab calls the Anthropic API from the browser. When self-hosted, add your API key to `src/App.jsx` in the `run` function fetch call:

```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'sk-ant-YOUR-KEY-HERE',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
```

> **Note:** For a public GitHub Pages site, consider moving the API call to a backend or Cloudflare Worker to keep your key private.

## Stack

- React 18 + Vite
- lucide-react (icons)
- Pure CSS (no Tailwind)
- GitHub Actions for CI/CD
- GitHub Pages for hosting
