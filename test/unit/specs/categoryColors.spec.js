import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
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

  it('pins yes to blue and no to vermillion, whichever came first', () => {
    // The case that prompted this: yes/no landing on the palette's red and pink.
    const { colorOf } = assignCategoryColors(['Gym', 'no', 'Yes']);
    expect(colorOf('Yes')).toBe(BLUE);
    expect(colorOf('no')).toBe(VERMILLION);
    expect(colorOf('Gym')).toBe(WINE);
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

describe('ContributionsWall legend', () => {
  function mountWith(categories, dates = {}) {
    return mount(ContributionsWall, {
      props: { dates, categories, settings: {} },
      global: { mocks: { $route: { query: {} } } },
    });
  }

  it('names the colors when there is more than one category', () => {
    const w = mountWith(['Yes', 'No']);
    expect(w.findAll('.cw-legend li').map(li => li.text())).toEqual(['Yes', 'No']);
  });

  it('shows no legend for a single category', () => {
    expect(mountWith(['Run']).find('.cw-legend').exists()).toBe(false);
  });

  it('paints a day in its category color', () => {
    const today = new Date();
    const w = mountWith(['Yes', 'No'], {
      [getDateString(today)]: { groupKey: 'No', scaledValue: 1 },
    });
    const fills = w.findAll('rect').map(r => r.attributes('fill').toLowerCase());
    expect(fills).toContain(VERMILLION.toLowerCase());
  });
});
