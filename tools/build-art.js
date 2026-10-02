// Сборка графики: node tools/build-art.js [фильтр]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[err]', e.message));
  await page.goto('file://' + path.join(__dirname, 'art', 'index.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const filter = process.argv[2] ? new RegExp(process.argv[2]) : null;
  const names = await page.evaluate(() => window.assetNames());
  const metaFile = path.join(root, 'js', 'assetmeta.js');
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8').replace(/^window\.ASSET_META = /, '').replace(/;\s*$/, '')); } catch (e) {}
  for (const n of names) {
    if (filter && !filter.test(n)) continue;
    const r = await page.evaluate(n => window.renderAsset(n), n);
    const ext = r.fmt === 'jpg' ? 'jpg' : 'png';
    const file = path.join(root, 'img', n + '.' + ext);
    fs.writeFileSync(file, Buffer.from(r.data.split(',')[1], 'base64'));
    meta[n] = Object.assign({ file: 'img/' + n + '.' + ext, w: r.w, h: r.h }, r.meta);
    console.log(n, r.w + 'x' + r.h, Math.round(fs.statSync(file).size / 1024) + 'KB');
  }
  fs.writeFileSync(metaFile, 'window.ASSET_META = ' + JSON.stringify(meta, null, 0) + ';\n');
  await browser.close();
})();
