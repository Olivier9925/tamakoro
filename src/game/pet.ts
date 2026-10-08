export const NEEDS = ['food', 'energy', 'hygiene', 'mood', 'health'] as const;
export type Need = (typeof NEEDS)[number];
export type Appearance = 'leaf' | 'ember' | 'water';
export type Action = 'feed' | 'hydrate' | 'clean' | 'play' | 'sleep';
export type Pet = {
  version: 1;
  name: string;
  appearance: Appearance;
  createdAt: number;
  updatedAt: number;
  sleeping: boolean;
  needs: Record<Need, number>;
};
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const GROWTH_STAGES = [
  { day: 0, label: 'Bébé' },
  { day: 15, label: 'Petite pousse' },
  { day: 30, label: 'Enfant' },
  { day: 45, label: 'Juvénile' },
  { day: 60, label: 'Adolescent' },
  { day: 75, label: 'Jeune adulte' },
  { day: 90, label: 'Adulte' },
] as const;

// Derive growth from the existing timestamps: no save-format migration is needed.
export function petGrowth(pet: Pick<Pet, 'createdAt' | 'updatedAt' | 'needs'>, now: number) {
  const age = Math.max(0, (pet.needs.health === 0 ? pet.updatedAt : Math.max(now, pet.updatedAt)) - pet.createdAt);
  const stageIndex = Math.min(6, Math.floor(age / (15 * DAY)));
  const stage = GROWTH_STAGES[stageIndex];
  const next = GROWTH_STAGES[stageIndex + 1];
  return { stageIndex, stage, ageDays: Math.floor(age / DAY),
    daysUntilNext: next ? Math.ceil((next.day * DAY - age) / DAY) : null,
    progress: next ? (age / DAY - stage.day) / 15 : 1 };
}
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export const NEED_WARNING: Record<Need, number> = { food: 25, energy: 25, hygiene: 25, mood: 30, health: 40 };
export function needSeverity(key: Need, value: number): 'normal' | 'warning' | 'critical' {
  if (value < (key === 'energy' ? 10 : 20)) return 'critical';
  return value < NEED_WARNING[key] ? 'warning' : 'normal';
}
export function isPetDead(pet: Pet) { return pet.needs.health === 0; }

export function petHealthAlert(pet: Pet) {
  if (isPetDead(pet)) return `${pet.name} est décédé. Les soins et la croissance sont arrêtés.`;
  const causes = [pet.needs.food < 20 ? 'satiété' : null,
    pet.needs.hygiene < 20 ? 'hygiène' : null, pet.needs.mood < 20 ? 'humeur' : null].filter(Boolean);
  if (causes.length) return `${pet.needs.health < 20 ? 'Danger de mort. ' : ''}Santé −2/h : ${causes.join(', ')} sous 20. Nourrir, nettoyer ou jouer permet de corriger ces besoins ; hydrater rend 5 points de santé.`;
  if (pet.needs.health < 40) return 'Santé fragile. Elle remonte de 1/h lorsque satiété, hygiène et humeur restent à 20 ou plus. Hydrater rend 5 points.';
  return null;
}

export function createPet(name: string, appearance: Appearance, now: number): Pet {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 20) throw new Error('Choisis un nom de 1 à 20 caractères.');
  return { version: 1, name: trimmed, appearance, createdAt: now, updatedAt: now,
    sleeping: false, needs: { food: 85, energy: 90, hygiene: 85, mood: 90, health: 100 } };
}

// Rates per hour. Segmenting at care thresholds keeps health independent of refresh frequency.
export function advancePet(pet: Pet, now: number): Pet {
  if (isPetDead(pet) || now <= pet.updatedAt) return pet;
  const hours = (now - pet.updatedAt) / HOUR;
  const rates = { food: -4, energy: pet.sleeping ? 18 : -3, hygiene: -2, mood: pet.sleeping ? -1 : -2 };
  const needs = { ...pet.needs };
  const breaks = [0, hours];
  let elapsed = hours;
  for (const key of ['food', 'hygiene', 'mood'] as const) {
    const crossing = (20 - needs[key]) / rates[key];
    if (crossing > 0 && crossing < hours) breaks.push(crossing);
  }
  breaks.sort((a, b) => a - b);
  for (let i = 1; i < breaks.length; i++) {
    const start = breaks[i - 1];
    const end = breaks[i];
    const middle = (start + end) / 2;
    const struggling = (['food', 'hygiene', 'mood'] as const)
      .some(key => clamp(pet.needs[key] + rates[key] * middle) < 20);
    if (struggling && needs.health <= 2 * (end - start)) {
      elapsed = start + needs.health / 2;
      needs.health = 0;
      break;
    }
    needs.health = clamp(needs.health + (struggling ? -2 : 1) * (end - start));
  }
  for (const key of ['food', 'energy', 'hygiene', 'mood'] as const) {
    needs[key] = clamp(needs[key] + rates[key] * elapsed);
  }
  return { ...pet, updatedAt: elapsed === hours ? now : pet.updatedAt + elapsed * HOUR,
    sleeping: needs.health === 0 ? false : pet.sleeping, needs };
}

export function careForPet(pet: Pet, action: Action, now: number): Pet {
  const next = advancePet(pet, now);
  if (isPetDead(next)) return next;
  if (action === 'sleep') return { ...next, sleeping: !next.sleeping };
  if (next.sleeping) return next;
  const needs = { ...next.needs };
  if (action === 'feed') { needs.food += 25; needs.mood += 3; }
  if (action === 'hydrate') { needs.food += 8; needs.health += 5; }
  if (action === 'clean') { needs.hygiene += 35; needs.mood += 5; }
  if (action === 'play') { needs.mood += 25; needs.energy -= 8; needs.food -= 4; }
  for (const key of NEEDS) needs[key] = clamp(needs[key]);
  return { ...next, needs };
}

export function petMood(pet: Pet) {
  if (isPetDead(pet)) return 'Décédé';
  if (pet.needs.health < 20) return 'Danger de mort';
  if (pet.needs.health < NEED_WARNING.health) return 'Besoin de soins';
  if (pet.sleeping) return 'Endormi';
  if (pet.needs.food < NEED_WARNING.food) return 'Un petit creux';
  if (pet.needs.energy < NEED_WARNING.energy) return 'Fatigué';
  if (pet.needs.hygiene < NEED_WARNING.hygiene) return 'Besoin d’un bain';
  if (pet.needs.mood < NEED_WARNING.mood) return 'Envie de jouer';
  return 'Heureux';
}

export function parsePet(raw: string): Pet {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || typeof value.name !== 'string' || !value.name.trim()
    || value.name.length > 20 || !['leaf', 'ember', 'water'].includes(value.appearance)
    || typeof value.sleeping !== 'boolean' || !Number.isFinite(value.createdAt)
    || !Number.isFinite(value.updatedAt) || value.createdAt < 0 || value.updatedAt < value.createdAt
    || !NEEDS.every(key => Number.isFinite(value.needs?.[key]) && value.needs[key] >= 0 && value.needs[key] <= 100)) {
    throw new Error('La sauvegarde ne peut pas être lue. Elle est conservée sur cet appareil.');
  }
  return value as Pet;
}
