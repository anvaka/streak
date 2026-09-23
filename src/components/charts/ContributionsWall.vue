<template>
<div>
  <div class='contributions-wall'>
    <div class='dow-container' :style='{"width": layout.dowWidth + "px"}'>
      <div v-for='dow in daysOfTheWeek' :key='dow.name' :style='{"top": dow.y + "px", "line-height": layout.cell + "px", "font-size": layout.fontSize + "px"}' class='dow'>{{dow.name}}</div>
    </div>
    <div class='days-container'>
      <!-- Taps are resolved from coordinates on the whole svg (see dayAt) rather
           than per-rect listeners, so the gaps between squares count too and a
           slightly-off finger still lands on the nearest day. -->
      <svg :width='layout.width' :height='layout.height' ref='contributions'
           :class='{"has-range-filter": hasRangeFilter}'
           @click='onClick' @pointermove='onPointerMove' @pointerleave='hideTooltip'>
        <g v-for='week in wall.weeks' :key='week.index' :transform='getWeekTransform(week)'>
          <rect v-for='day in week.days' :key='day.dayNumber' :fill='day.fill' :width='layout.cell' :height='layout.cell' x='0' :y='day.dayNumber * layout.pitch'
            class='contribution-day' :class='{"is-selected": isSelected(day)}'></rect>
        </g>
        <text v-for='month in wall.months' :key='month.x' :x='month.x' :font-size='layout.fontSize' :y='layout.monthHeight - 6'>{{month.name}}</text>
      </svg>
    </div>
  </div>
  <div v-if='tooltipText' class='cw-tooltip' :style='tooltipStyle'>{{tooltipText}}</div>
</div>
</template>

<script>
import { getDateString, formatDowDate, getDateFromFilterString } from 'src/lib/dateUtils.js';

import { makeColorBag } from 'src/lib/color';

const MAX_WEEKS_TO_SHOW = 52;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Month labels closer together than this would overlap, so the earlier one is dropped.
const MIN_MONTH_LABEL_SPACING = 30;
const colorBag = makeColorBag();

// `cell` is the drawn square, `pitch` the distance between neighbouring squares.
// A 10px square is fine under a mouse but far below a fingertip, so touch
// screens get squares big enough to aim at. The wall is wider than a phone
// either way; it scrolls sideways and starts at the most recent week.
const MOUSE_LAYOUT = { cell: 10, pitch: 12, monthHeight: 18, fontSize: 9, dowWidth: 25 };
const TOUCH_LAYOUT = { cell: 18, pitch: 21, monthHeight: 22, fontSize: 11, dowWidth: 30 };
const COARSE_POINTER = '(pointer: coarse)';

export default {
  name: 'ContributionsWall',
  props: ['dates', 'settings'],
  data() {
    return {
      tooltipText: '',
      tooltipStyle: {},
      isTouch: matchesMedia(COARSE_POINTER),
    };
  },
  computed: {
    layout() {
      const base = this.isTouch ? TOUCH_LAYOUT : MOUSE_LAYOUT;
      return {
        ...base,
        // One column per week plus the current one, and room on the right so
        // the last month label is not clipped.
        width: (MAX_WEEKS_TO_SHOW + 1) * base.pitch + 40,
        height: base.monthHeight + 7 * base.pitch + 2,
      };
    },
    daysOfTheWeek() {
      const { monthHeight, pitch } = this.layout;
      return [1, 3, 5].map(dayIndex => ({
        name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex],
        y: dayIndex * pitch + monthHeight
      }));
    },
    wall() {
      return buildWall(this.dates, this.layout.pitch);
    },
    hasRangeFilter() {
      return this.$route.query.from;
    },
    selection() {
      const { from, to } = this.$route.query;
      if (!from) return null;
      const start = getDateFromFilterString(from).getTime();
      const end = to ? getDateFromFilterString(to).getTime() : start;
      return { min: Math.min(start, end), max: Math.max(start, end) };
    },
    showStreakStats() {
      return this.settings && this.settings.showStreakStats;
    }
  },
  mounted() {
    if (typeof window.matchMedia === 'function') {
      this.pointerQuery = window.matchMedia(COARSE_POINTER);
      this.onPointerQueryChange = e => { this.isTouch = e.matches; };
      this.pointerQuery.addEventListener('change', this.onPointerQueryChange);
    }
    scrollToTheEnd(this.$refs.contributions);
  },

  beforeUnmount() {
    if (this.pointerQuery) {
      this.pointerQuery.removeEventListener('change', this.onPointerQueryChange);
    }
  },
  methods: {
    onClick(e) {
      const day = this.dayAt(e);
      if (!day) return;
      let from = day.dayKey;
      let to = from;
      if (e.shiftKey) {
        to = from;
        from = this.$route.query.from || from;
        e.preventDefault();
      }
      this.hideTooltip();
      this.$emit('filter', from, to);
    },
    onPointerMove(e) {
      // A tap also produces pointer events, and a tooltip opened by one would
      // have no pointerleave to close it. On touch the selection outline and
      // the date under the chart say which day was picked instead.
      if (e.pointerType !== 'mouse') return;
      const day = this.dayAt(e);
      if (!day) {
        this.hideTooltip();
        return;
      }
      const svgRect = this.$refs.contributions.getBoundingClientRect();
      const { cell, pitch, monthHeight } = this.layout;
      this.tooltipText = day.tooltip;
      this.tooltipStyle = {
        left: svgRect.left + day.weekIndex * pitch + cell / 2 + 'px',
        top: svgRect.top + monthHeight + day.dayNumber * pitch - 4 + 'px',
      };
    },
    hideTooltip() {
      this.tooltipText = '';
    },
    /**
     * The day closest to the pointer, or undefined when the pointer is clearly
     * off the grid (in the month labels, past the current week, or on a day
     * that has not happened yet). Snapping to the nearest square centre means
     * the gaps between squares belong to a day instead of swallowing the tap.
     */
    dayAt(e) {
      const svgRect = this.$refs.contributions.getBoundingClientRect();
      const { cell, pitch, monthHeight } = this.layout;
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top - monthHeight;
      const weekIndex = Math.round((x - cell / 2) / pitch);
      const dayNumber = Math.round((y - cell / 2) / pitch);
      if (weekIndex < 0 || weekIndex > MAX_WEEKS_TO_SHOW) return;
      if (dayNumber < 0 || dayNumber > 6) return;

      const week = this.wall.weeks.find(w => w.index === weekIndex);
      return week && week.days.find(d => d.dayNumber === dayNumber);
    },
    isSelected(day) {
      const s = this.selection;
      return !!s && day.time >= s.min && day.time <= s.max;
    },
    getWeekTransform(week) {
      const xOffset = week.index * this.layout.pitch;
      return `translate(${xOffset}, ${this.layout.monthHeight})`;
    },
  }
};

function matchesMedia(query) {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches;
}

function scrollToTheEnd(svg) {
  // The most recent weeks are on the right, and they are the ones people tap.
  svg.parentElement.scrollLeft = svg.parentElement.scrollWidth;
}

function buildWall(dates, pitch) {
  const weeks = [];
  const today = new Date();
  const sunday = getSunday(today);

  const thisWeek = buildWeekDays(sunday, dates, MAX_WEEKS_TO_SHOW).filter(removeFutureDays);

  weeks.push({
    index: MAX_WEEKS_TO_SHOW,
    days: thisWeek
  });

  for (let i = MAX_WEEKS_TO_SHOW - 1; i > -1; --i) {
    sunday.setDate(sunday.getDate() - 7);
    const days = buildWeekDays(sunday, dates, i);

    weeks.push({
      index: i,
      days
    });
  }

  const months = getMonths(weeks);

  return {
    weeks,
    months
  };

  function removeFutureDays(day) {
    return today >= day.day;
  }

  function getMonths(weeks) {
    let lastMonth = -1;
    const months = [];

    weeks.forEach(week => {
      const firstDayMonth = week.days[0].day.getMonth();
      if (firstDayMonth !== lastMonth) {
        lastMonth = firstDayMonth;
        months.push({
          name: MONTH_NAMES[lastMonth],
          weekIndex: week.index
        });
      }
    });

    return months.map(month => ({
      name: month.name,
      x: (month.weekIndex - 0.5) * pitch
    })).filter((month, index, array) => {
      if (month.x <= 0) return false;
      if (index < array.length - 1) {
        return month.x - array[index + 1].x > MIN_MONTH_LABEL_SPACING;
      }
      return true;
    });
  }
}

function getSunday(day) {
  const sunday = new Date(day);
  sunday.setDate(day.getDate() - day.getDay());
  return sunday;
}

function buildWeekDays(sunday, dates, weekIndex) {
  const weekDays = [];
  for (let i = 0; i < 7; ++i) {
    const day = new Date(sunday);
    day.setDate(day.getDate() + i);
    const dayKey = getDateString(day);

    weekDays.push({
      day,
      dayKey,
      // Midnight, so it compares cleanly against the filter's from/to dates.
      time: new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime(),
      weekIndex,
      tooltip: formatDowDate(day),
      dayNumber: i,
      fill: getFillForDate(dayKey, dates)
    });
  }

  return weekDays;
}

function getFillForDate(dayKey, contributionsByDay) {
  const contributions = contributionsByDay && contributionsByDay[dayKey];

  if (!contributions) {
    return 'rgb(235, 237, 240)';
  }

  const hsl = colorBag.getColor(contributions.groupKey);

  const h = Math.round(hsl[0] * 360);
  const s = Math.round(hsl[1] * 100);
  const l = Math.round((hsl[2] + 0.25 * (1 - contributions.scaledValue)) * 100);

  return `hsl(${h}, ${s}%, ${l}%)`;
}

</script>

<style lang='stylus'>
.contributions-wall {
  user-select: none;
  display: flex;
  .dow-container {
    position: relative;
    width: 25px;
    background: white;
    .dow {
      font-size: 9px;
      position: absolute;
    }
  }
  .days-container {
    overflow-x: auto;
    flex: 1;
  }
  svg {
    cursor: pointer;
    // No 300ms double-tap-to-zoom wait before a tap registers.
    touch-action: pan-x pan-y;
  }
  .has-range-filter .contribution-day:not(.is-selected) {
    opacity: 0.35;
  }
  .contribution-day.is-selected {
    stroke: rgba(0, 0, 0, 0.7);
    stroke-width: 1.5;
  }
}

.cw-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
}
</style>
