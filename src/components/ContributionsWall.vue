<template>
  <div class='contributions-wall'>
    <svg width='676' height='104' ref='contributions'>
      <g v-for='week in weeks' :transform='getWeekTransform(week)'>
        <rect v-for='day in week.days' :fill='day.fill' width='10' height='10' x='0' :y='getDayYPosition(day)'
              :title='day.day' class='contribution-day' :data-day='day.tooltip'></rect>
      </g>
    </svg>
  </div>
</template>

<script>
import moment from 'moment';
import { getDateString } from 'src/lib/dateUtils.js';
import Tooltip from 'tether-tooltip';

export default {
  name: 'ContributionsWall',
  props: ['project'],
  computed: {
    weeks() {
      return buildWeeks(this.project);
    }
  },
  mounted() {
    const svg = this.$refs.contributions;
    this.mouseEnterHandler = this.mouseEnter.bind(this);
    svg.addEventListener('mouseenter', this.mouseEnterHandler, true);
  },

  beforeDestroy() {
    const svg = this.$refs.contributions;
    svg.removeEventListener('mouseenter', this.mouseEnterHandler, true);
    if (this.tooltip) {
      this.tooltip.destroy();
    }
  },
  methods: {
    getWeekTransform(week) {
      const xOffset = week.index * 13;
      return `translate(${xOffset}, 0)`;
    },
    getDayYPosition(day) {
      const y = day.dayNumber * 12;
      return y;
    },
    mouseEnter(e) {
      const dayDom = e.target;
      if (!dayDom.classList.contains('contribution-day')) {
        return;
      }
      if (this.tooltip) {
        this.tooltip.destroy();
      }
      this.tooltip = new Tooltip({
        target: dayDom,
        content: dayDom.getAttribute('data-day'),
        classes: 'ui-tooltip--theme-default',
      });
      this.tooltip.open();
    }
  }
};

function buildWeeks(project) {
  const weeks = [];
  const today = new Date();
  const sunday = getSunday(today);

  const thisWeek = buildWeekDays(sunday, project).filter(removeFutureDays);

  weeks.push({
    index: 51,
    days: thisWeek
  });

  for (let i = 50; i > -1; --i) {
    sunday.setDate(sunday.getDate() - 7);

    weeks.push({
      index: i,
      days: buildWeekDays(sunday, project)
    });
  }

  return weeks;

  function removeFutureDays(day) {
    return today >= day.day;
  }
}


function getSunday(day) {
  const sunday = new Date(day);
  sunday.setDate(day.getDate() - day.getDay());
  return sunday;
}

function buildWeekDays(sunday, project) {
  const weekDays = [];
  for (let i = 0; i < 7; ++i) {
    const day = new Date(sunday);
    day.setDate(day.getDate() + i);

    weekDays.push({
      day,
      tooltip: moment(day).format('LL'),
      dayNumber: i,
      fill: getFillForDate(day, project)
    });
  }

  return weekDays;
}

function getFillForDate(day, project) {
  const { projectHistory } = project;
  if (!projectHistory) {
    return '#eee';
  }
  const dayKey = getDateString(day);
  const contributions = projectHistory.contributionsByDay[dayKey];
  if (contributions) {
    return '#d6e685';
  }

  return '#ddd';
}
</script>
