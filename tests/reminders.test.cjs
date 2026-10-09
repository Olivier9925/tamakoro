const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test, after } = require('node:test');
const output = mkdtempSync(join(tmpdir(), 'tamakoro-reminder-tests-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/reminders/reminder-controller.ts',
  '--outDir', output, '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck', '--strict', '--ignoreConfig']);
const { ReminderController, DEFAULT_REMINDER, parseReminder, reminderTime } = require(join(output, 'reminders', 'reminder-controller.js'));
after(() => rmSync(output, { recursive: true, force: true }));
function setup(raw = null) {
  const env = { raw, permission: 'granted', requests: 0, schedules: [], pending: null,
    pet: { name: 'Momo', alive: true }, failWrite: false, failSchedule: false, tests: 0 };
  const platform = {
    supported: true,
    async permission(request) { if (request) env.requests++; return env.permission; },
    async cancel() { env.pending = null; },
    async schedule(settings, name) {
      if (env.failSchedule) throw new Error('Échec de programmation');
      env.pending = { ...settings, name }; env.schedules.push(env.pending);
    },
    async test() { env.tests++; },
  };
  const controller = new ReminderController({ platform,
    read: async () => env.raw,
    write: async settings => { if (env.failWrite) throw new Error('Échec de sauvegarde'); env.raw = JSON.stringify(settings); },
    pet: async () => env.pet,
  });
  return { env, platform, controller };
}
const enabled = { ...DEFAULT_REMINDER, enabled: true };
test('default is off; opening settings never asks for permission or schedules', async () => {
  const { controller, env } = setup();
  await controller.refresh();
  assert.deepEqual(controller.getSnapshot().settings, DEFAULT_REMINDER);
  assert.equal(env.requests, 0); assert.equal(env.pending, null);
});
test('activation requires consent; changing time replaces the reminder and disabling cancels it', async () => {
  const { controller, env } = setup();
  await controller.save(enabled);
  assert.equal(env.requests, 1); assert.equal(env.pending.name, 'Momo');
  await controller.save({ ...enabled, hour: 7, minute: 45 });
  assert.equal(env.requests, 1); assert.equal(reminderTime(env.pending), '07:45');
  assert.equal(JSON.parse(env.raw).minute, 45);
  await controller.save({ ...enabled, enabled: false });
  assert.equal(env.pending, null); assert.equal(controller.getSnapshot().settings.enabled, false);
});
test('refused permission leaves the saved preference off and prevents test delivery', async () => {
  const { controller, env } = setup(); env.permission = 'denied';
  await controller.save(enabled);
  assert.equal(controller.getSnapshot().settings.enabled, false);
  assert.equal(controller.getSnapshot().permission, 'denied');
  assert.equal(env.raw, null); assert.equal(env.pending, null);
  await controller.test(); assert.equal(env.tests, 0);
  assert.ok(controller.getSnapshot().error);
});
test('reload restores the preference; revocation cancels, and reauthorization resumes without another prompt', async () => {
  const { controller, env } = setup(JSON.stringify(enabled));
  await controller.refresh(); assert.equal(env.pending.hour, 19);
  env.permission = 'denied'; await controller.refresh(); assert.equal(env.pending, null);
  env.permission = 'granted'; await controller.refresh(); assert.equal(env.pending.hour, 19);
  assert.equal(env.requests, 0);
});
test('death or no pet cancels reminders; adoption updates the name and resumes the saved setting', async () => {
  const { controller, env } = setup(JSON.stringify(enabled));
  await controller.refresh(); await controller.setPet({ name: 'Momo', alive: false });
  assert.equal(env.pending, null); assert.equal(controller.getSnapshot().settings.enabled, true);
  await controller.setPet(null); assert.equal(env.pending, null);
  await controller.setPet({ name: 'Rebond', alive: true }); assert.equal(env.pending.name, 'Rebond');
});
test('failed persistence restores the previous schedule; failed scheduling does not overwrite preferences', async () => {
  const { controller, env } = setup(JSON.stringify(enabled));
  await controller.refresh(); env.failWrite = true;
  await controller.save({ ...enabled, hour: 8 });
  assert.equal(controller.getSnapshot().settings.hour, 19); assert.equal(env.pending.hour, 19);
  assert.equal(JSON.parse(env.raw).hour, 19); assert.ok(controller.getSnapshot().error);
  env.failWrite = false; env.failSchedule = true;
  await controller.save({ ...enabled, hour: 8 });
  assert.equal(JSON.parse(env.raw).hour, 19); assert.ok(controller.getSnapshot().error);
});
test('invalid saves are preserved and time values are validated', async () => {
  for (const invalid of ['{', JSON.stringify({ ...enabled, hour: 24 }), JSON.stringify({ ...enabled, minute: -1 }),
    JSON.stringify({ ...enabled, minute: 0.5 }), JSON.stringify({ ...enabled, version: 2 })]) {
    assert.throws(() => parseReminder(invalid));
    const { controller, env } = setup(invalid);
    await controller.refresh(); await controller.save(enabled);
    assert.equal(env.raw, invalid); assert.equal(env.pending, null); assert.equal(env.requests, 0);
    assert.ok(controller.getSnapshot().error);
  }
});
test('rapid changes are serialized; tests require an enabled authorized reminder', async () => {
  const { controller, env } = setup();
  await Promise.all([controller.save(enabled), controller.save({ ...enabled, hour: 6 }),
    controller.save({ ...enabled, enabled: false })]);
  assert.equal(env.pending, null); assert.equal(JSON.parse(env.raw).enabled, false);
  await controller.save(enabled); await controller.test(); assert.equal(env.tests, 1);
});
test('web is explicitly unavailable and never saves an activated reminder', async () => {
  const { controller, env, platform } = setup(); platform.supported = false;
  await controller.refresh(); assert.equal(controller.getSnapshot().permission, 'unavailable');
  await controller.save(enabled); assert.equal(env.raw, null); assert.equal(env.requests, 0);
});
