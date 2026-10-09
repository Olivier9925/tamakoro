import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { advancePet, careForPet, createPet, isPetDead, petGrowth, petHealthAlert, type Action, type Appearance, type Pet } from '@/game/pet';
import { archivePet, loadPet, loadPetRecords, savePet, type PetRecord } from '@/game/storage';
import { reminders } from '@/reminders/reminders';

function growthNotice(previous: Pet, next: Pet) {
  if (isPetDead(next)) return isPetDead(previous) ? null : petHealthAlert(next);
  const before = petGrowth(previous, previous.updatedAt);
  const after = petGrowth(next, next.updatedAt);
  return after.stageIndex > before.stageIndex ? `${next.name} a évolué : ${after.stage.label} !` : null;
}

function elapsedNotice(previous: Pet, next: Pet) {
  const notices = [growthNotice(previous, next)];
  if (!isPetDead(next) && previous.sleeping && !next.sleeping) {
    notices.push(`${next.name} s’est réveillé automatiquement après avoir récupéré toute son énergie.`);
  }
  return notices.filter(Boolean).join(' ') || null;
}

export function usePet() {
  const [pet, setPet] = useState<Pet | null>(null);
  const current = useRef<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Chaque petit soin compte.');
  const [saveFailed, setSaveFailed] = useState(false);
  const [petRecords, setPetRecords] = useState<PetRecord[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const petName = pet?.name;
  const petDead = pet ? isPetDead(pet) : false;
  useEffect(() => {
    if (!loading && !loadFailed) void reminders.setPet(petName ? { name: petName, alive: !petDead } : null);
  }, [petName, petDead, loading, loadFailed]);

  const persist = useCallback((value: Pet, archive = false) => {
    // Serialize writes so an older snapshot cannot overwrite a newer action.
    const write = queue.current.catch(() => {}).then(async () => {
      await savePet(value);
      if (archive) {
        await archivePet(value);
        const records = await loadPetRecords();
        setPetRecords(records);
        setHistoryError(null);
      }
    });
    queue.current = write;
    return write;
  }, []);
  const load = useCallback(() => {
    return loadPet().then(async saved => {
      const value = saved ? advancePet(saved, Date.now()) : null;
      try {
        setPetRecords(await loadPetRecords());
        setHistoryError(null);
      } catch (cause) {
        setHistoryError(cause instanceof Error ? cause.message : 'Impossible de lire le mémorial.');
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
      setError(cause instanceof Error ? cause.message : 'Impossible de lire la partie. Réessaie.');
    }).finally(() => setLoading(false));
  }, [persist]);
  useEffect(() => { void load(); }, [load]);
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
  }, [persist]);
  const adopt = async (name: string, appearance: Appearance) => {
    if (locked.current || loadFailed || (current.current && !isPetDead(current.current))) return false;
    locked.current = true; setBusy(true); setError(null);
    try {
      if (current.current && isPetDead(current.current)) await persist(current.current, true);
      const value = createPet(name, appearance, Date.now());
      await persist(value);
      current.current = value; setPet(value); setSaveFailed(false); setMessage(`Bienvenue, ${value.name} !`);
      return true;
    } catch { setError('Adoption non sauvegardée. Réessaie.'); return false; }
    finally { locked.current = false; setBusy(false); }
  };
  const care = async (action: Action) => {
    if (!current.current || locked.current || isPetDead(current.current)) return;
    if (current.current.sleeping && action !== 'sleep') return;
    locked.current = true; setBusy(true);
    const previous = current.current;
    const value = careForPet(previous, action, Date.now());
    current.current = value; setPet(value);
    const messages: Record<Action, string> = {
      feed: 'Repas servi : satiété +25, humeur +3.',
      hydrate: 'Une gorgée : satiété +8, santé +5.',
      clean: 'Tout propre : hygiène +35, humeur +5.',
      play: 'Un bon moment : humeur +25, énergie −8, satiété −4.',
      sleep: value.sleeping ? 'Au repos : +18 énergie par heure, réveil automatique à 100. Les autres besoins continuent d’évoluer.' : 'Bien réveillé ! Les soins sont disponibles.',
    };
    const notice = growthNotice(previous, value);
    setMessage(isPetDead(value) ? petHealthAlert(value)! : notice ? `${notice} ${messages[action]}` : `${messages[action]} Les jauges restent entre 0 et 100.`);
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
