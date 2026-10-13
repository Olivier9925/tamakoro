import { advancePet, GROWTH_STAGES, HOUR, DAY, NEEDS, needSeverity, type Pet, type Need } from '../game/pet';
import { stageLabel, translate, type Language, type TranslationKey } from '../i18n/messages';

export type WidgetProps = {
  name: string; age: string; stage: string; evolution: string; status: string;
  artKey: string; image: string; empty: boolean; dead: boolean; alert: boolean;
  gauges: { label: string; value: number; color: string; severity: string }[];
};
const COLORS: Record<Need, string> = { food: '#ffac77', energy: '#d4ef83', hygiene: '#8fdce5', mood: '#7ae5a0', health: '#d8a7ff' };
function statusKey(pet: Pet): TranslationKey {
  if (pet.needs.health === 0) return 'home.deceased';
  if (pet.needs.health < 20) return 'home.danger';
  if (pet.needs.health < 40) return 'home.needsCare';
  if (pet.sleeping) return 'home.sleeping';
  if (pet.needs.food < 25) return 'home.hungry';
  if (pet.needs.energy < 25) return 'home.tired';
  if (pet.needs.hygiene < 25) return 'home.needsBath';
  if (pet.needs.mood < 30) return 'home.wantsPlay';
  return 'home.happy';
}
export function widgetSnapshot(saved: Pet | null, now: number, language: Language): WidgetProps {
  const t = (key: TranslationKey, values: Record<string, string | number> = {}) => translate(key, values, language);
  if (!saved) return { name: 'Tamakoro', age: '', stage: '', evolution: '', status: t('widget.adopt'),
    artKey: 'leaf-0-awake', image: '', empty: true, dead: false, alert: false, gauges: [] };
  const pet = advancePet(saved, now);
  const dead = pet.needs.health === 0;
  const age = Math.max(0, pet.updatedAt - pet.createdAt);
  const stage = Math.min(6, Math.floor(age / (15 * DAY)));
  const next = GROWTH_STAGES[stage + 1];
  const days = Math.floor(age / DAY), hours = Math.floor(age / HOUR) % 24;
  const artKey = `${pet.appearance}-${stage}-${pet.sleeping || dead ? 'asleep' : 'awake'}`;
  return {
    name: pet.name, age: t('widget.age', { days, hours }), stage: stageLabel(stage, language), artKey, image: '', empty: false, dead,
    status: t(statusKey(pet)), alert: !dead && pet.needs.health < 40,
    evolution: dead ? t('widget.remembrance') : next ? t('widget.evolution', { days: Math.ceil((next.day * DAY - age) / DAY) }) : t('home.adult'),
    gauges: NEEDS.map(key => ({ label: t(`need.${key}`), value: Math.round(pet.needs[key]),
      color: COLORS[key], severity: needSeverity(key, pet.needs[key]) })),
  };
}
// Future entries use the exact game engine. They never write predicted state into the save.
// All living pets reach death within 70 hours without care, even with full needs.
export function widgetTimeline(pet: Pet | null, now: number, language: Language) {
  const times = new Set([now]);
  if (pet && pet.needs.health > 0) {
    const base = Math.max(now, pet.updatedAt);
    const horizon = base + 72 * HOUR;
    for (let step = 0; step <= 144; step++) times.add(base + step * HOUR / 2);
    const terminal = advancePet(pet, horizon);
    if (terminal.needs.health === 0 && terminal.updatedAt > now) times.add(terminal.updatedAt);
    if (pet.sleeping) {
      const wake = pet.updatedAt + (100 - pet.needs.energy) / 18 * HOUR;
      if (wake > now && wake < horizon) times.add(wake);
    }
    for (const stage of GROWTH_STAGES) {
      const evolution = pet.createdAt + stage.day * DAY;
      if (evolution > now && evolution < horizon) times.add(evolution);
    }
  }
  const entries = [...times].sort((a, b) => a - b).map(time => ({ date: new Date(time), props: widgetSnapshot(pet, time, language) }));
  // The last death/empty entry remains valid indefinitely; avoid redundant deceased entries.
  const death = entries.findIndex(entry => entry.props.dead);
  return death < 0 ? entries : entries.slice(0, death + 1);
}
