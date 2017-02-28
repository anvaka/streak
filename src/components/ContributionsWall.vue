<template>
  <div class='contributions-wall'>
    <svg width='676' height='104'>
      <g v-for='week in weeks' :transform='getWeekTransform(week)'>
        <rect v-for='day in week.days' :fill='day.fill' width='10' height='10' x='0' :y='getDayYPosition(day)'
              :title='day.day'></rect>
      </g>
    </svg>
  </div>
</template>

<script>
export default {
  name: 'ContributionsWall',
  props: ['project'],
  data() {
    return {
      weeks: buildWeeks(this.project)
    };
  },
  methods: {
    getWeekTransform(week) {
      const xOffset = week.index * 13;
      return `translate(${xOffset}, 0)`;
    },
    getDayYPosition(day) {
      const y = day.dayNumber * 12;
      return y;
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
  // TODO: Move to shared module
  const dayKey = day.toISOString().substring(0, '2017-02-27'.length);
  const contributions = projectHistory.contributionsByDay[dayKey];
  if (contributions) {
    return '#d6e685';
  }

  return '#ddd';
}
</script>
