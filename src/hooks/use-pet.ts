import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { advancePet, careForPet, createPet, isPetDead, petGrowth, petHealthAlert, type Action, type Appearance, type Pet } from '@/game/pet';
import { loadPet, savePet } from '@/game/storage';

function growthNotice(previous: Pet, next: Pet) {
  if (isPetDead(next)) return isPetDead(previous) ? null : petHealthAlert(next);
  const before = petGrowth(previous, previous.updatedAt);
  const after = petGrowth(next, next.updatedAt);
  return after.stageIndex > before.stageIndex ? `${next.name} a évolué : ${after.stage.label} !` : null;
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
  const queue = useRef<Promise<void>>(Promise.resolve());

  const persist = useCallback((value: Pet) => {
    // Serialize writes so an older snapshot cannot overwrite a newer action.
    const write = queue.current.catch(() => {}).then(() => savePet(value));
    queue.current = write;
    return write;
  }, []);
  const load = useCallback(() => {
    return loadPet().then(saved => {
      const value = saved ? advancePet(saved, Date.now()) : null;
      if (saved && value) {
        const notice = growthNotice(saved, value);
        if (notice) setMessage(notice);
      }
      current.current = value; setPet(value); setLoadFailed(false);
      if (value && isPetDead(value) && saved && !isPetDead(saved)) {
        void persist(value).then(() => setSaveFailed(false), () => setSaveFailed(true));
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
      const value = advancePet(current.current, Date.now());
      const notice = growthNotice(current.current, value);
      if (notice) setMessage(notice);
      current.current = value; setPet(value);
      if (isPetDead(value) && notice) {
        void persist(value).then(() => setSaveFailed(false), () => setSaveFailed(true));
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
      sleep: value.sleeping ? 'Au repos : énergie +18 par heure. Les autres besoins continuent d’évoluer.' : 'Bien réveillé ! Les soins sont disponibles.',
    };
    const notice = growthNotice(previous, value);
    setMessage(isPetDead(value) ? petHealthAlert(value)! : notice ? `${notice} ${messages[action]}` : `${messages[action]} Les jauges restent entre 0 et 100.`);
    try { await persist(value); setSaveFailed(false); }
    catch { setSaveFailed(true); }
    finally { locked.current = false; setBusy(false); }
  };
  const retrySave = async () => {
    if (!current.current || locked.current) return;
    locked.current = true; setBusy(true);
    try { await persist(current.current); setSaveFailed(false); }
    catch { setSaveFailed(true); }
    finally { locked.current = false; setBusy(false); }
  };
  const retryLoad = () => { setLoading(true); setError(null); void load(); };
  return { pet, loading, loadFailed, busy, error, message, saveFailed, load: retryLoad, adopt, care, retrySave };
}
