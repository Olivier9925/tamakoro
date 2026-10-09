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
    if (name === '@/utils/svg-source') return { svgSource: svg => ({ uri: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` }) };
    throw new Error(`Unexpected artwork dependency: ${name}`);
  };
  new Function('require', 'module', 'exports', js)(artRequire, module, module.exports);
  return module.exports;
}

const { DIGITAL_BACKGROUND_SOURCE, WORDMARK_SOURCE } = artwork('digital-art.ts');
const markup = source => Buffer.from(source.uri.split(',')[1], 'base64').toString('utf8');
const inner = svg => svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
const background = inner(markup(DIGITAL_BACKGROUND_SOURCE));
const wordmark = inner(markup(WORDMARK_SOURCE));

// Keep the app's electronic background and pixel wordmark, replacing the incubator
// with a light circuit-board frame and a centered title panel.
const traces = `<g fill="none" stroke-linecap="square" stroke-linejoin="miter" shape-rendering="crispEdges">
  <g stroke="#bc691e" stroke-width="3" opacity="0.54">
    <path d="M0 112H24V148H58V206H83 M360 138H334V178H308V226H284"/>
    <path d="M0 273H19V307H32 M360 266H341V310H328 M0 505H20V470H32 M360 510H340V470H328"/>
    <path d="M0 646H28V620H64V586H91 M360 650H332V620H296V586H269"/>
  </g>
  <g stroke="#55a9b7" stroke-width="2" opacity="0.48">
    <path d="M0 188H13V230H33 M360 196H347V232H327"/>
    <path d="M0 546H14V520H32 M360 548H346V522H328"/>
    <path d="M86 0V22H112V48 M274 0V22H248V48 M88 780V752H117V730 M272 780V752H243V730"/>
  </g>
  <g fill="#e7a145" stroke="none">
    <rect x="78" y="201" width="6" height="6"/><rect x="281" y="221" width="6" height="6"/>
    <rect x="30" y="304" width="6" height="6"/><rect x="325" y="307" width="6" height="6"/>
    <rect x="30" y="467" width="6" height="6"/><rect x="325" y="467" width="6" height="6"/>
    <rect x="87" y="583" width="6" height="6"/><rect x="267" y="583" width="6" height="6"/>
  </g>
  <g fill="#7ce5f0" stroke="none">
    <rect x="30" y="227" width="4" height="4"/><rect x="326" y="229" width="4" height="4"/>
    <rect x="30" y="518" width="4" height="4"/><rect x="326" y="520" width="4" height="4"/>
  </g>
</g>
<g shape-rendering="crispEdges">
  <rect x="27" y="52" width="30" height="20" fill="#111922" stroke="#536472" stroke-width="2"/>
  <rect x="31" y="56" width="22" height="12" fill="#273744"/>
  <path d="M30 48V52 M38 48V52 M46 48V52 M30 72V76 M38 72V76 M46 72V76" stroke="#bc691e" stroke-width="2"/>
  <rect x="303" y="694" width="30" height="20" fill="#111922" stroke="#536472" stroke-width="2"/>
  <rect x="307" y="698" width="22" height="12" fill="#273744"/>
  <path d="M306 690V694 M314 690V694 M322 690V694 M306 714V718 M314 714V718 M322 714V718" stroke="#bc691e" stroke-width="2"/>
</g>`;
const title = `<g shape-rendering="crispEdges">
  <rect x="26" y="347" width="308" height="86" fill="#060c13" opacity="0.72"/>
  <rect x="32" y="350" width="296" height="76" fill="#10202a" stroke="#6a7c8a" stroke-width="2"/>
  <rect x="38" y="356" width="284" height="64" fill="#0a131c" stroke="#283844" stroke-width="2"/>
  <path d="M42 364V412 M318 364V412" stroke="#ffb637" stroke-width="3"/>
  <path d="M48 416H312" stroke="#bde99f" opacity="0.16"/>
  <svg x="48" y="369" width="264" height="42" viewBox="0 0 188 30">${wordmark}</svg>
</g>`;
const scene = `<svg x="0" y="0" width="360" height="780" viewBox="0 0 480 960" preserveAspectRatio="none">${background}</svg>${traces}${title}`;
const full = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2340" viewBox="0 0 360 780">${scene}</svg>`;
// Android's native splash uses a square mark. Crop the same scene around its title.
const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 210 360 360">${scene}</svg>`;

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
