<template>
  <contributions-wall :dates='projectContributions'
     @filter='filterContributions'
     @show-year='showYear'
     :categories='project.projectHistory.categories'
     :settings='settings'>
  </contributions-wall>
</template>

<script>
import ContributionsWall from './ContributionsWall';

export default {
  name: 'ContributionWallContainer',
  props: ['project', 'settings'],
  components: {
    ContributionsWall
  },
  computed: {
    projectContributions() {
      return this.project.projectHistory.contributionsByDay;
    }
  },
  methods: {
    filterContributions(from, to) {
      const query = { from };
      if (to !== from) {
        query.to = to;
      }
      // Stay on the year being explored.
      const { year } = this.$route.query;
      if (year) query.year = year;
      this.showOverview(query);
    },
    showYear(year) {
      // Only what the heatmap shows changes; the filter, if any, stays.
      const query = Object.assign({}, this.$route.query);
      if (year) {
        query.year = String(year);
      } else {
        delete query.year;
      }
      this.showOverview(query);
    },
    showOverview(query) {
      this.$router.push({
        name: 'project-overview',
        params: {
          projectId: this.project.id,
        },
        query
      });
    },
  }
};
</script>
