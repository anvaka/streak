<template>
  <div class='project-page-container'>
    <!--loading :isLoading='loading'></loading-->
    <project-title :project='project'></project-title>
    <router-view :project='project' :error='error'></router-view>
    <div v-if='error'>
      <h2 class='error-title'>Something is wrong...</h2>
      <pre>{{error}}</pre>
    </div>
  </div>
</template>

<script>
import loadProject from 'src/lib/loadProject';

import ProjectTitle from './ProjectTitle.vue';
import Loading from './Loading.vue';

export default {
  name: 'ProjectPage',
  props: ['projectId'],
  components: {
    ProjectTitle,
    Loading
  },
  data() {
    return {
      loading: true,
      error: null,
      project: null,
    };
  },
  watch: {
    $route(/* to, from */) {
      this.loadCurrentProject();
    }
  },
  created() {
    this.loadCurrentProject();
  },
  methods: {
    loadCurrentProject() {
      this.error = null;
      this.loading = true;

      loadProject(this.projectId)
        .then((project) => {
          project.projectHistory.filter(this.$route.query.from, this.$route.query.to);
          this.loading = false;
          this.project = project;
        }).catch(err => {
          this.loading = false;
          this.project = null;
          if (err && err.message) {
            this.error = err.message;
          } else {
            this.error = err;
          }
        });
    }
  }
};
</script>

<style lang='stylus'>
.error-title {
  margin: 0;
}

</style>
