import { content, hasData, parseSave, type GameSave } from '../game/save';
export type RemoteSave = { account: string; tag: string; payload: string };
export type BackupStatus = 'local' | 'system' | 'checking' | 'pending' | 'synced' | 'unavailable' | 'error' | 'conflict';
type Meta = RemoteSave;
export type BackupSnapshot = { status: BackupStatus; savedAt: number | null };
type Dependencies = {
  kind: 'cloud' | 'system' | 'local';
  readLocal(): Promise<GameSave>;
  replaceLocal(expected: GameSave, next: GameSave): Promise<void>;
  readMeta(): Promise<Meta | null>;
  writeMeta(meta: Meta): Promise<void>;
  readCloud(): Promise<RemoteSave>;
  writeCloud(save: RemoteSave): Promise<string>;
};
export class BackupController {
  private state: BackupSnapshot;
  private listeners = new Set<() => void>();
  private restoreGuards = new Set<() => boolean>();
  private restoredListeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private startup: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private remote: RemoteSave | null = null;
  constructor(private deps: Dependencies) {
    this.state = { status: deps.kind === 'system' ? 'system' : 'local', savedAt: null };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  subscribeRestores = (listener: () => void) => { this.restoredListeners.add(listener); return () => { this.restoredListeners.delete(listener); }; };
  subscribeRestoreGuard = (guard: () => boolean) => { this.restoreGuards.add(guard); return () => { this.restoreGuards.delete(guard); }; };
  private publish(status: BackupStatus, savedAt: number | null = this.state.savedAt) {
    this.state = { status, savedAt }; this.listeners.forEach(listener => listener());
  }
  private serialize(operation: () => Promise<void>) {
    const task = this.queue.catch(() => {}).then(operation); this.queue = task; return task;
  }
  initialize() {
    if (!this.startup) {
      this.startup = this.refresh().catch(error => { this.startup = null; throw error; });
    }
    return this.startup;
  }
  changed() {
    if (this.deps.kind !== 'cloud') return;
    if (this.state.status !== 'conflict') this.publish('pending');
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; void this.refresh().catch(() => {}); }, 1500);
  }
  refresh = () => this.serialize(async () => {
    if (this.deps.kind !== 'cloud') return;
    let local: GameSave | null = null;
    this.publish('checking');
    try {
      local = await this.deps.readLocal();
      const meta = await this.deps.readMeta();
      const remote = await this.deps.readCloud();
      this.remote = remote;
      const cloud = remote.payload ? parseSave(remote.payload) : null;
      if (meta && meta.account !== remote.account) { throw new Error('CLOUD_ACCOUNT_CHANGED'); }
      if (!hasData(local) && cloud) {
        await this.restore(local, cloud, remote);
        return;
      }
      if (cloud && content(cloud) === content(local)) {
        await this.deps.writeMeta(remote); this.publish('synced', cloud.savedAt); return;
      }
      if (cloud && meta && meta.tag !== remote.tag && content(local) === content(parseSave(meta.payload))) {
        await this.restore(local, cloud, remote); return;
      }
      if (cloud && (!meta || meta.tag !== remote.tag)) { this.publish('conflict'); return; }
      if (!hasData(local)) { this.publish('synced', null); return; }
      await this.upload(local, remote);
    } catch (error) {
      const unavailable = String(error).includes('CLOUD_UNAVAILABLE');
      this.publish(unavailable ? 'unavailable' : String(error).includes('CLOUD_CONFLICT') || String(error).includes('CLOUD_ACCOUNT_CHANGED') ? 'conflict' : 'error');
      // A failed cloud lookup on a fresh install must not silently create a replacement game.
      if (local && !hasData(local) && !unavailable) throw error;
    }
  });
  private async upload(local: GameSave, remote: RemoteSave) {
    const payload = JSON.stringify(local);
    parseSave(payload);
    const tag = await this.deps.writeCloud({ ...remote, payload });
    await this.deps.writeMeta({ account: remote.account, tag, payload });
    this.publish('synced', local.savedAt);
    if (content(await this.deps.readLocal()) !== content(local)) this.changed();
  }
  private async restore(local: GameSave, cloud: GameSave, remote: RemoteSave) {
    if ([...this.restoreGuards].some(guard => !guard())) throw new Error('CLOUD_CONFLICT');
    await this.deps.replaceLocal(local, cloud);
    this.restoredListeners.forEach(listener => listener());
    await this.deps.writeMeta(remote);
    this.publish('synced', cloud.savedAt);
  }
  resolve = (choice: 'local' | 'cloud') => this.serialize(async () => {
    if (!this.remote) return;
    this.publish('checking');
    try {
      const local = await this.deps.readLocal();
      if (choice === 'local') await this.upload(local, this.remote);
      else {
        const remote = await this.deps.readCloud();
        if (!remote.payload) throw new Error('Missing cloud backup');
        await this.restore(local, parseSave(remote.payload), remote);
      }
    } catch { this.publish('conflict'); }
  });
}
