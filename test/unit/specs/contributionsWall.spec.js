import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ContributionsWall from 'src/components/charts/ContributionsWall.vue';
import { getDateString } from 'src/lib/dateUtils';

// jsdom lays nothing out, so the svg's bounding rect sits at (0, 0) and a
// click's clientX/Y are svg coordinates. Mouse layout: 10px squares every
// 12px, below an 18px band of month names; week 52 is the current week.
const MONTH_BAND = 18;

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

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });

describe('ContributionsWall', () => {
  it('a tap in the gap between squares picks the nearest day', async () => {
    const w = mountWall();
    // Week 51's square spans x 612-622, week 52's 624-634. Both taps are in
    // the 2px gap, which per-square click handlers never received.
    await tapAt(w, 622.5, MONTH_BAND + 5);
    await tapAt(w, 623.5, MONTH_BAND + 5);

    expect(w.emitted('filter')).toEqual([
      [sundayOfWeeksAgo(1), sundayOfWeeksAgo(1)],
      [sundayOfWeeksAgo(0), sundayOfWeeksAgo(0)],
    ]);
  });

  it('ignores taps on the month names', async () => {
    const w = mountWall();
    await tapAt(w, 623.5, 4);
    expect(w.emitted('filter')).toBeUndefined();
  });

  it('shift-tap still extends from the current filter', async () => {
    const from = sundayOfWeeksAgo(3);
    const w = mountWall({ from });
    await w.find('svg').trigger('click', { clientX: 629, clientY: MONTH_BAND + 5, shiftKey: true });
    expect(w.emitted('filter')).toEqual([[from, sundayOfWeeksAgo(0)]]);
  });

  it('draws bigger squares on touch screens', () => {
    window.matchMedia = query => ({
      matches: query === '(pointer: coarse)',
      addEventListener() {},
      removeEventListener() {},
    });
    const w = mountWall();
    const rect = w.find('rect');
    expect(Number(rect.attributes('width'))).toBeGreaterThanOrEqual(18);
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
