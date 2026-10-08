const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test, after } = require('node:test');
const output = mkdtempSync(join(tmpdir(), 'tamakoro-tests-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/game/pet.ts', '--outDir', output,
  '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck', '--strict', '--ignoreConfig']);
const { createPet, advancePet, careForPet, parsePet, petGrowth, GROWTH_STAGES, DAY, HOUR, NEEDS } = require(join(output, 'pet.js'));
after(() => rmSync(output, { recursive: true, force: true }));
const birth = 100000;
const initial = () => createPet(' Momo ', 'leaf', birth);
test('adoption validates and trims the name; saves round-trip', () => {
  assert.equal(initial().name, 'Momo');
  assert.throws(() => createPet('  ', 'leaf', birth));
  assert.throws(() => createPet('x'.repeat(21), 'leaf', birth));
  assert.deepEqual(parsePet(JSON.stringify(initial())), initial());
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
  assert.equal(once.needs.health, 25);
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
  const pet = { ...initial(), needs: { food: 40, energy: 5, hygiene: 40, mood: 40, health: 40 } };
  assert.equal(careForPet(pet, 'feed', birth).needs.food, 65);
  assert.equal(careForPet(pet, 'hydrate', birth).needs.health, 45);
  assert.equal(careForPet(pet, 'clean', birth).needs.hygiene, 75);
  const played = careForPet(pet, 'play', birth);
  assert.equal(played.needs.mood, 65);
  assert.equal(played.needs.energy, 0);
  assert.equal(careForPet(initial(), 'feed', birth).needs.food, 100);
});
test('clock rollback does not reverse progression or duplicate elapsed time', () => {
  const pet = advancePet(initial(), birth + HOUR);
  assert.deepEqual(advancePet(pet, birth), pet);
  assert.deepEqual(advancePet(pet, pet.updatedAt), pet);
});
test('corrupt or unsupported saves are rejected', () => {
  assert.throws(() => parsePet('bad json'));
  for (const patch of [{ version: 2 }, { appearance: 'unknown' }, { updatedAt: -1 },
    { name: '' }, { sleeping: 'yes' }, { needs: { food: 200 } }]) {
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
  const grown = advancePet(oldSave, birth + 77 * DAY);
  assert.equal(petGrowth(grown, grown.updatedAt).stageIndex, 5);
  assert.equal(petGrowth(grown, birth).stageIndex, 5);
  assert.equal(petGrowth({ ...grown, sleeping: true }, grown.updatedAt).stageIndex, 5);
  assert.equal(petGrowth({ ...grown, needs: { food: 0, energy: 0, hygiene: 0, mood: 0, health: 25 } }, grown.updatedAt).stageIndex, 5);
  assert.equal(petGrowth(grown, grown.updatedAt).daysUntilNext, 13);
  assert.equal(petGrowth(initial(), birth - DAY).ageDays, 0);
  assert.deepEqual(petGrowth(oldSave, birth + 77 * DAY), petGrowth(grown, grown.updatedAt));
});
