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

  it('Number: accepts decimals - step must be "any"', async () => {
    const vm = { title: 'Weight', value: '' };
    const w = mount(NumberInput, { props: { vm } });
    const input = w.find('input');

    await input.setValue('3.5');
    expect(vm.value).toBe(3.5);

    // The regression this guards: a bare <input type="number"> defaults to
    // step=1, which makes every decimal a stepMismatch. AddRecord.vue submits
    // these through a <form>, and native validation runs before the submit
    // event fires - so an invalid field means "Save record" silently does
    // nothing. jsdom does not implement stepMismatch, so assert the attribute
    // that prevents it rather than the validity state.
    expect(input.attributes('step')).toBe('any');
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

  it('Date: carries step="any" for flatpickr to copy onto its mobile input', () => {
    const vm = { title: 'When', value: '' };
    const w = mount(DateInput, { props: { vm } });

    expect(w.find('input').attributes('step')).toBe('any');
  });

  it('Date: flatpickr\'s mobile input accepts times with seconds', async () => {
    // On a mobile UA flatpickr hides our input and inserts its own native
    // <input type="datetime-local">, filling it from the Y-m-d\TH:i:S format -
    // with seconds, since enableSeconds is on. A datetime-local input defaults
    // to step=60, so those seconds are a stepMismatch and AddRecord.vue's form
    // refuses to submit. flatpickr 2 hardcoded step="any" on that input;
    // flatpickr 4 only copies it from ours, so the v2->v4 bump silently dropped
    // it. Drive the real mobile code path rather than trusting the attribute.
    const realUa = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent');
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1',
      configurable: true,
    });

    try {
      const vm = { title: 'When', value: '03/15/2026 09:45:07' };
      const w = mount(DateInput, { props: { vm }, attachTo: document.body });

      const mobile = w.element.querySelector('input.flatpickr-mobile');
      expect(mobile, 'flatpickr did not take its mobile path').not.toBeNull();
      expect(mobile.type).toBe('datetime-local');
      // The seconds are what step=60 would reject. Matched loosely because
      // jsdom leaves the milliseconds on that a real browser sanitizes away.
      expect(mobile.value).toMatch(/^2026-03-15T09:45:07/);
      expect(mobile.getAttribute('step')).toBe('any');

      w.unmount();
    } finally {
      Object.defineProperty(navigator, 'userAgent', realUa);
    }
  });
});
