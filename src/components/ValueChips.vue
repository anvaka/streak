<template>
  <!-- The heatmap's key, and a filter: tapping a value shows only the records
       with it, everywhere; tapping it again, or All, shows everything. Looks
       like a row of buttons so it reads as something to tap, not a caption. -->
  <nav class='value-chips' aria-label='Show records with'>
    <router-link class='value-chip' :class='{selected: focus === undefined}' :to='linkTo(undefined)'
        :aria-current='focus === undefined ? "true" : null' replace>All</router-link>
    <template v-for='entry in legend' :key='entry.color'>
      <router-link v-if='isFocusable(entry)' class='value-chip' :class='{selected: focus === entry.value}'
          :to='linkTo(focus === entry.value ? undefined : entry.value)'
          :aria-current='focus === entry.value ? "true" : null' replace>
        <span class='vc-dot' :style='{background: entry.color}'></span><span class='vc-label'>{{entry.label}}</span> <span class='vc-count'>{{getCount(entry.value)}}</span>
      </router-link>
      <!-- "Other" and "No value" stand for several values, or none. -->
      <span v-else class='value-chip static'>
        <span class='vc-dot' :style='{background: entry.color}'></span><span class='vc-label'>{{entry.label}}</span>
      </span>
    </template>
  </nav>
</template>

<script>
import { countDaysByValue } from 'src/lib/facet.js';

export default {
  name: 'ValueChips',
  // `legend` from assignCategoryColors, `dates` the days to count them on.
  props: ['legend', 'dates', 'focus'],
  computed: {
    counts() {
      return countDaysByValue(this.dates);
    },
  },
  methods: {
    isFocusable(entry) {
      return typeof entry.value === 'string';
    },
    getCount(value) {
      return (this.counts.get(value) || 0).toLocaleString('en-US');
    },
    linkTo(value) {
      const query = Object.assign({}, this.$route.query);
      if (value === undefined) delete query.focus;
      else query.focus = value;
      return { name: this.$route.name, params: this.$route.params, query };
    },
  },
};
</script>

<style lang='stylus'>
@import '../styles/variables.styl';

.value-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
  font-size: 13px;
  .value-chip {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    min-height: 30px;
    padding: 0 10px;
    border: 1px solid strong-border-color;
    border-radius: 15px;
    color: base-text-color;
    background: white;
    text-decoration: none;
  }
  .value-chip.selected {
    border-color: base-text-color;
    box-shadow: inset 0 0 0 1px base-text-color;
  }
  .value-chip.static {
    border-style: dashed;
    color: secondary-text-color;
  }
  .vc-dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 6px;
  }
  .vc-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vc-count {
    margin-left: 4px;
    color: secondary-text-color;
  }
}
</style>
