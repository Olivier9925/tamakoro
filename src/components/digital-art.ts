import { svgSource } from '@/utils/svg-source';

export const TERMINAL_FONT = process.env.EXPO_OS === 'ios' ? 'Menlo' : 'monospace';

const glyphs: Record<string, string[]> = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  A: ['01110', '11011', '10001', '10001', '11111', '10001', '10001'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  O: ['01110', '11011', '10001', '10001', '10001', '11011', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
};
const letters = [...'TAMAKORO'].flatMap((letter, index) => glyphs[letter].flatMap((row, y) =>
  [...row].map((pixel, x) => pixel === '1'
    ? `<rect x="${index * 24 + x * 4}" y="${y * 4}" width="4" height="4" fill="${y < 2 ? '#f2ffe9' : '#bde99f'}"/>` : '')
)).join('');
export const WORDMARK_SOURCE = svgSource(`<svg xmlns="http://www.w3.org/2000/svg" width="188" height="30" viewBox="0 0 188 30" shape-rendering="crispEdges"><g transform="translate(0 2)" opacity="0.2">${letters}</g>${letters}</svg>`);

export const DIGITAL_BACKGROUND_SOURCE = svgSource(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="960" viewBox="0 0 480 960">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="#76bbd0" stroke-width="0.5" opacity="0.075"/>
      <rect x="0" y="0" width="1" height="1" fill="#94ced5" opacity="0.12"/>
    </pattern>
    <radialGradient id="ambient"><stop stop-color="#17323c" stop-opacity="0.6"/><stop offset="1" stop-color="#090f18" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="480" height="960" fill="#090f18"/>
  <rect width="480" height="960" fill="url(#grid)"/>
  <ellipse cx="240" cy="300" rx="300" ry="450" fill="url(#ambient)"/>
  <g fill="none" stroke="#62a8b7" stroke-width="1" opacity="0.13">
    <path d="M0 132H24V180H48V228 M0 552H24V600H48 M480 276H456V324H432V372 M480 720H456V768H432"/>
    <circle cx="48" cy="228" r="3"/><circle cx="48" cy="600" r="3"/>
    <circle cx="432" cy="372" r="3"/><circle cx="432" cy="768" r="3"/>
  </g>
</svg>`);
