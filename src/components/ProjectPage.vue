<template>
  <div class='project-page-container'>
    <div class='project-page-header'>
      <loading :isLoading='loading' class='project-loading'></loading>
      <project-title :project='project'></project-title>
      <project-tabs></project-tabs>
    </div>
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
import ProjectTabs from './ProjectTabs.vue';
import Loading from './Loading.vue';
import renderMakrdown from '../lib/markdown/index.js';

export default {
  name: 'ProjectPage',
  props: ['projectId'],
  components: {
    ProjectTitle,
    ProjectTabs,
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

.project-loading {
  margin-left: -10px;
  margin-top: 14px;
}
.project-page-header {
  margin: -14px -14px 20px -14px;
  padding-top: 14px;
  padding-right: 14px;
  padding-left: 14px;
  background-color: RGB(246, 248, 250);
}
</style>
