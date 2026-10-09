import { GROWTH_STAGES, type Appearance } from '@/game/pet';
import { svgSource } from '@/utils/svg-source';

// Keep the existing layout unit; artwork uses a finer, continuous 160-unit canvas.
export const SPRITE_SIZE = 32;
export const ARTWORK_SIZE = 160;
export const APPEARANCES = {
  leaf: { label: 'Feuille', color: '#a9d875', dark: '#537b49' },
  ember: { label: 'Braise', color: '#ffac77', dark: '#a55b47' },
  water: { label: 'Ondine', color: '#8fdce5', dark: '#417f9a' },
};

// Feet share the same baseline. Growth changes the silhouette, never the canvas.
const forms = [
  { radiusX: 28, radiusY: 25, centerY: 122, ears: 13, crown: 12 },
  { radiusX: 31, radiusY: 29, centerY: 118, ears: 17, crown: 19 },
  { radiusX: 35, radiusY: 32, centerY: 114, ears: 21, crown: 23 },
  { radiusX: 38, radiusY: 35, centerY: 111, ears: 24, crown: 27 },
  { radiusX: 40, radiusY: 36, centerY: 109, ears: 26, crown: 29 },
  { radiusX: 43, radiusY: 37, centerY: 108, ears: 25, crown: 31 },
  { radiusX: 45, radiusY: 38, centerY: 107, ears: 24, crown: 33 },
];
const outline = '#454638';

function pixelate(svg: string) {
  return svg.replace('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">',
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 40 40" shape-rendering="crispEdges"><g transform="scale(.25)">')
    .replace('</svg>', '</g></svg>');
}

function leaf(length: number, width: number) {
  return `<path d="M0 0 C${-width} ${-length * 0.3} ${-width * 0.72} ${-length * 0.8} 0 ${-length}
    C${width * 0.9} ${-length * 0.72} ${width} ${-length * 0.22} 0 0Z" fill="url(#leaf)" stroke="${outline}" stroke-width="2.2"/>
    <path d="M0 -2 Q-1 ${-length * 0.45} 0 ${-length + 4}
      M0 ${-length * 0.36} L${-width * 0.44} ${-length * 0.54}
      M0 ${-length * 0.55} L${width * 0.4} ${-length * 0.7}"
      fill="none" stroke="url(#vein)" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M${-width * 0.48} ${-length * 0.45} Q${-width * 0.48} ${-length * 0.68} -1 ${-length + 5}"
      fill="none" stroke="#fff9d7" stroke-opacity=".42" stroke-width="1.5" stroke-linecap="round"/>`;
}

function pose(appearance: Appearance, stage: number, frame: number, sleeping: boolean) {
  const { radiusX: rx, radiusY: ry, centerY: cy, ears, crown } = forms[stage];
  const palette = APPEARANCES[appearance];
  const top = cy - ry;
  const action = !sleeping && frame >= 100 ? Math.floor((frame - 100) / 5) : null;
  const breath = frame === 1;
  const actionFrame = action === null ? 0 : (frame - 100) % 5;
  const glance = !sleeping && frame === 2 ? -1 : !sleeping && frame === 3 ? 1 : 0;
  const closed = sleeping || frame === 4 || ((action === 0 || action === 1) && actionFrame % 2 === 1);
  const sway = frame === 2 ? -4 : frame === 3 ? 4 : breath ? -2 : action === 2 ? (actionFrame % 2 ? 5 : -5) : action === 3 ? (actionFrame % 2 ? 4 : -4) : 0;
  const eyesY = cy - 5;
  const spacing = 10 + stage * 1.25;
  const eyes = [-1, 1].map(side => {
    const x = 80 + side * spacing;
    return closed
      ? `<path d="M${x - 5.5} ${eyesY} Q${x} ${eyesY + 5.5} ${x + 5.5} ${eyesY}"
          fill="none" stroke="${outline}" stroke-width="2.5" stroke-linecap="round"/>
         <path d="M${x - 4} ${eyesY + 1} l-1.5 1.5" fill="none" stroke="${outline}" stroke-width="1.2" stroke-linecap="round"/>`
      : `<ellipse cx="${x}" cy="${eyesY}" rx="${6.3 + stage * .3}" ry="${8.3 + stage * .32}" fill="#293329"/>
         <ellipse cx="${x + glance * 1.8}" cy="${eyesY + 3}" rx="4.6" ry="4.7" fill="url(#iris)"/>
         <ellipse cx="${x + glance * 1.8}" cy="${eyesY - .4}" rx="3.5" ry="5.1" fill="#202b26"/>
         <ellipse cx="${x - 2 + glance}" cy="${eyesY - 4}" rx="2.3" ry="2.8" fill="#fffdf2"/>
         <circle cx="${x + 2 + glance}" cy="${eyesY + 3}" r="1.1" fill="#fffdf2" opacity=".85"/>
         <path d="M${x - 4} ${eyesY - 11} Q${x} ${eyesY - 12.5} ${x + 3} ${eyesY - 11}"
           fill="none" stroke="#ac8d58" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>`;
  }).join('');
  const dragon = stage >= 5;
  const eating = action === 0;
  const drinking = action === 1;
  const playing = action === 2;
  const cleaning = action === 3;
  const motion = action === null ? 0 : actionFrame;
  const actionTransform = eating ? ['translate(0 0)', 'translate(5 3) rotate(4 80 120)', 'translate(9 6) rotate(9 80 120)', 'translate(5 2) rotate(4 80 120)', 'translate(0 0)'][motion]
    : drinking ? ['translate(0 0)', 'translate(4 3) rotate(7 80 120)', 'translate(8 6) rotate(13 80 120)', 'translate(5 4) rotate(9 80 120)', 'translate(0 0)'][motion]
      : playing ? ['translate(0 0)', 'translate(0 -6)', 'translate(0 -15)', 'translate(0 -9)', 'translate(0 0)'][motion]
        : cleaning ? ['translate(0 0)', 'translate(-5 0) rotate(-8 80 120)', 'translate(6 -2) rotate(10 80 120)', 'translate(-4 1) rotate(-7 80 120)', 'translate(0 0)'][motion] : '';
  const wings = dragon ? [-1, 1].map(side => `<g transform="translate(${80 + side * (rx - 5)} ${cy + 5}) scale(${side} 1)">
    <path d="M0 -5 Q13 -25 27 -23 L22 -13 L32 -16 Q27 1 8 12 L2 8Z" fill="${palette.color}" stroke="${outline}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M4 3 L22 -13 M9 8 L27 -18" fill="none" stroke="${palette.dark}" stroke-width="2" stroke-linecap="round"/>
    </g>`).join('') : '';
  const tail = dragon ? `<path d="M${80 + rx - 4} ${cy + 18} Q${118 + stage * 2} ${cy + 28} 126 130 L139 119 L137 137 L120 145 Q111 135 113 ${cy + 26}Z"
    fill="${palette.color}" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>` : '';
  const horns = dragon ? [-1, 1].map(side => `<path d="M${80 + side * 19} ${top + 13} Q${80 + side * 29} ${top - 1} ${80 + side * 25} ${top - 12} Q${80 + side * 18} ${top - 6} ${80 + side * 15} ${top + 3}Z"
    fill="${palette.dark}" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`).join('') : '';
  const fins = [-1, 1].map(side => `<g transform="translate(${80 + side * (rx - 2)} ${cy - ry * .42}) rotate(${side * (119 + sway)})">
    ${leaf(ears, 7 + stage * .7)}</g>`).join('');
  const sprout = `<path d="M80 ${top + 3} Q${78 + sway * .3} ${top - crown * .5} ${80 + sway * .4} ${top - crown + 7}"
    fill="none" stroke="${palette.dark}" stroke-width="3.5" stroke-linecap="round"/>
    ${[-1, 1].map(side => `<g transform="translate(80 ${top - crown * .42}) rotate(${side * (43 + sway)})">${leaf(crown * .7, 5.5 + stage * .6)}</g>`).join('')}
    ${stage >= 3 ? [-1, 1].map(side => `<g transform="translate(80 ${top - 4}) rotate(${side * (66 - sway)})">${leaf(crown * .4, 4.5)}</g>`).join('') : ''}
    ${stage >= 5 ? `<path d="M80 ${top - crown + 7} C70 ${top - crown + 2} 74 ${top - crown - 5} 80 ${top - crown - 8}
      C86 ${top - crown - 5} 90 ${top - crown + 2} 80 ${top - crown + 7}Z" fill="url(#leaf)" stroke="${outline}" stroke-width="2"/>
      <path d="M78 ${top - crown - 3} Q76 ${top - crown} 78 ${top - crown + 2}" fill="none" stroke="#fff9d7" stroke-width="1.5" stroke-linecap="round"/>` : ''}`;
  const feet = [-1, 1].map(side => {
    const x = 80 + side * (rx * .52);
    return `<path d="M${x - 7} 139 Q${x - 10} 153 ${x - 3} 154 Q${x + 7} 157 ${x + 8} 144Z"
      fill="url(#body)" stroke="${outline}" stroke-width="2.3" stroke-linejoin="round"/>
      <path d="M${x - 3} 150 l0 2 M${x + 1} 150 l0 2" stroke="#c2a16c" stroke-width="1" stroke-linecap="round"/>`;
  }).join('');
  const mouthX = 80 + glance;
  const mouth = sleeping || (action !== null && action !== 0)
    ? `<path d="M77 ${cy + 10} Q80 ${cy + 8} 83 ${cy + 10}" fill="none" stroke="${outline}" stroke-width="1.7" stroke-linecap="round"/>`
    : `<path d="M${mouthX - 5} ${cy + 7} Q${mouthX} ${cy + 10} ${mouthX + 5} ${cy + 7}
        Q${mouthX + 4} ${cy + 18} ${mouthX} ${cy + 18} Q${mouthX - 4} ${cy + 18} ${mouthX - 5} ${cy + 7}Z"
        fill="#713e43" stroke="${outline}" stroke-width="1.5" stroke-linejoin="round"/>
       <path d="M${mouthX - 3} ${cy + 14} Q${mouthX} ${cy + 11} ${mouthX + 3} ${cy + 14}
         Q${mouthX} ${cy + 20} ${mouthX - 3} ${cy + 14}" fill="#f08d91"/>`;
  const mouthShape = dragon && !sleeping && (action !== null || !sleeping) ? `<path d="M${80 + rx * .42} ${cy + 8} L${80 + rx + 10} ${cy + 9} L${80 + rx + 5} ${cy + 17} L${80 + rx * .42} ${cy + 15}Z"
    fill="#ef9a75" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/><path d="M${80 + rx + 2} ${cy + 8} l2 3 m3 -2 l2 3" stroke="#fff2d1" stroke-width="1.5"/>` : '';
  const collar = stage >= 4 ? `<g transform="translate(80 ${cy + ry - 9})">
    <path d="M-13 -1 Q-6 -6 0 0 Q6 -6 13 -1 Q6 8 0 4 Q-6 8 -13 -1Z" fill="url(#leaf)" stroke="${palette.dark}" stroke-width="1.3"/>
    ${stage === 6 ? '<path d="M0 -3 Q6 1 0 8 Q-6 1 0 -3Z" fill="#fff8cf" stroke="#c5a463" stroke-width="1"/>' : ''}</g>` : '';
  return pixelate(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <radialGradient id="body" cx=".35" cy=".23" r=".88"><stop stop-color="#fffbe8"/><stop offset=".58" stop-color="#fff0cd"/><stop offset="1" stop-color="#ddb982"/></radialGradient>
      <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e2f2bf"/><stop offset=".35" stop-color="${palette.color}"/><stop offset="1" stop-color="${palette.dark}"/></linearGradient>
      <linearGradient id="vein"><stop stop-color="${palette.dark}"/><stop offset="1" stop-color="#f0f4cf"/></linearGradient>
      <linearGradient id="iris" x2="0" y2="1"><stop stop-color="${palette.dark}"/><stop offset="1" stop-color="${palette.color}"/></linearGradient>
      <radialGradient id="cheek"><stop stop-color="#ee9291" stop-opacity=".78"/><stop offset="1" stop-color="#f6b6a2" stop-opacity="0"/></radialGradient>
    </defs>
    ${tail}${wings}${horns}${feet}
    <g transform="${action !== null ? actionTransform : `translate(0 ${breath ? -1.2 : 0}) translate(80 ${cy + ry}) scale(${breath ? 1.012 : 1} ${breath ? 1.018 : 1}) translate(-80 ${-(cy + ry)})`}">
      ${fins}${sprout}
      <path d="M80 ${top} L${80 + rx * .62} ${top + 3} L${80 + rx} ${cy - ry * .4} L${80 + rx} ${cy + 4}
        L${80 + rx - 3} ${cy + ry * .62} L${80 + rx * .55} ${cy + ry} L80 ${cy + ry} L${80 - rx * .55} ${cy + ry}
        L${80 - rx + 3} ${cy + ry * .62} L${80 - rx} ${cy + 4} L${80 - rx} ${cy - ry * .4} L${80 - rx * .62} ${top + 3}Z"
        fill="${dragon ? palette.color : '#fff1cf'}" stroke="${outline}" stroke-width="2.6" stroke-linejoin="round"/>
      ${dragon ? `<path d="M${80 - rx * .52} ${cy + 14} L${80 - rx * .34} ${cy + 21} L${80 - rx * .14} ${cy + 15} L80 ${cy + 22} L${80 + rx * .16} ${cy + 15} L${80 + rx * .36} ${cy + 21} L${80 + rx * .54} ${cy + 13}"
        fill="none" stroke="${palette.dark}" stroke-width="2.4" stroke-linejoin="round"/>` : ''}
      ${dragon ? '' : `<path d="M${80 - rx + 6} ${cy - 6} L${80 - rx + 9} ${top + 7} L75 ${top + 5}"
        fill="none" stroke="#fffef1" stroke-width="3" stroke-linecap="round"/>`}
      ${[-1, 1].map(side => `<rect x="${80 + side * (spacing + 8) - 5}" y="${eyesY + 9}" width="10" height="4" rx="1" fill="#ee9b8c" opacity=".8"/>`).join('')}
      ${stage >= 2 ? `<g fill="${palette.dark}" opacity=".7"><rect x="68" y="${top + 12}" width="3" height="3"/><rect x="89" y="${top + 9}" width="3" height="3"/></g>` : ''}
      ${eyes}${dragon ? (eating ? mouthShape : mouth) : mouth}${collar}
      ${eating ? `<g transform="translate(0 ${[0,3,6,2,0][motion]})"><rect x="${[100,104,108,106,102][motion]}" y="${cy + [4,5,7,3,2][motion]}" width="${[8,7,5,3,2][motion]}" height="${[7,6,4,3,2][motion]}" fill="#ff9a45" stroke="${outline}" stroke-width="1.5"/><rect x="${[102,106,109,107,103][motion]}" y="${cy + [2,3,5,1,0][motion]}" width="${[4,3,2,2,1][motion]}" height="${[3,2,2,2,1][motion]}" fill="#79bc58"/></g><path d="M${80 + rx - 1} ${cy + 7 + (motion % 2) * 3} L${80 + rx + 5} ${cy + 10 - (motion % 2) * 2}" stroke="${outline}" stroke-width="2"/>` : ''}
      ${drinking ? `<rect x="${93 + motion}" y="${cy + 7}" width="15" height="13" fill="#14232d" stroke="#67dfff" stroke-width="2"/><rect x="${95 + motion}" y="${cy + 10}" width="11" height="7" fill="#67dfff" opacity=".8"/><path d="M${80 + rx - 1} ${cy + 10} L${80 + rx + 4} ${cy + 10}" stroke="#75e8ff" stroke-width="2"/><rect x="${101 + motion}" y="${cy - 1 - motion}" width="4" height="4" fill="#b8f8ff"/>` : ''}
      ${playing ? `<g transform="translate(0 ${[0,-4,-10,-6,0][motion]})"><path d="M${80-rx} ${cy+10} L${80-rx-10} ${cy+2} L${80-rx-7} ${cy+18} M${80+rx} ${cy+10} L${80+rx+10} ${cy+2} L${80+rx+7} ${cy+18}" fill="${palette.color}" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/></g><rect x="${[48,55,48,41,48][motion]}" y="${cy - 12}" width="5" height="5" fill="#b6ff78"/><rect x="${[108,101,108,115,108][motion]}" y="${cy - 3}" width="5" height="5" fill="#ffcf64"/><rect x="${76+motion}" y="${top - 11-motion}" width="6" height="6" fill="#ff8dc8"/>` : ''}
      ${cleaning ? `<rect x="${[48,45,48,51,48][motion]}" y="${cy - 13 + [0,3,6,3,0][motion]}" width="6" height="6" fill="#8ce9ff"/><rect x="${[109,112,109,106,109][motion]}" y="${cy - 8 - [0,3,6,3,0][motion]}" width="5" height="5" fill="#d5f8ff"/><rect x="${[56,60,56,52,56][motion]}" y="${cy + 8}" width="4" height="4" fill="#73cfff"/><rect x="${101+motion*2}" y="${top + 18 + motion*2}" width="6" height="6" fill="#ffffff"/><rect x="${55-motion}" y="${cy - 2-motion}" width="4" height="4" fill="#ffffff"/>` : ''}
    </g>
  </svg>`);
}

function frames(appearance: Appearance, stage: number, sleeping: boolean) {
  return Array.from({ length: sleeping ? 2 : 5 }, (_, frame) => svgSource(pose(appearance, stage, frame, sleeping)));
}

function interactionFrames(appearance: Appearance, stage: number, action: 'feed' | 'hydrate' | 'play' | 'clean') {
  const kind = { feed: 0, hydrate: 1, play: 2, clean: 3 }[action];
  return Array.from({ length: 5 }, (_, frame) => svgSource(pose(appearance, stage, 100 + kind * 5 + frame, false)));
}

// Cache the seven poses for each displayed age and colour, rather than all 147 at launch.
const cache = new Map<string, { awake: ReturnType<typeof frames>; asleep: ReturnType<typeof frames> }>();
export function petSprites(appearance: Appearance, stageIndex: number, action: 'feed' | 'hydrate' | 'play' | 'clean' | null = null) {
  const stage = Number.isFinite(stageIndex)
    ? Math.max(0, Math.min(GROWTH_STAGES.length - 1, Math.floor(stageIndex))) : 0;
  const key = `${appearance}-${stage}-${action ?? 'idle'}`;
  let sources = cache.get(key);
  if (!sources) {
    sources = { awake: frames(appearance, stage, false), asleep: frames(appearance, stage, true) };
    if (action) sources.awake = interactionFrames(appearance, stage, action);
    cache.set(key, sources);
  }
  return sources;
}
