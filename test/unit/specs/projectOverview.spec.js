import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectOverview from 'src/components/ProjectOverview.vue';

// A project shaped the way Project.load() leaves it, with one row holding a
// column that has a value and one that does not - the case that used to put
// `v-if='column.value'` next to `v-for='column in row'`.
const project = {
  id: 'p1',
  title: 'One meal a day',
  description: null,
  canEdit: true,
  loading: false,
  settings: { charts: [] },
  projectHistory: {
    recordsCount: 1,
    groups: [{
      group: { value: 'September 16, 2026', title: 'Date' },
      items: [[
        { title: 'Did it?', value: 'Yes' },
        { title: 'Note', value: '' }
      ]]
    }]
  }
};

const global = {
  mocks: { $route: { query: {} } },
  stubs: {
    'router-link': { template: '<a><slot/></a>' },
    'action-row': true,
    'selected-filters': true
  }
};

describe('ProjectOverview', () => {
  // Regression: Vue 3 evaluates v-if before v-for, so a v-if reading the loop
  // variable threw and aborted the whole component render (blank Overview).
  it('renders record rows without throwing', () => {
    const w = mount(ProjectOverview, { props: { project, error: null }, global });
    expect(w.text()).toContain('September 16, 2026');
    expect(w.text()).toContain('Did it?');
    expect(w.text()).toContain('Yes');
  });

  it('skips columns that have no value', () => {
    const w = mount(ProjectOverview, { props: { project, error: null }, global });
    expect(w.findAll('.cell-record')).toHaveLength(1);
    expect(w.text()).not.toContain('Note');
  });
});
