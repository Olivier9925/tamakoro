import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { advancePet, careForPet, createPet, type Action, type Appearance, type Pet } from '@/game/pet';
import { loadPet, savePet } from '@/game/storage';

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
      current.current = value; setPet(value); setLoadFailed(false);
    }).catch(cause => {
      setLoadFailed(true);
      setError(cause instanceof Error ? cause.message : 'Impossible de lire la partie. Réessaie.');
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const refresh = () => {
      if (!current.current || locked.current) return;
      const value = advancePet(current.current, Date.now());
      current.current = value; setPet(value);
    };
    const timer = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, 30_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
      else if (current.current) {
        void persist(current.current).then(() => setSaveFailed(false), () => setSaveFailed(true));
      }
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [persist]);
  const adopt = async (name: string, appearance: Appearance) => {
    if (locked.current || loadFailed) return;
    locked.current = true; setBusy(true); setError(null);
    try {
      const value = createPet(name, appearance, Date.now());
      await persist(value);
      current.current = value; setPet(value); setMessage(`Bienvenue, ${value.name} !`);
    } catch { setError('Adoption non sauvegardée. Réessaie.'); }
    finally { locked.current = false; setBusy(false); }
  };
  const care = async (action: Action) => {
    if (!current.current || locked.current) return;
    if (current.current.sleeping && action !== 'sleep') return;
    locked.current = true; setBusy(true);
    const value = careForPet(current.current, action, Date.now());
    current.current = value; setPet(value);
    const messages: Record<Action, string> = {
      feed: 'Repas servi : satiété +25, humeur +3.',
      hydrate: 'Une gorgée : satiété +8, santé +5.',
      clean: 'Tout propre : hygiène +35, humeur +5.',
      play: 'Un bon moment : humeur +25, énergie −8, satiété −4.',
      sleep: value.sleeping ? 'Au repos : énergie +18 par heure. Les autres besoins continuent d’évoluer.' : 'Bien réveillé ! Les soins sont disponibles.',
    };
    setMessage(`${messages[action]} Les jauges restent entre 0 et 100.`);
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
