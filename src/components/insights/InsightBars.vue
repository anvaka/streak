<template>
  <div class='insight-bars'>
    <!-- Each column is a button: tapping it puts its numbers in the caption.
         The caption starts on the tallest bar. -->
    <div class='ib-columns'>
      <button v-for='(bar, i) in bars' :key='i' type='button' class='ib-column'
          :class='{selected: i === selectedIndex}' :aria-label='bar.caption' @click='selected = i'>
        <span class='ib-bar' :style='{height: getHeight(bar.value)}'></span>
      </button>
    </div>
    <div class='ib-labels' :class='{ticks: ticks}'>
      <span v-for='(bar, i) in bars' :key='i' class='ib-label'>{{bar.label}}</span>
    </div>
    <div class='ib-caption'>{{bars[selectedIndex].caption}}</div>
  </div>
</template>

<script>
export default {
  name: 'InsightBars',
  // `bars`: [{value, label, caption}], values from 0 to `max`. With `ticks`
  // the labels mark where a column starts (hours) instead of naming it (days).
  props: ['bars', 'max', 'ticks'],
  data() {
    return { selected: null };
  },
  computed: {
    scaleMax() {
      return this.max || Math.max(...this.bars.map(bar => bar.value)) || 1;
    },
    selectedIndex() {
      if (this.selected !== null && this.selected < this.bars.length) return this.selected;
      const values = this.bars.map(bar => bar.value);
      return values.indexOf(Math.max(...values));
    },
  },
  methods: {
    getHeight(value) {
      if (!value) return '0';
      // Anything above zero stays visible.
      return `max(2px, ${(100 * value / this.scaleMax).toFixed(2)}%)`;
    },
  },
};
</script>

<style lang='stylus'>
@import '../../styles/variables.styl';

.insight-bars {
  .ib-columns {
    display: flex;
    align-items: stretch;
    height: 72px;
    border-bottom: 1px solid strong-border-color;
  }
  .ib-column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 1px;
    margin: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .ib-bar {
    display: block;
    background: #0072B2;
    opacity: 0.55;
    border-radius: 2px 2px 0 0;
  }
  .ib-column.selected .ib-bar {
    opacity: 1;
  }
  .ib-labels {
    display: flex;
    font-size: 12px;
    color: secondary-text-color;
    line-height: 20px;
  }
  .ib-label {
    flex: 1;
    min-width: 0;
    text-align: center;
  }
  .ib-labels.ticks .ib-label {
    text-align: left;
    white-space: nowrap;
    overflow: visible;
  }
  .ib-caption {
    font-size: 14px;
    min-height: 20px;
  }
}
</style>
