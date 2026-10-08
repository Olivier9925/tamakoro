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
export function petGrowth(pet: Pick<Pet, 'createdAt' | 'updatedAt'>, now: number) {
  const age = Math.max(0, Math.max(now, pet.updatedAt) - pet.createdAt);
  const stageIndex = Math.min(6, Math.floor(age / (15 * DAY)));
  const stage = GROWTH_STAGES[stageIndex];
  const next = GROWTH_STAGES[stageIndex + 1];
  return { stageIndex, stage, ageDays: Math.floor(age / DAY),
    daysUntilNext: next ? Math.ceil((next.day * DAY - age) / DAY) : null,
    progress: next ? (age / DAY - stage.day) / 15 : 1 };
}
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function createPet(name: string, appearance: Appearance, now: number): Pet {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 20) throw new Error('Choisis un nom de 1 à 20 caractères.');
  return { version: 1, name: trimmed, appearance, createdAt: now, updatedAt: now,
    sleeping: false, needs: { food: 85, energy: 90, hygiene: 85, mood: 90, health: 100 } };
}

// Rates per hour. Segmenting at care thresholds keeps health independent of refresh frequency.
export function advancePet(pet: Pet, now: number): Pet {
  if (now <= pet.updatedAt) return pet;
  const hours = (now - pet.updatedAt) / HOUR;
  const rates = { food: -4, energy: pet.sleeping ? 18 : -3, hygiene: -2, mood: pet.sleeping ? -1 : -2 };
  const needs = { ...pet.needs };
  const breaks = [0, hours];
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
    needs.health = Math.max(25, Math.min(100, needs.health + (struggling ? -2 : 1) * (end - start)));
  }
  for (const key of ['food', 'energy', 'hygiene', 'mood'] as const) {
    needs[key] = clamp(needs[key] + rates[key] * hours);
  }
  return { ...pet, updatedAt: now, needs };
}

export function careForPet(pet: Pet, action: Action, now: number): Pet {
  const next = advancePet(pet, now);
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
  if (pet.sleeping) return 'Endormi';
  if (pet.needs.health < 40) return 'Besoin de soins';
  if (pet.needs.food < 25) return 'Un petit creux';
  if (pet.needs.energy < 25) return 'Fatigué';
  if (pet.needs.hygiene < 25) return 'Besoin d’un bain';
  if (pet.needs.mood < 30) return 'Envie de jouer';
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
