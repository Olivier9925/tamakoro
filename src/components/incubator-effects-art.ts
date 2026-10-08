import { CIRCUIT_PATHS } from '@/components/incubator-art';
import { svgSource } from '@/utils/svg-source';

export const HARDWARE_FRAME_COUNT = 8;

type Bounds = { x: number; y: number; width: number; height: number };

function subtractBounds(area: Bounds, obstacle: Bounds): Bounds[] {
  const left = Math.max(area.x, obstacle.x);
  const top = Math.max(area.y, obstacle.y);
  const right = Math.min(area.x + area.width, obstacle.x + obstacle.width);
  const bottom = Math.min(area.y + area.height, obstacle.y + obstacle.height);
  if (left >= right || top >= bottom) return [area];
  return [
    { x: area.x, y: area.y, width: area.width, height: top - area.y },
    { x: area.x, y: bottom, width: area.width, height: area.y + area.height - bottom },
    { x: area.x, y: top, width: left - area.x, height: bottom - top },
    { x: right, y: top, width: area.x + area.width - right, height: bottom - top },
  ].filter(piece => piece.width > 0 && piece.height > 0);
}

function circuitClip(obstacles: number[][]) {
  // Clip to the actual 8-unit copper strips, with physical components cut out.
  // Separate rectangles avoid compound even-odd clips, which differ across SVG loaders.
  const strips = CIRCUIT_PATHS.flatMap(points => {
    const coordinates = points.split(' ').map(point => point.split(',').map(Number));
    return coordinates.slice(1).map(([x, y], index): Bounds => {
      const [previousX, previousY] = coordinates[index];
      return x === previousX
        ? { x: x - 4, y: Math.min(y, previousY), width: 8, height: Math.abs(y - previousY) }
        : { x: Math.min(x, previousX), y: y - 4, width: Math.abs(x - previousX), height: 8 };
    });
  });
  return obstacles.reduce((pieces, [x, y, width, height]) =>
    pieces.flatMap(piece => subtractBounds(piece, { x, y, width, height })), strips
  ).map(({ x, y, width, height }) => `<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`).join('');
}

function pathLength(points: string) {
  const coordinates = points.split(' ').map(point => point.split(',').map(Number));
  return coordinates.slice(1).reduce((length, [x, y], index) =>
    length + Math.abs(x - coordinates[index][0]) + Math.abs(y - coordinates[index][1]), 0);
}

export function createHardwareFrameSvg(frame: number, sleeping: boolean) {
  // Match the scenery's occlusion: current stays behind the camera, chips and chamber.
  const obstacles = [[22, 18, 57, 57], [18, 123, 37, 190], [63, 103, 234, 246],
    [98, 20, 42, 31], [153, 18, 53, 38], [220, 22, 30, 27], [24, 88, 24, 19],
    [304, 92, 27, 26], [309, 144, 22, 33], [304, 199, 27, 24], [306, 274, 25, 26],
    [24, 329, 29, 27], [71, 365, 35, 20], [126, 363, 51, 23], [196, 365, 25, 20],
    [240, 360, 34, 25], [303, 331, 25, 22]];
  const clip = circuitClip(obstacles);
  const pulses = CIRCUIT_PATHS.map((points, index) => {
    const length = pathLength(points);
    // Offset each circuit so the whole board never flashes in unison.
    const offset = -((frame / HARDWARE_FRAME_COUNT + index * 0.17) % 1) * length;
    const attributes = `points="${points}" fill="none" stroke-dasharray="8 ${length - 8}" stroke-dashoffset="${offset}"`;
    return `<g opacity="${sleeping ? 0.4 : 0.85}">
      <polyline ${attributes} stroke="#ff9b24" stroke-width="10" opacity="0.22"/>
      <polyline ${attributes} stroke="#ffd05a" stroke-width="4"/>
      <polyline ${attributes} stroke="#fff2b0" stroke-width="2"/>
    </g>`;
  }).join('');
  const blades = [0, 60, 120, 180, 240, 300].map(angle =>
    `<path d="M23 20 L26 6 L34 12 L27 23 Z" fill="#526271" transform="rotate(${angle + frame * 15} 23 23)"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="400" viewBox="0 0 360 400">
    <defs><clipPath id="circuits" clipPathUnits="userSpaceOnUse">${clip}</clipPath></defs>
    <g shape-rendering="crispEdges" clip-path="url(#circuits)">${pulses}</g>
    <g transform="translate(285 22)">
      <circle cx="23" cy="23" r="19" fill="#080f17"/>
      ${blades}
      <circle cx="23" cy="23" r="5" fill="${sleeping ? '#81c8fa' : '#ffb637'}"/>
    </g>
  </svg>`;
}

export const HARDWARE_SOURCES = {
  awake: Array.from({ length: HARDWARE_FRAME_COUNT }, (_, frame) => svgSource(createHardwareFrameSvg(frame, false))),
  asleep: Array.from({ length: HARDWARE_FRAME_COUNT }, (_, frame) => svgSource(createHardwareFrameSvg(frame, true))),
};
