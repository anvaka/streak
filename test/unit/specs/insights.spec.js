import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import ProjectInsights from 'src/components/insights/ProjectInsights.vue';
import ProjectTabs from 'src/components/ProjectTabs.vue';
import { getInsights, fisherExact, chiSquareWeekdays } from 'src/lib/insights';

// Saturday, September 26, 2026, mid-afternoon.
const TODAY = new Date(2026, 8, 26, 15, 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});
afterEach(() => {
  vi.useRealTimers();
});

// contributionsByDay, as ProjectHistoryViewModel builds it, from dates with
// times. Several records can share a day.
function history(dates) {
  const byDay = {};
  dates.forEach(date => {
    const key = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
    if (!byDay[key]) byDay[key] = { rows: [], date };
    byDay[key].rows.push({ cells: [{ value: date, valueType: 'date' }] });
  });
  return byDay;
}

// `count` days ending `daysAgo` days before today, at `hour`.
function days(count, { daysAgo = 0, hour = 9, every = 1 } = {}) {
  const dates = [];
  for (let i = count - 1; i >= 0; --i) {
    const back = daysAgo + i * every;
    dates.push(new Date(2026, 8, 26 - back, hour, 30));
  }
  return dates;
}

describe('insights: activity', () => {
  it('has nothing to say without records, or for a period without any', () => {
    expect(getInsights({})).toBe(null);
    expect(getInsights(history(days(5)), { from: '1-1-2020', to: '1-31-2020' })).toBe(null);
  });

  it('counts active days in the last 30 days against the 30 before', () => {
    // Every day for the last 20 days, and every other day before that.
    const dates = days(20).concat(days(30, { daysAgo: 20, every: 2 }));
    const { recent } = getInsights(history(dates));
    expect(recent.title).toBe('Last 30 days');
    expect(recent.days).toBe(30);
    expect(recent.count).toBe(25); // 20 in a row, and 5 of the 10 days before them
    expect(recent.previousCount).toBe(15);
  });

  it('counts from the first record in a young project, with nothing to compare', () => {
    const { recent } = getInsights(history(days(4, { daysAgo: 6 })));
    expect(recent.title).toBe('Since September 17, 2026');
    expect(recent.days).toBe(10);
    expect(recent.count).toBe(4);
    expect(recent.previousCount).toBe(null);
  });

  it('takes the pace of a project without a whole week from its days so far', () => {
    // Wednesday to Saturday, then Sunday: two part weeks, every day.
    vi.setSystemTime(new Date(2026, 8, 27, 15, 0));
    const { strength } = getInsights(history([23, 24, 25, 26, 27].map(d => new Date(2026, 8, d, 9, 0))));
    expect(strength.target).toBe(7);
    expect(strength.isYoung).toBe(true);
  });

  it('uses the filtered period, in either order, cut at today', () => {
    const dates = days(60);
    const { recent, scope } = getInsights(history(dates), { from: '12-1-2026', to: '9-20-2026' });
    expect(scope.first).toEqual(new Date(2026, 8, 20));
    expect(scope.last).toEqual(new Date(2026, 8, 26));
    expect(recent.title).toBe('This period');
    expect(recent).toMatchObject({ days: 7, count: 7, previousCount: 7 });
  });
});

describe('insights: habit strength', () => {
  it('reaches about 80% after a month of every day, as Loop does', () => {
    const { strength } = getInsights(history(days(30)));
    expect(strength.target).toBe(7);
    expect(strength.score).toBeCloseTo(1 - Math.pow(0.5, 30 / 13), 5);
    expect(strength.series.length).toBe(30);
  });

  it('halves in 13 days without a record', () => {
    const before = getInsights(history(days(300, { daysAgo: 13 }))).strength.score;
    vi.setSystemTime(new Date(2026, 8, 13, 15, 0));
    const atLastRecord = getInsights(history(days(300))).strength.score;
    expect(atLastRecord).toBeGreaterThan(0.99);
    expect(before).toBeCloseTo(atLastRecord / 2, 2);
  });

  it('measures a three-days-a-week habit against three days a week', () => {
    // Monday, Wednesday and Friday for 20 weeks.
    const dates = [];
    for (let week = 0; week < 20; ++week) {
      [1, 3, 5].forEach(weekday => dates.push(new Date(2026, 4, 3 + week * 7 + weekday, 7, 0)));
    }
    const { strength } = getInsights(history(dates));
    expect(strength.target).toBe(3);
    expect(strength.score).toBeGreaterThan(0.9);
  });

  it('shows a year of it at most', () => {
    const { strength } = getInsights(history(days(500)));
    expect(strength.series.length).toBe(365);
  });
});

describe('insights: rhythm', () => {
  it('rates weekdays by how many of them had a record', () => {
    // Weekdays only, for 12 weeks.
    const dates = days(84).filter(d => d.getDay() !== 0 && d.getDay() !== 6);
    const { weekdays, sentences } = getInsights(history(dates));
    expect(weekdays.enough).toBe(true);
    expect(weekdays.rates).toEqual([0, 1, 1, 1, 1, 1, 0]);
    // From the first Monday; the Sunday before it had no record, so isn't counted.
    expect(weekdays.totals).toEqual([11, 12, 12, 12, 12, 12, 12]);
    expect(weekdays.p).toBeLessThan(0.001);
    expect(sentences).toContain("You're most active on Mondays (100% of them) and least on Sundays (0%).");
  });

  it('makes no weekday claim from a few weeks, or from an even spread', () => {
    const fewWeeks = days(28).filter(d => d.getDay() !== 0);
    expect(getInsights(history(fewWeeks)).sentences.join()).not.toMatch(/most active on/);

    // Every other day falls evenly on every weekday.
    const even = getInsights(history(days(100, { every: 2 })));
    expect(even.weekdays.p).toBeGreaterThan(0.5);
    expect(even.sentences.join()).not.toMatch(/most active on/);
  });

  it('counts records by hour, leaving out ones without a time', () => {
    const dates = days(12, { hour: 19 }).concat(days(3, { daysAgo: 20, hour: 0 }).map(d => {
      d.setMinutes(0);
      return d;
    }));
    const { hours } = getInsights(history(dates));
    expect(hours.count).toBe(12);
    expect(hours.counts[19]).toBe(12);
    expect(hours.counts[0]).toBe(0);
    expect(hours.enough).toBe(true);
  });

  it('says when half of the records fall in a few hours, across midnight too', () => {
    const late = days(10, { hour: 23 }).concat(days(10, { daysAgo: 10, hour: 0 }), days(5, { daysAgo: 20, hour: 14 }));
    expect(getInsights(history(late)).sentences)
      .toContain('Half of the records are made between 11pm and 1am.');

    const spread = [];
    for (let hour = 1; hour < 24; hour += 1) spread.push(new Date(2026, 8, 1, hour, 10));
    expect(getInsights(history(spread)).sentences.join()).not.toMatch(/Half of the records/);
  });
});

describe('insights: consistency', () => {
  it('finds streaks, weeks in a row, the typical gap and the longest break', () => {
    const dates = [
      ...days(5), // Sep 22 - 26, current
      ...days(12, { daysAgo: 10, every: 2 }), // every other day, Aug 25 - Sep 16
      ...days(8, { daysAgo: 60 }), // Jul 21 - Jul 28
    ];
    const c = getInsights(history(dates)).consistency;
    expect(c.longest).toEqual({ first: new Date(2026, 6, 21), last: new Date(2026, 6, 28), count: 8 });
    expect(c.current).toEqual({ first: new Date(2026, 8, 22), last: new Date(2026, 8, 26), count: 5 });
    expect(c.longestBreak).toEqual({ first: new Date(2026, 6, 29), last: new Date(2026, 7, 24), count: 27 });
    expect(c.typicalGap).toBe(2);
    expect(c.gap90).toBe(2);
    expect(c.currentWeeks).toBe(5); // the week of Aug 23 to this one
    expect(c.longestWeeks).toBe(5);
    expect(c.activeDays).toBe(25);
  });

  it('keeps a streak alive until today ends', () => {
    const c = getInsights(history(days(4, { daysAgo: 1 }))).consistency;
    expect(c.current.count).toBe(4);
    expect(getInsights(history(days(4, { daysAgo: 2 }))).consistency.current).toBe(null);
  });

  it('counts days across a daylight saving change as consecutive', () => {
    // US clocks went forward on March 8, 2026.
    const dates = [6, 7, 8, 9, 10].map(d => new Date(2026, 2, d, 23, 30));
    const c = getInsights(history(dates)).consistency;
    expect(c.longest.count).toBe(5);
    expect(c.longestBreak).toBe(null);
  });
});

describe('insights: sentences', () => {
  it('says when the current streak is the longest so far', () => {
    const dates = days(10).concat(days(4, { daysAgo: 20 }));
    expect(getInsights(history(dates)).sentences).toContain("You're on your longest streak so far: 10 days.");
  });

  it('says activity dropped only when the drop is more than chance', () => {
    // 6 of the last 30 days after 25 of the 30 before.
    const dropped = days(6, { every: 5 }).concat(days(25, { daysAgo: 35 }));
    expect(getInsights(history(dropped)).sentences)
      .toContain('Less active lately: 6 of the last 30 days, down from 25 in the 30 before.');

    // 12 after 15 could easily be chance.
    const similar = days(12, { every: 2 }).concat(days(15, { daysAgo: 31, every: 2 }));
    expect(getInsights(history(similar)).sentences.join()).not.toMatch(/active lately/);
  });

  it('notes a wait longer than almost any before it', () => {
    const dates = days(20, { daysAgo: 6 });
    expect(getInsights(history(dates)).sentences)
      .toContain("It's been 6 days since the last record, the longest wait so far.");
  });

  it('never says more than three things', () => {
    const dates = days(60, { hour: 7 }).filter(d => d.getDay() !== 0 && d.getDay() !== 6)
      .concat(days(30, { daysAgo: 70, hour: 7, every: 3 }));
    expect(getInsights(history(dates)).sentences.length).toBeLessThanOrEqual(3);
  });
});

describe('insights: tests', () => {
  it('matches the textbook Fisher exact test', () => {
    // Fisher's lady tasting tea: 3 of 4 right against 1 of 4.
    expect(fisherExact(3, 4, 1, 4)).toBeCloseTo(0.4857, 4);
    expect(fisherExact(4, 4, 0, 4)).toBeCloseTo(0.0286, 4);
    expect(fisherExact(10, 30, 10, 30)).toBeCloseTo(1, 9);
  });

  it('finds no weekday pattern in an even spread', () => {
    expect(chiSquareWeekdays([5, 5, 5, 5, 5, 5, 5], [10, 10, 10, 10, 10, 10, 10])).toBeCloseTo(1, 6);
    // Chi-square of 12.59 with 6 degrees of freedom is the 5% point.
    const counts = [2, 8, 8, 8, 8, 8, 2];
    expect(chiSquareWeekdays(counts, [10, 10, 10, 10, 10, 10, 10])).toBeLessThan(0.01);
  });
});

describe('Insights tab', () => {
  const project = dates => ({ id: 'p1', projectHistory: { contributionsByDay: history(dates) } });
  const mountInsights = (dates, query = {}) => mount(ProjectInsights, {
    props: { project: project(dates) },
    global: {
      mocks: { $route: { name: 'project-insights', query } },
      stubs: { RouterLink: RouterLinkStub, 'selected-filters': true },
    },
  });

  it('shows the headline, the sentences, the charts and the facts', () => {
    const dates = days(84, { hour: 19 }).filter(d => d.getDay() !== 0 && d.getDay() !== 6);
    const w = mountInsights(dates);
    expect(w.find('.insight-tile h3').text()).toBe('Last 30 days');
    expect(w.find('.insight-number').text()).toBe('21 of 30 days active');
    expect(w.findAll('.insight-sentences li').length).toBeGreaterThan(0);
    expect(w.findAll('.insight-bars').length).toBe(2);
    expect(w.find('.insight-sparkline polyline').exists()).toBe(true);
    expect(w.text()).toContain('Measured against your usual 5 days a week');
    expect(w.find('.insight-card h3 span').text()).toBe('since July 6, 2026');
  });

  it('puts a tapped bar in the caption', async () => {
    const dates = days(84, { hour: 19 }).filter(d => d.getDay() !== 0 && d.getDay() !== 6);
    const w = mountInsights(dates);
    const weekdays = w.findAll('.insight-bars')[0];
    expect(weekdays.find('.ib-caption').text()).toBe('Mondays: 12 of 12 had a record (100%)');
    await weekdays.findAll('.ib-column')[0].trigger('click');
    expect(weekdays.find('.ib-caption').text()).toBe('Sundays: 0 of 11 had a record (0%)');
    expect(w.findAll('.insight-bars')[1].find('.ib-caption').text()).toBe('7pm - 8pm: 60 records');
  });

  it('links streaks and breaks to their days on the overview', () => {
    const dates = days(5).concat(days(8, { daysAgo: 60 }));
    const w = mountInsights(dates);
    const links = w.findAllComponents(RouterLinkStub).map(l => l.props('to').query);
    expect(links).toEqual([
      { from: '7-21-2026', to: '7-28-2026' }, // longest streak
      { from: '9-22-2026', to: '9-26-2026' }, // current streak
      { from: '7-29-2026', to: '9-21-2026' }, // longest break
    ]);
    expect(w.findAll('.insight-range').map(l => l.text()))
      .toEqual(['Jul 21 - 28, 2026', 'Sep 22 - 26, 2026', 'Jul 29 - Sep 21, 2026']);
  });

  it('says what is still missing, and when there is nothing at all', () => {
    const w = mountInsights(days(3));
    expect(w.text()).toContain('Not enough records yet for the weekday chart');
    expect(w.findAll('.insight-bars').length).toBe(0);

    expect(mountInsights([]).text()).toContain('There are no records yet');
    expect(mountInsights(days(3), { from: '1-1-2020' }).text()).toContain('Nothing was recorded in this period.');
  });
});

describe('Project tabs', () => {
  it('keep the date filter between Overview and Insights, and nothing else', () => {
    const w = mount(ProjectTabs, {
      props: { project: { canEdit: true } },
      global: {
        mocks: { $route: { name: 'add-record', query: { from: '9-1-2026', to: '9-3-2026', date: '9-1-2026' } } },
        stubs: { RouterLink: RouterLinkStub },
      },
    });
    const [overview, insights, settings] = w.findAllComponents(RouterLinkStub).map(l => l.props('to'));
    expect(overview).toEqual({ name: 'project-overview', query: { from: '9-1-2026', to: '9-3-2026' } });
    expect(insights).toEqual({ name: 'project-insights', query: { from: '9-1-2026', to: '9-3-2026' } });
    expect(settings).toEqual({ name: 'project-settings' });
  });
});
