<template>
  <contributions-wall :dates='projectContributions'
     @filter='filterContributions'
     :categories='project.projectHistory.categories'
     :settings='settings'>
  </contributions-wall>
</template>

<script>
import ContributionsWall from './ContributionsWall';
import { getFocus, keepFocus } from 'src/lib/facet.js';
import { isDayInside } from 'src/lib/dateUtils.js';

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
      // The focus stays only if the days picked have that value: a gray
      // day's records are all other values, and focusing would list none.
      const focus = getFocus(this.$route.query);
      const days = this.projectContributions;
      const hasFocus = focus !== undefined && Object.keys(days).some(key => (
        isDayInside(key, query.from, query.to) && (days[key].values || []).indexOf(focus) >= 0
      ));
      this.$router.push({
        name: 'project-overview',
        params: {
          projectId: this.project.id,
        },
        query: hasFocus ? keepFocus(query, this.$route.query) : query
      });
    },
  }
};
</script>

