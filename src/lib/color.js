export function makeColorBag() {
  const groupKeyToColorHsl = new Map();
  // TODO: More colors
  const predefinedGroups = [
    [0.97, 1, 0.5],
    [0.57, 1, 0.5],
    [0.87, 1, 0.5],
    [0.67, 1, 0.5],
    [0.77, 1, 0.5]
  ];

  return {
    getColor(key) {
      let hslColor = groupKeyToColorHsl.get(key);
      if (hslColor) return hslColor;

      // const hue = random(hashCode(key)).nextDouble();
      // hslColor = [hue, 1, 0.5];
      hslColor = predefinedGroups[groupKeyToColorHsl.size % predefinedGroups.length];
      groupKeyToColorHsl.set(key, hslColor);
      return hslColor;
    }
  };
}
