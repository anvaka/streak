import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NumberInput from 'src/components/inputs/Number.vue';
import MultiLineText from 'src/components/inputs/MultiLineText.vue';
import DateInput from 'src/components/inputs/Date.vue';

// These components write straight through the `vm` object prop (v-model="vm.value").
// eslint flags that as vue/no-mutating-props, but Vue 3 props are only
// shallowReadonly, so nested writes still work - AddRecord.vue collects
// field.value from exactly these objects.
describe('record input components write back through the vm prop', () => {
  it('Number: typing updates vm.value without a mutation warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const vm = { title: 'Weight', value: '' };
    const w = mount(NumberInput, { props: { vm } });

    await w.find('input').setValue('42');

    // Vue 3 casts type="number" inputs to Number (Vue 2 gave a string). Sheets
    // is written with valueInputOption USER_ENTERED, so both land the same.
    expect(vm.value).toBe(42);
    expect(warn.mock.calls.filter(c => String(c[0]).includes('mutating'))).toHaveLength(0);
    warn.mockRestore();
  });

  it('MultiLineText: typing updates vm.value', async () => {
    const vm = { title: 'Note', value: '', hasMultiline: false, autocomplete: [] };
    const w = mount(MultiLineText, { props: { vm } });

    await w.find('textarea').setValue('hello there');

    expect(vm.value).toBe('hello there');
  });

  it('Date: seeds vm.value on mount', () => {
    const vm = { title: 'When', value: '' };
    mount(DateInput, { props: { vm } });

    // toDateInputStr's US format, matching flatpickr's dateFormat 'm/d/Y H:i:S'.
    expect(vm.value).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
  });
});
