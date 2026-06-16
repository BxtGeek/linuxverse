# ◈ LinuxVerse

> A fast, SEO-friendly static Linux distribution discovery website.  
> Auto-updates monthly via GitHub Actions. Zero backend.

**Live demo:** `https://yourusername.github.io/linuxverse`

---

## Features

- **20 distributions** with detail pages, badges, and suitability ratings
- **Distro Finder Quiz** — 6-question recommender (client-side, no backend)
- **Compare tool** — side-by-side comparison of 2–4 distributions
- **Dark/light theme** — persisted in localStorage
- **Search + filters** — instant, client-side
- **Auto-updates** — GitHub Action fetches latest release versions monthly
- **SEO-ready** — sitemap.xml, robots.txt, Open Graph, structured data
- **Lighthouse 95+** — pure static HTML/CSS/JS, no frameworks

---

## Quick Start

```bash
git clone https://github.com/yourusername/linuxverse
cd linuxverse
node build.js          # generates ./docs/
npx serve docs         # preview at http://localhost:3000
```

---

## Deploy to GitHub Pages

### 1. Create the repository

```bash
gh repo create linuxverse --public --source=. --push
```

### 2. Enable GitHub Pages

Go to **Settings → Pages** and set:
- Source: **GitHub Actions**

### 3. Push — the workflow auto-deploys on every push to `main`

```bash
git push origin main
```

The site will be live at `https://yourusername.github.io/linuxverse` within ~2 minutes.

---

## Project Structure

```
linuxverse/
├── src/
│   └── data/
│       └── distros.json          ← Single source of truth
├── scripts/
│   └── update-versions.js        ← Monthly auto-update script
├── docs/                         ← Built output (GitHub Pages root)
│   ├── index.html
│   ├── distros/index.html
│   ├── compare/index.html
│   ├── quiz/index.html
│   ├── distro/<slug>/index.html  ← One page per distro
│   ├── sitemap.xml
│   ├── robots.txt
│   └── assets/
│       ├── style.css
│       ├── main.js
│       └── favicon.svg
├── .github/
│   └── workflows/
│       └── update-distros.yml    ← Monthly cron + deploy
├── build.js                      ← Static site generator
└── package.json
```

---

## Adding a New Distribution

Edit `src/data/distros.json` and add an entry:

```json
{
  "name": "My Distro",
  "slug": "my-distro",
  "website": "https://example.com",
  "family": "Debian",
  "base": "Ubuntu",
  "package_manager": "APT",
  "desktop": ["GNOME"],
  "release_model": "Fixed",
  "latest_version": "1.0",
  "release_date": "2024-01-01",
  "categories": ["beginner", "desktop"],
  "description": "A short description.",
  "logo": "",
  "screenshots": [],
  "beginner_friendly": true,
  "gaming": false,
  "privacy": false,
  "lightweight": false,
  "rolling": false,
  "enterprise": false,
  "recommended_uses": ["Home desktop"],
  "related": ["ubuntu", "linux-mint"]
}
```

Then rebuild:

```bash
node build.js
git add -A && git commit -m "feat: add My Distro" && git push
```

---

## Auto-Update System

The GitHub Action at `.github/workflows/update-distros.yml`:

1. Runs on the **1st of every month** at midnight UTC
2. Executes `scripts/update-versions.js` which queries public APIs
3. Commits any changed versions back to `main`
4. Re-builds and deploys the static site

To add version-fetching for a new distro, add a fetcher to `SLUG_FETCHERS` in `scripts/update-versions.js`.

### Manual trigger

```bash
gh workflow run update-distros.yml
```

---

## Customisation

| What | Where |
|------|-------|
| Site URL | `build.js` → `SITE_URL` |
| Site name | `build.js` → `SITE_NAME` |
| Color palette | `docs/assets/style.css` → `:root` CSS variables |
| Distro data | `src/data/distros.json` |
| Quiz questions/scoring | `build.js` → `buildQuiz()` |

---

## License

MIT — free to fork, modify, and deploy.
