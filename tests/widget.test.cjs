const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync, existsSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test, after } = require('node:test');
const output = mkdtempSync(join(tmpdir(), 'tamakoro-widget-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/widgets/timeline.ts', '--outDir', output,
  '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck', '--strict', '--ignoreConfig']);
const { widgetSnapshot, widgetTimeline } = require(join(output, 'widgets/timeline.js'));
const { createPet, advancePet, careForPet, HOUR, DAY, NEEDS } = require(join(output, 'game/pet.js'));
after(() => rmSync(output, { recursive: true, force: true }));
const birth = 100000;
const initial = () => createPet('Momo', 'leaf', birth);
test('empty widget invites adoption in the selected language', () => {
  assert.equal(widgetSnapshot(null, birth, 'fr').status, 'Adopte ton compagnon');
  assert.equal(widgetSnapshot(null, birth, 'en').status, 'Adopt your companion');
  assert.equal(widgetTimeline(null, birth, 'fr').length, 1);
});
test('age, stage and evolution reflect elapsed time and selected language', () => {
  const pet = createPet('Dragon', 'ember', birth);
  pet.createdAt -= 16 * DAY + 12 * HOUR;
  const fr = widgetSnapshot(pet, birth, 'fr'); const en = widgetSnapshot(pet, birth, 'en');
  assert.equal(fr.age, '16 j · 12 h'); assert.equal(en.age, '16 d · 12 h');
  assert.equal(fr.stage, 'Petite pousse'); assert.equal(fr.evolution, 'Évolution dans 14 j');
  assert.equal(fr.artKey, 'ember-1-awake');
});
test('all five widget gauges use the same game engine and respect need warnings', () => {
  const pet = { ...initial(), needs: { ...initial().needs, food: 10 } };
  const snapshot = widgetSnapshot(pet, birth + HOUR, 'en'); const actual = advancePet(pet, birth + HOUR);
  assert.deepEqual(snapshot.gauges.map(g => g.value), NEEDS.map(key => Math.round(actual.needs[key])));
  assert.equal(snapshot.gauges[0].severity, 'critical'); assert.equal(snapshot.gauges[0].label, 'Fullness');
});
test('timeline includes automatic wakeup at the exact game instant', () => {
  const pet = careForPet(initial(), 'sleep', birth);
  const wake = birth + (100 - pet.needs.energy) / 18 * HOUR;
  const timeline = widgetTimeline(pet, birth, 'en');
  assert.equal(timeline[0].props.artKey, 'leaf-0-asleep');
  assert.equal(timeline.find(entry => entry.date.getTime() === wake).props.artKey, 'leaf-0-awake');
});
test('timeline includes evolution, even while the app remains closed', () => {
  const pet = initial(); pet.createdAt = birth - 15 * DAY + HOUR;
  const entry = widgetTimeline(pet, birth, 'fr').find(entry => entry.date.getTime() === birth + HOUR);
  assert.equal(entry.props.stage, 'Petite pousse'); assert.equal(entry.props.artKey, 'leaf-1-awake');
});
test('timeline freezes death age and sleeping artwork at the exact death time', () => {
  const pet = initial(); const terminal = advancePet(pet, birth + 72 * HOUR);
  const timeline = widgetTimeline(pet, birth, 'fr'); const last = timeline.at(-1);
  assert.equal(last.date.getTime(), terminal.updatedAt); assert.equal(last.props.dead, true);
  assert.match(last.props.artKey, /asleep$/);
  assert.deepEqual(widgetSnapshot(terminal, birth + 200 * HOUR, 'fr'), last.props);
  assert.equal(widgetTimeline(terminal, birth + 200 * HOUR, 'fr').length, 1);
});
test('building widget entries never modifies game state, even after a clock rollback', () => {
  const pet = initial(); const original = JSON.stringify(pet);
  const timeline = widgetTimeline(pet, birth - 80 * HOUR, 'fr');
  assert.equal(JSON.stringify(pet), original); assert.equal(timeline.at(-1).props.dead, true);
  for (let i = 1; i < timeline.length; i++) assert.ok(timeline[i].date > timeline[i - 1].date);
});
test('every timeline artwork key has a bundled image for all colours and ages', () => {
  for (const appearance of ['leaf', 'ember', 'water']) for (let stage = 0; stage <= 6; stage++) {
    const pet = createPet('A', appearance, birth + 100 * DAY); pet.createdAt -= stage * 15 * DAY;
    for (const sleeping of [false, true]) {
      pet.sleeping = sleeping;
      const props = widgetSnapshot(pet, pet.updatedAt, 'fr');
      assert.ok(existsSync(`assets/widgets/${props.artKey}.png`));
    }
  }
});
test('native widget configuration declares both formats and the shared App Group', () => {
  const config = JSON.parse(readFileSync('app.json', 'utf8')).expo;
  const options = config.plugins.find(p => Array.isArray(p) && p[0] === 'expo-widgets')[1];
  assert.deepEqual(options.widgets[0].ios.supportedFamilies, ['systemSmall', 'systemMedium']);
  assert.equal(options.groupIdentifier, 'group.com.olivier9925.tamakoro');
});
