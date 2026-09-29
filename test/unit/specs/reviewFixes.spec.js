import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { computed } from 'vue';
import ProjectHistoryViewModel from 'src/lib/project-list/ProjectHistoryViewModel';
import extractHeaderTypesFromData from 'src/lib/project-list/utils/extractHeaderTypesFromData';
import ContributionsWallContainer from 'src/components/charts/ContributionsWallContainer.vue';
import ProjectPage from 'src/components/ProjectPage.vue';
import ProjectOverview from 'src/components/ProjectOverview.vue';
import ProjectInsights from 'src/components/insights/ProjectInsights.vue';
import now from 'src/lib/today';

// Saturday, September 26, 2026, mid-afternoon.
const TODAY = new Date(2026, 8, 26, 15, 0);
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});
afterEach(() => {
  vi.useRealTimers();
});

function sheetDate(daysAgo, hour = 8) {
  const d = new Date(2026, 8, 26 - daysAgo, hour, 15);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(hour)}:15:00`;
}
const DATE = { title: 'Date', valueType: 'date' };
const SPORT = { title: 'Sport', valueType: 'text' };
const NOTES = { title: 'Notes', valueType: 'text' };

describe('the values to pick from', () => {
  it('include one that is never the last record of a day', () => {
    const history = new ProjectHistoryViewModel([
      [sheetDate(6, 8), 'Run'], [sheetDate(6, 9), 'Swim'],
      [sheetDate(5, 8), 'Run'], [sheetDate(5, 9), 'Swim'],
      [sheetDate(4), 'Bike'],
    ], [DATE, SPORT]);
    expect(history.categories).toEqual(['Run', 'Swim', 'Bike']);
  });

  it('come from the most repetitive text column, not the first that could do', () => {
    const rows = [];
    const notes = ['tired', 'great', 'tired', 'rain', 'ok', 'great'];
    notes.forEach((note, i) => rows.push([sheetDate(i), note, i % 3 ? 'Run' : 'Swim']));
    const history = new ProjectHistoryViewModel(rows, [DATE, NOTES, SPORT]);
    expect(history.facet).toEqual({ columnIndex: 2, title: 'Sport' });
  });
});

describe('a settings field saved only for "add up"', () => {
  it('leaves the column type to be guessed', () => {
    const headers = extractHeaderTypesFromData(
      { headers: ['Date', 'Minutes'], values: [[sheetDate(0), '30']] },
      { fields: [{ title: 'Minutes', combine: 'sum' }] }
    );
    expect(headers[1].valueType).toBe('number');
    expect(headers[1].combine).toBe('sum');
  });
});

describe('tapping a heatmap day while a value is in focus', () => {
  function tap(from, to) {
    const history = new ProjectHistoryViewModel([
      [sheetDate(2), 'Yes'], [sheetDate(1), 'No'], [sheetDate(0), 'Yes'],
    ], [DATE, { title: 'Ate well?', valueType: 'text' }]);
    const push = vi.fn();
    const w = mount(ContributionsWallContainer, {
      props: { project: { id: 'p1', projectHistory: history }, settings: {} },
      global: {
        mocks: { $route: { name: 'project-overview', query: { focus: 'Yes' } }, $router: { push } },
        stubs: { ContributionsWall: true },
      },
    });
    w.vm.filterContributions(from, to);
    return push.mock.calls[0][0].query;
  }

  it('keeps the focus on a day that has the value', () => {
    expect(tap('9-26-2026', '9-26-2026')).toEqual({ from: '9-26-2026', focus: 'Yes' });
  });

  it('drops it on a day that has only other values, so its records show', () => {
    expect(tap('9-25-2026', '9-25-2026')).toEqual({ from: '9-25-2026' });
    expect(tap('9-24-2026', '9-25-2026')).toEqual({ from: '9-24-2026', to: '9-25-2026', focus: 'Yes' });
  });
});

describe('the project page', () => {
  const reloads = (to, from) => {
    const loadCurrentProject = vi.fn();
    ProjectPage.watch.$route.call({ loadCurrentProject }, to, from);
    return loadCurrentProject.mock.calls.length > 0;
  };
  const route = (name, path, query = {}) => ({ name, path, query });

  it("doesn't fetch the sheet again to filter or focus, or between overview and Insights", () => {
    expect(reloads(route('project-overview', '/u/project/p1', { focus: 'Yes' }), route('project-overview', '/u/project/p1'))).toBe(false);
    expect(reloads(route('project-insights', '/u/project/p1/insights'), route('project-overview', '/u/project/p1'))).toBe(false);
    const add = '/u/project/p1/add';
    expect(reloads(route('add-record', add, { date: '9-26-2026' }), route('add-record', add, { date: '9-25-2026' }))).toBe(false);
  });

  it('does after adding a record, or leaving the settings', () => {
    expect(reloads(route('project-overview', '/u/project/p1'), route('add-record', '/u/project/p1/add'))).toBe(true);
    expect(reloads(route('project-overview', '/u/project/p1'), route('project-settings', '/u/project/p1/settings'))).toBe(true);
  });
});

describe('the record list', () => {
  function mountOverview(query) {
    const history = new ProjectHistoryViewModel([
      [sheetDate(2), 'Yes'], [sheetDate(1), 'No'], [sheetDate(0), 'Yes'],
    ], [DATE, { title: 'Ate well?', valueType: 'text' }]);
    return mount(ProjectOverview, {
      props: { project: { id: 'p1', canEdit: false, loading: false, settings: { charts: [] }, projectHistory: history }, error: null },
      global: {
        mocks: { $route: { query } },
        stubs: { 'router-link': { template: '<a><slot/></a>' }, 'action-row': true, 'selected-filters': true },
      },
    });
  }

  it('follows the filter and focus in the address', () => {
    expect(mountOverview({}).findAll('.group-record').length).toBe(3);
    expect(mountOverview({ focus: 'Yes' }).findAll('.group-record').length).toBe(2);
    expect(mountOverview({ from: '9-25-2026', focus: 'Yes' }).text()).toContain('nothing recorded');
  });

  it('shows everything for an empty or repeated focus, as the chips do', () => {
    expect(mountOverview({ focus: '' }).findAll('.group-record').length).toBe(3);
    expect(mountOverview({ focus: null }).findAll('.group-record').length).toBe(3);
    expect(mountOverview({ focus: ['Yes', 'No'] }).findAll('.group-record').length).toBe(3);
  });
});

describe('Insights value chips', () => {
  it('count the days in the date filter', () => {
    const rows = [];
    for (let i = 0; i < 20; ++i) rows.push([sheetDate(i), i % 4 ? 'Yes' : 'No']);
    const history = new ProjectHistoryViewModel(rows, [DATE, { title: 'Ate well?', valueType: 'text' }]);
    const w = mount(ProjectInsights, {
      props: { project: { id: 'p1', canEdit: false, projectHistory: history } },
      global: {
        mocks: { $route: { name: 'project-insights', params: {}, query: { from: '9-20-2026', to: '9-26-2026' } } },
        stubs: { RouterLink: RouterLinkStub, 'selected-filters': true },
      },
    });
    expect(w.findAll('.value-chip').map(c => c.text().replace(/\s+/g, ' '))).toEqual(['All', 'Yes 5', 'No 2']);
  });
});

describe('today', () => {
  it('moves on when the page comes back on another day', () => {
    const day = computed(() => now().getDate());
    expect(day.value).toBe(26);
    vi.setSystemTime(new Date(2026, 8, 27, 7, 0));
    expect(day.value).toBe(26); // cached, as computeds are
    document.dispatchEvent(new Event('visibilitychange'));
    expect(day.value).toBe(27);
  });
});
