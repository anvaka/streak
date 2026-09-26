import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import ContributionsWall from 'src/components/charts/ContributionsWall.vue';
import ContributionsWallContainer from 'src/components/charts/ContributionsWallContainer.vue';
import Stats from 'src/components/charts/Stats.vue';
import { isOnlyYearChange } from 'src/components/ProjectPage.vue';
import { getPeriod, getYearToShow } from 'src/lib/heatmapPeriod';
import { isDayInside } from 'src/lib/dateUtils';

// Saturday, September 26, 2026. jsdom lays nothing out, so the heatmap falls
// back to its smallest squares: 18px every 21px, below a 22px band of months.
const TODAY = new Date(2026, 8, 26, 15, 0);
const MONTH_BAND = 22;
const PITCH = 21;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});
afterEach(() => { vi.useRealTimers(); });

function mountWall({ query = {}, dates = {} } = {}) {
  return mount(ContributionsWall, {
    props: { dates, settings: {} },
    global: { mocks: { $route: { query } } }
  });
}

function tapCell(w, column, row) {
  return w.find('svg').trigger('click', {
    clientX: column * PITCH + 5,
    clientY: MONTH_BAND + row * PITCH + 5,
  });
}

const day = () => ({ rows: [{}], scaledValue: 1, groupKey: null });

describe('heatmap periods', () => {
  it('shows a past year from January 1 to December 31', () => {
    const p = getPeriod(2023);
    expect(p.columns).toBe(53);
    expect(p.firstDay).toEqual(new Date(2023, 0, 1));
    expect(p.lastDay).toEqual(new Date(2023, 11, 31));
    // A leap year starting on a Saturday touches 54 weeks.
    expect(getPeriod(2000).columns).toBe(54);
  });

  it('stops this year at today but names all its months', () => {
    const p = getPeriod(2026);
    expect(p.lastDay).toEqual(new Date(2026, 8, 26));
    expect(p.labelsEnd).toEqual(new Date(2026, 11, 31));
  });

  it('keeps the default at the last twelve months', () => {
    const p = getPeriod(null);
    expect(p.columns).toBe(53);
    expect(p.start).toEqual(new Date(2025, 8, 21)); // the Sunday 52 weeks before this week's
    expect(p.lastDay).toEqual(new Date(2026, 8, 26));
  });

  it('opens a date in its year only once it is older than the last twelve months', () => {
    expect(getYearToShow(new Date(2025, 8, 21))).toBe(null);
    expect(getYearToShow(new Date(2025, 8, 20))).toBe(2025);
    expect(getYearToShow(new Date(2019, 4, 1))).toBe(2019);
  });
});

describe('heatmap year view', () => {
  it('draws every day of the year and nothing either side', async () => {
    const w = mountWall({ query: { year: '2023' } });
    expect(w.findAll('rect')).toHaveLength(365);

    await tapCell(w, 0, 0);
    await tapCell(w, 52, 0);
    expect(w.emitted('filter')).toEqual([
      ['1-1-2023', '1-1-2023'],
      ['12-31-2023', '12-31-2023'],
    ]);
  });

  it('ignores taps on the days of another year sharing its first week', async () => {
    // January 1, 2022 was a Saturday: the rest of that column is 2021.
    const w = mountWall({ query: { year: '2022' } });
    await tapCell(w, 0, 1);
    expect(w.emitted('filter')).toBeUndefined();
    await tapCell(w, 0, 6);
    expect(w.emitted('filter')).toEqual([['1-1-2022', '1-1-2022']]);
  });

  it('names January at the start of the year', () => {
    const w = mountWall({ query: { year: '2023' } });
    const labels = w.findAll('text');
    expect(labels.map(t => t.text())).toEqual(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    );
    expect(labels[0].attributes('x')).toBe('0');
  });

  it('shows this year up to today, with the months to come still named', () => {
    const w = mountWall({ query: { year: '2026' } });
    expect(w.findAll('rect')).toHaveLength(269); // January 1 to September 26
    expect(w.findAll('text')).toHaveLength(12);
  });
});

describe('heatmap year chips', () => {
  const chipLabels = w => w.findAll('.cw-years button').map(b => b.text());

  it('are not offered while the last twelve months hold every record', () => {
    const w = mountWall({ dates: { '9-1-2026': day(), '10-1-2025': day() } });
    expect(w.find('.cw-years').exists()).toBe(false);
  });

  it('list the years that have records, newest first', () => {
    const w = mountWall({ dates: { '9-1-2026': day(), '3-5-2023': day(), '7-7-2023': day() } });
    expect(chipLabels(w)).toEqual(['Last 12 months', '2026', '2023']);
    expect(w.find('.cw-years button[aria-pressed="true"]').text()).toBe('Last 12 months');
  });

  it('ask to show the year that was picked, or the last twelve months', async () => {
    const w = mountWall({ query: { year: '2023' }, dates: { '9-1-2026': day(), '3-5-2023': day() } });
    expect(w.find('.cw-years button[aria-pressed="true"]').text()).toBe('2023');
    const buttons = w.findAll('.cw-years button');
    await buttons[2].trigger('click');
    await buttons[0].trigger('click');
    expect(w.emitted('show-year')).toEqual([[2023], [null]]);
  });
});

describe('heatmap year in the address', () => {
  function mountContainer(query) {
    const push = vi.fn();
    const w = mount(ContributionsWallContainer, {
      props: { project: { id: 'p1', projectHistory: { contributionsByDay: {}, categories: [] } }, settings: {} },
      global: {
        mocks: { $route: { query }, $router: { push } },
        stubs: { ContributionsWall: true },
      }
    });
    return { wall: w.findComponent({ name: 'ContributionsWall' }), push };
  }

  it('tapping a day keeps the year being explored', () => {
    const { wall, push } = mountContainer({ year: '2023' });
    wall.vm.$emit('filter', '3-5-2023', '3-5-2023');
    expect(push.mock.calls[0][0].query).toEqual({ from: '3-5-2023', year: '2023' });
  });

  it('switching years keeps the filter', () => {
    const { wall, push } = mountContainer({ from: '3-5-2023', year: '2023' });
    wall.vm.$emit('show-year', 2021);
    wall.vm.$emit('show-year', null);
    expect(push.mock.calls.map(c => c[0].query)).toEqual([
      { from: '3-5-2023', year: '2021' },
      { from: '3-5-2023' },
    ]);
  });

  it('switching years does not load the project again', () => {
    const route = (query) => ({ name: 'project-overview', params: { projectId: 'p1' }, query });
    expect(isOnlyYearChange(route({ year: '2023' }), route({}))).toBe(true);
    expect(isOnlyYearChange(route({ from: '1-2-2023' }), route({ from: '1-2-2023', year: '2023' }))).toBe(true);
    // A new filter changes which records are listed.
    expect(isOnlyYearChange(route({ from: '1-2-2023', year: '2023' }), route({}))).toBe(false);
    expect(isOnlyYearChange(route({ year: '2023' }), route({ year: '2023' }))).toBe(false);
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

  it('open an old streak in its year', () => {
    const [longest, current] = streakLinks(['3-1-2023', '3-2-2023', '3-3-2023', '9-26-2026']);
    expect(longest).toEqual({ from: '3-1-2023', to: '3-3-2023', year: '2023' });
    expect(current).toEqual({ from: '9-26-2026' });
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
