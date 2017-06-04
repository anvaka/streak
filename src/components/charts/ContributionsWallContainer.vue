<template>
  <contributions-wall :dates='projectContributions' @filter='filterContributions'>
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

