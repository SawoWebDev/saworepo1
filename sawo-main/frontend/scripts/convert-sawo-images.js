'use strict';

const path  = require('path');
const fs    = require('fs');
const https = require('https');
const http  = require('http');

// ── CONFIG ────────────────────────────────────────────────────────────────────

const FRONTEND_ROOT = path.resolve(__dirname, '..');
const SRC_DIR       = path.join(FRONTEND_ROOT, 'src');
const ASSETS_DIR    = path.join(SRC_DIR, 'assets');

const SCAN_EXTENSIONS  = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html']);
const IMAGE_EXTENSIONS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg']);
const CSS_EXTENSIONS   = new Set(['.css', '.scss']);

// Matches https://www.sawo.com/wp-content/uploads/... and subdomains
const SAWO_URL_RE =
  /https?:\/\/(?:[\w-]+\.)*sawo\.com\/wp-content\/uploads\/[^\s"'`()\[\]<>\\]+/g;

const DOWNLOAD_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS       = 5;
const DOWNLOAD_DELAY_MS   = 200;

const report = {
  totalOccurrences : 0,
  uniqueUrls       : 0,
  downloaded       : 0,
  skipped          : 0,
  failed           : [],
  filesModified    : 0,
  remaining        : 0,
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isImageUrl(url) {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return IMAGE_EXTENSIONS.has(ext);
  } catch {
    return false;
  }
}

function detectLineEnding(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Derive a safe JS identifier from a URL
function urlToVarName(url, usedNames) {
  const basename = path.basename(new URL(url).pathname);
  const stem     = basename.replace(/\.[^.]+$/, '');
  let   name     = 'img_' + stem.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  if (!usedNames.has(name)) { usedNames.add(name); return name; }
  let n = 2;
  while (usedNames.has(`${name}_${n}`)) n++;
  usedNames.add(`${name}_${n}`);
  return `${name}_${n}`;
}

// Derive the local .webp filename from a URL, handling stem collisions across URLs
function urlToOutputFilename(url, claimedMap) {
  const basename = path.basename(new URL(url).pathname);
  const stem     = basename.replace(/\.[^.]+$/, '');
  let   candidate = stem + '.webp';

  if (!claimedMap.has(candidate) || claimedMap.get(candidate) === url) {
    claimedMap.set(candidate, url);
    return candidate;
  }
  let n = 2;
  while (claimedMap.has(`${stem}_${n}.webp`) && claimedMap.get(`${stem}_${n}.webp`) !== url) n++;
  const result = `${stem}_${n}.webp`;
  claimedMap.set(result, url);
  return result;
}

// ── PHASE 1: SCAN ─────────────────────────────────────────────────────────────

function walkDir(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

function scanAllFiles() {
  const fileUrlMap = new Map(); // filePath → Set<url>
  const allUrls    = new Set();

  for (const filePath of walkDir(SRC_DIR)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [...content.matchAll(SAWO_URL_RE)]
      .map((m) => m[0])
      .filter(isImageUrl);

    if (matches.length === 0) continue;

    const urlSet = new Set(matches);
    fileUrlMap.set(filePath, urlSet);
    report.totalOccurrences += matches.length;
    for (const u of urlSet) allUrls.add(u);
  }

  report.uniqueUrls = allUrls.size;
  return { fileUrlMap, allUrls };
}

// ── PHASE 2: DOWNLOAD & CONVERT ───────────────────────────────────────────────

// Copy a file using streams (fallback when sharp unavailable and src is already .webp)
function copyFile(src, dest) {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(src);
    const ws = fs.createWriteStream(dest);
    rs.pipe(ws);
    ws.on('finish', resolve);
    ws.on('error', reject);
    rs.on('error', reject);
  });
}

function downloadFile(url, destPath, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft < 0) return reject(new Error('Too many redirects'));

    const proto = url.startsWith('https') ? https : http;
    const req   = proto.get(url, { timeout: DOWNLOAD_TIMEOUT_MS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return downloadFile(res.headers.location, destPath, redirectsLeft - 1)
          .then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const ws = fs.createWriteStream(destPath);
      res.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout (${DOWNLOAD_TIMEOUT_MS}ms)`)); });
  });
}

async function downloadAndConvert(allUrls, sharp /* may be null */) {
  const urlToFilename = new Map(); // url → localWebpFilename
  const claimedMap    = new Map(); // outputName → url (collision tracking)

  for (const url of allUrls) {
    let outputName = urlToOutputFilename(url, claimedMap);
    let targetPath = path.join(ASSETS_DIR, outputName);
    const tempPath = path.join(ASSETS_DIR, '__tmp_' + outputName);

    // Skip if the .webp already exists in assets
    if (fs.existsSync(targetPath)) {
      console.log(`  [SKIP] ${outputName} already exists`);
      report.skipped++;
      urlToFilename.set(url, outputName);
      await sleep(DOWNLOAD_DELAY_MS);
      continue;
    }

    const srcExt = path.extname(new URL(url).pathname).toLowerCase();
    try {
      process.stdout.write(`  [DL]   ${url.split('/').pop()} ... `);
      await downloadFile(url, tempPath);
      if (sharp) {
        await sharp(tempPath).webp({ quality: 85 }).toFile(targetPath);
      } else if (srcExt === '.webp') {
        // No sharp: already webp, just copy
        await copyFile(tempPath, targetPath);
      } else {
        // No sharp, non-webp source: save as original extension instead
        const fallbackPath = targetPath.replace(/\.webp$/, srcExt);
        await copyFile(tempPath, fallbackPath);
        // Update outputName so the import path stays correct
        outputName = path.basename(fallbackPath);
        urlToFilename.set(url, outputName); // pre-set; will be set again below but that's fine
        console.log(`OK (no sharp — kept as ${srcExt})`);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        report.downloaded++;
        await sleep(DOWNLOAD_DELAY_MS);
        continue;
      }
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.log('OK');
      report.downloaded++;
      urlToFilename.set(url, outputName);
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.log(`FAIL — ${err.message}`);
      report.failed.push({ url, reason: err.message });
    }

    await sleep(DOWNLOAD_DELAY_MS);
  }

  return urlToFilename;
}

// ── PHASE 3: UPDATE CSS FILES ─────────────────────────────────────────────────

function updateCssFile(filePath, urlSet, urlToFilename) {
  let content  = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const relBase = path.relative(path.dirname(filePath), ASSETS_DIR).replace(/\\/g, '/');

  for (const url of urlSet) {
    if (!urlToFilename.has(url)) continue;
    const replacement = `${relBase}/${urlToFilename.get(url)}`;
    if (content.includes(url)) {
      content  = content.split(url).join(replacement);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    report.filesModified++;
    console.log(`  [CSS]  ${path.relative(SRC_DIR, filePath)}`);
  }
}

// ── PHASE 4: UPDATE JS/JSX/TS/TSX FILES ──────────────────────────────────────

function findLastImportLineIndex(lines) {
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) last = i;
  }
  return last;
}

function updateJsFile(filePath, urlSet, urlToFilename) {
  const actionable = [...urlSet].filter((u) => urlToFilename.has(u));
  if (actionable.length === 0) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const le    = detectLineEnding(content);
  const lines = content.split(/\r?\n/);

  // Build url → varName map for this file
  const usedNames = new Set();
  const urlToVar  = new Map();
  for (const url of actionable) {
    urlToVar.set(url, urlToVarName(url, usedNames));
  }

  // Compute relative import path from this file to ASSETS_DIR
  const relBase = path.relative(path.dirname(filePath), ASSETS_DIR).replace(/\\/g, '/');

  // Build import lines
  const importLines = [...urlToVar.entries()].map(
    ([url, varName]) => `import ${varName} from "${relBase}/${urlToFilename.get(url)}";`
  );

  // Find insertion point
  const insertAfter = findLastImportLineIndex(lines);
  const newLines = [
    ...lines.slice(0, insertAfter + 1),
    ...importLines,
    ...lines.slice(insertAfter + 1),
  ];
  content = newLines.join(le);

  // Replace URL occurrences in content — ORDER MATTERS
  for (const [url, varName] of urlToVar) {
    // 1. JSX attribute: ="URL" → ={varName}  and  ='URL' → ={varName}
    content = content.split(`="${url}"`).join(`={${varName}}`);
    content = content.split(`='${url}'`).join(`={${varName}}`);

    // 2. Template literal url(): `url(URL)` → `url(${varName})`
    content = content.split(`url(${url})`).join(`url(\${${varName}})`);

    // 3. Remaining string literals: "URL" → varName  and  'URL' → varName
    content = content.split(`"${url}"`).join(varName);
    content = content.split(`'${url}'`).join(varName);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  report.filesModified++;
  console.log(`  [JS]   ${path.relative(SRC_DIR, filePath)} (${actionable.length} URL${actionable.length > 1 ? 's' : ''})`);
}

// ── PHASE 5: VERIFY ───────────────────────────────────────────────────────────

function verify() {
  let remaining = 0;
  for (const filePath of walkDir(SRC_DIR)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [...content.matchAll(SAWO_URL_RE)].map((m) => m[0]).filter(isImageUrl);
    if (matches.length > 0) {
      for (const url of matches) {
        console.log(`  [REMAIN] ${path.relative(SRC_DIR, filePath)}: ${url.slice(0, 80)}`);
        remaining++;
      }
    }
  }
  report.remaining = remaining;
}

// ── REPORT ────────────────────────────────────────────────────────────────────

function printReport() {
  console.log('\n════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('════════════════════════════════════════════');
  console.log(`  Total URL occurrences found : ${report.totalOccurrences}`);
  console.log(`  Unique image URLs           : ${report.uniqueUrls}`);
  console.log(`  Downloaded + converted      : ${report.downloaded}`);
  console.log(`  Skipped (already existed)   : ${report.skipped}`);
  console.log(`  Failed                      : ${report.failed.length}`);
  console.log(`  Source files modified       : ${report.filesModified}`);
  console.log(`  Remaining sawo.com URLs     : ${report.remaining}`);

  if (report.failed.length > 0) {
    console.log('\n  ── Failed URLs ──');
    for (const { url, reason } of report.failed) {
      console.log(`  [FAIL] ${reason}`);
      console.log(`         ${url}`);
    }
  }

  console.log('');
  if (report.remaining === 0) {
    console.log('  ✓ All sawo.com image URLs have been replaced successfully.');
  } else {
    console.log(`  ⚠ ${report.remaining} sawo.com image URL(s) remain — see [REMAIN] lines above.`);
  }
  console.log('════════════════════════════════════════════\n');
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══ SAWO Image Converter ════════════════════\n');

  // Load sharp (optional — falls back to direct copy for already-.webp files)
  let sharp = null;
  try {
    sharp = require('sharp');
    console.log('  sharp: available (images will be re-encoded to webp)');
  } catch {
    console.warn('  [WARN] sharp not installed — .webp sources copied as-is, other formats kept in original extension.');
    console.warn('         Install sharp for full webp conversion: npm install sharp\n');
  }

  // Verify assets dir
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`[ERROR] Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }

  // Phase 1
  console.log('Phase 1: Scanning source files...');
  const { fileUrlMap, allUrls } = scanAllFiles();
  console.log(`  ${report.uniqueUrls} unique image URLs in ${fileUrlMap.size} files (${report.totalOccurrences} total occurrences)\n`);

  if (allUrls.size === 0) {
    console.log('Nothing to do — no sawo.com image URLs found.');
    return;
  }

  // Phase 2
  console.log('Phase 2: Downloading and converting...');
  const urlToFilename = await downloadAndConvert(allUrls, sharp);
  console.log('');

  // Phase 3 & 4
  console.log('Phase 3: Updating source files...');
  for (const [filePath, urlSet] of fileUrlMap) {
    const ext = path.extname(filePath).toLowerCase();
    if (CSS_EXTENSIONS.has(ext)) {
      updateCssFile(filePath, urlSet, urlToFilename);
    } else {
      updateJsFile(filePath, urlSet, urlToFilename);
    }
  }
  console.log('');

  // Phase 4 (verify)
  console.log('Phase 4: Verifying — scanning for remaining sawo.com image URLs...');
  verify();

  printReport();
}

main().catch((err) => { console.error('[FATAL]', err); process.exit(1); });
