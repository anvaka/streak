<template>
  <div class='project-page-container'>
    <div class='project-page-header'>
      <project-title :project='project'></project-title>
      <loading :isLoading='loading' class='project-loading'></loading>
      <project-tabs :project='project'></project-tabs>
    </div>
    <router-view :project='project'></router-view>
    <div v-if='error'>
      <h2 class='error-title'>Something is wrong...</h2>
      <pre>{{error}}</pre>
    </div>
  </div>
</template>

<script>
import ProjectTitle from './ProjectTitle.vue';
import ProjectTabs from './ProjectTabs.vue';
import Loading from './Loading.vue';
import bus from '../lib/bus.js';

export default {
  name: 'ProjectPage',
  props: ['project'],
  components: {
    ProjectTitle,
    ProjectTabs,
    Loading
  },
  data() {
    return {
      loading: false,
      error: null,
    };
  },
  watch: {
    $route(/* to, from */) {
      this.loadCurrentProject();
    },
    project() {
      this.loadCurrentProject();
    }
  },
  created() {
    this.loadCurrentProject();
    bus.on('reload-project', this.loadCurrentProject, this);
  },

  beforeDestroy() {
    bus.off('reload-project', this.loadCurrentProject);
  },

  methods: {
    loadCurrentProject() {
      this.error = null;

      if (this.project) {
        this.loading = true;
        const from = this.$route.query.from;
        const to = this.$route.query.to;
        this.project.load(from, to).then(() => {
          this.loading = false;
        }).catch(err => {
          this.loading = false;
          if (err && err.message) {
            this.error = err.message;
          } else {
            this.error = err;
          }
        });
      }

      // this.error = null;
      // this.loading = true;
      //
      // loadProject(this.projectId)
      //   .then((project) => {
      //     project.projectHistory.filter(this.$route.query.from, this.$route.query.to);
      //
      //     this.loading = false;
      //     this.project = project;
      //
      //     // this can happen when user edited settings file or manually removed
      //     // headers. Redirect to the settings page to fix the error
      //     if (project.shouldRedirectToSettings && this.$route.name !== 'project-settings') {
      //       this.$router.replace({
      //         name: 'project-settings'
      //       });
      //     }
      //     // TODO: if headers has no date, should also redirect here
      //   }).catch(err => {
      //     this.loading = false;
      //     this.project = null;
      //     if (err && err.message) {
      //       this.error = err.message;
      //     } else {
      //       this.error = err;
      //     }
      //   });
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
  position: absolute;
  top: 105px;
}
.project-page-header {
  margin: -14px -14px 20px -14px;
  padding-top: 14px;
  padding-right: 14px;
  padding-left: 14px;
  background-color: RGB(246, 248, 250);
}
</style>
