const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test, after } = require('node:test');
const output = mkdtempSync(join(tmpdir(), 'tamakoro-tests-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/game/pet.ts', '--outDir', output,
  '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck', '--strict', '--ignoreConfig']);
const { createPet, advancePet, careForPet, parsePet, petGrowth, petMood, petHealthAlert, needSeverity, isPetDead, GROWTH_STAGES, DAY, HOUR, NEEDS } = require(join(output, 'game', 'pet.js'));
after(() => rmSync(output, { recursive: true, force: true }));
const birth = 100000;
const initial = () => createPet(' Momo ', 'leaf', birth);
test('adoption validates and trims the name; saves round-trip', () => {
  assert.equal(initial().name, 'Momo');
  assert.throws(() => createPet('  ', 'leaf', birth));
  assert.throws(() => createPet('x'.repeat(21), 'leaf', birth));
  assert.deepEqual(parsePet(JSON.stringify(initial())), initial());
});
test('version 1 saves migrate to version 2 with empty statistics', () => {
  const legacy = { ...initial(), version: 1 };
  delete legacy.stats;
  const migrated = parsePet(JSON.stringify(legacy));
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.stats, { feed: 0, hydrate: 0, clean: 0, play: 0, naps: 0 });
  assert.equal(migrated.name, legacy.name);
});
test('one hour evolves each need deterministically', () => {
  const pet = advancePet(initial(), birth + HOUR);
  assert.deepEqual(pet.needs, { food: 81, energy: 87, hygiene: 83, mood: 88, health: 100 });
});
test('long absences and frequent refreshes produce the same state', () => {
  const once = advancePet(initial(), birth + 80 * HOUR);
  let frequent = initial();
  for (let i = 1; i <= 800; i++) frequent = advancePet(frequent, birth + i * HOUR / 10);
  for (const key of NEEDS) assert.ok(Math.abs(once.needs[key] - frequent.needs[key]) < 1e-8, key);
  assert.equal(once.needs.health, 0);
  assert.ok(Math.abs(once.updatedAt - frequent.updatedAt) < 1);
});
test('sleep recovers energy while other needs evolve; wake resumes care', () => {
  const tired = { ...initial(), needs: { ...initial().needs, energy: 10 } };
  const asleep = careForPet(tired, 'sleep', birth);
  const rested = advancePet(asleep, birth + 3 * HOUR);
  assert.equal(rested.needs.energy, 64);
  assert.equal(rested.needs.food, 73);
  assert.deepEqual(careForPet(rested, 'feed', rested.updatedAt), rested);
  assert.equal(careForPet(rested, 'sleep', rested.updatedAt).sleeping, false);
});
test('care affects the right needs and never exceeds bounds', () => {
  const pet = { ...initial(), needs: { food: 40, energy: 20, hygiene: 40, mood: 40, health: 40 } };
  assert.equal(careForPet(pet, 'feed', birth).needs.food, 65);
  assert.equal(careForPet(pet, 'feed', birth).needs.energy, 16);
  assert.equal(careForPet(pet, 'hydrate', birth).needs.health, 45);
  assert.equal(careForPet(pet, 'hydrate', birth).needs.energy, 17);
  assert.equal(careForPet(pet, 'clean', birth).needs.hygiene, 75);
  assert.equal(careForPet(pet, 'clean', birth).needs.energy, 14);
  const played = careForPet(pet, 'play', birth);
  assert.equal(played.needs.mood, 65);
  assert.equal(played.needs.energy, 8);
  assert.equal(careForPet(initial(), 'feed', birth).needs.food, 100);
  assert.equal(careForPet(initial(), 'feed', birth).needs.energy, 86);
});
test('care actions require their energy cost; sleeping restores energy to use them', () => {
  const exhausted = { ...initial(), needs: { ...initial().needs, energy: 2 } };
  assert.deepEqual(careForPet(exhausted, 'feed', birth), exhausted);
  const rested = advancePet({ ...exhausted, sleeping: true }, birth + 2 * HOUR);
  assert.equal(rested.needs.energy, 38);
  const awake = careForPet(rested, 'sleep', rested.updatedAt);
  assert.equal(careForPet(awake, 'feed', awake.updatedAt).needs.energy, 34);
});
test('successful care, play and sleep sessions increment their lifetime counters', () => {
  const fed = careForPet(initial(), 'feed', birth);
  const played = careForPet(fed, 'play', birth);
  const asleep = careForPet(played, 'sleep', birth);
  const awake = careForPet(asleep, 'sleep', birth);
  assert.deepEqual(awake.stats, { feed: 1, hydrate: 0, clean: 0, play: 1, naps: 1 });
  const tooTired = { ...initial(), needs: { ...initial().needs, energy: 2 } };
  assert.deepEqual(careForPet(tooTired, 'feed', birth).stats, tooTired.stats);
});
test('clock rollback does not reverse progression or duplicate elapsed time', () => {
  const pet = advancePet(initial(), birth + HOUR);
  assert.deepEqual(advancePet(pet, birth), pet);
  assert.deepEqual(advancePet(pet, pet.updatedAt), pet);
});
test('corrupt or unsupported saves are rejected', () => {
  assert.throws(() => parsePet('bad json'));
  for (const patch of [{ version: 3 }, { appearance: 'unknown' }, { updatedAt: -1 },
    { name: '' }, { sleeping: 'yes' }, { needs: { food: 200 } },
    { stats: { feed: -1, hydrate: 0, clean: 0, play: 0, naps: 0 } }]) {
    assert.throws(() => parsePet(JSON.stringify({ ...initial(), ...patch })));
  }
});

test('growth changes exactly at each 15-day boundary and stops at adulthood', () => {
  assert.equal(petGrowth(initial(), birth).stage.label, 'Bébé');
  assert.equal(petGrowth(initial(), birth).daysUntilNext, 15);
  for (let index = 1; index < GROWTH_STAGES.length; index++) {
    const boundary = birth + index * 15 * DAY;
    assert.equal(petGrowth(initial(), boundary - 1).stageIndex, index - 1);
    const growth = petGrowth(initial(), boundary);
    assert.equal(growth.stageIndex, index);
    assert.equal(growth.stage.label, GROWTH_STAGES[index].label);
    assert.equal(growth.daysUntilNext, index === 6 ? null : 15);
  }
  const adult = petGrowth(initial(), birth + 365 * DAY);
  assert.equal(adult.stage.label, 'Adulte');
  assert.equal(adult.stageIndex, 6);
  assert.equal(adult.progress, 1);
});
test('growth survives offline absences, old saves, sleep and clock rollback', () => {
  const oldSave = parsePet(JSON.stringify(initial()));
  const grown = { ...oldSave, updatedAt: birth + 77 * DAY };
  assert.equal(petGrowth(grown, grown.updatedAt).stageIndex, 5);
  assert.equal(petGrowth(grown, birth).stageIndex, 5);
  assert.equal(petGrowth({ ...grown, sleeping: true }, grown.updatedAt).stageIndex, 5);
  assert.equal(petGrowth({ ...grown, needs: { food: 0, energy: 0, hygiene: 0, mood: 0, health: 25 } }, grown.updatedAt).stageIndex, 5);
  assert.equal(petGrowth(grown, grown.updatedAt).daysUntilNext, 13);
  assert.equal(petGrowth(initial(), birth - DAY).ageDays, 0);
  assert.deepEqual(petGrowth(oldSave, birth + 77 * DAY), petGrowth(grown, grown.updatedAt));
});

test('each prolonged critical need can lower health below 25 and cause death', () => {
  for (const cause of ['food', 'hygiene', 'mood']) {
    const pet = { ...initial(), needs: { food: 100, energy: 100, hygiene: 100, mood: 100, health: 26, [cause]: 0 } };
    assert.equal(advancePet(pet, birth + HOUR).needs.health, 24);
    const dead = advancePet(pet, birth + 14 * HOUR);
    assert.equal(dead.needs.health, 0);
    assert.equal(dead.updatedAt, birth + 13 * HOUR);
    assert.equal(isPetDead(dead), true);
  }
});
test('death is calculated at the exact instant, including offline and during sleep', () => {
  for (const sleeping of [false, true]) {
    const pet = { ...initial(), sleeping };
    const deathTime = birth + 66.25 * HOUR;
    assert.ok(advancePet(pet, deathTime - 1).needs.health > 0);
    const dead = advancePet(pet, deathTime);
    assert.equal(dead.needs.health, 0);
    assert.equal(dead.updatedAt, deathTime);
    assert.equal(dead.sleeping, false);
    assert.deepEqual(advancePet(pet, birth + 100 * DAY), dead);
    assert.deepEqual(parsePet(JSON.stringify(dead)), dead);
  }
});
test('dead pets cannot be revived by care, time or clock rollback; growth freezes', () => {
  const dead = advancePet(initial(), birth + 100 * DAY);
  for (const action of ['feed', 'hydrate', 'clean', 'play', 'sleep']) {
    assert.deepEqual(careForPet(dead, action, birth + 101 * DAY), dead);
    assert.deepEqual(careForPet(initial(), action, birth + 100 * DAY), dead);
  }
  assert.deepEqual(advancePet(dead, birth), dead);
  assert.deepEqual(petGrowth(dead, birth + 100 * DAY), petGrowth(dead, dead.updatedAt));
  assert.equal(petMood(dead), 'Décédé');
});
test('care before death can correct critical needs and recover health', () => {
  const fragile = { ...initial(), needs: { food: 19, energy: 80, hygiene: 80, mood: 80, health: 10 } };
  const fed = careForPet(fragile, 'feed', birth);
  const hydrated = careForPet(fed, 'hydrate', birth);
  assert.equal(advancePet(hydrated, birth + HOUR).needs.health, 16);
  const almostDead = { ...fragile, needs: { ...fragile.needs, health: 0.001 } };
  assert.equal(isPetDead(almostDead), false);
  assert.equal(needSeverity('health', almostDead.needs.health), 'critical');
});
test('warnings match mood thresholds and critical health is visible while sleeping', () => {
  for (const [key, boundary] of [['food', 25], ['energy', 25], ['hygiene', 25], ['mood', 30], ['health', 40]]) {
    assert.equal(needSeverity(key, boundary), 'normal');
    assert.equal(needSeverity(key, boundary - 0.01), 'warning');
  }
  const danger = { ...initial(), sleeping: true, needs: { ...initial().needs, food: 0, health: 19 } };
  assert.equal(petMood(danger), 'Danger de mort');
  assert.match(petHealthAlert(danger), /Danger de mort/);
  assert.match(petHealthAlert(danger), /satiété/i);
});
