import { describe, it, expect } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { mount } from '@vue/test-utils';
import { defineComponent, h, resolveComponent } from 'vue';
import router from 'src/router';
import { updateRow, deleteRow } from 'src/lib/store/sheetOperations.js';

// Regression guard for a vue-router 4 migration bug. `row` is used in
// arithmetic - sheetOperations builds the write range as 'A' + (row + 2) - and
// vue-router 4 normalises every route param to a string, where vue-router 3
// passed a pushed number straight through. With `props: true`, editing record 3
// therefore wrote to 'A32': the edit vanished and an unrelated row 30 rows down
// was overwritten.
describe('edit-record row param is a number', () => {
  const propsFor = params => {
    const record = router.getRoutes().find(r => r.name === 'edit-record');
    const toProps = record.props.default;
    expect(typeof toProps, 'edit-record must use a props function, not `props: true`').toBe('function');
    return toProps({ params });
  };

  it('converts the string route param to a number', () => {
    expect(propsFor({ row: '3' })).toEqual({ row: 3 });
  });

  it('produces a row that lands on the right sheet range', () => {
    const { row } = propsFor({ row: '3' });
    expect('A' + (row + 2)).toBe('A5'); // not 'A32'
  });

  it('keeps row 0 usable', () => {
    expect(propsFor({ row: '0' })).toEqual({ row: 0 });
  });

  it('refuses a hand-edited nonsense url rather than guessing a row', () => {
    expect(propsFor({ row: 'banana' })).toEqual({ row: undefined });
    expect(propsFor({ row: '-1' })).toEqual({ row: undefined });
    expect(propsFor({ row: '1.5' })).toEqual({ row: undefined });
  });
});

describe('sheet writes refuse a non-integer row', () => {
  const record = ['03/15/2026 09:45:00', 'Run'];

  it('updateRow throws rather than building a concatenated range', () => {
    expect(() => updateRow('p', 'sheet', record, '3')).toThrow(/integer/i);
  });

  it('deleteRow throws too', () => {
    expect(() => deleteRow('p', 'sheet', '3')).toThrow(/integer/i);
  });

  it('updateRow still allows undefined, which means append', () => {
    // Reaches gapi and fails there, but not on the row guard.
    expect(() => updateRow('p', 'sheet', record, undefined)).not.toThrow(/integer/i);
  });
});


describe('a props function still lets router-view pass its own props', () => {
  // AddRecordContainer gets `row` from the route but `project` from
  // <router-view :project='project'>. Swapping `props: true` for a function
  // must not drop one or the other, or editing breaks entirely.
  it('delivers both the route prop and the router-view prop', async () => {
    const Probe = defineComponent({
      name: 'Probe',
      props: ['project', 'row'],
      render() { return h('div'); },
    });
    const testRouter = createRouter({
      history: createMemoryHistory(),
      routes: [{
        path: '/edit-record/:row',
        name: 'edit-record',
        component: Probe,
        props: route => ({ row: Number(route.params.row) }),
      }],
    });
    const App = defineComponent({
      data: () => ({ project: { id: 'p1' } }),
      render() {
        return h(resolveComponent('RouterView'), { project: this.project });
      },
    });

    // Navigate before mounting, so router-view has a matched route to render.
    await testRouter.push({ name: 'edit-record', params: { row: 3 } });
    await testRouter.isReady();
    const w = mount(App, { global: { plugins: [testRouter] } });
    await w.vm.$nextTick();

    const probe = w.findComponent(Probe);
    expect(probe.props('row')).toBe(3);
    expect(probe.props('project')).toEqual({ id: 'p1' });
  });
});
