import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocalRevision } from '@/backup/local';
import { backup } from '@/backup/runtime';
import { AppState } from 'react-native';
import { ACTION_ENERGY_COST, advancePet, careForPet, createPet, isPetDead, NEEDS, petGrowth, petHealthAlert, type Action, type Appearance, type Need, type Pet } from '@/game/pet';
import { archivePet, loadPet, loadPetRecords, savePet, type PetRecord } from '@/game/storage';
import { reminders } from '@/reminders/reminders';
import { stageLabel, translate } from '@/i18n/messages';
import { useI18n } from '@/i18n/provider';

function growthNotice(previous: Pet, next: Pet) {
  if (isPetDead(next)) return isPetDead(previous) ? null : petHealthAlert(next);
  const before = petGrowth(previous, previous.updatedAt);
  const after = petGrowth(next, next.updatedAt);
  return after.stageIndex > before.stageIndex ? translate('care.evolved', { name: next.name, stage: stageLabel(after.stageIndex) }) : null;
}

function elapsedNotice(previous: Pet, next: Pet) {
  const notices = [growthNotice(previous, next)];
  if (!isPetDead(next) && previous.sleeping && !next.sleeping) {
    notices.push(translate('care.autoWake', { name: next.name }));
  }
  return notices.filter(Boolean).join(' ') || null;
}

export function usePet() {
  const { language } = useI18n();
  const [pet, setPet] = useState<Pet | null>(null);
  const current = useRef<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState(() => ({ language, text: translate('care.generic') }));
  const setMessage = useCallback((text: string) => setMessageState({ language, text }), [language]);
  const message = messageState.language === language ? messageState.text : translate('care.generic');
  const [saveFailed, setSaveFailed] = useState(false);
  const [petRecords, setPetRecords] = useState<PetRecord[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const pendingWrites = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const petName = pet?.name;
  const petDead = pet ? isPetDead(pet) : false;
  useEffect(() => {
    if (!loading && !loadFailed) void reminders.setPet(petName ? { name: petName, alive: !petDead } : null);
  }, [petName, petDead, loading, loadFailed]);

  const persist = useCallback((value: Pet, archive = false) => {
    const revision = getLocalRevision();
    pendingWrites.current++;
    // Serialize writes so an older snapshot cannot overwrite a newer action.
    const write = queue.current.catch(() => {}).then(async () => {
      await savePet(value, revision);
      if (archive) {
        await archivePet(value, revision);
        const records = await loadPetRecords();
        setPetRecords(records);
        setHistoryError(null);
      }
    });
    const settled = write.finally(() => { pendingWrites.current--; });
    queue.current = settled;
    return settled;
  }, []);
  const load = useCallback(() => {
    return loadPet().then(async saved => {
      const value = saved ? advancePet(saved, Date.now()) : null;
      try {
        setPetRecords(await loadPetRecords());
        setHistoryError(null);
      } catch (cause) {
        setHistoryError(cause instanceof Error ? cause.message : translate('memorial.readError'));
      }
      if (saved && value) {
        const notice = elapsedNotice(saved, value);
        if (notice) setMessage(notice);
      }
      current.current = value; setPet(value); setLoadFailed(false);
      if (value && saved && (isPetDead(value) || (saved.sleeping && !value.sleeping))) {
        void persist(value, isPetDead(value)).then(() => setSaveFailed(false), cause => {
          setSaveFailed(true);
          if (isPetDead(value)) setHistoryError(cause instanceof Error ? cause.message : 'Archivage impossible.');
        });
      }
    }).catch(cause => {
      setLoadFailed(true);
      setError(cause instanceof Error ? cause.message : translate('save.unreadable'));
    }).finally(() => setLoading(false));
  }, [persist, setMessage]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => backup.subscribeRestoreGuard(() => pendingWrites.current === 0), []);
  useEffect(() => backup.subscribeRestores(() => {
    current.current = null; setLoading(true); void load();
  }), [load]);
  useEffect(() => {
    const refresh = () => {
      if (!current.current || locked.current) return;
      const previous = current.current;
      const value = advancePet(previous, Date.now());
      const notice = elapsedNotice(previous, value);
      if (notice) setMessage(notice);
      current.current = value; setPet(value);
      if ((isPetDead(value) && notice) || (previous.sleeping && !value.sleeping)) {
        void persist(value, isPetDead(value)).then(() => setSaveFailed(false), cause => {
          setSaveFailed(true);
          if (isPetDead(value)) setHistoryError(cause instanceof Error ? cause.message : 'Archivage impossible.');
        });
      }
    };
    const timer = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, 30_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
      else if (current.current && !locked.current) {
        void persist(current.current).then(() => setSaveFailed(false), () => setSaveFailed(true));
      }
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [persist, setMessage]);
  const adopt = async (name: string, appearance: Appearance) => {
    if (locked.current || loadFailed || (current.current && !isPetDead(current.current))) return false;
    locked.current = true; setBusy(true); setError(null);
    try {
      if (current.current && isPetDead(current.current)) await persist(current.current, true);
      const value = createPet(name, appearance, Date.now());
      await persist(value);
      current.current = value; setPet(value); setSaveFailed(false); setMessage(translate('care.welcome', { name: value.name }));
      return true;
    } catch { setError(translate('home.saveFailure')); return false; }
    finally { locked.current = false; setBusy(false); }
  };
  const care = async (action: Action, onApplied?: (deltas: Partial<Record<Need, number>>) => void) => {
    if (!current.current || locked.current || isPetDead(current.current)) return;
    if (current.current.sleeping && action !== 'sleep') return;
    locked.current = true; setBusy(true);
    const previous = current.current;
    const now = Date.now();
    const evaluated = advancePet(previous, now);
    const value = careForPet(previous, action, now);
    current.current = value; setPet(value);
    const messages: Record<Action, string> = {
      feed: translate('care.feed'),
      hydrate: translate('care.hydrate'),
      clean: translate('care.clean'),
      play: translate('care.play'),
      sleep: value.sleeping ? translate('care.sleep') : translate('care.wake'),
    };
    const notice = growthNotice(previous, value);
    const insufficientEnergy = action !== 'sleep' && evaluated.needs.energy < ACTION_ENERGY_COST[action];
    if (!isPetDead(value) && !insufficientEnergy && action !== 'sleep') {
      const deltas = Object.fromEntries(NEEDS.map(key => [key, value.needs[key] - evaluated.needs[key]])
        .filter(([, delta]) => delta !== 0)) as Partial<Record<Need, number>>;
      onApplied?.(deltas);
    }
    setMessage(isPetDead(value) ? petHealthAlert(value)! : insufficientEnergy ? translate('care.lowEnergy')
      : notice ? `${notice} ${messages[action]}` : `${messages[action]}${translate('care.clamped')}`);
    try { await persist(value, isPetDead(value)); setSaveFailed(false); }
    catch (cause) {
      setSaveFailed(true);
      if (isPetDead(value)) setHistoryError(cause instanceof Error ? cause.message : 'Archivage impossible.');
    }
    finally { locked.current = false; setBusy(false); }
  };
  const retrySave = async () => {
    if (!current.current || locked.current) return;
    locked.current = true; setBusy(true);
    try { await persist(current.current, isPetDead(current.current)); setSaveFailed(false); }
    catch (cause) {
      setSaveFailed(true);
      if (isPetDead(current.current)) setHistoryError(cause instanceof Error ? cause.message : 'Archivage impossible.');
    }
    finally { locked.current = false; setBusy(false); }
  };
  const retryLoad = () => { setLoading(true); setError(null); void load(); };
  return { pet, petRecords, historyError, loading, loadFailed, busy, error, message, saveFailed, load: retryLoad, adopt, care, retrySave };
}
