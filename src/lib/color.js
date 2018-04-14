export function makeColorBag() {
  const colorMap = new Map();
  let lastUsed = -1;
  // TODO: More colors
  const predefinedColors = [
    [0.57, 1, 0.5],
    [0.97, 1, 0.5],
    [0.87, 1, 0.5],
    [0.67, 1, 0.5],
    [0.77, 1, 0.5],
    [0.60, 1, 0.3],
    [0.80, 1, 0.2],
  ];

  return {
    getColor(key) {
      let hslColor = colorMap.get(key);

      if (hslColor) return hslColor;

      lastUsed += 1;
      if (lastUsed > predefinedColors.length - 1) {
        // cycle through colors
        lastUsed = 0;
      }
      hslColor = predefinedColors[lastUsed];
      colorMap.set(key, hslColor);

      return hslColor;
    }
  };
}

function getHash(str) {
  if (!str) return 0; // if it's falsy object return null hash.

  const strType = typeof str;
  if (strType === 'number') return str;
  if (strType !== 'string') throw new Error('Only strings or numbers expected here');

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash);
}
