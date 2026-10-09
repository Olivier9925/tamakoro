import { translate } from '../i18n/messages';

export type ReminderSettings = { version: 1; enabled: boolean; hour: number; minute: number };
export type ReminderPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';
export type ReminderPet = { name: string; alive: boolean } | null;
export const DEFAULT_REMINDER: ReminderSettings = { version: 1, enabled: false, hour: 19, minute: 0 };
export const reminderTime = (settings: ReminderSettings) => `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`;

export function parseReminder(raw: string): ReminderSettings {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || typeof value.enabled !== 'boolean'
    || !Number.isInteger(value.hour) || value.hour < 0 || value.hour > 23
    || !Number.isInteger(value.minute) || value.minute < 0 || value.minute > 59) {
    throw new Error(translate('settings.reminderCorrupt'));
  }
  return { version: 1, enabled: value.enabled, hour: value.hour, minute: value.minute };
}

export interface ReminderAdapter {
  supported: boolean;
  permission(request: boolean): Promise<ReminderPermission>;
  cancel(): Promise<void>;
  schedule(settings: ReminderSettings, name: string): Promise<void>;
  test(name: string): Promise<void>;
}
type Dependencies = {
  platform: ReminderAdapter;
  read(): Promise<string | null>;
  write(settings: ReminderSettings): Promise<void>;
  pet(): Promise<ReminderPet>;
};
type Snapshot = { settings: ReminderSettings; permission: ReminderPermission; pet: ReminderPet;
  loading: boolean; busy: boolean; error: string | null; message: string | null };

// Serialize permission, scheduling and storage operations across screens and app resumes.
export class ReminderController {
  private loaded = false;
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();
  private state: Snapshot = { settings: DEFAULT_REMINDER, permission: 'undetermined', pet: null,
    loading: true, busy: false, error: null, message: null };
  constructor(private deps: Dependencies) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(change: Partial<Snapshot>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach(listener => listener());
  }
  private run(work: () => Promise<void>) {
    const operation = this.queue.then(async () => {
      this.publish({ busy: true, error: null, message: null });
      let succeeded = false;
      try { await work(); succeeded = true; }
    catch (error) {
        if (!this.loaded) await this.deps.platform.cancel().catch(() => {});
        this.publish({ error: error instanceof Error ? error.message : translate('settings.reminderError') });
      }
      finally { this.publish({ busy: false, loading: false }); }
      return succeeded;
    });
    this.queue = operation;
    return operation;
  }
  private async load() {
    if (this.loaded) return;
    const raw = await this.deps.read();
    const settings = raw === null ? { ...DEFAULT_REMINDER } : parseReminder(raw);
    const pet = await this.deps.pet();
    this.publish({ settings, pet });
    this.loaded = true;
  }
  private async sync(settings = this.state.settings) {
    if (!this.deps.platform.supported) { this.publish({ permission: 'unavailable' }); return; }
    const permission = await this.deps.platform.permission(false);
    this.publish({ permission });
    await this.deps.platform.cancel();
    if (settings.enabled && permission === 'granted' && this.state.pet?.alive) {
      await this.deps.platform.schedule(settings, this.state.pet.name);
    }
  }
  refresh = () => this.run(async () => {
    await this.load();
    this.publish({ pet: await this.deps.pet() });
    await this.sync();
  });
  setPet = (pet: ReminderPet) => this.run(async () => {
    await this.load();
    this.publish({ pet });
    await this.sync();
  });
  save = (settings: ReminderSettings) => this.run(async () => {
    await this.load();
    const next = parseReminder(JSON.stringify(settings));
    const previous = this.state.settings;
    if (!this.deps.platform.supported) throw new Error(translate('settings.reminderUnsupported'));
    if (next.enabled && !previous.enabled) {
      const permission = await this.deps.platform.permission(true);
      this.publish({ permission });
      if (permission !== 'granted') throw new Error(translate('settings.reminderDenied'));
    }
    try {
      await this.sync(next);
      await this.deps.write(next);
    } catch (error) {
      // Restore the saved schedule if either scheduling or persistence fails.
      try { await this.sync(previous); } catch { await this.deps.platform.cancel().catch(() => {}); }
      throw error;
    }
    this.publish({ settings: next, message: next.enabled ? translate('settings.timeSaved', { time: reminderTime(next) }) : translate('settings.remindersOff') });
  });
  test = () => this.run(async () => {
    await this.load();
    const permission = await this.deps.platform.permission(false);
    this.publish({ permission });
    if (!this.state.settings.enabled || permission !== 'granted' || !this.state.pet?.alive) {
      throw new Error(translate('settings.testReminderNeedsSetup'));
    }
    await this.deps.platform.test(this.state.pet.name);
    this.publish({ message: translate('settings.testReminderScheduled') });
  });
}
