<template>
  <div>
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
    this.error = null;
    this.loading = true;

    loadProject(this.projectId)
      .then((project) => {
        this.title = project.sheetInfo.properties.title;
        console.log(project);
      });
  }
};
</script>
