import { describe, it, expect } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { assignCategoryColors, shade, hexToOklab, CATEGORY_COLORS, OTHER_COLOR } from 'src/lib/color';
import ProjectHistoryViewModel from 'src/lib/project-list/ProjectHistoryViewModel';
import ContributionsWall from 'src/components/charts/ContributionsWall.vue';
import { getDateString } from 'src/lib/dateUtils';

const [BLUE, VERMILLION, WINE, GREEN] = CATEGORY_COLORS;

describe('assignCategoryColors', () => {
  it('colors categories in the order they first appeared', () => {
    const { colorOf } = assignCategoryColors(['Run', 'Swim', 'Yoga']);
    expect([colorOf('Run'), colorOf('Swim'), colorOf('Yoga')]).toEqual([BLUE, VERMILLION, WINE]);
  });

  it('a new category never repaints the existing ones', () => {
    const before = assignCategoryColors(['Run', 'Swim']);
    const after = assignCategoryColors(['Run', 'Swim', 'Bike']);
    expect(after.colorOf('Run')).toBe(before.colorOf('Run'));
    expect(after.colorOf('Swim')).toBe(before.colorOf('Swim'));
  });

  it('gives yes and no no special colors: what a value says never matters', () => {
    const { colorOf } = assignCategoryColors(['Gym', 'no', 'Yes']);
    expect(colorOf('Gym')).toBe(BLUE);
    expect(colorOf('no')).toBe(VERMILLION);
    expect(colorOf('Yes')).toBe(WINE);
  });

  it('folds a fifth category into Other instead of reusing a color', () => {
    const { colorOf, legend } = assignCategoryColors(['a', 'b', 'c', 'd', 'e']);
    expect(colorOf('d')).toBe(GREEN);
    expect(colorOf('e')).toBe(OTHER_COLOR);
    expect(legend.map(e => e.label)).toEqual(['a', 'b', 'c', 'd', 'Other']);
  });

  it('draws blank cells as "No value" without spending a color', () => {
    const { colorOf, legend } = assignCategoryColors([null, 'Yes', 'No']);
    expect(colorOf(null)).toBe(OTHER_COLOR);
    expect(legend.map(e => e.label)).toEqual(['Yes', 'No', 'No value']);
  });

  it('the session no longer shares one palette across projects', () => {
    assignCategoryColors(['Something', 'Else', 'Entirely']);
    expect(assignCategoryColors(['Run']).colorOf('Run')).toBe(BLUE);
  });
});

describe('shade', () => {
  it('is the color itself at zero', () => {
    expect(shade(VERMILLION, 0).toLowerCase()).toBe(VERMILLION.toLowerCase());
  });

  it('lightens without drifting towards another hue', () => {
    // Lightening in HSL turned a light red into pink, so a smaller day looked
    // like a different category. The OKLab hue angle has to hold still.
    const hueOf = hex => {
      const [, a, b] = hexToOklab(hex);
      return Math.atan2(b, a) * 180 / Math.PI;
    };
    for (const color of CATEGORY_COLORS) {
      const light = shade(color, 0.25);
      expect(hexToOklab(light)[0]).toBeGreaterThan(hexToOklab(color)[0] + 0.05);
      expect(Math.abs(hueOf(light) - hueOf(color))).toBeLessThan(1.5);
    }
  });
});

describe('ProjectHistoryViewModel categories', () => {
  const headers = [
    { title: 'When', valueType: 'date' },
    { title: 'Did it', valueType: 'text' },
  ];

  it('orders categories by date, not by position in the sheet', () => {
    const history = new ProjectHistoryViewModel([
      ['03/05/2026 10:00:00', 'No'],
      ['03/01/2026 10:00:00', 'Yes'],
    ], headers);
    expect(history.categories).toEqual(['Yes', 'No']);
  });

  it('treats padded and blank cells sensibly', () => {
    const history = new ProjectHistoryViewModel([
      ['03/01/2026 10:00:00', ' Yes '],
      ['03/02/2026 10:00:00', 'Yes'],
      ['03/03/2026 10:00:00', ''],
    ], headers);
    expect(history.categories).toEqual(['Yes', null]);
  });

  it('draws equal days at full strength, not all at the palest shade', () => {
    const history = new ProjectHistoryViewModel([
      ['03/01/2026 10:00:00', 'Yes'],
      ['03/02/2026 10:00:00', 'No'],
    ], headers);
    const days = Object.values(history.contributionsByDay);
    expect(days.map(d => d.scaledValue)).toEqual([1, 1]);
  });
});

describe('ContributionsWall value chips', () => {
  function mountWith(categories, dates = {}, query = {}) {
    return mount(ContributionsWall, {
      props: { dates, categories, settings: {} },
      global: {
        mocks: { $route: { name: 'project-overview', params: { projectId: 'p1' }, query } },
        stubs: { RouterLink: RouterLinkStub },
      },
    });
  }
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const dates = {
    [getDateString(today)]: { groupKey: 'No', values: ['No'], scaledValue: 1 },
    [getDateString(yesterday)]: { groupKey: 'Yes', values: ['Yes'], scaledValue: 1 },
  };
  const fillsOf = w => w.findAll('rect').map(r => r.attributes('fill').toLowerCase());

  it('names the colors, with how many days have each', () => {
    const w = mountWith(['Yes', 'No'], dates);
    expect(w.findAll('.value-chip').map(c => c.text().replace(/\s+/g, ' '))).toEqual(['All', 'Yes 1', 'No 1']);
  });

  it('shows no chips for a single category', () => {
    expect(mountWith(['Run']).find('.value-chips').exists()).toBe(false);
  });

  it('paints a day in its category color', () => {
    expect(fillsOf(mountWith(['Yes', 'No'], dates))).toContain(VERMILLION.toLowerCase());
  });

  it('links each chip to a focus on its value, and the focused one back to all', () => {
    const w = mountWith(['Yes', 'No'], dates, { from: '1-1-2026', focus: 'Yes' });
    const [all, yes, no] = w.findAllComponents(RouterLinkStub).map(l => l.props('to').query);
    expect(all).toEqual({ from: '1-1-2026' });
    expect(yes).toEqual({ from: '1-1-2026' });
    expect(no).toEqual({ from: '1-1-2026', focus: 'No' });
    expect(w.find('.value-chip.selected').text()).toMatch(/^Yes/);
  });

  it('grays days with other values when focused, and keeps empty days empty', () => {
    const fills = fillsOf(mountWith(['Yes', 'No'], dates, { focus: 'Yes' }));
    expect(fills).toContain(BLUE.toLowerCase());
    expect(fills).not.toContain(VERMILLION.toLowerCase());
    const otherValue = shade(OTHER_COLOR, 0.5).toLowerCase();
    expect(fills.filter(f => f === otherValue).length).toBe(1);
    expect(fills).toContain('rgb(235, 237, 240)');
  });
});
