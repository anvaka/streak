<template>
  <div class='project-insights' v-if='project && project.projectHistory'>
    <selected-filters :from='$route.query.from' :to='$route.query.to' :project-id='project.id'></selected-filters>
    <value-chips v-if='palette.legend.length > 1' :legend='palette.legend' :dates='daysInFilter' :focus='focus'></value-chips>

    <p v-if='!insights' class='vertical-padding secondary'>{{emptyMessage}}</p>
    <template v-else>
      <!-- The numbers themselves first: for a weight log they are the point. -->
      <number-card v-for='column in project.projectHistory.numberColumns' :key='column.columnIndex'
          :project='project' :column='column' :contributions='days' :note='quoted'></number-card>

      <div class='insight-tiles'>
        <section class='insight-tile'>
          <h3>{{insights.recent.title}}</h3>
          <div class='insight-number'>{{insights.recent.count}} <span class='insight-unit'>of {{formatDays(insights.recent.days)}} with {{focus === undefined ? 'a record' : quoted}}</span></div>
          <div class='secondary small' v-if='insights.recent.previousCount !== null'>{{insights.recent.previousCount}} in the {{formatDays(insights.recent.days)}} before</div>
        </section>
        <section class='insight-tile'>
          <h3>Habit strength <span v-if='focus !== undefined' class='secondary'>{{quoted}}</span></h3>
          <div class='insight-number'>{{percent(insights.strength.score)}}</div>
          <svg v-if='sparkline' class='insight-sparkline' :viewBox='sparkline.viewBox' preserveAspectRatio='none' aria-hidden='true'>
            <polyline :points='sparkline.points'></polyline>
          </svg>
          <div class='secondary small'>{{strengthTarget}}</div>
        </section>
      </div>

      <ul v-if='insights.sentences.length' class='insight-sentences'>
        <li v-for='sentence in insights.sentences' :key='sentence'>{{sentence}}</li>
      </ul>

      <!-- Each value on its own row, on a common scale; a row focuses on it. -->
      <section v-if='valueRows.length > 1' class='insight-card'>
        <h3>{{project.projectHistory.facet.title}} <span class='secondary'>{{scopeNote}}</span></h3>
        <router-link v-for='row in valueRows' :key='row.label' :to='row.link' class='insight-value' replace>
          <span class='iv-name'><span class='vc-dot' :style='{background: row.color}'></span>{{row.label}}</span>
          <span class='iv-bar'><span :style='{width: row.width, background: row.color}'></span></span>
          <span class='iv-numbers'>{{row.summary}}</span>
        </router-link>
      </section>

      <section v-if='insights.weekdays.enough' class='insight-card'>
        <h3>Days of the week <span class='secondary'>{{scopeNote}}</span></h3>
        <insight-bars :bars='weekdayBars' :max='1'></insight-bars>
      </section>

      <section v-if='insights.hours.enough' class='insight-card'>
        <h3>Time of day <span class='secondary'>{{scopeNote}}</span></h3>
        <insight-bars :bars='hourBars' :ticks='true'></insight-bars>
      </section>

      <section class='insight-card'>
        <h3>Consistency <span class='secondary'>{{scopeNote}}</span></h3>
        <dl class='insight-facts'>
          <template v-for='fact in facts' :key='fact.name'>
            <dt>{{fact.name}}</dt>
            <dd>{{fact.value}}<template v-if='fact.range'>, <router-link class='insight-range' :to='getRangeLink(fact.range)'>{{formatRange(fact.range)}}</router-link></template></dd>
          </template>
        </dl>
      </section>

      <p v-if='pending.length' class='secondary small'>Not enough records yet for {{pending.join(' or ')}}.</p>
    </template>
  </div>
</template>

<script>
import SelectedFilters from '../SelectedFilters.vue';
import ValueChips from '../ValueChips.vue';
import InsightBars from './InsightBars.vue';
import NumberCard from './NumberCard.vue';
import { assignCategoryColors } from 'src/lib/color.js';
import { getFocus, keepFocus, focusContributions, daysBetween } from 'src/lib/facet.js';
import { MONTH_NAMES, WEEKDAY_NAMES as WEEKDAYS, formatDateOnly, getDateString } from 'src/lib/dateUtils.js';
import {
  getInsights, getDayCounts, formatDays, formatHour, percent,
  MIN_WEEKS_FOR_CHART, MIN_TIMED_FOR_CHART, MIN_GAPS
} from 'src/lib/insights.js';
import now from 'src/lib/today.js';

export default {
  name: 'ProjectInsights',
  props: ['project'],
  components: {
    SelectedFilters,
    ValueChips,
    InsightBars,
    NumberCard,
  },
  computed: {
    allDays() {
      return this.project.projectHistory.contributionsByDay;
    },
    // The chips count the days in the date filter, as everything below does.
    daysInFilter() {
      const { from, to } = this.$route.query;
      return daysBetween(this.allDays, from, to);
    },
    palette() {
      return assignCategoryColors(this.project.projectHistory.categories || []);
    },
    focus() {
      return getFocus(this.$route.query);
    },
    quoted() {
      return this.focus === undefined ? '' : `\u201c${this.focus}\u201d`;
    },
    // The days, holding only their records with the focused value.
    days() {
      const { facet } = this.project.projectHistory;
      return focusContributions(this.allDays, facet, this.focus);
    },
    // All records, whatever their value.
    allInsights() {
      const { from, to } = this.$route.query;
      return getInsights(this.allDays, { from, to }, now());
    },
    // A value in focus is measured against how often anything is recorded:
    // "Yes" on 5 of the 7 days you log is 5 of 7, not a perfect "Yes" pace.
    insights() {
      if (this.focus === undefined) return this.allInsights;
      const { from, to } = this.$route.query;
      const target = this.allInsights && this.allInsights.strength.target;
      return getInsights(this.days, { from, to, focus: this.focus, target }, now());
    },
    valueRows() {
      if (this.focus !== undefined || !this.project.projectHistory.facet) return [];
      const { from, to } = this.$route.query;
      const logged = this.allInsights.consistency.activeDays;
      const rows = this.palette.legend
        .filter(entry => typeof entry.value === 'string')
        .map(entry => {
          const days = focusContributions(this.allDays, this.project.projectHistory.facet, entry.value);
          const c = getDayCounts(days, { from, to }, now());
          const count = c ? c.activeDays : 0;
          const streaks = c ? [
            c.current ? `${c.current} now` : null,
            `${c.longest} best`,
          ].filter(Boolean).join(', ') : '';
          return {
            label: entry.label,
            color: entry.color,
            count,
            link: { name: this.$route.name, params: this.$route.params,
              query: Object.assign({}, this.$route.query, { focus: entry.value }) },
            summary: `${formatDays(count)} (${percent(count / logged)})` + (streaks ? `, streak ${streaks}` : ''),
          };
        });
      const most = Math.max(...rows.map(row => row.count)) || 1;
      rows.forEach(row => { row.width = (100 * row.count / most).toFixed(1) + '%'; });
      return rows;
    },
    emptyMessage() {
      const what = this.focus === undefined ? 'Nothing was' : `Nothing with ${this.quoted} was`;
      if (this.$route.query.from) return `${what} recorded in this period.`;
      if (this.focus !== undefined) return `${what} recorded yet.`;
      return 'There are no records yet. Insights appear here as you add them.';
    },
    // Card titles say what they cover: the focused value, and the days unless
    // a filter already says so above them.
    scopeNote() {
      const { scope } = this.insights;
      return [this.quoted, scope.isAllTime ? 'since ' + formatDateOnly(scope.first) : '']
        .filter(Boolean).join(', ');
    },
    strengthTarget() {
      const { target, isYoung } = this.insights.strength;
      const days = target === 7 ? 'every day' : `${target} ${target === 1 ? 'day' : 'days'} a week`;
      const pace = this.focus === undefined ? (target === 7 ? days : `your usual ${days}`) :
        `how often you record (${days})`;
      // The score starts at zero, so a new habit's is low however well it goes.
      if (isYoung) return `Starts low and builds up over weeks of ${pace}`;
      return `Measured against ${pace}`;
    },
    sparkline() {
      const { series } = this.insights.strength;
      if (series.length < 14) return null;
      // Drawn in a box of one unit per day and 100 per score, stretched to fit.
      return {
        viewBox: `0 0 ${series.length - 1} 100`,
        points: series.map((score, i) => `${i},${(100 - score * 100).toFixed(1)}`).join(' '),
      };
    },
    weekdayBars() {
      const { rates, counts, totals } = this.insights.weekdays;
      return rates.map((rate, i) => ({
        value: rate,
        label: WEEKDAYS[i].slice(0, 3),
        caption: `${WEEKDAYS[i]}s: ${counts[i]} of ${totals[i]} had ` +
          `${this.focus === undefined ? 'a record' : this.quoted} (${percent(rate)})`,
      }));
    },
    hourBars() {
      const { counts } = this.insights.hours;
      return counts.map((count, hour) => ({
        value: count,
        label: hour % 6 === 0 ? formatHour(hour) : '',
        caption: `${formatHour(hour)} - ${formatHour((hour + 1) % 24)}: ` +
          (count === 1 ? '1 record' : `${count} records`),
      }));
    },
    facts() {
      const c = this.insights.consistency;
      const { scope } = this.insights;
      const facts = [{
        name: `Days with ${this.focus === undefined ? 'a record' : this.quoted}`,
        value: `${c.activeDays.toLocaleString('en-US')} of ${formatDays(c.totalDays)} ` +
          `(${percent(c.activeDays / c.totalDays)}), ` +
          (c.recordCount === 1 ? '1 record' : `${c.recordCount.toLocaleString('en-US')} records`),
      }, {
        name: 'Longest streak',
        value: formatDays(c.longest.count),
        range: c.longest,
      }];
      if (scope.reachesToday) {
        facts.push(c.current ?
          { name: 'Current streak', value: formatDays(c.current.count), range: c.current } :
          { name: 'Current streak', value: `none, last record ${formatDateOnly(c.lastDay)}` });
      }
      facts.push({
        name: 'Weeks in a row',
        value: scope.reachesToday ?
          `${c.currentWeeks} now, ${c.longestWeeks} at most` : `${c.longestWeeks} at most`,
      });
      if (c.typicalGap !== null) {
        facts.push({
          name: 'Typical gap',
          value: (c.typicalGap === 1 ? 'the next day' : formatDays(c.typicalGap)) +
            (c.gap90 > c.typicalGap ? ` (9 in 10 within ${formatDays(c.gap90)})` : ''),
        });
      }
      if (c.longestBreak) {
        facts.push({ name: 'Longest break', value: formatDays(c.longestBreak.count), range: c.longestBreak });
      }
      return facts;
    },
    pending() {
      const { weekdays, hours, consistency } = this.insights;
      const pending = [];
      if (!weekdays.enough) pending.push(`the weekday chart (needs ${MIN_WEEKS_FOR_CHART} weeks)`);
      if (!hours.enough) pending.push(`time of day (needs ${MIN_TIMED_FOR_CHART} records with a time)`);
      if (consistency.gaps.length < MIN_GAPS) pending.push(`the typical gap (needs ${MIN_GAPS + 1} active days)`);
      return pending;
    },
  },
  methods: {
    formatDays,
    percent,
    // Short, so a fact fits a phone's line: Aug 3 - 13, 2026.
    formatRange({ first, last }) {
      const day = date => MONTH_NAMES[date.getMonth()].slice(0, 3) + ' ' + date.getDate();
      if (first.getTime() === last.getTime()) return `${day(first)}, ${first.getFullYear()}`;
      if (first.getFullYear() !== last.getFullYear()) {
        return `${day(first)}, ${first.getFullYear()} - ${day(last)}, ${last.getFullYear()}`;
      }
      const end = first.getMonth() === last.getMonth() ? last.getDate() : day(last);
      return `${day(first)} - ${end}, ${last.getFullYear()}`;
    },
    // The dates filter the overview to that stretch, and its heatmap scrolls there.
    getRangeLink(range) {
      const query = { from: getDateString(range.first) };
      if (range.count > 1) query.to = getDateString(range.last);
      return {
        name: 'project-overview',
        params: { projectId: this.project.id },
        query: keepFocus(query, this.$route.query)
      };
    },
  },
};
</script>

<style lang='stylus'>
@import '../../styles/variables.styl';

.project-insights {
  h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px 0;
    span {
      font-weight: normal;
    }
  }
  .insight-tiles {
    margin-top: 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }
  .insight-tile {
    flex: 1 1 150px;
    min-width: 0;
  }
  .insight-number {
    font-size: 28px;
    line-height: 36px;
  }
  .insight-unit {
    font-size: 14px;
    color: secondary-text-color;
  }
  .insight-sparkline {
    display: block;
    width: 100%;
    height: 28px;
    margin: 2px 0;
    polyline {
      fill: none;
      stroke: #0072B2;
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
  }
  .insight-sentences {
    margin: 20px 0 0 0;
    padding: 12px 14px 12px 32px;
    background: header-background;
    border-radius: 4px;
    li + li {
      margin-top: 6px;
    }
  }
  .insight-card {
    margin-top: 24px;
  }
  .insight-facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 14px;
    margin: 0;
    dt {
      color: secondary-text-color;
    }
    dd {
      margin: 0;
    }
  }
  .insight-value {
    display: grid;
    grid-template-columns: minmax(0, 7em) 1fr;
    gap: 2px 10px;
    align-items: center;
    padding: 6px 0;
    color: inherit;
    text-decoration: none;
  }
  .iv-name {
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .vc-dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 6px;
  }
  .iv-bar {
    height: 8px;
    background: header-background;
    border-radius: 4px;
    overflow: hidden;
    span {
      display: block;
      height: 100%;
      border-radius: 4px;
    }
  }
  .iv-numbers {
    grid-column: 2;
    font-size: 13px;
    color: secondary-text-color;
  }
  .insight-range {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: rgba(0, 0, 0, 0.3);
  }
  > p.small {
    margin-top: 24px;
  }
}
</style>
