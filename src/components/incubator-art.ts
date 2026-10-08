// Original vector scenery inspired by the smartphone cutaway references in ../sources/.
// Generated once per lighting state; all geometry stays local and resolution independent.
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const screw = (x: number, y: number) => `<g>${rect(x - 4, y - 4, 8, 8, '#080e16')}
  ${rect(x - 3, y - 3, 6, 6, '#adb4bd')}${rect(x - 1, y - 2, 2, 4, '#35414d')}</g>`;

function chip(x: number, y: number, w: number, h: number, silver = false) {
  const pins = Array.from({ length: Math.floor(w / 7) }, (_, i) =>
    rect(x + 3 + i * 7, y - 4, 3, 5, '#b77b35') + rect(x + 3 + i * 7, y + h - 1, 3, 5, '#b77b35')).join('');
  const sides = Array.from({ length: Math.floor(h / 7) }, (_, i) =>
    rect(x - 4, y + 3 + i * 7, 5, 3, '#b77b35') + rect(x + w - 1, y + 3 + i * 7, 5, 3, '#b77b35')).join('');
  return `<g shape-rendering="crispEdges">${pins}${sides}
    ${rect(x, y, w, h, '#080d14')}${rect(x + 2, y + 2, w - 4, h - 4, silver ? 'url(#metal)' : '#26313e')}
    ${rect(x + 4, y + 4, w - 8, 2, silver ? '#a3adb7' : '#3c4a58')}
    ${rect(x + 5, y + h - 5, w - 10, 2, '#101923')}${rect(x + 5, y + 7, 3, 3, '#8897a3')}
  </g>`;
}

function ribbon(points: string) {
  return `<polyline points="${points}" fill="none" stroke="#4d2a1e" stroke-width="12" stroke-linejoin="miter"/>
    <polyline points="${points}" fill="none" stroke="#bc691e" stroke-width="8"/>
    <polyline points="${points}" fill="none" stroke="#e7a145" stroke-width="2"/>`;
}

export function createIncubatorSvg(sleeping: boolean) {
  const light = sleeping ? '#81c8fa' : '#ffb637';
  const hot = sleeping ? '#c7efff' : '#fff2b0';
  const glow = sleeping ? '#315d90' : '#a76322';
  const hardware = [chip(98, 20, 42, 31, true), chip(153, 18, 53, 38), chip(220, 22, 30, 27, true),
    chip(24, 88, 24, 19), chip(304, 92, 27, 26, true), chip(309, 144, 22, 33),
    chip(304, 199, 27, 24, true), chip(306, 274, 25, 26), chip(24, 329, 29, 27, true),
    chip(71, 365, 35, 20), chip(126, 363, 51, 23, true), chip(196, 365, 25, 20),
    chip(240, 360, 34, 25), chip(303, 331, 25, 22, true)].join('');
  const boardBits = Array.from({ length: 54 }, (_, i) => {
    const x = i % 2 === 0 ? 18 + (i % 5) * 8 : 298 + (i % 4) * 8;
    const y = 75 + Math.floor(i / 2) * 11;
    return rect(x, y, 4, 5, i % 3 === 0 ? '#64707a' : '#283e46') + rect(x, y + 1, 1, 3, '#829398');
  }).join('');
  const particles = Array.from({ length: 15 }, (_, i) =>
    rect(92 + (i * 47) % 167, 125 + (i * 31) % 190, i % 4 === 0 ? 2 : 1, 2, light,
      `opacity="${i % 3 === 0 ? 0.55 : 0.2}"`)).join('');
  const bolts = [[13, 14], [347, 14], [13, 385], [347, 385], [79, 110], [281, 110],
    [79, 338], [281, 338]].map(([x, y]) => screw(x, y)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="400" viewBox="0 0 360 400">
    <defs>
      <linearGradient id="metal" x2="0" y2="1"><stop stop-color="#828d9d"/>
        <stop offset="0.18" stop-color="#465361"/><stop offset="0.8" stop-color="#26303b"/>
        <stop offset="1" stop-color="#576574"/></linearGradient>
      <linearGradient id="glass" x2="1" y2="0"><stop stop-color="${glow}" stop-opacity="0.2"/>
        <stop offset="0.45" stop-color="#132029" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${glow}" stop-opacity="0.25"/></linearGradient>
      <radialGradient id="halo"><stop stop-color="${light}" stop-opacity="0.28"/>
        <stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
      <linearGradient id="battery" x2="1" y2="0"><stop stop-color="#111820"/>
        <stop offset="0.45" stop-color="#2b333c"/><stop offset="1" stop-color="#131b24"/></linearGradient>
      <pattern id="board" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 8 H8 V16 M8 0 V3 H16" fill="none" stroke="#27424a" stroke-width="1"/>
        <rect x="7" y="7" width="2" height="2" fill="#34515a"/>
      </pattern>
    </defs>
    <rect x="2" y="2" width="356" height="396" rx="27" fill="#070d14" stroke="#778698" stroke-width="3"/>
    <rect x="8" y="8" width="344" height="384" rx="22" fill="#10202a" stroke="#283844" stroke-width="2"/>
    <rect x="12" y="12" width="336" height="376" rx="18" fill="url(#board)" opacity="0.55"/>
    ${boardBits}
    <g shape-rendering="crispEdges">
      ${ribbon('49,43 79,43 79,27 94,27')}
      ${ribbon('211,16 211,62 282,62 282,75 315,75')}
      ${ribbon('40,97 60,97 60,125 69,125')}
      ${ribbon('320,119 320,130 297,130 297,168')}
      ${ribbon('313,236 296,236 296,259 282,259')}
      ${ribbon('48,319 61,319 61,352 93,352')}
      ${ribbon('282,329 293,329 293,366 282,366')}
      ${ribbon('180,361 180,349 226,349')}
      ${hardware}
      ${rect(18, 123, 37, 190, '#080d14')}${rect(21, 126, 31, 182, 'url(#battery)')}
      ${rect(25, 130, 23, 2, '#48505c')}${rect(30, 119, 13, 5, '#697787')}
      ${[0, 1, 2, 3].map(i => rect(28, 213 + i * 7, 17 - i * 3, 3, '#707982')).join('')}
      ${rect(25, 294, 23, 7, '#080e16')}
    </g>
    <g transform="translate(24 20)">
      <rect width="53" height="53" rx="3" fill="url(#metal)" stroke="#080d14" stroke-width="3"/>
      <circle cx="26.5" cy="26.5" r="19" fill="#090e16" stroke="#354351" stroke-width="4"/>
      <circle cx="26.5" cy="26.5" r="12" fill="#132539" stroke="#080e16" stroke-width="3"/>
      <circle cx="26.5" cy="26.5" r="7" fill="#1c5d85"/>
      ${rect(22, 20, 4, 5, '#7ae4f3')}${screw(6, 6)}${screw(47, 47)}
    </g>
    <g transform="translate(285 22)">
      <rect width="46" height="46" fill="url(#metal)" stroke="#090f16" stroke-width="3"/>
      <circle cx="23" cy="23" r="19" fill="#080f17"/>
      ${[0, 60, 120, 180, 240, 300].map(angle => `<path d="M23 20 L26 6 L34 12 L27 23 Z" fill="#3b4754" transform="rotate(${angle} 23 23)"/>`).join('')}
      <circle cx="23" cy="23" r="5" fill="${light}"/>
    </g>
    <rect x="76" y="74" width="208" height="25" fill="#111922" stroke="#4c5966" stroke-width="2"/>
    ${rect(82, 81, 3, 10, light)}${rect(275, 81, 3, 10, light)}
    <g>
      <rect x="66" y="106" width="228" height="240" rx="28" fill="#080f17" stroke="#1d2935" stroke-width="5"/>
      <rect x="73" y="109" width="214" height="233" rx="24" fill="url(#glass)" stroke="url(#metal)" stroke-width="7"/>
      <ellipse cx="180" cy="233" rx="110" ry="120" fill="url(#halo)"/>
      <path d="M91 137 V306 M269 137 V306" stroke="${light}" stroke-width="1" opacity="0.3"/>
      <path d="M96 142 V300" stroke="#ffffff" stroke-width="2" opacity="0.07"/>
      ${particles}
      ${rect(70, 149, 7, 46, glow)}${rect(72, 154, 3, 36, hot)}
      ${rect(283, 149, 7, 46, glow)}${rect(284, 154, 3, 36, hot)}
      ${rect(71, 265, 5, 35, light)}${rect(284, 265, 5, 35, light)}
      <ellipse cx="180" cy="126" rx="94" ry="14" fill="none" stroke="${light}" stroke-width="16" opacity="0.07"/>
      <ellipse cx="180" cy="126" rx="86" ry="9" fill="#151e28" stroke="${light}" stroke-width="3"/>
      <ellipse cx="180" cy="127" rx="71" ry="4" fill="${hot}" opacity="0.85"/>
      <ellipse cx="180" cy="321" rx="99" ry="15" fill="none" stroke="${light}" stroke-width="16" opacity="0.09"/>
      <ellipse cx="180" cy="321" rx="94" ry="13" fill="#29313a" stroke="#56616a" stroke-width="4"/>
      <ellipse cx="180" cy="319" rx="84" ry="9" fill="#282627" stroke="${light}" stroke-width="3"/>
      <ellipse cx="180" cy="319" rx="70" ry="6" fill="${light}" opacity="0.12"/>
      <path d="M91 333 H269 L259 349 H101 Z" fill="url(#metal)" stroke="#111923" stroke-width="3"/>
      ${rect(157, 339, 46, 5, light)}
    </g>
    ${bolts}
    ${rect(307, 238, 18, 22, '#102432')}${rect(312, 240, 7, 17, '#7ce5f0')}
    ${rect(29, 369, 22, 8, '#102432')}${rect(33, 371, 14, 3, '#7ce5f0')}
  </svg>`;
}

// expo-image's Android data-URI loader requires Base64. The generated SVG is ASCII.
function svgSource(svg: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';
  for (let i = 0; i < svg.length; i += 3) {
    const a = svg.charCodeAt(i);
    const b = svg.charCodeAt(i + 1) || 0;
    const c = svg.charCodeAt(i + 2) || 0;
    encoded += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)]
      + (i + 1 < svg.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=')
      + (i + 2 < svg.length ? alphabet[c & 63] : '=');
  }
  return { uri: `data:image/svg+xml;base64,${encoded}` };
}

export const INCUBATOR_SOURCES = {
  awake: svgSource(createIncubatorSvg(false)),
  asleep: svgSource(createIncubatorSvg(true)),
};
