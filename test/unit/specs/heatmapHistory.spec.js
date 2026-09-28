import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import ContributionsWall from 'src/components/charts/ContributionsWall.vue';
import Stats from 'src/components/charts/Stats.vue';
import { getPeriod, getColumn } from 'src/lib/heatmapPeriod';
import { isDayInside } from 'src/lib/dateUtils';

// Saturday, September 26, 2026. At the smallest squares (a phone, or jsdom
// with no layout) a square is 18px every 21px, below a 22px band of months.
const TODAY = new Date(2026, 8, 26, 15, 0);
const MONTH_BAND = 22;
const PITCH = 21;
const PHONE_WIDTH = 400;

// jsdom does no layout, so give elements a width and a scroll position that
// behaves like a browser's: clamped to what the svg inside can scroll.
const realProps = {};
const scrollLefts = new WeakMap();
function scrollWidthOf(el) {
  const svg = el.querySelector && el.querySelector(':scope > svg');
  return svg ? Number(svg.getAttribute('width')) : 0;
}
function withPhoneLayout() {
  ['clientWidth', 'scrollWidth', 'scrollLeft'].forEach(name => {
    realProps[name] = Object.getOwnPropertyDescriptor(Element.prototype, name);
  });
  Object.defineProperty(Element.prototype, 'clientWidth', { get: () => PHONE_WIDTH, configurable: true });
  Object.defineProperty(Element.prototype, 'scrollWidth', { get() { return scrollWidthOf(this); }, configurable: true });
  Object.defineProperty(Element.prototype, 'scrollLeft', {
    get() { return scrollLefts.get(this) || 0; },
    set(v) { scrollLefts.set(this, Math.max(0, Math.min(v, scrollWidthOf(this) - PHONE_WIDTH))); },
    configurable: true,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});
afterEach(() => {
  vi.useRealTimers();
  Object.keys(realProps).forEach(name => {
    Object.defineProperty(Element.prototype, name, realProps[name]);
    delete realProps[name];
  });
});

const day = () => ({ rows: [{}], scaledValue: 1, groupKey: null });
// Records from March 2016 to now.
const HISTORY = { '3-5-2016': day(), '6-15-2020': day(), '9-1-2026': day() };

function mountWall({ query = {}, dates = {} } = {}) {
  return mount(ContributionsWall, {
    props: { dates, settings: {} },
    global: { mocks: { $route: { query } } }
  });
}

async function mountOnPhone(options) {
  withPhoneLayout();
  const w = mountWall(options);
  await w.vm.$nextTick(); // measured on mount, then scrolled
  await w.vm.$nextTick();
  return w;
}

const scroller = w => w.find('.days-container');
async function scrollTo(w, left) {
  scroller(w).element.scrollLeft = left;
  await scroller(w).trigger('scroll');
}
function tapCell(w, column, row) {
  // jsdom keeps the svg's bounding rect at (0, 0) however far it is
  // scrolled, so svg coordinates are client coordinates.
  return w.find('svg').trigger('click', {
    clientX: column * PITCH + 5,
    clientY: MONTH_BAND + row * PITCH + 5,
  });
}
const rendered = w => w.findAll('rect').length;
const labels = w => w.findAll('svg text').map(t => t.text());

describe('heatmap history', () => {
  it('spans the last twelve months while that holds every record', () => {
    const p = getPeriod(undefined);
    expect(p.columns).toBe(53);
    expect(p.start).toEqual(new Date(2025, 8, 21)); // the Sunday 52 weeks before this week's
  });

  it('reaches back to the month of the earliest record', () => {
    const p = getPeriod(new Date(2016, 2, 5));
    expect(p.start).toEqual(new Date(2016, 1, 28)); // the Sunday before March 1
    expect(getColumn(p, TODAY)).toBe(p.columns - 1);
  });

  it('opens on the present, drawing only the weeks near it', async () => {
    const w = await mountOnPhone({ dates: HISTORY });
    const columns = getPeriod(new Date(2016, 2, 5)).columns;
    expect(scroller(w).element.scrollLeft).toBe(columns * PITCH + 10 - PHONE_WIDTH);
    expect(rendered(w)).toBeLessThan(80 * 7);

    await tapCell(w, columns - 1, 6);
    expect(w.emitted('filter')).toEqual([['9-26-2026', '9-26-2026']]);
    expect(w.find('.cw-corner-year').text()).toBe('2026');
  });

  it('draws older weeks as they are scrolled to', async () => {
    const w = await mountOnPhone({ dates: HISTORY });
    await scrollTo(w, 0);
    expect(rendered(w)).toBeLessThan(80 * 7);
    expect(labels(w).slice(0, 3)).toEqual(['Mar', 'Apr', 'May']);
    expect(w.find('.cw-corner-year').text()).toBe('2016');

    await tapCell(w, 0, 2);
    expect(w.emitted('filter')).toEqual([['3-1-2016', '3-1-2016']]);
  });

  it('scrolls to a filter years back, such as a streak', async () => {
    const w = await mountOnPhone({ dates: HISTORY, query: { from: '6-15-2020', to: '6-17-2020' } });
    const column = getColumn(getPeriod(new Date(2016, 2, 5)), new Date(2020, 5, 15));
    expect(scroller(w).element.scrollLeft).toBe(column * PITCH + 9 - PHONE_WIDTH / 2);
    expect(w.findAll('rect.is-selected')).toHaveLength(3);
    expect(w.find('.cw-corner-year').text()).toBe('2020');
  });

  it('names a new year instead of its January', () => {
    const w = mountWall();
    expect(labels(w)).toEqual(
      ['Oct', 'Nov', 'Dec', '2026', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
    );
    expect(w.find('.cw-year-label').text()).toBe('2026');
  });

  it('draws the edge between December 31 and January 1', () => {
    // January 1, 2026 is a Thursday (row 4) in column 14. The line runs down
    // the gap after that column's December days, across, then down the gap
    // before its January days.
    const w = mountWall();
    const boundaries = w.findAll('path.cw-year-boundary');
    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].attributes('d')).toBe('M313.5,20.5V104.5H292.5V167.5');
  });
});

describe('streak links', () => {
  function streakLinks(dates) {
    const contributionsByDay = {};
    dates.forEach(d => { contributionsByDay[d] = day(); });
    const w = mount(Stats, {
      props: { project: { id: 'p1', projectHistory: { contributionsByDay } }, settings: {} },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    return w.findAllComponents(RouterLinkStub).map(link => link.props('to').query);
  }

  it('filter to the streak', () => {
    const [longest, current] = streakLinks(['3-1-2023', '3-2-2023', '3-3-2023', '9-26-2026']);
    expect(longest).toEqual({ from: '3-1-2023', to: '3-3-2023' });
    expect(current).toEqual({ from: '9-26-2026' });
  });
});

describe('streaks', () => {
  function stats(dates) {
    const contributionsByDay = {};
    dates.forEach(d => { contributionsByDay[d] = day(); });
    return mount(Stats, {
      props: { project: { id: 'p1', projectHistory: { contributionsByDay } }, settings: {} },
      global: { stubs: { RouterLink: RouterLinkStub } }
    }).text();
  }

  it('are broken by a gap across a daylight saving change', () => {
    // Clocks went forward on March 12, 2023, between these records.
    const text = stats(['3-1-2023', '3-2-2023', '3-3-2023', '3-20-2023']);
    expect(text).toContain('Longest streak: 3 days (March 1, 2023 - March 3, 2023)');
  });

  it('carry on through a daylight saving change', () => {
    const text = stats(['3-11-2023', '3-12-2023', '3-13-2023']);
    expect(text).toContain('Longest streak: 3 days');
  });

  it('are still current when the last record was yesterday', () => {
    const text = stats(['9-24-2026', '9-25-2026']);
    expect(text).toContain('Current streak: 2 days');
  });
});

describe('range filters', () => {
  it('work in Safari, which cannot parse "1-5-2024" as a date', () => {
    const RealDate = Date;
    // Like Safari: a date string in this format is an Invalid Date.
    globalThis.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 1 && typeof args[0] === 'string') super(NaN);
        else super(...args);
      }
    };
    try {
      expect(isDayInside('1-5-2024', '1-1-2024', '1-31-2024')).toBe(true);
      expect(isDayInside('2-5-2024', '1-1-2024', '1-31-2024')).toBe(false);
    } finally {
      globalThis.Date = RealDate;
    }
  });

  it('work when the later day was picked first', () => {
    expect(isDayInside('1-5-2024', '1-31-2024', '1-1-2024')).toBe(true);
    expect(isDayInside('2-5-2024', '1-31-2024', '1-1-2024')).toBe(false);
  });
});
