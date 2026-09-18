<template>
<div>
  <div class='contributions-wall'>
    <div class='dow-container'>
      <div v-for='dow in daysOfTheWeek' :style='{"top": dow.y + "px"}' class='dow'>{{dow.name}}</div>
    </div>
    <div class='days-container'>
      <svg width='676' height='104' ref='contributions' :class='{"has-range-filter": hasRangeFilter}'>
        <g v-for='week in wall.weeks' :transform='getWeekTransform(week)'>
          <rect v-for='day in week.days' :fill='day.fill' width='10' height='10' x='0' :y='getDayYPosition(day)' :title='day.day' class='contribution-day' :data-day='day.tooltip' @click='onDayClick($event, day)'></rect>
        </g>
        <text v-for='month in wall.months' :x='month.x' font-size='9' y='12'>{{month.name}}</text>
      </svg>
    </div>
  </div>
  <div v-if='tooltipText' class='cw-tooltip' :style='tooltipStyle'>{{tooltipText}}</div>
</div>
</template>

<script>
import { getDateString, formatDowDate } from 'src/lib/dateUtils.js';

import { makeColorBag } from 'src/lib/color';

const DAY_HEIGHT = 12;
const DAY_WIDTH = 12;
const DAY_OF_THE_WEEK_LENGTH = 0;
const MONTH_NAMES_HEIGHT = 18;
const MAX_WEEKS_TO_SHOW = 52;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colorBag = makeColorBag();

export default {
  name: 'ContributionsWall',
  props: ['dates', 'settings'],
  data() {
    return {
      tooltipText: '',
      tooltipStyle: {},
      daysOfTheWeek: [{
        name: 'Mon',
        y: getDayOfTheYOffset(1)
      }, {
        name: 'Wed',
        y: getDayOfTheYOffset(3)
      }, {
        name: 'Fri',
        y: getDayOfTheYOffset(5)
      }]
    };
  },
  computed: {
    wall() {
      return buildWall(this.dates);
    },
    hasRangeFilter() {
      return this.$route.query.from;
    },
    showStreakStats() {
      return this.settings && this.settings.showStreakStats;
    }
  },
  mounted() {
    const svg = this.$refs.contributions;
    this.mouseEnterHandler = this.mouseEnter.bind(this);
    this.mouseLeaveHandler = this.mouseLeave.bind(this);
    svg.addEventListener('mouseenter', this.mouseEnterHandler, true);
    svg.addEventListener('mouseleave', this.mouseLeaveHandler, true);
    scrollToTheEnd(svg);
  },

  beforeUnmount() {
    const svg = this.$refs.contributions;
    svg.removeEventListener('mouseenter', this.mouseEnterHandler, true);
    svg.removeEventListener('mouseleave', this.mouseLeaveHandler, true);
  },
  methods: {
    onDayClick(e, day) {
      let from = day.dayKey;
      let to = from;
      if (e.shiftKey) {
        to = from;
        from = this.$route.query.from || from;
        e.preventDefault();
      }
      this.$emit('filter', from, to);
    },
    getWeekTransform(week) {
      const xOffset = week.index * DAY_WIDTH + DAY_OF_THE_WEEK_LENGTH;
      return `translate(${xOffset}, ${MONTH_NAMES_HEIGHT})`;
    },
    getDayYPosition(day) {
      const y = day.dayNumber * DAY_HEIGHT;
      return y;
    },
    mouseEnter(e) {
      const dayDom = e.target;
      if (!dayDom.classList.contains('contribution-day')) {
        return;
      }
      const content = dayDom.getAttribute('data-day');
      if (!content) return;
      const rect = dayDom.getBoundingClientRect();
      this.tooltipText = content;
      this.tooltipStyle = {
        left: rect.left + rect.width / 2 + 'px',
        top: rect.top - 4 + 'px',
      };
    },
    mouseLeave() {
      this.tooltipText = '';
    }
  }
};

function scrollToTheEnd(svg) {
  svg.parentElement.scrollLeft = 600;
}

function buildWall(dates) {
  const weeks = [];
  const today = new Date();
  const sunday = getSunday(today);

  const thisWeek = buildWeekDays(sunday, dates).filter(removeFutureDays);

  weeks.push({
    index: MAX_WEEKS_TO_SHOW,
    days: thisWeek
  });

  for (let i = MAX_WEEKS_TO_SHOW - 1; i > -1; --i) {
    sunday.setDate(sunday.getDate() - 7);
    const days = buildWeekDays(sunday, dates);

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
      x: (month.weekIndex - 0.5) * DAY_WIDTH
    })).filter((month, index, array) => {
      if (month.x <= DAY_OF_THE_WEEK_LENGTH) return false;
      if (index < array.length - 1) {
        return month.x - array[index + 1].x > 30;
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

function buildWeekDays(sunday, dates) {
  const weekDays = [];
  for (let i = 0; i < 7; ++i) {
    const day = new Date(sunday);
    day.setDate(day.getDate() + i);
    const dayKey = getDateString(day);

    weekDays.push({
      day,
      dayKey,
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


function getDayOfTheYOffset(dayIndex) {
  return dayIndex * DAY_HEIGHT + MONTH_NAMES_HEIGHT;
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
