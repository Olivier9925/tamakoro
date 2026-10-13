// Produce a standalone design preview from the same projected data and PNGs as the widget.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} }; cache.set(file, module.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => load(path.resolve(path.dirname(file), name) + '.ts') });
  return module.exports;
}
const { createPet, careForPet, advancePet, HOUR, DAY } = load(path.join(root, 'src/game/pet.ts'));
const { widgetSnapshot } = load(path.join(root, 'src/widgets/timeline.ts'));
const now = Date.now();
const baby = createPet('Momo', 'leaf', now);
const adult = createPet('Ryū', 'ember', now); adult.createdAt -= 90 * DAY;
const tired = { ...baby, needs: { ...baby.needs, energy: 45 } };
const fragile = { ...adult, needs: { food: 12, energy: 20, hygiene: 32, mood: 28, health: 15 } };
const cases = { happy: baby, sleeping: careForPet(tired, 'sleep', now), adult, danger: fragile,
  deceased: advancePet(baby, now + 72 * HOUR), empty: null };
const data = Object.fromEntries(['fr','en'].map(lang => [lang, Object.fromEntries(Object.entries(cases)
  .map(([key, pet]) => [key, widgetSnapshot(pet, now, lang)]))]));
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tamakoro — aperçu des widgets iOS</title><style>
*{box-sizing:border-box}body{margin:0;background:#090f18;color:#eaf6f0;font:15px system-ui;padding:24px}main{max-width:1050px;margin:auto}h1{color:#d4fbb5}p{max-width:750px;line-height:1.5;color:#a3bcc0}select{padding:10px;background:#101c26;color:#eaf6f0;border:1px solid #354650;border-radius:8px;margin:0 8px 8px 0}section{display:flex;gap:26px;align-items:center;flex-wrap:wrap;padding:36px 0}.card{background:#101c26;border:1px solid #354650;border-radius:24px;padding:12px;font-family:ui-monospace,Menlo,monospace;box-shadow:0 12px 35px #0007;overflow:hidden}.small{width:170px;height:170px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3px}.medium{width:360px;height:170px;display:flex;align-items:center;gap:14px}.name{font-size:14px;font-weight:700;color:#d4fbb5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.stage{font-size:9px;color:#a3bcc0}.small img{width:62px;height:62px}.small .status{font-size:10px}.age{font-size:10px}.left{width:110px;flex-shrink:0;display:flex;align-items:center;flex-direction:column;gap:3px}.left img{width:76px;height:76px}.right{flex:1;min-width:0}.status{font:600 11px system-ui;color:#d4fbb5;margin-bottom:4px}.alert{color:#ffac77}.dead{color:#a3bcc0}.gauge{display:flex;gap:5px;align-items:center;height:18px;font-size:9px}.gauge .label{width:53px;color:#a3bcc0}.track{flex:1;height:4px;border-radius:4px;background:#30434a;overflow:hidden}.fill{height:100%}.value{width:24px;text-align:right}.evolution{font:9px system-ui;color:#a3bcc0;line-height:1.2;margin-top:4px}figure{margin:0}figcaption{text-align:center;color:#a3bcc0;margin-top:12px}a{color:#d4fbb5}img{object-fit:contain}body.tinted .card{background:#344050}body.tinted .card *{color:white}body.tinted .fill{background:white!important}
</style><main><h1>Tamakoro — widgets iOS</h1><p>Aperçu de mise en page : les données et les poses proviennent du widget. Le rendu final SwiftUI et les délais de mise à jour restent gérés par iOS.</p>
<select id="state" aria-label="État du compagnon"><option value="happy">Bébé heureux</option><option value="sleeping">Endormi</option><option value="adult">Dragon adulte</option><option value="danger">Santé critique</option><option value="deceased">Décédé</option><option value="empty">Sans adoption</option></select>
<select id="lang" aria-label="Langue"><option value="fr">Français</option><option value="en">English</option></select>
<select id="mode" aria-label="Couleurs"><option value="color">Couleurs</option><option value="tinted">Teinté — simulation</option></select>
<section><figure><div class="card small" id="small"></div><figcaption>Petit format</figcaption></figure><figure><div class="card medium" id="medium"></div><figcaption>Format moyen</figcaption></figure></section>
<p>Un appui sur le widget installé ouvre la partie. Les jauges sont projetées à partir des derniers soins sauvegardés.</p></main><script>
const data=${JSON.stringify(data)};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){const p=data[document.getElementById('lang').value][document.getElementById('state').value];document.body.classList.toggle('tinted',document.getElementById('mode').value==='tinted');const name='<div class="name">'+escape(p.name)+'</div>';const art='<img src="../assets/widgets/'+p.artKey+'.png" alt="'+escape(p.stage)+'">';const age='<div class="age">'+escape(p.age)+'</div>';const stage='<div class="stage">'+escape(p.stage)+'</div>';const status='<div class="status '+(p.alert?'alert':p.dead?'dead':'')+'">'+escape(p.status)+'</div>';document.getElementById('small').innerHTML=name+stage+art+status+age;const gauges=p.gauges.map(g=>'<div class="gauge"><span class="label">'+escape(g.label)+'</span><div class="track"><div class="fill" style="width:'+g.value+'%;background:'+(g.severity==='critical'?'#ff8078':g.color)+'"></div></div><span class="value">'+g.value+'</span></div>').join('');document.getElementById('medium').innerHTML='<div class="left">'+name+art+age+stage+'</div><div class="right">'+status+gauges+'<div class="evolution">'+escape(p.evolution)+'</div></div>';}
document.querySelectorAll('select').forEach(s=>s.addEventListener('change',render));render();</script></html>`;
fs.writeFileSync(path.join(root, 'docs/tamakoro-widgets-preview.html'), html);
console.log('Created docs/tamakoro-widgets-preview.html');
