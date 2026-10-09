const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test, after } = require('node:test');
const output = mkdtempSync(join(tmpdir(), 'tamakoro-backup-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/backup/controller.ts', 'src/backup/store.ts', '--outDir', output,
  '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck', '--strict', '--ignoreConfig']);
const { BackupController } = require(join(output, 'backup/controller.js'));
const { createSaveStore } = require(join(output, 'backup/store.js'));
const { emptySave, parseSave } = require(join(output, 'game/save.js'));
const { createPet, advancePet, HOUR } = require(join(output, 'game/pet.js'));
after(() => rmSync(output, { recursive: true, force: true }));
const save = (name = 'Momo') => ({ ...emptySave(), savedAt: 1000, pet: createPet(name, 'leaf', 1000) });
function fixture(local = emptySave(), cloud = save(), meta = null) {
  let writes = 0;
  const deps = { kind: 'cloud', readLocal: async () => local, readMeta: async () => meta,
    writeMeta: async value => { meta = value; },
    readCloud: async () => ({ account: 'apple-user', tag: 'tag', payload: cloud ? JSON.stringify(cloud) : '' }),
    replaceLocal: async (expected, next) => { assert.deepEqual(local, expected); local = next; },
    writeCloud: async () => { writes++; return 'next-tag'; } };
  return { deps, controller: new BackupController(deps), local: () => local, writes: () => writes };
}
test('fresh installation restores the pet and memorial together', async () => {
  const dead = advancePet(createPet('Old', 'ember', 1000), 1000 + 200 * HOUR);
  const cloud = { ...save(), memorial: [{ id: `${dead.createdAt}:${dead.name}`, pet: dead }] };
  const f = fixture(emptySave(), cloud); let restored = 0;
  f.controller.subscribeRestores(() => restored++);
  await f.controller.initialize();
  assert.deepEqual(f.local(), cloud); assert.equal(restored, 1); assert.equal(f.writes(), 0);
  assert.equal(f.controller.getSnapshot().status, 'synced');
});
test('invalid cloud data blocks adoption on a fresh install and is never overwritten', async () => {
  const f = fixture(); f.deps.readCloud = async () => ({ account: 'a', tag: 't', payload: '{broken' });
  await assert.rejects(f.controller.initialize()); assert.deepEqual(f.local(), emptySave()); assert.equal(f.writes(), 0);
});
test('offline lookup blocks a fresh install but keeps an existing game playable', async () => {
  for (const local of [emptySave(), save()]) {
    const f = fixture(local); f.deps.readCloud = async () => { throw Error('Network'); };
    if (local.pet) await f.controller.initialize(); else await assert.rejects(f.controller.initialize());
    assert.deepEqual(f.local(), local); assert.equal(f.writes(), 0);
  }
});
test('no iCloud account permits local play', async () => {
  const f = fixture(); f.deps.readCloud = async () => { throw Error('CLOUD_UNAVAILABLE'); };
  await f.controller.initialize(); assert.equal(f.controller.getSnapshot().status, 'unavailable');
});
test('existing local data and unrelated cloud data require an explicit choice', async () => {
  const f = fixture(save('Local'), save('Cloud')); await f.controller.initialize();
  assert.equal(f.controller.getSnapshot().status, 'conflict'); assert.equal(f.writes(), 0);
  await f.controller.resolve('cloud'); assert.equal(f.local().pet.name, 'Cloud');
});
test('new cloud data restores automatically when local data matches the previous backup', async () => {
  const local = save(); const f = fixture(local, save('New'), { account: 'apple-user', tag: 'old', payload: JSON.stringify(local) });
  await f.controller.initialize(); assert.equal(f.local().pet.name, 'New'); assert.equal(f.writes(), 0);
});
test('simultaneous local and remote changes preserve local data', async () => {
  const local = save('Local'); const f = fixture(local, save('Cloud'), { account: 'apple-user', tag: 'old', payload: JSON.stringify(save()) });
  await f.controller.initialize(); assert.equal(f.controller.getSnapshot().status, 'conflict'); assert.deepEqual(f.local(), local);
});
test('local changes upload with the remote change tag; server conflicts are retained', async () => {
  const f = fixture(save('Local'), save(), { account: 'apple-user', tag: 'tag', payload: JSON.stringify(save()) });
  f.deps.writeCloud = async value => { assert.equal(value.tag, 'tag'); throw Error('CLOUD_CONFLICT'); };
  await f.controller.initialize(); assert.equal(f.controller.getSnapshot().status, 'conflict'); assert.equal(f.local().pet.name, 'Local');
});
test('changing the Apple account never silently transfers a save', async () => {
  const f = fixture(save(), null, { account: 'previous-user', tag: 'old', payload: JSON.stringify(save()) });
  await f.controller.initialize(); assert.equal(f.controller.getSnapshot().status, 'conflict'); assert.equal(f.writes(), 0);
});
test('local changes during a remote read prevent restoring over them', async () => {
  const f = fixture(); f.deps.replaceLocal = async () => { throw Error('CLOUD_CONFLICT'); };
  await assert.rejects(f.controller.initialize()); assert.equal(f.controller.getSnapshot().status, 'conflict');
});
function storage(values = {}) {
  const data = new Map(Object.entries(values));
  return { data, getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); },
    multiGet: async keys => keys.map(key => [key, data.get(key) ?? null]) };
}
test('legacy pet migration preserves old keys and converts v1 statistics', async () => {
  const pet = { ...save().pet, version: 1 }; delete pet.stats;
  const old = JSON.stringify(pet); const adapter = storage({ 'tamakoro.pet.v1': old }); const store = createSaveStore(adapter);
  const migrated = await store.readLocalSave(); assert.equal(migrated.pet.version, 2);
  assert.equal(adapter.data.get('tamakoro.pet.v1'), old); assert.ok(adapter.data.has('tamakoro.game.v1'));
});
test('unreadable legacy memorial prevents migration and preserves every original key', async () => {
  const adapter = storage({ 'tamakoro.pet.v1': JSON.stringify(save().pet), 'tamakoro.memorial.v1': 'broken' });
  await assert.rejects(createSaveStore(adapter).readLocalSave()); assert.equal(adapter.data.has('tamakoro.game.v1'), false);
});
test('atomic snapshot validation keeps an invalid write from replacing the game', async () => {
  const adapter = storage({ 'tamakoro.game.v1': JSON.stringify(save()) }); const store = createSaveStore(adapter);
  await assert.rejects(store.updateLocalSave(value => ({ ...value, pet: { ...value.pet, name: '' } })));
  assert.deepEqual(await store.readLocalSave(), save());
});
test('compare and replace detects intervening writes and increments the restoration revision', async () => {
  const store = createSaveStore(storage()); const before = await store.readLocalSave();
  await store.updateLocalSave(() => save()); await assert.rejects(store.replaceLocalSave(before, save('Cloud')));
  const current = await store.readLocalSave(); await store.replaceLocalSave(current, save('Cloud'));
  assert.equal(store.getLocalRevision(), 1);
});
test('invalid snapshot versions and duplicate memorial entries are rejected', () => {
  assert.throws(() => parseSave(JSON.stringify({ ...save(), version: 99 })));
  const dead = advancePet(save().pet, 200 * HOUR); const record = { id: `${dead.createdAt}:${dead.name}`, pet: dead };
  assert.throws(() => parseSave(JSON.stringify({ ...save(), memorial: [record, record] })));
  assert.throws(() => parseSave('42'));
});
test('local changes upload a validated complete snapshot when the server is unchanged', async () => {
  const local = save('Local'); const f = fixture(local, save(), { account: 'apple-user', tag: 'tag', payload: JSON.stringify(save()) });
  await f.controller.initialize(); assert.equal(f.writes(), 1); assert.equal(f.controller.getSnapshot().status, 'synced');
  assert.deepEqual(f.local(), local);
});
test('system and web modes never access the cloud', async () => {
  for (const kind of ['system', 'local']) {
    const f = fixture(); f.deps.kind = kind;
    f.deps.readCloud = async () => { assert.fail('Unexpected cloud request'); };
    const controller = new BackupController(f.deps); await controller.initialize();
    assert.equal(controller.getSnapshot().status, kind);
  }
});
test('UTF-8 size limits prevent an oversized cloud snapshot from being accepted', () => {
  assert.throws(() => parseSave(JSON.stringify({ ...save(), extra: '🐉'.repeat(180000) })), /large/);
});
test('an unsaved in-memory action prevents automatic cloud restoration', async () => {
  const f = fixture(); const stop = f.controller.subscribeRestoreGuard(() => false);
  await assert.rejects(f.controller.initialize()); assert.deepEqual(f.local(), emptySave());
  stop(); await f.controller.initialize(); assert.equal(f.local().pet.name, 'Momo');
});
