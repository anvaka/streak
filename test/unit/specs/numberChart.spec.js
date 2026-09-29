import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectHistoryViewModel from 'src/lib/project-list/ProjectHistoryViewModel';
import { toDayNumber } from 'src/lib/insights';
import { splitAtBreaks } from 'src/lib/numberStats';
import { getValueScale, getDateTicks } from 'src/lib/chartScale';
import NumberCard from 'src/components/insights/NumberCard.vue';

// Saturday, September 26, 2026, mid-afternoon.
const TODAY = new Date(2026, 8, 26, 15, 0);
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
  localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

const today = toDayNumber(TODAY);
const day = (y, m, d) => toDayNumber(new Date(y, m - 1, d));

describe('value gridlines', () => {
  it('fall on round numbers around the values, with room to spare', () => {
    expect(getValueScale([73.6, 76.8]).ticks).toEqual([73, 74, 75, 76, 77, 78]);
  });

  it("don't blow a small change up to the whole height", () => {
    // 0.2 in 74 is noise; it stays a sliver among whole kilos.
    expect(getValueScale([74, 74.2]).ticks).toEqual([72, 73, 74, 75, 76]);
  });

  it('never go below zero for values that never do', () => {
    expect(getValueScale([0, 3, 5]).ticks).toEqual([0, 2, 4, 6]);
    expect(getValueScale([-3, 2]).min).toBeLessThan(-3);
  });

  it('start bars at zero, and keep small steps exact', () => {
    expect(getValueScale([30, 120], { fromZero: true }).ticks).toEqual([0, 50, 100, 150]);
    const small = getValueScale([0.1, 0.3]);
    expect(small.ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4]);
    expect(small.decimals).toBe(1);
    expect(getValueScale([0, 0]).ticks).toEqual([0, 0.5, 1]);
  });

  it('are three to six', () => {
    [[1, 2], [70, 90], [0, 1000], [0.01, 0.05], [5, 5], [1234, 1300], [-40, 60]].forEach(values => {
      const n = getValueScale(values).ticks.length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    });
  });
});

describe('date labels', () => {
  const labels = (first, last, width) => getDateTicks(first, last, width).map(t => t.label);

  it('mark weeks in a month, and months in three', () => {
    expect(labels(today - 29, today, 320)).toEqual(['Aug 30', 'Sep 6', 'Sep 13', 'Sep 20']);
    expect(labels(today - 90, today, 320)).toEqual(['Jul', 'Aug', 'Sep']);
  });

  it('mark every other Sunday in two months', () => {
    expect(labels(today - 59, today, 320)).toEqual(['Aug 9', 'Aug 23', 'Sep 6', 'Sep 20']);
  });

  it('name the new year in bold', () => {
    const ticks = getDateTicks(day(2025, 11, 15), day(2026, 2, 15), 320);
    expect(ticks.map(t => t.label)).toEqual(['Dec', '2026', 'Feb']);
    expect(ticks.map(t => t.strong)).toEqual([false, true, false]);
  });

  it('thin out to fit the width', () => {
    const year = [day(2025, 9, 27), today];
    expect(labels(...year, 600).length).toBe(12);
    expect(labels(...year, 320)).toEqual(['Nov', '2026', 'Mar', 'May', 'Jul', 'Sep']);
    expect(labels(day(2016, 3, 1), today, 320)).toEqual(['2018', '2020', '2022', '2024', '2026']);
  });
});

describe('the trend line', () => {
  it('breaks where the entries stop for a while', () => {
    const points = [0, 1, 2, 3, 20, 21].map(d => ({ day: d, value: 1 }));
    expect(splitAtBreaks(points).map(piece => piece.map(p => p.day))).toEqual([[0, 1, 2, 3], [20, 21]]);
  });

  it('keeps going through the usual gaps of a weekly entry', () => {
    // Three weeks is a break for a daily entry, but not for a weekly one.
    const points = [0, 7, 14, 21, 28, 49, 84].map(d => ({ day: d, value: 1 }));
    expect(splitAtBreaks(points).map(piece => piece.length)).toEqual([6, 1]);
  });
});

function numbers(pairs) {
  const sheetDate = (daysAgo, hour) => {
    const d = new Date(2026, 8, 26 - daysAgo, hour, 15);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(hour)}:15:00`;
  };
  const rows = pairs.map(([daysAgo, value], i) => [sheetDate(daysAgo, 8 + i % 10), String(value)]);
  return new ProjectHistoryViewModel(rows, [{ title: 'Date', valueType: 'date' }, { title: 'Weight', valueType: 'number' }])
    .contributionsByDay;
}

function mountCard(contributions, combine = 'average') {
  return mount(NumberCard, {
    props: { project: { canEdit: false, headers: [] }, column: { columnIndex: 1, title: 'Weight', combine }, contributions, note: '' },
    global: { mocks: { $route: { query: {} } } },
    attachTo: document.body,
  });
}

// The chart is 320 wide in jsdom, and starts at the page's left edge.
async function press(w, clientX) {
  await w.find('svg').trigger('pointerdown', { clientX, button: 0 });
  await w.find('svg').trigger('pointerup', { clientX });
}

describe('picking a day on the chart', () => {
  const weight = () => numbers([[40, 74], [20, 73.5], [10, 72.9], [10, 73.3], [0, 72.1]]);

  it('reads out the nearest day above the chart, then goes back to the trend', async () => {
    const w = mountCard(weight());
    expect(w.find('.insight-number').text()).toMatch(/trend$/);
    await press(w, 0);
    expect(w.find('.insight-number').text()).toBe('74.0 entered');
    expect(w.find('.nc-subline').text()).toBe('Mon, Aug 17, 2026 · trend 74.0');
    expect(w.find('line.nc-rule').exists()).toBe(true);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await w.vm.$nextTick();
    expect(w.find('.insight-number').text()).toMatch(/trend$/);
    expect(w.find('line.nc-rule').exists()).toBe(false);
    w.unmount();
  });

  it('shows every entry of a busy day', async () => {
    const w = mountCard(weight());
    // Ten days ago is at three quarters of the way from 40 days ago.
    await press(w, 200);
    expect(w.find('.insight-number').text()).toBe('73.1 average of 2');
    expect(w.find('.nc-subline').text()).toMatch(/^Wed, Sep 16, 2026 · 72.9, 73.3 · trend \d+\.\d$/);
    w.unmount();
  });

  it('follows a drag, and gives the page back when the browser scrolls it', async () => {
    const w = mountCard(weight());
    const svg = w.find('svg');
    await svg.trigger('pointerdown', { clientX: 0, button: 0 });
    await svg.trigger('pointermove', { clientX: 320 });
    expect(w.find('.insight-number').text()).toBe('72.1 entered');
    await svg.trigger('pointerup', { clientX: 320 });
    await svg.trigger('pointermove', { clientX: 0 });
    expect(w.find('.insight-number').text()).toBe('72.1 entered');

    // A vertical swipe starting on the chart scrolls the page instead.
    await svg.trigger('pointerdown', { clientX: 0, button: 0 });
    await svg.trigger('pointercancel');
    expect(w.find('.insight-number').text()).toBe('72.1 entered');
    w.unmount();
  });

  it('steps through the days with the keyboard', async () => {
    const w = mountCard(weight());
    const svg = w.find('svg');
    await svg.trigger('keydown', { key: 'ArrowRight' });
    expect(w.find('.nc-subline').text()).toMatch(/^Sat, Sep 26, 2026/);
    await svg.trigger('keydown', { key: 'ArrowLeft' });
    expect(w.find('.nc-subline').text()).toMatch(/^Wed, Sep 16, 2026/);
    await svg.trigger('keydown', { key: 'Home' });
    expect(w.find('.insight-number').text()).toBe('74.0 entered');
    await svg.trigger('keydown', { key: 'Escape' });
    expect(w.find('.insight-number').text()).toMatch(/trend$/);
    w.unmount();
  });

  it('reads out a bar when the column adds up', async () => {
    const w = mountCard(numbers([[1, 30], [0, 45], [0, 15]]), 'sum');
    await w.findAll('.nc-ranges button').find(b => b.text() === '1M').trigger('click');
    await press(w, 319);
    expect(w.find('.insight-number').text()).toBe('60 total');
    expect(w.find('.nc-subline').text()).toBe('Sat, Sep 26, 2026');
    w.unmount();
  });

  it('forgets the pick when the owner switches to entries', async () => {
    const col = { columnIndex: 1, title: 'Weight', combine: 'sum' };
    const w = mount(NumberCard, {
      props: { project: { canEdit: false, headers: [] }, column: col, contributions: numbers([[1, 30], [0, 45]]), note: '' },
      global: { mocks: { $route: { query: {} } } },
      attachTo: document.body,
    });
    await press(w, 319);
    expect(w.find('.insight-number').text()).toBe('45 total');
    await w.setProps({ column: { ...col, combine: 'average' } });
    expect(w.find('.insight-number').text()).toMatch(/trend$/);
    w.unmount();
  });

  it('forgets the pick when the range changes', async () => {
    const w = mountCard(weight());
    await press(w, 0);
    await w.findAll('.nc-ranges button').find(b => b.text() === '1M').trigger('click');
    expect(w.find('.insight-number').text()).toMatch(/trend$/);
    w.unmount();
  });
});

describe('the number card', () => {
  it('labels round values and dates, and breaks the trend over a long gap', () => {
    const pairs = [];
    for (let i = 80; i >= 50; i -= 2) pairs.push([i, 75]);
    for (let i = 20; i >= 0; i -= 2) pairs.push([i, 74]);
    const w = mountCard(numbers(pairs));
    const labels = w.findAll('text.nc-label').map(t => t.text());
    // The chart starts at the first entry, July 8.
    expect(labels).toEqual(['73', '74', '75', '76', 'Aug', 'Sep']);
    expect(w.findAll('polyline.nc-trend').length).toBe(2);
    expect(w.find('svg').attributes('aria-label')).toMatch(/^27 entries from Jul 8, 2026 to Sep 26, 2026, between 74 and 75/);
    w.unmount();
  });

  it('names the best week or month, not a day in it', async () => {
    const w = mountCard(numbers([[400, 5], [40, 30], [38, 30], [3, 10]]), 'sum');
    expect(w.text()).toContain('Most in a week: 60 (week of Aug 16, 2026)');
    await w.findAll('.nc-ranges button').find(b => b.text() === 'All').trigger('click');
    expect(w.text()).toContain('Most in a month: 60 (Aug 2026)');
    w.unmount();
  });

  it('remembers the range picked last', async () => {
    const w = mountCard(numbers([[0, 70]]));
    await w.findAll('.nc-ranges button').find(b => b.text() === '6M').trigger('click');
    w.unmount();
    const next = mountCard(numbers([[0, 70]]));
    expect(next.find('.nc-ranges button.selected').text()).toBe('6M');
    next.unmount();
  });
});
