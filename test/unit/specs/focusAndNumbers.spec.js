import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import ProjectHistoryViewModel from 'src/lib/project-list/ProjectHistoryViewModel';
import extractHeaderTypesFromData from 'src/lib/project-list/utils/extractHeaderTypesFromData';
import { focusContributions, countDaysByValue, keepFocus } from 'src/lib/facet';
import { getEntries, getTrend, getNumberSummary, formatChange } from 'src/lib/numberStats';
import { getInsights, toDayNumber } from 'src/lib/insights';
import NumberCard from 'src/components/insights/NumberCard.vue';
import ProjectInsights from 'src/components/insights/ProjectInsights.vue';
import setColumnCombine from 'src/lib/store/setColumnCombine';
import Stats from 'src/components/charts/Stats.vue';

// Saturday, September 26, 2026, mid-afternoon.
const TODAY = new Date(2026, 8, 26, 15, 0);
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});
afterEach(() => {
  vi.useRealTimers();
});

// A sheet row for `daysAgo` days before today, as the sheet stores it.
function sheetDate(daysAgo, hour = 8) {
  const d = new Date(2026, 8, 26 - daysAgo, hour, 15);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(hour)}:15:00`;
}
const DATE = { title: 'Date', valueType: 'date' };
const NOTES = { title: 'Notes', valueType: 'text' };
const ATE_WELL = { title: 'Ate well?', valueType: 'text' };
const WEIGHT = { title: 'Weight', valueType: 'number' };
const MINUTES = { title: 'Minutes', valueType: 'number', combine: 'sum' };

describe('the facet column', () => {
  it('is the first text column whose values repeat, not free-form notes', () => {
    const rows = [];
    for (let i = 0; i < 12; ++i) rows.push([sheetDate(i), `note number ${i}`, i % 3 ? 'Yes' : 'No']);
    const history = new ProjectHistoryViewModel(rows, [DATE, NOTES, ATE_WELL]);
    expect(history.facet).toEqual({ columnIndex: 2, title: 'Ate well?' });
    expect(history.categories).toEqual(['Yes', 'No']); // earliest first
  });

  it('is missing when no text column repeats', () => {
    const rows = [];
    for (let i = 0; i < 12; ++i) rows.push([sheetDate(i), `note number ${i}`]);
    expect(new ProjectHistoryViewModel(rows, [DATE, NOTES]).facet).toBe(null);
  });

  it('lists every value a day has', () => {
    const history = new ProjectHistoryViewModel([
      [sheetDate(0, 8), 'Run'], [sheetDate(0, 18), 'Swim'], [sheetDate(1), 'Run'],
    ], [DATE, { title: 'Sport', valueType: 'text' }]);
    const today = history.contributionsByDay['9-26-2026'];
    expect(today.values).toEqual(['Run', 'Swim']);
    expect(countDaysByValue(history.contributionsByDay)).toEqual(new Map([['Run', 2], ['Swim', 1]]));
  });
});

describe('numbers on the heatmap', () => {
  it('average within a day, unless the column adds up', () => {
    const rows = [[sheetDate(0, 7), '72', '30'], [sheetDate(0, 21), '74', '15']];
    const averaged = new ProjectHistoryViewModel(rows, [DATE, WEIGHT, MINUTES]);
    expect(averaged.contributionsByDay['9-26-2026'].value).toBe(73);
    expect(averaged.numberColumns.map(c => c.combine)).toEqual(['average', 'sum']);

    const minutesFirst = rows.map(([date, weight, minutes]) => [date, minutes, weight]);
    const summed = new ProjectHistoryViewModel(minutesFirst, [DATE, MINUTES, WEIGHT]);
    expect(summed.contributionsByDay['9-26-2026'].value).toBe(45);
  });

  it('count the records when there is no number column', () => {
    const rows = [[sheetDate(0, 7), 'Yes'], [sheetDate(0, 9), 'Yes']];
    expect(new ProjectHistoryViewModel(rows, [DATE, ATE_WELL]).contributionsByDay['9-26-2026'].value).toBe(2);
  });

  it('keep "add up" from the settings file through a structure edit', () => {
    const headers = extractHeaderTypesFromData(
      { headers: ['Date', 'Minutes'], values: [[sheetDate(0), '30']] },
      { fields: [{ title: 'Date', type: 'date' }, { title: 'Minutes', type: 'number', combine: 'sum' }] }
    );
    expect(headers[1].combine).toBe('sum');

    const updateStructure = vi.fn(() => Promise.resolve());
    setColumnCombine({ headers, updateStructure }, 1, undefined);
    const fields = updateStructure.mock.calls[0][0];
    expect(fields.map(f => [f.title, f.originalTitle, f.type.value, f.combine]))
      .toEqual([['Date', 'Date', 'date', undefined], ['Minutes', 'Minutes', 'number', undefined]]);
  });
});

describe('focus', () => {
  const rows = [
    [sheetDate(0), 'Yes'], [sheetDate(1), 'No'], [sheetDate(2), 'Yes'], [sheetDate(3), 'Yes'],
  ];

  it('keeps only the records with that value on the overview', () => {
    const history = new ProjectHistoryViewModel(rows, [DATE, ATE_WELL]);
    history.filter(undefined, undefined, 'No');
    expect(history.groups.length).toBe(1);
    expect(history.groups[0].key).toBe('9-25-2026');
  });

  it('narrows the days to that value, so streaks count only it', () => {
    const history = new ProjectHistoryViewModel(rows, [DATE, ATE_WELL]);
    const yes = focusContributions(history.contributionsByDay, history.facet, 'Yes');
    expect(Object.keys(yes).sort()).toEqual(['9-23-2026', '9-24-2026', '9-26-2026']);
    const insights = getInsights(yes, { focus: 'Yes' });
    expect(insights.consistency.current.count).toBe(1);
    expect(insights.consistency.longest.count).toBe(2);
  });

  it('makes the overview streaks count only that value, and keeps it in their links', () => {
    const history = new ProjectHistoryViewModel(rows, [DATE, ATE_WELL]);
    const w = mount(Stats, {
      props: { project: { id: 'p1', projectHistory: history }, settings: {} },
      global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $route: { query: { focus: 'Yes' } } } },
    });
    expect(w.text()).toContain('Longest streak (Yes): 2 days');
    expect(w.text()).toContain('Current streak (Yes): 1 day');
    expect(w.findAllComponents(RouterLinkStub)[0].props('to').query)
      .toEqual({ from: '9-23-2026', to: '9-24-2026', focus: 'Yes' });
  });

  it('stays in links that change something else', () => {
    expect(keepFocus({ from: '1-1-2026' }, { focus: 'Yes', to: 'x' })).toEqual({ from: '1-1-2026', focus: 'Yes' });
    expect(keepFocus({ from: '1-1-2026' }, {})).toEqual({ from: '1-1-2026' });
  });
});

// contributionsByDay with one number column, from [daysAgo, value] pairs.
function numbers(pairs) {
  const rows = pairs.map(([daysAgo, value]) => [sheetDate(daysAgo), String(value)]);
  return new ProjectHistoryViewModel(rows, [DATE, WEIGHT]).contributionsByDay;
}
const today = toDayNumber(TODAY);

describe('number trend', () => {
  it('moves a tenth of the way to each day, and further after a gap', () => {
    const trend = getTrend([{ day: 0, value: 70 }, { day: 1, value: 80 }, { day: 11, value: 80 }]);
    expect(trend[1].value).toBeCloseTo(71, 6);
    // Ten days away: as if each of them had brought 80.
    expect(trend[2].value).toBeCloseTo(80 - 9 * Math.pow(0.9, 10), 6);
  });

  it('averages the entries of one day before smoothing', () => {
    const trend = getTrend([{ day: 0, value: 70 }, { day: 1, value: 70 }, { day: 1, value: 90 }]);
    expect(trend.length).toBe(2);
    expect(trend[1].value).toBeCloseTo(71, 6);
  });

  it('sums up a weight falling half a kilo a week', () => {
    const pairs = [];
    for (let i = 90; i >= 0; --i) pairs.push([i, (80 - (90 - i) / 14 + (i % 2 ? 0.4 : -0.4)).toFixed(1)]);
    const entries = getEntries(numbers(pairs), 1);
    const s = getNumberSummary(entries, { first: today - 29, last: today });
    expect(s.count).toBe(30);
    expect(s.decimals).toBe(1);
    expect(s.perWeek).toBeCloseTo(-0.5, 1);
    expect(s.change).toBeLessThan(-1.5);
    expect(s.changeSince).toEqual(new Date(2026, 7, 28));
    expect(s.lowest.day).toBe(today);
    expect(formatChange(s.perWeek, 1)).toBe('−0.5');
  });

  it('gives no weekly rate from a few scattered entries', () => {
    const entries = getEntries(numbers([[20, 70], [3, 71], [0, 72]]), 1);
    expect(getNumberSummary(entries, { first: today - 29, last: today }).perWeek).toBe(null);
  });
});

describe('number totals', () => {
  it('add up per week within a year, and compare with the days before', () => {
    const pairs = [];
    for (let i = 0; i < 120; i += 2) pairs.push([i, 30]);
    const entries = getEntries(numbers(pairs), 1);
    const s = getNumberSummary(entries, { first: today - 90, last: today, combine: 'sum' });
    expect(s.unit).toBe('week');
    expect(s.total).toBe(46 * 30);
    expect(s.previousTotal).toBe(null); // the records don't reach 91 days further back
    expect(s.buckets[0].day % 7).toBe(3); // a Sunday
    expect(s.best.total).toBe(120);
    expect(s.buckets.reduce((sum, b) => sum + b.total, 0)).toBe(s.total);
  });

  it('add up per day within a month, and per month beyond a year', () => {
    const entries = getEntries(numbers([[0, 10], [0, 5], [400, 1]]), 1);
    expect(getNumberSummary(entries, { first: today - 29, last: today, combine: 'sum' }).buckets.pop())
      .toEqual({ day: today, total: 15 });
    const all = getNumberSummary(entries, { first: today - 400, last: today, combine: 'sum' });
    expect(all.unit).toBe('month');
    expect(all.buckets.length).toBe(14); // August 2025 to September 2026
  });
});

describe('number card', () => {
  const column = { columnIndex: 1, title: 'Weight', combine: 'average' };
  function mountCard(contributions, { query = {}, canEdit = false, col = column } = {}) {
    return mount(NumberCard, {
      props: { project: { canEdit, headers: [] }, column: col, contributions, note: '' },
      global: { mocks: { $route: { query } } },
    });
  }

  it('leads with the trend, its change and the range of entries', () => {
    const w = mountCard(numbers([[40, 74], [20, 73.5], [10, 72.9], [0, 72.1]]));
    expect(w.find('.insight-number').text()).toMatch(/^\d+\.\d trend$/);
    expect(w.text()).toContain('Lowest 72.1 (Sep 26, 2026)');
    expect(w.text()).toContain('highest 74.0 (Aug 17, 2026)');
    expect(w.text()).toContain('−1.5 since Aug 17, 2026');
    expect(w.findAll('circle').length).toBe(4);
  });

  it('narrows to a month and back', async () => {
    const w = mountCard(numbers([[40, 74], [20, 73.5], [10, 72.9], [0, 72.1]]));
    await w.findAll('.nc-ranges button').find(b => b.text() === '1M').trigger('click');
    expect(w.findAll('circle').length).toBe(3);
  });

  it('shows totals as bars for a column that adds up', () => {
    const w = mountCard(numbers([[1, 30], [0, 45]]), { col: { columnIndex: 1, title: 'Minutes', combine: 'sum' } });
    expect(w.find('.insight-number').text()).toBe('75 total');
    expect(w.findAll('rect.nc-bar').length).toBeGreaterThan(0);
  });

  it('lets only the owner choose between entries and totals', () => {
    expect(mountCard(numbers([[0, 1]])).find('.nc-combine').exists()).toBe(false);
    expect(mountCard(numbers([[0, 1]]), { canEdit: true }).find('.nc-combine').exists()).toBe(true);
  });
});

describe('Insights with a facet', () => {
  function project() {
    const rows = [];
    for (let i = 0; i < 40; ++i) rows.push([sheetDate(i), i % 4 === 0 ? 'No' : 'Yes', String(70 + (i % 3))]);
    return { id: 'p1', canEdit: false, projectHistory: new ProjectHistoryViewModel(rows, [DATE, ATE_WELL, WEIGHT]) };
  }
  const mountInsights = query => mount(ProjectInsights, {
    props: { project: project() },
    global: {
      mocks: { $route: { name: 'project-insights', params: {}, query } },
      stubs: { RouterLink: RouterLinkStub, 'selected-filters': true },
    },
  });

  it('shows each value on its own row when nothing is in focus', () => {
    const w = mountInsights({});
    const rows = w.findAll('.insight-value').map(r => [r.find('.iv-name').text(), r.find('.iv-numbers').text()]);
    expect(rows).toEqual([
      ['Yes', '30 days (75%), streak 3 now, 3 best'],
      ['No', '10 days (25%), streak 1 now, 1 best'], // today was a No
    ]);
    expect(w.find('.number-card h3').text()).toBe('Weight');
  });

  it('follows the focus, and names it', () => {
    const w = mountInsights({ focus: 'Yes' });
    expect(w.findAll('.insight-value').length).toBe(0);
    expect(w.find('.insight-tile .insight-number').text()).toBe('22 of 30 days with “Yes”');
    // Measured against how often anything is recorded - every day here -
    // not against the pace of "Yes" days themselves.
    expect(w.text()).toContain('Measured against how often you record (every day)');
    expect(w.find('.value-chip.selected').text()).toMatch(/^Yes/);
    expect(w.text()).toContain('Days with “Yes”');
  });
});
