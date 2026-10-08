// Render every pose and build an offline review of the artwork used by the app.
// SHARP_MODULE=/path/to/sharp node scripts/preview-pet-sprites.cjs [output-directory]
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const modules = new Map();
async function load(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const source = await fs.readFile(path.join(root, relative), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const deps = {};
  for (const name of ['@/game/pet', '@/utils/svg-source']) {
    if (source.includes(name)) deps[name] = await load('src/' + name.slice(2) + '.ts');
  }
  const module = { exports: {} };
  vm.runInNewContext(js, { module, exports: module.exports, require: name => {
    assert.ok(deps[name], 'Unexpected dependency: ' + name);
    return deps[name];
  } }, { filename: relative });
  modules.set(relative, module.exports);
  return module.exports;
}
(async () => {
  const out = path.resolve(process.argv[2] || path.join(root, 'docs', 'pet-sprites'));
  await fs.mkdir(out, { recursive: true });
  const { petSprites, APPEARANCES } = await load('src/components/pet-sprite-art.ts');
  const { GROWTH_STAGES } = await load('src/game/pet.ts');
  const cards = [];
  const checks = [];
  const contact = [];
  let appearanceIndex = 0;
  for (const [appearance, palette] of Object.entries(APPEARANCES)) {
    for (let stage = 0; stage < GROWTH_STAGES.length; stage++) {
      const poses = petSprites(appearance, stage);
      assert.equal(poses.awake.length, 5);
      assert.equal(poses.asleep.length, 2);
      const images = [];
      for (const [state, sources] of Object.entries(poses)) {
        for (let frame = 0; frame < sources.length; frame++) {
          const svg = Buffer.from(sources[frame].uri.split(',')[1], 'base64');
          const { data, info } = await sharp(svg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
          assert.equal(info.width, 160); assert.equal(info.height, 160);
          let left = 160, top = 160, right = 0, bottom = 0;
          for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
            if (data[(y * 160 + x) * 4 + 3] > 8) {
              left = Math.min(left, x); right = Math.max(right, x);
              top = Math.min(top, y); bottom = Math.max(bottom, y);
            }
          }
          assert.ok(left > 0 && top > 0 && right < 159 && bottom < 159, `${appearance}/${stage}/${state}/${frame}: cropped artwork`);
          assert.ok(bottom >= 153 && bottom <= 156, 'Feet must stay on the shared baseline');
          checks.push({ appearance, stage, state, frame, bounds: { left, top, right, bottom } });
          images.push(sources[frame].uri);
          if (state === 'awake' && frame === 0) contact.push({ input: await sharp(svg).resize(240,240).png().toBuffer(), left:stage*240, top:appearanceIndex*280 });
        }
      }
      cards.push({ appearance, label:palette.label, stage:GROWTH_STAGES[stage].label, images });
    }
    appearanceIndex++;
  }
  await sharp({ create: { width:1680,height:840,channels:4,background:'#14232d' } }).composite(contact).png().toFile(path.join(out,'growth-overview.png'));
  await fs.writeFile(path.join(out,'verification.json'), JSON.stringify({ count:checks.length, checked:'PNG rasterisation, transparency, uncropped silhouette and shared foot baseline', sprites:checks },null,2));
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tamakoro — Sprites affinés</title>
<style>body{margin:0;background:#090f18;color:#edf5ea;font:15px system-ui;padding:24px}header{max-width:1200px;margin:auto}h1{color:#b6df8d}button,select{background:#19343f;color:#eaf6f0;border:1px solid #537b49;border-radius:8px;padding:10px;margin:4px;font:inherit}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;max-width:1200px;margin:24px auto}article{background:#14232d;border:1px solid #314753;border-radius:14px;text-align:center;padding:12px}img{display:block;width:160px;height:160px;max-width:100%;margin:auto}h2{font-size:14px;margin:8px 0}small{color:#a9bfc1}</style>
<header><h1>Tamakoro — les sept âges</h1><p>Trois palettes, cinq poses éveillées et deux poses de sommeil. Les dessins sont ceux utilisés dans le jeu.</p>
<label>Couleur <select id="colour"><option value="leaf">Feuille</option><option value="ember">Braise</option><option value="water">Ondine</option><option value="all">Toutes</option></select></label>
<label>Pose <select id="pose"><option value="animate">Animation éveillée</option><option value="sleep">Animation du sommeil</option><option value="0">Repos</option><option value="1">Respiration</option><option value="2">Regard à gauche</option><option value="3">Regard à droite</option><option value="4">Clignement</option><option value="5">Sommeil — repos</option><option value="6">Sommeil — respiration</option></select></label></header><main></main>
<script>const cards=${JSON.stringify(cards)};const main=document.querySelector('main'),colour=document.querySelector('#colour'),pose=document.querySelector('#pose');let displayed=[];function render(){main.replaceChildren();displayed=cards.filter(c=>colour.value==='all'||c.appearance===colour.value).map(c=>{const a=document.createElement('article'),i=document.createElement('img'),h=document.createElement('h2'),s=document.createElement('small');i.src=c.images[0];i.alt=c.stage;h.textContent=c.stage;s.textContent=c.label;a.append(i,h,s);main.append(a);return {c,i};});}colour.onchange=render;render();const timeline=[[0,0],[14,1],[28,0],[38,4],[41,0],[50,2],[60,0],[70,1],[82,0],[88,3],[96,0]];function tick(t){const v=pose.value;let frame=Number(v);if(v==='sleep')frame=5+(t%4000>=2000?1:0);else if(v==='animate'){const p=t%8000/80;frame=timeline.filter(x=>x[0]<=p).at(-1)[1];}for(const {c,i} of displayed)if(i.src!==c.images[frame])i.src=c.images[frame];requestAnimationFrame(tick);}requestAnimationFrame(tick);</script></html>`;
  await fs.writeFile(path.join(out,'index.html'),html);
  console.log(`Verified ${checks.length} sprites. Review: ${out}/index.html`);
})();
