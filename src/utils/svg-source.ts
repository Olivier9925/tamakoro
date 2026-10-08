// expo-image's Android data-URI loader requires Base64. Input must be ASCII SVG.
export function svgSource(svg: string) {
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
