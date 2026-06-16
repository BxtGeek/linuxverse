#!/usr/bin/env node
/**
 * LinuxVerse — Auto-update distro versions
 * Runs monthly via GitHub Actions.
 * Fetches latest release info from public APIs and websites.
 */

const fs = require('fs');
const https = require('https');

const DATA_FILE = 'src/data/distros.json';
const distros = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// ── helpers ────────────────────────────────────────────────────────────────

function get(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'LinuxVerse-Bot/1.0 (https://github.com/yourusername/linuxverse)',
        Accept: 'application/json',
        ...(process.env.GITHUB_TOKEN && url.includes('api.github.com')
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      ...opts,
    };
    https.get(url, options, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function today() { return new Date().toISOString().split('T')[0]; }

// ── per-distro fetchers ────────────────────────────────────────────────────

const FETCHERS = {
  // GitHub Releases API — pass owner/repo
  github: async (owner, repo) => {
    const data = await get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
    if (!data || !data.tag_name) return null;
    return {
      latest_version: data.tag_name.replace(/^v/, ''),
      release_date: (data.published_at || '').split('T')[0],
    };
  },

  // Alpine Linux — public JSON endpoint
  alpine: async () => {
    const data = await get('https://dl-cdn.alpinelinux.org/alpine/latest-stable/releases/x86_64/latest-releases.yaml');
    // YAML not parsed here; fall back to known stable pattern
    return null;
  },
};

// Map slug → async function returning { latest_version, release_date } | null
const SLUG_FETCHERS = {
  'ubuntu':              () => FETCHERS.github('nicowillis', 'ubuntu-release-info').catch(() => null),
  'arch-linux':         async () => {
    const d = await get('https://archlinux.org/releng/releases/json/');
    if (!d || !d.releases || !d.releases.length) return null;
    const r = d.releases[0];
    return { latest_version: r.version, release_date: r.release_date };
  },
  'fedora':             async () => {
    const d = await get('https://openqa.fedoraproject.org/api/v1/products?name=Fedora&arch=x86_64&maxcount=1');
    return null; // fallback — leave existing data
  },
  'kali-linux':         async () => {
    const d = await get('https://api.github.com/repos/offensive-security/kali-linux-releases/releases/latest').catch(() => null);
    return d ? { latest_version: d.tag_name, release_date: (d.published_at||'').split('T')[0] } : null;
  },
  'nixos':              async () => {
    const d = await get('https://api.github.com/repos/NixOS/nixpkgs/releases/latest').catch(() => null);
    return d ? { latest_version: d.tag_name, release_date: (d.published_at||'').split('T')[0] } : null;
  },
  'tails':              async () => {
    const d = await get('https://tails.boum.org/install/v2/Tails/amd64/stable/latest.json').catch(() => null);
    if (!d) return null;
    return { latest_version: d.version, release_date: d.release_date };
  },
  'manjaro':            async () => {
    const d = await get('https://api.github.com/repos/manjaro/release-info/releases/latest').catch(() => null);
    return d ? { latest_version: d.tag_name, release_date: (d.published_at||'').split('T')[0] } : null;
  },
  'alpine-linux':       async () => {
    const d = await get('https://api.github.com/repos/alpinelinux/aports/tags?per_page=1').catch(() => null);
    if (!d || !d.length) return null;
    return { latest_version: d[0].name.replace(/^v/, ''), release_date: today() };
  },
  'endeavouros':        async () => {
    const d = await get('https://api.github.com/repos/endeavouros-team/EndeavourOS-ISO/releases/latest').catch(() => null);
    return d ? { latest_version: d.tag_name, release_date: (d.published_at||'').split('T')[0] } : null;
  },
  'garuda-linux':       async () => {
    const d = await get('https://api.github.com/repos/dr460nf1r3/garuda-update/releases/latest').catch(() => null);
    return null;
  },
  'nobara':             async () => {
    const d = await get('https://api.github.com/repos/GloriousEggroll/nobara-images/releases/latest').catch(() => null);
    return d ? { latest_version: d.tag_name, release_date: (d.published_at||'').split('T')[0] } : null;
  },
};

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔄  Checking for distro updates...\n');
  let updated = 0;

  for (const d of distros) {
    const fetcher = SLUG_FETCHERS[d.slug];
    if (!fetcher) {
      console.log(`  ⬜ ${d.name} — no fetcher configured`);
      continue;
    }

    try {
      const info = await fetcher();
      await sleep(500); // be polite to APIs

      if (!info) {
        console.log(`  ⬜ ${d.name} — no data returned`);
        continue;
      }

      let changed = false;
      if (info.latest_version && info.latest_version !== d.latest_version) {
        console.log(`  ✅ ${d.name}: ${d.latest_version} → ${info.latest_version}`);
        d.latest_version = info.latest_version;
        changed = true;
      }
      if (info.release_date && info.release_date !== d.release_date) {
        d.release_date = info.release_date;
        changed = true;
      }
      if (changed) updated++;
      else console.log(`  — ${d.name}: already up-to-date`);
    } catch (err) {
      console.warn(`  ⚠️  ${d.name}: ${err.message}`);
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(distros, null, 2) + '\n', 'utf8');
  console.log(`\n✅  Done. ${updated} distros updated.\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
