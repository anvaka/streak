import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ContributionsWall from 'src/components/charts/ContributionsWall.vue';
import { getDateString } from 'src/lib/dateUtils';

// jsdom lays nothing out, so the svg's bounding rect sits at (0, 0) and a
// click's clientX/Y are svg coordinates. With no measurable width the wall
// falls back to its smallest squares: 18px every 21px, below a 22px band of
// month names. Week 52 is the current week.
const MONTH_BAND = 22;
const PITCH = 21;
const CELL = 18;

function sundayOfWeeksAgo(weeksAgo) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - 7 * weeksAgo);
  return getDateString(d);
}

function mountWall(query = {}) {
  return mount(ContributionsWall, {
    props: { dates: {}, settings: {} },
    global: { mocks: { $route: { query } } }
  });
}

async function tapAt(w, x, y) {
  await w.find('svg').trigger('click', { clientX: x, clientY: y });
}

const realClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
function withContainerWidth(width) {
  Object.defineProperty(Element.prototype, 'clientWidth', { get: () => width, configurable: true });
}
afterEach(() => { Object.defineProperty(Element.prototype, 'clientWidth', realClientWidth); });

describe('ContributionsWall', () => {
  it('a tap in the gap between squares picks the nearest day', async () => {
    const w = mountWall();
    // Week 51's square spans x 1071-1089, week 52's 1092-1110. Both taps are
    // in the gap, which per-square click handlers never received; each goes to
    // the square whose centre is nearer.
    const gapStart = 51 * PITCH + CELL;
    await tapAt(w, gapStart + 1, MONTH_BAND + 5);
    await tapAt(w, gapStart + 2, MONTH_BAND + 5);

    expect(w.emitted('filter')).toEqual([
      [sundayOfWeeksAgo(1), sundayOfWeeksAgo(1)],
      [sundayOfWeeksAgo(0), sundayOfWeeksAgo(0)],
    ]);
  });

  it('ignores taps on the month names', async () => {
    const w = mountWall();
    await tapAt(w, 52 * PITCH + 5, 4);
    expect(w.emitted('filter')).toBeUndefined();
  });

  it('shift-tap still extends from the current filter', async () => {
    const from = sundayOfWeeksAgo(3);
    const w = mountWall({ from });
    await w.find('svg').trigger('click', { clientX: 52 * PITCH + 5, clientY: MONTH_BAND + 5, shiftKey: true });
    expect(w.emitted('filter')).toEqual([[from, sundayOfWeeksAgo(0)]]);
  });

  it('fits a whole year into a wide container', async () => {
    withContainerWidth(1300);
    const w = mountWall();
    await w.vm.$nextTick(); // the width is measured on mount
    const svgWidth = Number(w.find('svg').attributes('width'));
    // Squares grow past the minimum to use the space, and the year fits
    // beside the day names without scrolling.
    expect(Number(w.find('rect').attributes('width'))).toBeGreaterThan(CELL);
    expect(svgWidth + 30).toBeLessThanOrEqual(1300);
  });

  it('keeps squares finger-sized on a phone and scrolls instead', async () => {
    withContainerWidth(360);
    const w = mountWall();
    await w.vm.$nextTick(); // the width is measured on mount
    expect(Number(w.find('rect').attributes('width'))).toBe(CELL);
    expect(Number(w.find('svg').attributes('width'))).toBeGreaterThan(360);
  });

  it('stops growing squares on very wide screens', async () => {
    withContainerWidth(4000);
    const w = mountWall();
    await w.vm.$nextTick(); // the width is measured on mount
    // Capped at a 24px pitch, however much room there is.
    expect(Number(w.find('rect').attributes('width'))).toBe(21);
  });

  it('outlines the filtered day', () => {
    const w = mountWall({ from: sundayOfWeeksAgo(2) });
    const selected = w.findAll('rect.is-selected');
    expect(selected).toHaveLength(1);
  });

  it('outlines a whole range, whichever way round it was picked', () => {
    // Sunday two weeks ago through Sunday one week ago: 8 days inclusive.
    const w = mountWall({ from: sundayOfWeeksAgo(1), to: sundayOfWeeksAgo(2) });
    expect(w.findAll('rect.is-selected')).toHaveLength(8);
  });
});
