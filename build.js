#!/usr/bin/env node
/**
 * LinuxVerse Static Site Generator
 * Generates all HTML pages from src/data/distros.json
 */

const fs = require('fs');
const path = require('path');

const distros = JSON.parse(fs.readFileSync('src/data/distros.json', 'utf8'));
const OUT = 'docs';
const SITE_URL = 'https://bxtgeek.github.io/linuxverse';
const SITE_NAME = 'LinuxVerse';

// ── helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(file, html) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, html, 'utf8');
  console.log('  wrote', file);
}

function fmtDate(d) {
  if (!d) return 'Unknown';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function categoryLabel(cat) {
  const map = {
    beginner: '🟢 Beginner Friendly',
    developer: '💻 Developer',
    gaming: '🎮 Gaming',
    privacy: '🔒 Privacy',
    lightweight: '⚡ Lightweight',
    rolling: '🔄 Rolling Release',
    enterprise: '🏢 Enterprise',
    server: '🖥️ Server',
    desktop: '🖱️ Desktop',
    security: '🛡️ Security',
    live: '💿 Live',
    advanced: '🧠 Advanced',
    containers: '📦 Containers',
    stable: '🏛️ Stable',
  };
  return map[cat] || cat;
}

// ── shared HTML parts ─────────────────────────────────────────────────────────

function head(title, desc, canonical) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${SITE_NAME}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${SITE_URL}${canonical}">
  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}${canonical}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <link rel="stylesheet" href="/linuxverse/assets/style.css">
  <link rel="icon" href="/linuxverse/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>`;
}

function nav(active = '') {
  const links = [
    { href: '/linuxverse/', label: 'Home' },
    { href: '/linuxverse/distros/', label: 'Distros' },
    { href: '/linuxverse/compare/', label: 'Compare' },
    { href: '/linuxverse/quiz/', label: 'Find My Distro' },
  ];
  return `
<nav class="site-nav">
  <div class="nav-inner">
    <a href="/linuxverse/" class="nav-brand">
      <span class="brand-icon">◈</span>
      <span class="brand-name">Linux<span class="brand-accent">Verse</span></span>
    </a>
    <button class="nav-toggle" aria-label="Toggle menu" onclick="document.querySelector('.nav-links').classList.toggle('open')">
      <span></span><span></span><span></span>
    </button>
    <div class="nav-links">
      ${links.map(l => `<a href="${l.href}" class="nav-link${active === l.label ? ' active' : ''}">${l.label}</a>`).join('')}
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme" title="Toggle dark/light mode">☀</button>
    </div>
  </div>
</nav>`;
}

function foot() {
  return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <span class="brand-icon">◈</span> <strong>LinuxVerse</strong>
      <p>An independent Linux distribution discovery platform. Not affiliated with any distribution.</p>
    </div>
    <div class="footer-links">
      <a href="/linuxverse/">Home</a>
      <a href="/linuxverse/distros/">All Distros</a>
      <a href="/linuxverse/compare/">Compare</a>
      <a href="/linuxverse/quiz/">Distro Finder</a>
    </div>
    <div class="footer-meta">
      <p>Data updated automatically via GitHub Actions.</p>
      <p><a href="https://github.com/yourusername/linuxverse">View on GitHub</a></p>
    </div>
  </div>
</footer>
<script src="/linuxverse/assets/main.js"></script>
</body>
</html>`;
}

// ── distro card ───────────────────────────────────────────────────────────────

function distroCard(d, showLink = true) {
  const cats = d.categories.slice(0, 3).map(c => `<span class="tag">${categoryLabel(c)}</span>`).join('');
  const badges = [];
  if (d.beginner_friendly) badges.push('<span class="badge badge-green">Beginner</span>');
  if (d.rolling) badges.push('<span class="badge badge-yellow">Rolling</span>');
  if (d.gaming) badges.push('<span class="badge badge-purple">Gaming</span>');
  if (d.privacy) badges.push('<span class="badge badge-blue">Privacy</span>');

  return `
<div class="distro-card" data-family="${d.family.toLowerCase()}" data-rolling="${d.rolling}" data-beginner="${d.beginner_friendly}" data-gaming="${d.gaming}">
  <div class="card-header">
    <div class="card-logo" aria-hidden="true">${d.name.charAt(0)}</div>
    <div class="card-title">
      <h3>${showLink ? `<a href="/linuxverse/distro/${d.slug}/">${d.name}</a>` : d.name}</h3>
      <div class="card-badges">${badges.join('')}</div>
    </div>
  </div>
  <p class="card-desc">${d.description.slice(0, 120)}…</p>
  <dl class="card-meta">
    <dt>Base</dt><dd>${d.base}</dd>
    <dt>Packages</dt><dd>${d.package_manager}</dd>
    <dt>Model</dt><dd>${d.release_model}</dd>
    <dt>Version</dt><dd>${d.latest_version || 'Rolling'}</dd>
  </dl>
  <div class="card-tags">${cats}</div>
  ${showLink ? `<a href="/linuxverse/distro/${d.slug}/" class="card-cta">View Details →</a>` : ''}
</div>`;
}

// ── INDEX PAGE ────────────────────────────────────────────────────────────────

function buildIndex() {
  const featured = distros.filter(d => d.beginner_friendly).slice(0, 4);
  const gaming = distros.filter(d => d.gaming).slice(0, 4);
  const rolling = distros.filter(d => d.rolling).slice(0, 4);
  const privacy = distros.filter(d => d.privacy).slice(0, 4);

  function section(title, id, subset, moreHref) {
    return `
<section class="home-section">
  <div class="section-header">
    <h2>${title}</h2>
    <a href="${moreHref}" class="see-all">See all →</a>
  </div>
  <div class="card-grid">${subset.map(d => distroCard(d)).join('')}</div>
</section>`;
  }

  const html = `${head('Discover Linux Distributions', 'Find your perfect Linux distribution. Browse, compare, and discover hundreds of Linux distros organized by use case, family, and features.', '/')}
${nav('Home')}

<header class="hero">
  <div class="hero-inner">
    <div class="hero-eyebrow"><span class="mono">$ find /linux --best</span></div>
    <h1>Find Your Perfect<br><span class="hero-accent">Linux Distribution</span></h1>
    <p class="hero-sub">Browse ${distros.length}+ distributions by use case, architecture, and philosophy. From beginner-friendly to bleeding-edge.</p>
    <div class="hero-actions">
      <a href="/linuxverse/quiz/" class="btn btn-primary">Find My Distro →</a>
      <a href="/linuxverse/distros/" class="btn btn-secondary">Browse All</a>
    </div>
  </div>
  <div class="hero-stats">
    <div class="stat"><span class="stat-n">${distros.length}</span><span class="stat-l">Distributions</span></div>
    <div class="stat"><span class="stat-n">${distros.filter(d=>d.rolling).length}</span><span class="stat-l">Rolling Release</span></div>
    <div class="stat"><span class="stat-n">${distros.filter(d=>d.beginner_friendly).length}</span><span class="stat-l">Beginner Friendly</span></div>
    <div class="stat"><span class="stat-n">${distros.filter(d=>d.gaming).length}</span><span class="stat-l">Gaming Ready</span></div>
  </div>
</header>

<main class="home-main">
  <div class="search-bar-wrap">
    <input type="search" class="search-bar" placeholder="Search distributions…" id="search" autocomplete="off" oninput="liveSearch(this.value)">
    <div class="search-filters">
      <button class="filter-btn active" data-filter="all" onclick="filterCards('all',this)">All</button>
      <button class="filter-btn" data-filter="debian" onclick="filterCards('debian',this)">Debian-based</button>
      <button class="filter-btn" data-filter="arch" onclick="filterCards('arch',this)">Arch-based</button>
      <button class="filter-btn" data-filter="independent" onclick="filterCards('independent',this)">Independent</button>
      <button class="filter-btn" data-filter="rolling" onclick="filterCards('rolling',this)">Rolling</button>
      <button class="filter-btn" data-filter="beginner" onclick="filterCards('beginner',this)">Beginner</button>
      <button class="filter-btn" data-filter="gaming" onclick="filterCards('gaming',this)">Gaming</button>
    </div>
  </div>

  <div id="search-results" class="card-grid" style="display:none"></div>

  ${section('🟢 Beginner Friendly', 'beginner', featured, '/linuxverse/distros/?filter=beginner')}
  ${section('🎮 Gaming', 'gaming', gaming, '/linuxverse/distros/?filter=gaming')}
  ${section('🔄 Rolling Release', 'rolling', rolling, '/linuxverse/distros/?filter=rolling')}
  ${section('🔒 Privacy Focused', 'privacy', privacy, '/linuxverse/distros/?filter=privacy')}

  <section class="cta-section">
    <h2>Not sure where to start?</h2>
    <p>Answer 6 quick questions and we'll match you with the right distribution.</p>
    <a href="/linuxverse/quiz/" class="btn btn-primary btn-large">Take the Distro Quiz →</a>
  </section>
</main>

<script>
const DISTROS = ${JSON.stringify(distros)};
function liveSearch(q) {
  const box = document.getElementById('search-results');
  const sections = document.querySelectorAll('.home-section, .cta-section, .search-bar-wrap + .card-grid');
  if (!q.trim()) {
    box.style.display = 'none';
    document.querySelectorAll('.home-section').forEach(s => s.style.display = '');
    return;
  }
  const ql = q.toLowerCase();
  const hits = DISTROS.filter(d =>
    d.name.toLowerCase().includes(ql) ||
    d.family.toLowerCase().includes(ql) ||
    d.package_manager.toLowerCase().includes(ql) ||
    d.categories.some(c => c.includes(ql))
  );
  document.querySelectorAll('.home-section').forEach(s => s.style.display = 'none');
  box.style.display = 'grid';
  box.innerHTML = hits.length
    ? hits.map(d => \`<div class="distro-card"><div class="card-header"><div class="card-logo">\${d.name.charAt(0)}</div><div class="card-title"><h3><a href="/linuxverse/distro/\${d.slug}/">\${d.name}</a></h3></div></div><p class="card-desc">\${d.description.slice(0,120)}…</p><dl class="card-meta"><dt>Base</dt><dd>\${d.base}</dd><dt>Packages</dt><dd>\${d.package_manager}</dd><dt>Model</dt><dd>\${d.release_model}</dd></dl><a href="/linuxverse/distro/\${d.slug}/" class="card-cta">View Details →</a></div>\`).join('')
    : '<p class="no-results">No distributions matched your search.</p>';
}
function filterCards(filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const cards = document.querySelectorAll('.distro-card');
  cards.forEach(c => {
    if (filter === 'all') { c.style.display = ''; return; }
    const show =
      (filter === 'debian' && c.dataset.family === 'debian') ||
      (filter === 'arch' && c.dataset.family === 'arch') ||
      (filter === 'independent' && c.dataset.family === 'independent') ||
      (filter === 'rolling' && c.dataset.rolling === 'true') ||
      (filter === 'beginner' && c.dataset.beginner === 'true') ||
      (filter === 'gaming' && c.dataset.gaming === 'true');
    c.style.display = show ? '' : 'none';
  });
}
</script>

${foot()}`;

  write(`${OUT}/index.html`, html);
}

// ── DISTRO DIRECTORY ──────────────────────────────────────────────────────────

function buildDirectory() {
  const html = `${head('All Linux Distributions', 'Browse and filter all Linux distributions by family, release model, and use case.', '/distros/')}
${nav('Distros')}

<main class="page-main">
  <div class="page-header">
    <h1>Linux Distribution Directory</h1>
    <p>${distros.length} distributions listed</p>
  </div>

  <div class="dir-controls">
    <input type="search" class="search-bar" placeholder="Search distributions…" id="dir-search" oninput="dirSearch(this.value)">
    <div class="search-filters">
      <button class="filter-btn active" data-filter="all" onclick="dirFilter('all',this)">All</button>
      <button class="filter-btn" data-filter="debian" onclick="dirFilter('debian',this)">Debian</button>
      <button class="filter-btn" data-filter="arch" onclick="dirFilter('arch',this)">Arch</button>
      <button class="filter-btn" data-filter="independent" onclick="dirFilter('independent',this)">Independent</button>
      <button class="filter-btn" data-filter="rolling" onclick="dirFilter('rolling',this)">Rolling</button>
      <button class="filter-btn" data-filter="fixed" onclick="dirFilter('fixed',this)">Fixed</button>
      <button class="filter-btn" data-filter="beginner" onclick="dirFilter('beginner',this)">Beginner</button>
      <button class="filter-btn" data-filter="gaming" onclick="dirFilter('gaming',this)">Gaming</button>
      <button class="filter-btn" data-filter="privacy" onclick="dirFilter('privacy',this)">Privacy</button>
      <button class="filter-btn" data-filter="lightweight" onclick="dirFilter('lightweight',this)">Lightweight</button>
    </div>
  </div>

  <div class="card-grid" id="dir-grid">
    ${distros.map(d => distroCard(d)).join('')}
  </div>
  <p class="no-results" id="dir-empty" style="display:none">No distributions matched your filters.</p>
</main>

<script>
function dirSearch(q) {
  const ql = q.toLowerCase();
  document.querySelectorAll('#dir-grid .distro-card').forEach(c => {
    const name = c.querySelector('h3').textContent.toLowerCase();
    c.style.display = (!q || name.includes(ql)) ? '' : 'none';
  });
  checkEmpty();
}
function dirFilter(filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#dir-grid .distro-card').forEach(c => {
    if (filter === 'all') { c.style.display = ''; return; }
    const show =
      (filter === 'debian' && c.dataset.family === 'debian') ||
      (filter === 'arch' && c.dataset.family === 'arch') ||
      (filter === 'independent' && c.dataset.family === 'independent') ||
      (filter === 'rolling' && c.dataset.rolling === 'true') ||
      (filter === 'fixed' && c.dataset.rolling === 'false') ||
      (filter === 'beginner' && c.dataset.beginner === 'true') ||
      (filter === 'gaming' && c.dataset.gaming === 'true') ||
      (filter === 'privacy' && c.dataset.privacy === 'true') ||
      (filter === 'lightweight' && c.dataset.lightweight === 'true');
    c.style.display = show ? '' : 'none';
  });
  checkEmpty();
}
function checkEmpty() {
  const visible = [...document.querySelectorAll('#dir-grid .distro-card')].some(c => c.style.display !== 'none');
  document.getElementById('dir-empty').style.display = visible ? 'none' : 'block';
}
// URL param filter on load
const p = new URLSearchParams(location.search);
if (p.get('filter')) {
  const btn = document.querySelector(\`[data-filter="\${p.get('filter')}"]\`);
  if (btn) dirFilter(p.get('filter'), btn);
}
</script>
${foot()}`;

  write(`${OUT}/distros/index.html`, html);
}

// ── DETAIL PAGES ──────────────────────────────────────────────────────────────

function buildDetail(d) {
  const related = distros.filter(r => d.related.includes(r.slug)).slice(0, 3);
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: d.name,
    url: d.website,
    operatingSystem: 'Linux',
    applicationCategory: 'OperatingSystem',
    description: d.description,
    softwareVersion: d.latest_version,
    datePublished: d.release_date,
  });

  const badges = [];
  if (d.beginner_friendly) badges.push('<span class="badge badge-green badge-lg">Beginner Friendly</span>');
  if (d.rolling) badges.push('<span class="badge badge-yellow badge-lg">Rolling Release</span>');
  if (d.gaming) badges.push('<span class="badge badge-purple badge-lg">Gaming Ready</span>');
  if (d.privacy) badges.push('<span class="badge badge-blue badge-lg">Privacy Focused</span>');
  if (d.lightweight) badges.push('<span class="badge badge-cyan badge-lg">Lightweight</span>');
  if (d.enterprise) badges.push('<span class="badge badge-orange badge-lg">Enterprise</span>');

  const html = `${head(d.name, d.description, `/distro/${d.slug}/`)}
<script type="application/ld+json">${schema}</script>
${nav('Distros')}

<main class="page-main">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="/linuxverse/">Home</a> › <a href="/linuxverse/distros/">Distros</a> › <span>${d.name}</span>
  </nav>

  <div class="detail-hero">
    <div class="detail-logo" aria-hidden="true">${d.name.charAt(0)}</div>
    <div class="detail-title">
      <h1>${d.name}</h1>
      <div class="detail-badges">${badges.join('')}</div>
      <a href="${d.website}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener">Visit Website ↗</a>
    </div>
  </div>

  <div class="detail-grid">
    <section class="detail-main">
      <h2>About ${d.name}</h2>
      <p class="detail-desc">${d.description}</p>

      <h2>Recommended For</h2>
      <ul class="use-cases">
        ${d.recommended_uses.map(u => `<li>${u}</li>`).join('')}
      </ul>
    </section>

    <aside class="detail-sidebar">
      <div class="info-box">
        <h3>Quick Facts</h3>
        <dl class="info-list">
          <dt>Family / Base</dt><dd>${d.family} › ${d.base}</dd>
          <dt>Package Manager</dt><dd><code>${d.package_manager}</code></dd>
          <dt>Release Model</dt><dd>${d.release_model}</dd>
          <dt>Latest Version</dt><dd>${d.latest_version || '—'}</dd>
          <dt>Release Date</dt><dd>${fmtDate(d.release_date)}</dd>
          <dt>Desktop(s)</dt><dd>${d.desktop.join(', ')}</dd>
        </dl>
      </div>

      <div class="info-box">
        <h3>Suitability</h3>
        <div class="suitability-grid">
          ${[
            ['Beginners', d.beginner_friendly],
            ['Gaming', d.gaming],
            ['Privacy', d.privacy],
            ['Lightweight', d.lightweight],
            ['Enterprise', d.enterprise],
            ['Rolling', d.rolling],
          ].map(([label, val]) => `
          <div class="suit-item ${val ? 'suit-yes' : 'suit-no'}">
            <span class="suit-icon">${val ? '✓' : '✗'}</span>
            <span>${label}</span>
          </div>`).join('')}
        </div>
      </div>

      <div class="info-box">
        <h3>Categories</h3>
        <div class="tag-cloud">
          ${d.categories.map(c => `<span class="tag">${categoryLabel(c)}</span>`).join('')}
        </div>
      </div>

      <a href="/linuxverse/compare/?a=${d.slug}" class="btn btn-secondary btn-full">Compare ${d.name} →</a>
    </aside>
  </div>

  ${related.length ? `
  <section class="related-section">
    <h2>Related Distributions</h2>
    <div class="card-grid card-grid-sm">
      ${related.map(r => distroCard(r)).join('')}
    </div>
  </section>` : ''}
</main>
${foot()}`;

  write(`${OUT}/distro/${d.slug}/index.html`, html);
}

// ── QUIZ ─────────────────────────────────────────────────────────────────────

function buildQuiz() {
  const html = `${head('Distro Finder Quiz', 'Answer 6 quick questions to find the perfect Linux distribution for your needs.', '/quiz/')}
${nav('Find My Distro')}

<main class="page-main">
  <div class="page-header">
    <h1>Find Your Linux Distribution</h1>
    <p>Answer a few questions and we'll match you with the right distro.</p>
  </div>

  <div class="quiz-wrap" id="quiz">
    <div class="quiz-progress"><div class="quiz-bar" id="quiz-bar"></div></div>

    <div class="quiz-step active" data-step="0">
      <h2>How would you describe your Linux experience?</h2>
      <div class="quiz-options">
        <button class="quiz-opt" data-key="beginner" data-val="true" onclick="pick(this)">🌱 Complete beginner — I've never used Linux</button>
        <button class="quiz-opt" data-key="beginner" data-val="maybe" onclick="pick(this)">🌿 Some experience — I've tried Linux before</button>
        <button class="quiz-opt" data-key="beginner" data-val="false" onclick="pick(this)">🌳 Experienced — I'm comfortable with the terminal</button>
      </div>
    </div>

    <div class="quiz-step" data-step="1">
      <h2>Will you use this for gaming?</h2>
      <div class="quiz-options">
        <button class="quiz-opt" data-key="gaming" data-val="true" onclick="pick(this)">🎮 Yes, gaming is important to me</button>
        <button class="quiz-opt" data-key="gaming" data-val="false" onclick="pick(this)">🖥️ No, productivity / work is my focus</button>
      </div>
    </div>

    <div class="quiz-step" data-step="2">
      <h2>Is privacy and anonymity a priority?</h2>
      <div class="quiz-options">
        <button class="quiz-opt" data-key="privacy" data-val="true" onclick="pick(this)">🔒 Yes — I need maximum privacy</button>
        <button class="quiz-opt" data-key="privacy" data-val="false" onclick="pick(this)">🔓 No — standard security is fine</button>
      </div>
    </div>

    <div class="quiz-step" data-step="3">
      <h2>Are you a developer or software engineer?</h2>
      <div class="quiz-options">
        <button class="quiz-opt" data-key="developer" data-val="true" onclick="pick(this)">💻 Yes — I write code regularly</button>
        <button class="quiz-opt" data-key="developer" data-val="false" onclick="pick(this)">📝 No — general use</button>
      </div>
    </div>

    <div class="quiz-step" data-step="4">
      <h2>What hardware will you install this on?</h2>
      <div class="quiz-options">
        <button class="quiz-opt" data-key="lightweight" data-val="true" onclick="pick(this)">🐢 Old or low-spec hardware (< 4GB RAM)</button>
        <button class="quiz-opt" data-key="lightweight" data-val="false" onclick="pick(this)">🚀 Modern hardware — no constraints</button>
      </div>
    </div>

    <div class="quiz-step" data-step="5">
      <h2>Do you prefer always-up-to-date software or rock-solid stability?</h2>
      <div class="quiz-options">
        <button class="quiz-opt" data-key="rolling" data-val="true" onclick="pick(this)">🔄 Rolling release — latest packages always</button>
        <button class="quiz-opt" data-key="rolling" data-val="false" onclick="pick(this)">🏛️ Fixed release — tested, stable updates</button>
      </div>
    </div>

    <div class="quiz-result" id="quiz-result" style="display:none">
      <h2>Your Recommendations</h2>
      <p class="result-sub">Based on your answers, here are the best Linux distributions for you:</p>
      <div class="card-grid" id="result-cards"></div>
      <button class="btn btn-secondary" onclick="restartQuiz()">↩ Start Over</button>
    </div>
  </div>
</main>

<script>
const DISTROS = ${JSON.stringify(distros)};
const answers = {};
let step = 0;
const TOTAL = 6;

function pick(btn) {
  answers[btn.dataset.key] = btn.dataset.val;
  step++;
  const bar = document.getElementById('quiz-bar');
  bar.style.width = (step / TOTAL * 100) + '%';
  const steps = document.querySelectorAll('.quiz-step');
  steps[step - 1].classList.remove('active');
  if (step < TOTAL) {
    steps[step].classList.add('active');
  } else {
    showResults();
  }
}

function score(d) {
  let s = 0;
  if (answers.beginner === 'true' && d.beginner_friendly) s += 3;
  if (answers.beginner === 'true' && !d.beginner_friendly) s -= 5;
  if (answers.beginner === 'false' && !d.beginner_friendly) s += 1;
  if (answers.gaming === 'true' && d.gaming) s += 3;
  if (answers.privacy === 'true' && d.privacy) s += 4;
  if (answers.developer === 'true' && d.categories.includes('developer')) s += 2;
  if (answers.lightweight === 'true' && d.lightweight) s += 3;
  if (answers.lightweight === 'true' && !d.lightweight) s -= 2;
  if (answers.rolling === 'true' && d.rolling) s += 2;
  if (answers.rolling === 'false' && !d.rolling) s += 2;
  return s;
}

function showResults() {
  const ranked = [...DISTROS].sort((a, b) => score(b) - score(a)).slice(0, 4);
  const cards = document.getElementById('result-cards');
  cards.innerHTML = ranked.map(d => \`
    <div class="distro-card">
      <div class="card-header">
        <div class="card-logo">\${d.name.charAt(0)}</div>
        <div class="card-title"><h3><a href="/linuxverse/distro/\${d.slug}/">\${d.name}</a></h3></div>
      </div>
      <p class="card-desc">\${d.description.slice(0, 120)}…</p>
      <dl class="card-meta">
        <dt>Base</dt><dd>\${d.base}</dd>
        <dt>Packages</dt><dd>\${d.package_manager}</dd>
        <dt>Model</dt><dd>\${d.release_model}</dd>
      </dl>
      <a href="/linuxverse/distro/\${d.slug}/" class="card-cta">Learn More →</a>
    </div>\`).join('');
  document.getElementById('quiz-result').style.display = 'block';
}

function restartQuiz() {
  Object.keys(answers).forEach(k => delete answers[k]);
  step = 0;
  document.getElementById('quiz-bar').style.width = '0';
  document.querySelectorAll('.quiz-step').forEach((s, i) => {
    s.classList.toggle('active', i === 0);
  });
  document.getElementById('quiz-result').style.display = 'none';
}
</script>
${foot()}`;

  write(`${OUT}/quiz/index.html`, html);
}

// ── COMPARE ───────────────────────────────────────────────────────────────────

function buildCompare() {
  const opts = distros.map(d => `<option value="${d.slug}">${d.name}</option>`).join('');
  const html = `${head('Compare Linux Distributions', 'Compare up to 4 Linux distributions side-by-side by package manager, desktop, release model, and more.', '/compare/')}
${nav('Compare')}

<main class="page-main">
  <div class="page-header">
    <h1>Compare Distributions</h1>
    <p>Select up to 4 distributions to compare side-by-side.</p>
  </div>

  <div class="compare-selectors">
    ${[0, 1, 2, 3].map(i => `
    <div class="compare-slot">
      <label for="cmp${i}">Distro ${i + 1}</label>
      <select id="cmp${i}" onchange="renderTable()">
        <option value="">— Select —</option>
        ${opts}
      </select>
    </div>`).join('')}
  </div>

  <div id="compare-table"></div>
</main>

<script>
const DISTROS = ${JSON.stringify(distros)};
const BY_SLUG = Object.fromEntries(DISTROS.map(d => [d.slug, d]));

// Pre-select from URL params
const p = new URLSearchParams(location.search);
const slugs = ['a','b','c','d'];
slugs.forEach((key, i) => {
  if (p.get(key)) document.getElementById('cmp' + i).value = p.get(key);
});

function renderTable() {
  const selected = [0,1,2,3]
    .map(i => BY_SLUG[document.getElementById('cmp' + i).value])
    .filter(Boolean);
  const box = document.getElementById('compare-table');
  if (selected.length < 2) {
    box.innerHTML = '<p class="hint">Select at least 2 distributions to compare.</p>';
    return;
  }
  const rows = [
    ['Family', d => d.family],
    ['Base', d => d.base],
    ['Package Manager', d => \`<code>\${d.package_manager}</code>\`],
    ['Desktop(s)', d => d.desktop.join(', ')],
    ['Release Model', d => d.release_model],
    ['Latest Version', d => d.latest_version || 'Rolling'],
    ['Beginner Friendly', d => d.beginner_friendly ? '✅ Yes' : '❌ No'],
    ['Gaming', d => d.gaming ? '✅ Yes' : '❌ No'],
    ['Privacy Focused', d => d.privacy ? '✅ Yes' : '❌ No'],
    ['Lightweight', d => d.lightweight ? '✅ Yes' : '❌ No'],
    ['Enterprise', d => d.enterprise ? '✅ Yes' : '❌ No'],
    ['Rolling Release', d => d.rolling ? '✅ Yes' : '❌ No'],
  ];

  box.innerHTML = \`
  <div class="compare-table-wrap">
    <table class="compare-table">
      <thead>
        <tr>
          <th>Feature</th>
          \${selected.map(d => \`<th><a href="/linuxverse/distro/\${d.slug}/">\${d.name}</a></th>\`).join('')}
        </tr>
      </thead>
      <tbody>
        \${rows.map(([label, fn]) => \`
        <tr>
          <td class="row-label">\${label}</td>
          \${selected.map(d => \`<td>\${fn(d)}</td>\`).join('')}
        </tr>\`).join('')}
      </tbody>
    </table>
  </div>
  \`;
}
renderTable();
</script>
${foot()}`;

  write(`${OUT}/compare/index.html`, html);
}

// ── SITEMAP + ROBOTS ──────────────────────────────────────────────────────────

function buildSitemap() {
  const urls = [
    { loc: '/', priority: '1.0' },
    { loc: '/distros/', priority: '0.9' },
    { loc: '/compare/', priority: '0.8' },
    { loc: '/quiz/', priority: '0.8' },
    ...distros.map(d => ({ loc: `/distro/${d.slug}/`, priority: '0.7', lastmod: d.release_date || new Date().toISOString().split('T')[0] })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <priority>${u.priority}</priority>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;
  write(`${OUT}/sitemap.xml`, xml);

  const robots = `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  write(`${OUT}/robots.txt`, robots);
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildCSS() {
  const css = `/* LinuxVerse — Terminal-inspired design system */
:root {
  --bg: #0d1117;
  --bg2: #161b22;
  --bg3: #21262d;
  --border: #30363d;
  --text: #e6edf3;
  --text2: #8b949e;
  --accent: #58a6ff;
  --accent2: #3fb950;
  --accent3: #d2a8ff;
  --accent4: #ffa657;
  --accent5: #79c0ff;
  --danger: #f85149;
  --mono: 'JetBrains Mono', monospace;
  --sans: 'Inter', system-ui, sans-serif;
  --radius: 8px;
  --radius-sm: 4px;
  --shadow: 0 1px 3px rgba(0,0,0,.4);
  --shadow-lg: 0 4px 16px rgba(0,0,0,.5);
  --transition: 0.15s ease;
}
[data-theme="light"] {
  --bg: #f6f8fa;
  --bg2: #ffffff;
  --bg3: #f0f2f4;
  --border: #d0d7de;
  --text: #1f2328;
  --text2: #656d76;
  --shadow: 0 1px 3px rgba(0,0,0,.12);
  --shadow-lg: 0 4px 16px rgba(0,0,0,.15);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--sans); background: var(--bg); color: var(--text); line-height: 1.6; min-height: 100vh; display: flex; flex-direction: column; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code { font-family: var(--mono); background: var(--bg3); padding: 2px 6px; border-radius: var(--radius-sm); font-size: .85em; }
.mono { font-family: var(--mono); }

/* NAV */
.site-nav { background: var(--bg2); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
.nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; display: flex; align-items: center; gap: 1rem; height: 56px; }
.nav-brand { display: flex; align-items: center; gap: .5rem; color: var(--text); font-weight: 700; font-size: 1.1rem; text-decoration: none; }
.brand-icon { color: var(--accent); font-size: 1.4rem; }
.brand-accent { color: var(--accent); }
.nav-links { display: flex; align-items: center; gap: .25rem; margin-left: auto; }
.nav-link { color: var(--text2); padding: .4rem .75rem; border-radius: var(--radius-sm); font-size: .9rem; font-weight: 500; transition: color var(--transition), background var(--transition); }
.nav-link:hover, .nav-link.active { color: var(--text); background: var(--bg3); text-decoration: none; }
.nav-toggle { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: .5rem; }
.nav-toggle span { display: block; width: 20px; height: 2px; background: var(--text2); border-radius: 2px; }
.theme-toggle { background: none; border: 1px solid var(--border); color: var(--text2); cursor: pointer; border-radius: var(--radius-sm); padding: .3rem .6rem; font-size: 1rem; margin-left: .5rem; transition: border-color var(--transition); }
.theme-toggle:hover { border-color: var(--accent); color: var(--accent); }

/* HERO */
.hero { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 4rem 1.5rem 3rem; }
.hero-inner { max-width: 1200px; margin: 0 auto; }
.hero-eyebrow { color: var(--accent); font-family: var(--mono); font-size: .85rem; margin-bottom: 1rem; opacity: .8; }
.hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 700; line-height: 1.15; margin-bottom: 1.25rem; }
.hero-accent { color: var(--accent); }
.hero-sub { color: var(--text2); font-size: 1.1rem; max-width: 600px; margin-bottom: 2rem; }
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem; }
.hero-stats { display: flex; gap: 2.5rem; flex-wrap: wrap; border-top: 1px solid var(--border); padding-top: 2rem; }
.stat { display: flex; flex-direction: column; }
.stat-n { font-size: 2rem; font-weight: 700; color: var(--accent); font-family: var(--mono); }
.stat-l { font-size: .8rem; color: var(--text2); text-transform: uppercase; letter-spacing: .05em; }

/* BUTTONS */
.btn { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem 1.25rem; border-radius: var(--radius); font-weight: 600; font-size: .9rem; transition: all var(--transition); cursor: pointer; border: 1px solid transparent; text-decoration: none; }
.btn:hover { text-decoration: none; }
.btn-primary { background: var(--accent); color: #0d1117; border-color: var(--accent); }
.btn-primary:hover { filter: brightness(1.1); }
.btn-secondary { background: var(--bg3); color: var(--text); border-color: var(--border); }
.btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
.btn-sm { padding: .35rem .8rem; font-size: .8rem; }
.btn-large { padding: .85rem 1.75rem; font-size: 1rem; }
.btn-full { width: 100%; justify-content: center; }

/* SEARCH */
.search-bar-wrap { max-width: 1200px; margin: 0 auto 2rem; padding: 0 1.5rem; }
.dir-controls { max-width: 1200px; margin: 0 auto 2rem; padding: 0 1.5rem; }
.search-bar { width: 100%; padding: .75rem 1rem; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font-size: 1rem; margin-bottom: 1rem; transition: border-color var(--transition); }
.search-bar:focus { outline: none; border-color: var(--accent); }
.search-filters { display: flex; gap: .5rem; flex-wrap: wrap; }
.filter-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text2); padding: .35rem .8rem; border-radius: var(--radius-sm); font-size: .8rem; cursor: pointer; transition: all var(--transition); }
.filter-btn:hover { border-color: var(--accent); color: var(--accent); }
.filter-btn.active { background: var(--accent); color: #0d1117; border-color: var(--accent); font-weight: 600; }

/* CARDS */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
.card-grid-sm { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.distro-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; display: flex; flex-direction: column; gap: .75rem; transition: border-color var(--transition), box-shadow var(--transition); }
.distro-card:hover { border-color: var(--accent); box-shadow: var(--shadow-lg); }
.card-header { display: flex; align-items: flex-start; gap: .75rem; }
.card-logo { width: 44px; height: 44px; border-radius: var(--radius-sm); background: var(--bg3); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; color: var(--accent); flex-shrink: 0; font-family: var(--mono); }
.card-title h3 { font-size: .95rem; font-weight: 600; line-height: 1.3; }
.card-title h3 a { color: var(--text); }
.card-title h3 a:hover { color: var(--accent); text-decoration: none; }
.card-badges { display: flex; gap: .35rem; flex-wrap: wrap; margin-top: .3rem; }
.card-desc { font-size: .82rem; color: var(--text2); line-height: 1.5; flex: 1; }
.card-meta { display: grid; grid-template-columns: auto 1fr; gap: .2rem .75rem; font-size: .78rem; }
.card-meta dt { color: var(--text2); }
.card-meta dd { color: var(--text); font-weight: 500; }
.card-tags { display: flex; gap: .35rem; flex-wrap: wrap; }
.card-cta { color: var(--accent); font-size: .82rem; font-weight: 600; margin-top: auto; }
.card-cta:hover { text-decoration: underline; }

/* BADGES */
.badge { font-size: .68rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; text-transform: uppercase; letter-spacing: .03em; }
.badge-lg { font-size: .75rem; padding: 3px 10px; }
.badge-green { background: rgba(63,185,80,.15); color: var(--accent2); border: 1px solid rgba(63,185,80,.3); }
.badge-yellow { background: rgba(255,166,87,.15); color: var(--accent4); border: 1px solid rgba(255,166,87,.3); }
.badge-purple { background: rgba(210,168,255,.15); color: var(--accent3); border: 1px solid rgba(210,168,255,.3); }
.badge-blue { background: rgba(88,166,255,.15); color: var(--accent5); border: 1px solid rgba(88,166,255,.3); }
.badge-cyan { background: rgba(121,192,255,.15); color: #79c0ff; border: 1px solid rgba(121,192,255,.3); }
.badge-orange { background: rgba(255,166,87,.15); color: #ffa657; border: 1px solid rgba(255,166,87,.3); }

/* TAGS */
.tag { font-size: .73rem; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 2px 8px; color: var(--text2); }

/* SECTIONS */
.home-main, .page-main { max-width: 1200px; margin: 0 auto; padding: 2.5rem 1.5rem; flex: 1; width: 100%; }
.home-section { margin-bottom: 3rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding: 0 1.5rem; }
.section-header h2 { font-size: 1.2rem; font-weight: 700; }
.see-all { font-size: .85rem; color: var(--accent); }
.page-header { margin-bottom: 2rem; }
.page-header h1 { font-size: 2rem; font-weight: 700; margin-bottom: .5rem; }
.page-header p { color: var(--text2); }
.cta-section { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 3rem 2rem; text-align: center; margin: 2rem 1.5rem; }
.cta-section h2 { font-size: 1.6rem; font-weight: 700; margin-bottom: .75rem; }
.cta-section p { color: var(--text2); margin-bottom: 1.5rem; }
.no-results { text-align: center; color: var(--text2); padding: 3rem; grid-column: 1/-1; }
.hint { text-align: center; color: var(--text2); padding: 2rem; }

/* DETAIL PAGE */
.breadcrumb { font-size: .83rem; color: var(--text2); margin-bottom: 2rem; }
.breadcrumb a { color: var(--text2); }
.breadcrumb a:hover { color: var(--accent); }
.breadcrumb span { color: var(--text); }
.detail-hero { display: flex; align-items: flex-start; gap: 1.5rem; margin-bottom: 2.5rem; flex-wrap: wrap; }
.detail-logo { width: 80px; height: 80px; border-radius: var(--radius); background: var(--bg2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: var(--accent); font-family: var(--mono); flex-shrink: 0; }
.detail-title h1 { font-size: 2rem; font-weight: 700; margin-bottom: .5rem; }
.detail-badges { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .75rem; }
.detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; margin-bottom: 3rem; }
.detail-main h2 { font-size: 1.15rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: .75rem; border-bottom: 1px solid var(--border); padding-bottom: .5rem; }
.detail-main h2:first-child { margin-top: 0; }
.detail-desc { color: var(--text2); line-height: 1.7; }
.use-cases { list-style: none; display: flex; flex-direction: column; gap: .5rem; }
.use-cases li::before { content: '→ '; color: var(--accent); font-weight: 700; }
.detail-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }
.info-box { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; }
.info-box h3 { font-size: .85rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text2); margin-bottom: 1rem; }
.info-list { display: grid; grid-template-columns: auto 1fr; gap: .4rem .75rem; font-size: .85rem; }
.info-list dt { color: var(--text2); }
.info-list dd { color: var(--text); font-weight: 500; }
.suitability-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.suit-item { display: flex; align-items: center; gap: .5rem; font-size: .82rem; padding: .4rem .6rem; border-radius: var(--radius-sm); }
.suit-yes { background: rgba(63,185,80,.1); color: var(--accent2); }
.suit-no { background: var(--bg3); color: var(--text2); }
.suit-icon { font-weight: 700; }
.tag-cloud { display: flex; flex-wrap: wrap; gap: .4rem; }
.related-section { margin-top: 2rem; }
.related-section h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 1.25rem; }

/* QUIZ */
.quiz-wrap { max-width: 680px; margin: 0 auto; }
.quiz-progress { height: 4px; background: var(--bg3); border-radius: 2px; margin-bottom: 2.5rem; overflow: hidden; }
.quiz-bar { height: 100%; background: var(--accent); border-radius: 2px; transition: width .3s ease; width: 0; }
.quiz-step { display: none; }
.quiz-step.active { display: block; }
.quiz-step h2 { font-size: 1.35rem; font-weight: 700; margin-bottom: 1.5rem; }
.quiz-options { display: flex; flex-direction: column; gap: .75rem; }
.quiz-opt { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; text-align: left; color: var(--text); font-size: .95rem; cursor: pointer; transition: all var(--transition); }
.quiz-opt:hover { border-color: var(--accent); background: var(--bg3); color: var(--accent); }
.quiz-result { margin-top: 2rem; }
.quiz-result h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: .5rem; }
.result-sub { color: var(--text2); margin-bottom: 1.5rem; }
.quiz-result .btn { margin-top: 2rem; }

/* COMPARE */
.compare-selectors { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.compare-slot label { display: block; font-size: .8rem; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .05em; margin-bottom: .4rem; }
.compare-slot select { width: 100%; padding: .6rem .75rem; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font-size: .9rem; cursor: pointer; }
.compare-slot select:focus { outline: none; border-color: var(--accent); }
.compare-table-wrap { overflow-x: auto; }
.compare-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.compare-table th, .compare-table td { padding: .75rem 1rem; border: 1px solid var(--border); text-align: left; }
.compare-table th { background: var(--bg2); font-weight: 700; color: var(--text2); text-transform: uppercase; font-size: .75rem; letter-spacing: .05em; }
.compare-table th:first-child, .compare-table td.row-label { background: var(--bg3); font-weight: 600; width: 160px; }
.compare-table tr:nth-child(even) td { background: rgba(255,255,255,.02); }

/* FOOTER */
.site-footer { background: var(--bg2); border-top: 1px solid var(--border); margin-top: auto; padding: 3rem 1.5rem; }
.footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 2rem; }
.footer-brand p { color: var(--text2); font-size: .85rem; margin-top: .5rem; }
.footer-links { display: flex; flex-direction: column; gap: .5rem; }
.footer-links a { color: var(--text2); font-size: .88rem; }
.footer-links a:hover { color: var(--accent); }
.footer-meta p { color: var(--text2); font-size: .8rem; line-height: 1.7; }
.footer-meta a { color: var(--text2); }

@media (max-width: 900px) {
  .detail-grid { grid-template-columns: 1fr; }
  .footer-inner { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .nav-links { display: none; flex-direction: column; position: absolute; top: 56px; left: 0; right: 0; background: var(--bg2); border-bottom: 1px solid var(--border); padding: 1rem; gap: .25rem; }
  .nav-links.open { display: flex; }
  .nav-toggle { display: flex; margin-left: auto; }
  .hero { padding: 2.5rem 1.5rem 2rem; }
  .hero-stats { gap: 1.5rem; }
  .section-header { padding: 0; }
  .card-grid { padding: 0; }
  .cta-section { margin: 2rem 0; }
  .footer-inner { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}`;

  ensureDir(`${OUT}/assets`);
  write(`${OUT}/assets/style.css`, css);
}

// ── JS ────────────────────────────────────────────────────────────────────────

function buildJS() {
  const js = `// LinuxVerse main.js
(function () {
  // Theme persistence
  const saved = localStorage.getItem('lv-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  window.toggleTheme = function () {
    const curr = document.documentElement.getAttribute('data-theme');
    const next = curr === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lv-theme', next);
    document.querySelector('.theme-toggle').textContent = next === 'dark' ? '☀' : '🌙';
  };

  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = saved === 'dark' ? '☀' : '🌙';
})();`;

  write(`${OUT}/assets/main.js`, js);
}

// ── FAVICON ───────────────────────────────────────────────────────────────────

function buildFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0d1117"/>
  <text x="16" y="22" text-anchor="middle" font-family="monospace" font-size="18" fill="#58a6ff">◈</text>
</svg>`;
  write(`${OUT}/assets/favicon.svg`, svg);
}

// ── 404 ───────────────────────────────────────────────────────────────────────

function build404() {
  const html = `${head('Page Not Found', 'The page you are looking for does not exist.', '/404')}
${nav()}
<main class="page-main" style="text-align:center;padding:6rem 1.5rem">
  <div style="font-size:4rem;margin-bottom:1rem;font-family:var(--mono);color:var(--accent)">404</div>
  <h1 style="margin-bottom:.75rem">Page not found</h1>
  <p style="color:var(--text2);margin-bottom:2rem">The distribution or page you're looking for doesn't exist.</p>
  <a href="/linuxverse/" class="btn btn-primary">← Back to Home</a>
</main>
${foot()}`;
  write(`${OUT}/404.html`, html);
}

// ── NOJEKYLL ─────────────────────────────────────────────────────────────────

function buildNojekyll() {
  write(`${OUT}/.nojekyll`, '');
}

// ── RUN ───────────────────────────────────────────────────────────────────────

console.log('\n🔨  LinuxVerse Static Site Builder\n');
ensureDir(OUT);
buildCSS();
buildJS();
buildFavicon();
buildIndex();
buildDirectory();
distros.forEach(d => buildDetail(d));
buildQuiz();
buildCompare();
buildSitemap();
build404();
buildNojekyll();
console.log(`\n✅  Built ${distros.length} distro pages + core pages → ./${OUT}/\n`);
