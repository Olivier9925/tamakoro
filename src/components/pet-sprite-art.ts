import { GROWTH_STAGES, type Appearance } from '@/game/pet';
import { svgSource } from '@/utils/svg-source';

export const SPRITE_SIZE = 32;
export const APPEARANCES = {
  leaf: { label: 'Feuille', color: '#a9d875', dark: '#537b49' },
  ember: { label: 'Braise', color: '#ffac77', dark: '#a55b47' },
  water: { label: 'Ondine', color: '#8fdce5', dark: '#417f9a' },
};

// All forms share a baseline and canvas; their actual silhouette grows within it.
const forms = [
  { radiusX: 5, radiusY: 5, centerY: 25, ears: 2, crown: 2 },
  { radiusX: 6, radiusY: 6, centerY: 24, ears: 3, crown: 3 },
  { radiusX: 7, radiusY: 6, centerY: 24, ears: 4, crown: 4 },
  { radiusX: 7, radiusY: 7, centerY: 23, ears: 4, crown: 5 },
  { radiusX: 8, radiusY: 7, centerY: 23, ears: 5, crown: 6 },
  { radiusX: 8, radiusY: 8, centerY: 22, ears: 6, crown: 7 },
  { radiusX: 9, radiusY: 8, centerY: 22, ears: 6, crown: 8 },
];

function pose(stageIndex: number, frame: number, sleeping: boolean) {
  const form = forms[stageIndex];
  const grid = Array.from({ length: SPRITE_SIZE }, () => Array<string>(SPRITE_SIZE).fill('.'));
  const put = (x: number, y: number, color: string) => {
    if (x >= 0 && x < SPRITE_SIZE && y >= 0 && y < SPRITE_SIZE) grid[y][x] = color;
  };
  const block = (x: number, y: number, width: number, height: number, color: string) => {
    for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) put(x + dx, y + dy, color);
  };
  const breath = frame === 1 ? -1 : 0;
  const glance = !sleeping && frame === 2 ? -1 : !sleeping && frame === 3 ? 1 : 0;
  const centerX = 15;
  const centerY = form.centerY + breath;
  const top = centerY - form.radiusY;
  const earLift = frame === 2 ? -1 : frame === 3 ? 1 : 0;
  // Growing leaf-like fins sway by a pixel independently of the face.
  for (const side of [-1, 1]) {
    for (let length = 0; length <= form.ears; length++) {
      const x = centerX + side * (form.radiusX + length - 1);
      const y = centerY - 2 + Math.floor(length / 2) + side * earLift;
      block(x, y, 1, Math.max(1, 5 - Math.floor(length / 2)), 'g');
      block(x, y + 1, 1, Math.max(1, 3 - Math.floor(length / 2)), 'G');
    }
  }
  // Pixel contour, cream body and lower shading.
  for (let y = top; y <= centerY + form.radiusY; y++) {
    for (let x = centerX - form.radiusX; x <= centerX + form.radiusX; x++) {
      const distance = ((x - centerX) / form.radiusX) ** 2 + ((y - centerY) / form.radiusY) ** 2;
      if (distance <= 1) {
        const inner = ((x - centerX) / (form.radiusX - 1)) ** 2 + ((y - centerY) / (form.radiusY - 1)) ** 2;
        put(x, y, inner > 1 ? 'o' : y > centerY + form.radiusY - 3 ? 'S' : 'C');
      }
    }
  }
  // The crown develops from a bud to a broad, branching shoot.
  const crownX = centerX + glance;
  block(centerX, top - form.crown + 1, 1, form.crown, 'g');
  for (let leaf = 0; leaf <= Math.floor(stageIndex / 2); leaf++) {
    const tipY = top - form.crown + leaf * 2;
    const reach = 2 + Math.floor(stageIndex / 2) - leaf;
    for (const side of [-1, 1]) for (let length = 1; length <= reach; length++) {
      const x = crownX + side * length;
      put(x, tipY + Math.floor(length / 2), 'g');
      put(x, tipY + Math.floor(length / 2) + 1, 'G');
    }
  }
  if (stageIndex >= 5) {
    // A bright crown bud distinguishes the two mature forms.
    block(crownX - 1, top - form.crown - 1, 3, 2, 'G');
    put(crownX, top - form.crown - 1, 'w');
  }
  const eyesY = centerY - 2;
  const eyeSpacing = stageIndex >= 3 ? 4 : 3;
  for (const side of [-1, 1]) {
    const x = centerX + side * eyeSpacing + glance - 1;
    if (sleeping || frame === 4) block(x, eyesY + 1, 2, 1, 'o');
    else {
      block(x, eyesY, 2, stageIndex >= 2 ? 3 : 2, 'o');
      put(x, eyesY, 'w');
    }
    block(centerX + side * (eyeSpacing + 1) - 1, eyesY + 3, 2, 1, 'p');
  }
  block(centerX + glance, centerY + 2, stageIndex >= 2 ? 2 : 1, 1, 'm');
  if (stageIndex >= 3) put(centerX + glance, centerY + 3, 'm');
  if (stageIndex >= 4) {
    // A small collar appears in adolescence and becomes a three-pixel crest.
    block(centerX - 1, centerY + 5, stageIndex === 6 ? 3 : 2, 1, 'G');
  }
  // Feet stay grounded while the body breathes.
  for (const side of [-1, 1]) {
    const x = centerX + side * Math.max(2, form.radiusX - 3) - 1;
    const legTop = centerY + form.radiusY - 3;
    block(x, legTop, stageIndex >= 3 ? 3 : 2, 32 - legTop, 'o');
    block(x + 1, legTop, 1, 31 - legTop, 'C');
    block(x, 30, stageIndex >= 3 ? 3 : 2, 2, 'o');
    block(x + 1, 30, 1, 1, 'C');
  }
  return grid;
}

function frames(appearance: Appearance, stageIndex: number, sleeping: boolean) {
  const palette: Record<string, string> = {
    g: APPEARANCES[appearance].dark, G: APPEARANCES[appearance].color,
    o: '#283a43', C: '#fff0c7', S: '#eacb94', w: '#ffffff', p: '#ffa1a0', m: '#c76777',
  };
  return Array.from({ length: sleeping ? 2 : 5 }, (_, frame) => {
    const pixels = pose(stageIndex, frame, sleeping).flatMap((row, y) => row.map((pixel, x) =>
      palette[pixel] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[pixel]}"/>` : ''
    )).join('');
    return svgSource(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">${pixels}</svg>`);
  });
}

// Generate and cache only the forms actually displayed, rather than all 147 sprites at startup.
const cache = new Map<string, { awake: ReturnType<typeof frames>; asleep: ReturnType<typeof frames> }>();
export function petSprites(appearance: Appearance, stageIndex: number) {
  const stage = Math.max(0, Math.min(GROWTH_STAGES.length - 1, Math.floor(stageIndex)));
  const key = `${appearance}-${stage}`;
  let sources = cache.get(key);
  if (!sources) {
    sources = { awake: frames(appearance, stage, false), asleep: frames(appearance, stage, true) };
    cache.set(key, sources);
  }
  return sources;
}
