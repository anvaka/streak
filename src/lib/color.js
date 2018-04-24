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
