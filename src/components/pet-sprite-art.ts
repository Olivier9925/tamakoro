import type { Appearance } from '@/game/pet';
import { svgSource } from '@/utils/svg-source';

const sprite = [
  '........gg......',
  '.......gGg......',
  '........g.......',
  '.....oooooo.....',
  '...ooCCCCCCoo...',
  '..oCCCCCCCCCCo..',
  '.gGCCoCCCCoCCGg.',
  'gGGCCooCCooCCGGg',
  'gGGCCwwCCwwCCGGg',
  '.gGCCCCCCCCCCGg.',
  '..oCpCCmmCCpCo..',
  '..oCCCCmmCCCCo..',
  '...oCCCCCCCCo...',
  '....ooCCCCoo....',
  '.....oCooCo.....',
  '......o..o......',
];

export const APPEARANCES = {
  leaf: { label: 'Feuille', color: '#a9d875', dark: '#537b49' },
  ember: { label: 'Braise', color: '#ffac77', dark: '#a55b47' },
  water: { label: 'Ondine', color: '#8fdce5', dark: '#417f9a' },
};

// Five hand-adjusted poses on a fixed 16 × 17 grid; feet stay on the same baseline.
function pose(index: number, sleeping: boolean) {
  const rows = sprite.map(row => [...row]);
  if (sleeping || index === 4) {
    for (const y of [6, 8]) for (const x of [5, 6, 9, 10]) rows[y][x] = 'C';
  } else if (index === 2 || index === 3) {
    const direction = index === 2 ? -1 : 1;
    for (const y of [6, 7, 8]) {
      for (let x = 4; x <= 11; x++) rows[y][x] = 'C';
      for (let x = 4; x <= 11; x++) {
        if ('ow'.includes(sprite[y][x])) rows[y][x + direction] = sprite[y][x];
      }
    }
    // The little shoot follows the glance.
    rows[0] = [...(index === 2 ? '.......gg.......' : '.........gg.....')];
    rows[1] = [...(index === 2 ? '......gGg.......' : '........gGg.....')];
  }
  const grid = Array.from({ length: 17 }, () => Array<string>(16).fill('.'));
  rows.forEach((row, y) => {
    const target = y + (index === 1 && y < 14 ? 0 : 1);
    grid[target] = row;
  });
  if (index === 1) grid[14] = [...'....ooCCCCoo....'];
  return grid;
}

function frames(appearance: Appearance, sleeping: boolean) {
  const palette: Record<string, string> = {
    g: APPEARANCES[appearance].dark, G: APPEARANCES[appearance].color,
    o: '#283a43', C: '#fff0c7', w: '#ffffff', p: '#ffa1a0', m: '#c76777',
  };
  return Array.from({ length: sleeping ? 2 : 5 }, (_, index) => {
    const pixels = pose(index, sleeping).flatMap((row, y) => row.map((pixel, x) =>
      palette[pixel] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[pixel]}"/>` : ''
    )).join('');
    return svgSource(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" shape-rendering="crispEdges">${pixels}</svg>`);
  });
}

// Precompute all palettes once, rather than rebuilding sprites during animation.
export const PET_SPRITES = Object.fromEntries(
  (Object.keys(APPEARANCES) as Appearance[]).map(appearance => [appearance, {
    awake: frames(appearance, false), asleep: frames(appearance, true),
  }])
) as Record<Appearance, { awake: ReturnType<typeof frames>; asleep: ReturnType<typeof frames> }>;
