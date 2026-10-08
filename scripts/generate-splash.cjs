// Reuse the app's original vector art; no copied reference image or system font.
// Run with Node 22+: node scripts/generate-splash.cjs
// Optionally rasterize the SVGs: SHARP_MODULE=/path/to/sharp node scripts/generate-splash.cjs
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function artwork(file) {
  const source = fs.readFileSync(path.join(root, 'src/components', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const artRequire = name => {
    if (name === '@/utils/svg-source') return { svgSource: svg => svg };
    throw new Error(`Unexpected artwork dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', js)(artRequire, module, module.exports);
  return module.exports;
}

const incubator = artwork('incubator-art.ts').createIncubatorSvg(false);
const wordmark = artwork('digital-art.ts').WORDMARK_SOURCE;
const inner = svg => svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
// Extend the chamber; the camera, top chips, fan and title keep their proportions.
const slice = (y, height, targetY, targetHeight) =>
  `<svg x="0" y="${targetY}" width="360" height="${targetHeight}" viewBox="0 ${y} 360 ${height}" preserveAspectRatio="none">${inner(incubator)}</svg>`;
const title = `<svg x="48" y="369" width="264" height="42" viewBox="0 0 188 30">${inner(wordmark)}</svg>`;
const full = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2340" viewBox="0 0 360 780">
  <rect width="360" height="780" fill="#090f18"/>
  ${slice(0, 109, 0, 109)}${slice(109, 240, 109, 620)}${slice(349, 51, 729, 51)}
  <g shape-rendering="crispEdges">
    <rect x="30" y="352" width="300" height="80" fill="#060c13" opacity="0.65"/>
    <rect x="32" y="350" width="296" height="76" fill="#10202a" stroke="#6a7c8a" stroke-width="2"/>
    <rect x="38" y="356" width="284" height="64" fill="#0a131c" stroke="#283844" stroke-width="2"/>
    <path d="M42 364V412 M318 364V412" stroke="#ffb637" stroke-width="3"/>
    <path d="M48 416H312" stroke="#bde99f" opacity="0.16"/>
  </g>
  ${title}
</svg>`;
const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 360 360">
  <rect x="32" y="127" width="296" height="106" rx="8" fill="#10202a" stroke="#6a7c8a" stroke-width="3"/>
  <rect x="40" y="135" width="280" height="90" fill="#0a131c" stroke="#283844" stroke-width="2"/>
  <path d="M46 154V206 M314 154V206" stroke="#ffb637" stroke-width="3"/>
  <svg x="57" y="161" width="246" height="39" viewBox="0 0 188 30">${inner(wordmark)}</svg>
</svg>`;
const assets = path.join(root, 'assets/images');
for (const [name, svg] of [['tamakoro-splash', full], ['tamakoro-splash-logo', logo]]) {
  fs.writeFileSync(path.join(assets, `${name}.svg`), svg);
}
if (process.env.SHARP_MODULE) {
  const sharp = require(process.env.SHARP_MODULE);
  Promise.all([['tamakoro-splash', full], ['tamakoro-splash-logo', logo]].map(([name, svg]) =>
    name === 'tamakoro-splash'
      ? sharp(Buffer.from(svg)).resize(360, 780).png().toBuffer().then(buffer =>
        sharp(buffer).resize(1080, 2340, { kernel: 'nearest' }).png().toFile(path.join(assets, `${name}.png`)))
      : sharp(Buffer.from(svg)).png().toFile(path.join(assets, `${name}.png`))
  )).catch(error => { console.error(error); process.exitCode = 1; });
}
