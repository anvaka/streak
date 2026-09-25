/**
 * Colors for the heatmap's categories.
 *
 * Every square on the heatmap can sit next to any other, so each pair of
 * category colors has to stay apart - for colorblind readers too, and after
 * the square has been lightened to show a smaller day (see `shade`). Four
 * colors is as far as that holds: blue, vermillion, wine and bluish green pass
 * a colorblind-simulation check (protanopia/deuteranopia, Machado et al. 2009)
 * for every pair, and no fifth color we tried kept them all apart. Blue and
 * vermillion are the classic colorblind-safe pair (Okabe & Ito), which is why
 * yes/no answers are pinned to them.
 *
 * A fifth category onwards shares a neutral "Other" gray instead of reusing a
 * color, and the legend says what the colors mean.
 */
export const CATEGORY_COLORS = ['#0072B2', '#D55E00', '#882255', '#1BAF7A'];
export const OTHER_COLOR = '#7F7F7F';

// Answers that mean yes or no get the same two colors in every project,
// whatever order they first show up in.
const POSITIVE = new Set(['yes', 'y', 'true', 'done']);
const NEGATIVE = new Set(['no', 'n', 'false', 'skipped', 'skip', 'missed']);

/**
 * Gives each category a color. `categories` must be in the order they first
 * appeared in the sheet: a new category then only ever takes the next free
 * color, so adding records never repaints the ones already on the heatmap.
 * A `null` category (a blank cell) goes to Other.
 *
 * Returns `colorOf(category)` and the `legend` entries, in color order.
 */
export function assignCategoryColors(categories) {
  const colorByCategory = new Map();
  const free = CATEGORY_COLORS.slice();
  const named = categories.filter(c => c !== null && c !== undefined);

  const pinned = [
    [named.find(c => POSITIVE.has(normalize(c))), CATEGORY_COLORS[0]],
    [named.find(c => NEGATIVE.has(normalize(c))), CATEGORY_COLORS[1]],
  ];
  pinned.forEach(([category, color]) => {
    if (category === undefined) return;
    colorByCategory.set(category, color);
    free.splice(free.indexOf(color), 1);
  });

  let hasOther = categories.length > named.length;
  named.forEach(category => {
    if (colorByCategory.has(category)) return;
    if (free.length) {
      colorByCategory.set(category, free.shift());
    } else {
      hasOther = true;
    }
  });

  const legend = CATEGORY_COLORS
    .map(color => {
      const category = named.find(c => colorByCategory.get(c) === color);
      return category === undefined ? null : { label: String(category), color };
    })
    .filter(Boolean);
  if (hasOther) {
    const onlyBlanks = named.every(c => colorByCategory.has(c));
    legend.push({ label: onlyBlanks ? 'No value' : 'Other', color: OTHER_COLOR });
  }

  return {
    colorOf(category) {
      return colorByCategory.get(category) || OTHER_COLOR;
    },
    legend,
  };
}

function normalize(category) {
  return String(category).trim().toLowerCase();
}

/**
 * Lightens `hex` towards white by `amount` (0..1). Done in OKLab, where a
 * straight line to white keeps the hue angle, so a lighter vermillion stays
 * vermillion. Lightening in HSL, as this used to, turned light red into pink
 * and made it look like a different category.
 */
export function shade(hex, amount) {
  const [L, a, b] = hexToOklab(hex);
  return oklabToHex([L + (1 - L) * amount, a * (1 - amount), b * (1 - amount)]);
}

export function hexToOklab(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = toLinear(n >> 16);
  const g = toLinear((n >> 8) & 255);
  const b = toLinear(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363037254 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817492620 * g + 0.6299257874 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

function oklabToHex([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return '#' + rgb.map(c => fromLinear(c).toString(16).padStart(2, '0')).join('');
}

function toLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function fromLinear(c) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}
