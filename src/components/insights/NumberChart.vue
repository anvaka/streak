<template>
  <div class='number-chart' ref='chart'>
    <!-- Every entry as a dot and the trend through them; or a bar per day,
         week or month when the column adds up. All of them are drawn, as
         wide as `visible` days per screen asks, and the chart scrolls
         sideways through the rest; it opens on the latest days. A tap picks
         the closest day, and the card's header reads it out; so does a
         press, held, then a drag. A mouse picks with a press and a drag. -->
    <div class='nc-scroll' ref='scroller' :style='{marginRight: axisWidth + "px"}' @scroll='onScroll'>
      <svg class='nc-plot' ref='plot' :width='contentWidth' :height='height' role='img' :aria-label='description' tabindex='0'
          @pointerdown='onPointerDown' @pointermove='onPointerMove' @pointerup='onPointerUp'
          @pointercancel='onPointerCancel' @keydown='onKeyDown' @contextmenu='onContextMenu'>
        <g class='nc-grid'>
          <line v-for='tick in valueTicks' :key='tick.value' x1='0' :x2='contentWidth' :y1='tick.y' :y2='tick.y'
              :class='{base: tick.base}'></line>
          <template v-for='tick in dateTicks' :key='tick.day'>
            <line :x1='tick.x' :x2='tick.x' :y1='plotBottom' :y2='plotBottom + 4'></line>
            <text class='nc-label' :class='{strong: tick.strong}' :x='tick.labelX' :y='plotBottom + 16'>{{tick.label}}</text>
          </template>
        </g>

        <template v-if='bars'>
          <rect v-for='(bar, i) in drawnBars' :key='bar.day' :x='bar.x' :y='bar.y' :width='bar.width' :height='bar.height'
              class='nc-bar' :class='{selected: i === picked, faded: picked !== null && i !== picked}'></rect>
        </template>
        <template v-else>
          <line v-if='selected' class='nc-rule' :x1='selected.x' :x2='selected.x' :y1='TOP' :y2='plotBottom'></line>
          <circle v-for='(dot, i) in drawnDots' :key='i' :cx='dot.x' :cy='dot.y' :r='dotRadius' class='nc-dot'></circle>
          <polyline v-for='(line, i) in trendLines' :key='"t" + i' :points='line' class='nc-trend'></polyline>
          <template v-if='selected'>
            <circle v-for='(y, i) in selected.ys' :key='"s" + i' :cx='selected.x' :cy='y' r='4' class='nc-dot selected'></circle>
            <circle v-if='selected.trendY !== null' :cx='selected.x' :cy='selected.trendY' r='3.5' class='nc-trend-mark'></circle>
          </template>
          <circle v-else-if='trendEnd' :cx='trendEnd.x' :cy='trendEnd.y' r='3.5' class='nc-trend-end'></circle>
        </template>
      </svg>
    </div>
    <!-- The values are labelled right of the plot, as in Apple Health: the
         latest days, which matter most, stay clear of them. They stay put
         while the days scroll. -->
    <svg class='nc-axis' :width='axisWidth' :height='height' aria-hidden='true'>
      <text v-for='tick in valueTicks' :key='tick.value' class='nc-label' x='6' :y='tick.y + 4'>{{tick.label}}</text>
    </svg>
  </div>
</template>

<script>
import { fromDayNumber } from 'src/lib/insights.js';
import { formatShortDate } from 'src/lib/dateUtils.js';
import { formatNumber, splitAtBreaks } from 'src/lib/numberStats.js';
import { getValueScale, getDateTicks, getLabelWidth } from 'src/lib/chartScale.js';

const TOP = 8;
const DATE_SPACE = 22;
// Room at either end, so a dot on the first or last day isn't cut off.
const EDGE = 4;
const MIN_HEIGHT = 180;
const MAX_HEIGHT = 260;
// A touch held this long without moving picks a day, and dragging then
// moves the pick instead of scrolling.
const HOLD_MS = 350;
// A touch that moves further than this is a swipe, not a tap.
const SLOP = 10;

export default {
  name: 'NumberChart',
  // `entries` and `trend`: [{day, value}]; `bars`: [{day, total}] instead,
  // `unit` naming their length. `first`/`last` are the days drawn, and
  // `visible` how many of them fit on screen at once.
  // Emits `pick` with the picked day - `{day, values, trend}`, or
  // `{day, total}` for a bar - and with null when nothing is picked; and
  // `view` with `{first, last}`, the days on screen, as they scroll.
  props: ['entries', 'trend', 'bars', 'unit', 'first', 'last', 'visible', 'decimals'],
  emits: ['pick', 'view'],
  data() {
    return { width: 320, picked: null, TOP };
  },
  created() {
    // The first day on screen, or null to stay at the latest days. Not
    // reactive: nothing drawn depends on it, so scrolling redraws nothing.
    this.viewFirst = null;
    this.emitted = null;
    this.touch = null;
  },
  mounted() {
    this.measure();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(this.$refs.chart);
    }
    document.addEventListener('pointerdown', this.onPointerDownOutside);
    // Not passive: once a held touch picks a day, its drag mustn't scroll.
    this.$refs.scroller.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.$nextTick(this.placeScroll);
  },
  beforeUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    document.removeEventListener('pointerdown', this.onPointerDownOutside);
    this.$refs.scroller.removeEventListener('touchmove', this.onTouchMove);
    this.endTouch();
  },
  watch: {
    // New days, or a new zoom: back to the latest days.
    first() { this.reset(); },
    last() { this.reset(); },
    visible() { this.reset(); },
    bars() { this.picked = null; },
    // Resized: the same days stay on screen.
    dayWidth() { this.$nextTick(this.placeScroll); },
    pickedItem(item) { this.$emit('pick', item); },
  },
  computed: {
    // About 16:9 on a phone, and not too tall on a wide screen.
    height() {
      return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(this.width * 0.55)));
    },
    plotBottom() {
      return this.height - DATE_SPACE;
    },
    // The scale fits all the days, not just those on screen, so it holds
    // still while they scroll and a value is as high wherever it is.
    scale() {
      if (this.bars) return getValueScale(this.bars.map(bar => bar.total), { fromZero: true });
      return getValueScale(this.entries.map(e => e.value).concat(this.trend.map(p => p.value)));
    },
    axisWidth() {
      const widest = Math.max(...this.scale.ticks.map(v => this.formatTick(v).length));
      return getLabelWidth(widest) - 6;
    },
    days() {
      return this.last - this.first + 1;
    },
    shownDays() {
      return Math.max(1, Math.min(this.days, this.visible || this.days));
    },
    // Each day gets the same width, and its dots are in the middle of it.
    dayWidth() {
      return Math.max(0, this.width - this.axisWidth - 2 * EDGE) / this.shownDays;
    },
    contentWidth() {
      return 2 * EDGE + this.days * this.dayWidth;
    },
    valueTicks() {
      // The line bars stand on, or the bottom of the plot, is drawn darker.
      const base = this.bars ? 0 : this.scale.min;
      return this.scale.ticks.map(value => ({
        value, base: value === base, y: this.getY(value), label: this.formatTick(value)
      }));
    },
    dateTicks() {
      const ticks = getDateTicks(this.first, this.last, this.contentWidth - 2 * EDGE);
      let taken = -Infinity;
      return ticks.map(tick => {
        // A bar starts where its day does.
        const x = this.bars ? this.getX(tick.day - 0.5) : this.getX(tick.day);
        const labelWidth = getLabelWidth(tick.label.length) - 14;
        // Centered under its tick, but kept inside the plot.
        const labelX = Math.max(0, Math.min(this.contentWidth - labelWidth, x - labelWidth / 2));
        return { ...tick, x, labelX, labelWidth };
      }).filter(tick => {
        if (tick.labelX < taken + 6) return false;
        taken = tick.labelX + tick.labelWidth;
        return true;
      });
    },

    // One mark per day with entries: all of its dots and the trend there.
    dayMarks() {
      if (this.bars) return [];
      const trendByDay = new Map(this.trend.map(p => [p.day, p.value]));
      const days = [];
      this.entries.forEach(entry => {
        const last = days[days.length - 1];
        if (last && last.day === entry.day) last.values.push(entry.value);
        else days.push({ day: entry.day, values: [entry.value], trend: trendByDay.has(entry.day) ? trendByDay.get(entry.day) : null });
      });
      return days;
    },
    drawnDots() {
      return this.entries.map(entry => ({ x: this.getX(entry.day), y: this.getY(entry.value) }));
    },
    // Smaller dots when they crowd, so the trend stays on top.
    dotRadius() {
      const perPixel = this.dayMarks.length / Math.max(1, this.contentWidth - 2 * EDGE);
      return perPixel > 0.5 ? 1.5 : perPixel > 0.2 ? 2 : 2.5;
    },
    trendLines() {
      if (!this.trend) return [];
      return splitAtBreaks(this.trend)
        .filter(piece => piece.length > 1)
        .map(piece => piece.map(p => `${this.getX(p.day).toFixed(1)},${this.getY(p.value).toFixed(1)}`).join(' '));
    },
    trendEnd() {
      const end = this.trend && this.trend[this.trend.length - 1];
      return end ? { x: this.getX(end.day), y: this.getY(end.value) } : null;
    },

    // A bar is as wide as its days, cut to the days drawn: the first week
    // or month may start before them, and months differ in length.
    drawnBars() {
      const { bars } = this;
      const left = this.getX(this.first - 0.5);
      const right = this.getX(this.last + 0.5);
      // From zero, up or down: a total can be negative.
      const zero = this.getY(0);
      return bars.map((bar, i) => {
        const start = Math.max(left, this.getX(bar.day - 0.5));
        const end = Math.min(right, i + 1 < bars.length ? this.getX(bars[i + 1].day - 0.5) : right);
        const gap = Math.min(2, (end - start) / 4);
        const y = this.getY(bar.total);
        return {
          day: bar.day,
          x: start + gap / 2,
          y: Math.min(y, zero),
          width: Math.max(1, end - start - gap),
          height: Math.max(bar.total ? 1 : 0, Math.abs(zero - y)),
        };
      });
    },

    marks() {
      return this.bars ? this.bars : this.dayMarks;
    },
    // Where each mark is along the days, to pick the closest one.
    centers() {
      return this.bars ?
        this.drawnBars.map(bar => bar.x + bar.width / 2) :
        this.dayMarks.map(day => this.getX(day.day));
    },
    pickedItem() {
      if (this.picked === null || this.picked >= this.marks.length) return null;
      return this.marks[this.picked];
    },
    selected() {
      const item = this.pickedItem;
      if (!item || this.bars) return null;
      return {
        x: this.getX(item.day),
        ys: item.values.map(value => this.getY(value)),
        trendY: item.trend === null ? null : this.getY(item.trend),
      };
    },
    description() {
      const span = `${this.formatDay(this.first)} to ${this.formatDay(this.last)}`;
      const scroll = this.shownDays < this.days ?
        ` The latest ${this.shownDays} days are on screen; scroll sideways for the rest.` : '';
      const { ticks } = this.scale;
      if (this.bars) {
        return `Totals per ${this.unit}, ${span}.${scroll} Tap the chart, or use the arrow keys, to read each ${this.unit}.`;
      }
      const values = this.entries.map(e => e.value);
      return `${this.entries.length} entries from ${span}, between ${formatNumber(Math.min(...values), this.decimals)} ` +
        `and ${formatNumber(Math.max(...values), this.decimals)}; the scale runs from ${this.formatTick(ticks[0])} ` +
        `to ${this.formatTick(ticks[ticks.length - 1])}.${scroll} Tap the chart, or use the arrow keys, to read each day.`;
    },
  },
  methods: {
    measure() {
      const width = this.$refs.chart && this.$refs.chart.clientWidth;
      if (width) this.width = width;
    },
    getX(day) {
      return EDGE + (day - this.first + 0.5) * this.dayWidth;
    },
    getY(value) {
      const { min, max } = this.scale;
      return TOP + (1 - (value - min) / (max - min)) * (this.plotBottom - TOP);
    },

    reset() {
      this.picked = null;
      this.viewFirst = null;
      this.$nextTick(this.placeScroll);
    },
    // The first day that can be on screen while the last one is.
    latestFirst() {
      return this.last - this.shownDays + 1;
    },
    // Scrolls to `viewFirst`, or to the latest days.
    placeScroll() {
      const { scroller } = this.$refs;
      if (!scroller) return;
      const first = this.viewFirst === null ? this.latestFirst() : Math.min(this.viewFirst, this.latestFirst());
      scroller.scrollLeft = (first - this.first) * this.dayWidth;
      this.updateView(first);
    },
    onScroll() {
      if (this.scrollFrame) return;
      const next = typeof requestAnimationFrame === 'undefined' ? fn => fn() : requestAnimationFrame;
      this.scrollFrame = true;
      next(() => {
        this.scrollFrame = false;
        const { scroller } = this.$refs;
        if (!scroller || !this.dayWidth) return;
        const first = Math.max(this.first, Math.min(this.latestFirst(),
          this.first + Math.round(scroller.scrollLeft / this.dayWidth)));
        this.viewFirst = first === this.latestFirst() ? null : first;
        this.updateView(first);
      });
    },
    updateView(first) {
      const last = first + this.shownDays - 1;
      if (this.emitted && this.emitted.first === first && this.emitted.last === last) return;
      this.emitted = { first, last };
      this.$emit('view', this.emitted);
    },
    // Scrolls just enough to show the picked mark.
    showPicked() {
      const { scroller } = this.$refs;
      if (!scroller || this.picked === null) return;
      const x = this.centers[this.picked];
      const room = Math.min(20, scroller.clientWidth / 4);
      if (x < scroller.scrollLeft + room) scroller.scrollLeft = x - room;
      else if (x > scroller.scrollLeft + scroller.clientWidth - room) scroller.scrollLeft = x - scroller.clientWidth + room;
    },

    // A mouse picks on press and moves the pick while dragging. A finger
    // scrolls: a tap picks, and so does a press held still, after which
    // the drag moves the pick.
    onPointerDown(e) {
      if (e.button) return;
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        this.endTouch();
        this.touch = {
          id: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, scrubbing: false,
          timer: setTimeout(() => this.startScrub(), HOLD_MS),
        };
        return;
      }
      this.pickedBefore = this.picked;
      this.dragging = true;
      if (e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {
          // Only a nicety: dragging off the chart stops moving the pick.
        }
      }
      this.pickAt(e.clientX);
    },
    onPointerMove(e) {
      const { touch } = this;
      if (touch && touch.id === e.pointerId) {
        touch.x = e.clientX;
        if (touch.scrubbing) this.pickAt(e.clientX);
        else if (movedFar(touch, e)) this.endTouch();
        return;
      }
      if (this.dragging) this.pickAt(e.clientX);
    },
    onPointerUp(e) {
      const { touch } = this;
      if (touch && touch.id === e.pointerId) {
        if (!touch.scrubbing && !movedFar(touch, e)) this.pickAt(e.clientX);
        this.endTouch();
        return;
      }
      this.dragging = false;
    },
    // The browser took the pointer over to scroll: a touch was a swipe, and
    // a mouse press gives back the earlier pick.
    onPointerCancel(e) {
      const { touch } = this;
      if (touch && touch.id === e.pointerId) {
        this.endTouch();
        return;
      }
      if (this.dragging) this.picked = this.pickedBefore;
      this.dragging = false;
    },
    startScrub() {
      if (!this.touch) return;
      this.touch.scrubbing = true;
      this.pickAt(this.touch.x);
    },
    endTouch() {
      if (this.touch) clearTimeout(this.touch.timer);
      this.touch = null;
    },
    onTouchMove(e) {
      if (this.touch && this.touch.scrubbing && e.cancelable) e.preventDefault();
    },
    // A long press would otherwise bring up a menu.
    onContextMenu(e) {
      if (this.touch) e.preventDefault();
    },
    onPointerDownOutside(e) {
      if (this.$refs.chart && !this.$refs.chart.contains(e.target)) this.picked = null;
    },
    onKeyDown(e) {
      const count = this.marks.length;
      if (!count) return;
      let next;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Nothing picked: start from the latest day on screen.
        if (this.picked === null) next = this.lastOnScreen();
        else next = Math.max(0, Math.min(count - 1, this.picked + (e.key === 'ArrowLeft' ? -1 : 1)));
      } else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = count - 1;
      else if (e.key === 'Escape') next = null;
      else return;
      e.preventDefault();
      this.picked = next;
      this.showPicked();
    },
    lastOnScreen() {
      const last = this.emitted ? this.emitted.last : this.last;
      let i = this.marks.length - 1;
      while (i > 0 && this.marks[i].day > last) i -= 1;
      return i;
    },
    // The mark closest to `clientX` along the days only.
    pickAt(clientX) {
      const x = clientX - this.$refs.plot.getBoundingClientRect().left;
      const { centers } = this;
      // The centers go left to right: find the first one past `x`.
      let low = 0;
      let high = centers.length;
      while (low < high) {
        const middle = (low + high) >> 1;
        if (centers[middle] < x) low = middle + 1;
        else high = middle;
      }
      if (low === centers.length) low -= 1;
      if (low > 0 && x - centers[low - 1] <= centers[low] - x) low -= 1;
      this.picked = centers.length ? low : null;
    },

    formatTick(value) {
      return formatNumber(value, this.scale.decimals);
    },
    formatDay(day) {
      return formatShortDate(fromDayNumber(day));
    },
  },
};

function movedFar(touch, e) {
  return Math.abs(e.clientX - touch.startX) > SLOP || Math.abs(e.clientY - touch.startY) > SLOP;
}
</script>

<style lang='stylus'>
@import '../../styles/variables.styl';

.number-chart {
  position: relative;
  .nc-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
  }
  svg {
    display: block;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  .nc-plot {
    cursor: crosshair;
    touch-action: manipulation;
  }
  .nc-plot:focus-visible {
    outline: 2px solid #0072B2;
    outline-offset: -2px;
  }
  .nc-axis {
    position: absolute;
    top: 0;
    right: 0;
  }
  .nc-grid line {
    stroke: rgb(234, 236, 239);
  }
  .nc-grid line.base {
    stroke: strong-border-color;
  }
  .nc-label {
    font-size: 12px;
    fill: secondary-text-color;
  }
  .nc-label.strong {
    font-weight: bold;
    fill: base-text-color;
  }
  .nc-rule {
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 1;
  }
  .nc-dot {
    fill: rgba(0, 114, 178, 0.35);
  }
  .nc-dot.selected {
    fill: #0072B2;
    stroke: white;
    stroke-width: 1.5;
  }
  .nc-trend {
    fill: none;
    stroke: #0072B2;
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .nc-trend-end {
    fill: #0072B2;
  }
  .nc-trend-mark {
    fill: white;
    stroke: #0072B2;
    stroke-width: 2;
  }
  .nc-bar {
    fill: #0072B2;
    opacity: 0.7;
  }
  .nc-bar.selected {
    opacity: 1;
  }
  .nc-bar.faded {
    opacity: 0.35;
  }
}
</style>
