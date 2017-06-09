export function makeColorBag() {
  const colorMap = new Map();
  // TODO: More colors
  const predefinedColors = [
    [0.97, 1, 0.5],
    [0.57, 1, 0.5],
    [0.87, 1, 0.5],
    [0.67, 1, 0.5],
    [0.77, 1, 0.5]
  ];

  return {
    getColor(key) {
      const hashKey = getHash(key);
      let hslColor = colorMap.get(hashKey);
      if (hslColor) return hslColor;

      // const hue = random(hashCode(key)).nextDouble();
      // hslColor = [hue, 1, 0.5];
      hslColor = predefinedColors[hashKey % predefinedColors.length];
      colorMap.set(hashKey, hslColor);
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
