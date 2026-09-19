import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import extractHeaderTypesFromData from 'src/lib/project-list/utils/extractHeaderTypesFromData';
import MultiComplete from 'src/components/multi-complete/MultiComplete.vue';
import MultiLineText from 'src/components/inputs/MultiLineText.vue';

const sheet = values => ({ headers: ['When', 'Workout'], values });

describe('autocomplete suggestions', () => {
  it('orders suggestions by how often the value was used', () => {
    const [, workout] = extractHeaderTypesFromData(sheet([
      ['1/1/2026', 'Swim'],
      ['1/2/2026', 'Run'],
      ['1/3/2026', 'Run'],
      ['1/4/2026', 'Yoga'],
      ['1/5/2026', 'Run'],
      ['1/6/2026', 'Swim'],
    ]));

    // Run 3x, Swim 2x, Yoga 1x - not the order they first appear in the sheet.
    expect(workout.autocomplete).toEqual(['Run', 'Swim', 'Yoga']);
  });

  it('breaks frequency ties towards the more recently used value', () => {
    const [, workout] = extractHeaderTypesFromData(sheet([
      ['1/1/2026', 'Run'],
      ['1/2/2026', 'Swim'],
      ['1/3/2026', 'Run'],
      ['1/4/2026', 'Swim'],
      ['1/5/2026', 'Yoga'],
    ]));

    // Run and Swim are both used twice, and Run appears first in the sheet, so
    // insertion order would put Run on top. Swim was used most recently, so it
    // should lead instead.
    expect(workout.autocomplete.slice(0, 2)).toEqual(['Swim', 'Run']);
  });

  it('still de-duplicates and trims, as before', () => {
    const [, workout] = extractHeaderTypesFromData(sheet([
      ['1/1/2026', ' Run '],
      ['1/2/2026', 'Run'],
      ['1/3/2026', ''],
    ]));

    expect(workout.autocomplete).toEqual(['Run']);
  });
});

describe('low-cardinality columns open on focus', () => {
  const mountWith = (suggestions, modelValue = '', props = {}) =>
    mount(MultiComplete, { props: { suggestions, modelValue, ...props } });

  it('opens the whole list when the field is empty and values are few', async () => {
    const w = mountWith(['Run', 'Swim', 'Yoga']);
    expect(w.vm.showDropdown).toBe(false);

    await w.find('textarea').trigger('focus');

    // Two taps: one into the field, one on the value.
    expect(w.vm.showDropdown).toBe(true);
    expect(w.findAll('.mc-suggestion-item').map(i => i.text())).toEqual(['Run', 'Swim', 'Yoga']);
  });

  it('stays shut when the column has too many distinct values', async () => {
    const many = Array.from({ length: 9 }, (_, i) => 'value ' + i);
    const w = mountWith(many);

    await w.find('textarea').trigger('focus');

    expect(w.vm.showDropdown).toBe(false);
  });

  it('stays shut when the field already has a value', async () => {
    // Editing an existing record: the prefix filter would match only that
    // value, so a dropdown over the keyboard is pure noise.
    const w = mountWith(['Run', 'Swim', 'Yoga'], 'Run');

    await w.find('textarea').trigger('focus');

    expect(w.vm.showDropdown).toBe(false);
  });

  it('stays shut when the column has no history yet', async () => {
    const w = mountWith([]);

    await w.find('textarea').trigger('focus');

    expect(w.vm.showDropdown).toBe(false);
  });

  it('picking a suggestion writes it back through v-model', async () => {
    const w = mountWith(['Run', 'Swim']);
    await w.find('textarea').trigger('focus');

    await w.findAll('.mc-suggestion-item')[1].trigger('click');

    expect(w.emitted('update:modelValue').at(-1)).toEqual(['Swim']);
  });

  it('threshold is configurable', async () => {
    const w = mountWith(['a', 'b', 'c'], '', { openOnFocusMaxSuggestions: 2 });

    await w.find('textarea').trigger('focus');

    expect(w.vm.showDropdown).toBe(false);
  });
});

describe('MultiLineText passes the column history through', () => {
  it('forwards vm.autocomplete as suggestions', () => {
    const vm = { title: 'Workout', value: '', autocomplete: ['Run', 'Swim'], hasMultiline: false };
    const w = mount(MultiLineText, { props: { vm } });

    expect(w.findComponent(MultiComplete).props('suggestions')).toEqual(['Run', 'Swim']);
  });

  it('suppresses suggestions for columns holding multi-line text', () => {
    const vm = { title: 'Note', value: '', autocomplete: ['a'], hasMultiline: true };
    const w = mount(MultiLineText, { props: { vm } });

    expect(w.findComponent(MultiComplete).props('suggestions')).toEqual([]);
  });
});
