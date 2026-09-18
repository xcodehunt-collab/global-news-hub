# Global News Hub

A responsive, region-aware global news PWA built with vanilla HTML, CSS and JavaScript and a Netlify Function for reliable server-side RSS fetching.

## Features

- World, Technology, Business, Sports, Health, Science and Entertainment
- BBC, Sky News, Sky Sports and Ars Technica RSS sources
- Netlify Function at `/api/news` to avoid browser RSS CORS failures
- Region detection using ipapi.co with browser-language fallback and manual override
- 10-minute automatic refresh by default, configurable in Settings
- Hero slider, breaking-news ticker, category grids, Top Stories and Recently Added
- Live search
- RSS image extraction with deterministic Picsum fallback
- Browser notifications through the Notification API and Service Worker
- Notification click opens the original publisher article
- Local cache fallback when live feeds are temporarily unavailable
- PWA manifest and offline static-asset caching
- Responsive desktop, tablet and mobile layouts

## Netlify deployment

This repository is ready for Netlify. The important structure is:

```
index.html
style.css
app.js
service-worker.js
manifest.json
netlify.toml
netlify/
  functions/
    news.js
```

Connect this GitHub repository to Netlify and deploy the repository root. No build command is required. `netlify.toml` sets the publish directory to the repository root and the Functions directory to `netlify/functions`.

After deployment test:

```
https://YOUR-SITE.netlify.app/api/news?health=1
https://YOUR-SITE.netlify.app/api/news?category=world
```

The health endpoint should return JSON with `"ok": true`. The category endpoint should return an `articles` array.

## Local testing

Static UI:

```bash
python3 -m http.server 8080
```

For the complete site including the Netlify Function, use the Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

The plain Python server cannot execute Netlify Functions, so live RSS loading through `/api/news` requires Netlify Dev or a deployed Netlify site.

## Notifications

Notifications require HTTPS or localhost and explicit browser permission. Chrome can permanently block repeated permission prompts, so if permission is denied use the browser's site controls and change Notifications to Allow.

The Service Worker handles notification clicks and opens the article URL in a new tab/window.

The frontend keeps a notification counter in localStorage. The configured behavior redirects to `https://callerbuzz.free.je/` after the notification threshold is reached.

Static frontend refreshes can discover and notify about new articles while the site is open or revisited. True background Web Push while the site/browser is closed requires a push backend and subscription service.

## Customization

Edit `CONFIG` at the top of `app.js` for refresh timing and notification behavior. Edit `FEEDS` in `netlify/functions/news.js` to change publisher feeds. Update theme variables at the top of `style.css`.

## Source and editorial notes

Global News Hub aggregates public RSS metadata and sends readers to the original publisher. Headlines and linked content remain the property of their respective publishers. “Top Stories” is based on recency in the available feeds and does not claim publisher-independent popularity data.
