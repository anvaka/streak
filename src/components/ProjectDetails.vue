<template>
  <div>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}}</h2>
  </div>
</template>

<script>
import loadProject from '../lib/loadProject';

export default {
  props: ['projectId'],

  data() {
    return {
      loading: true,
      error: null,
      title: ''
    };
  },

  created() {
    this.loadCurrentProject();
  },

  watch: {
    $route(/* to, from */) {
      this.loadCurrentProject();
    }
  },

  methods: {
    loadCurrentProject() {
      this.error = null;
      this.loading = true;

      loadProject(this.projectId)
        .then((project) => {
          this.loading = false;
          this.title = project.title;
          console.log(project);
        });
    }
  }
};
</script>

<style scoped>
.loading {
  position: absolute;
  text-align: right;
  top: 0;
  right: 16px;
}
</style>
