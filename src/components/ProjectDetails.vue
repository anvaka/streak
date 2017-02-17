<template>
  <div>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}}</h2>
    <div v-if='project'>
      <add-record :fields='fields' :spreadsheet-id='project.spreadsheetId'></add-record>
    </div>
  </div>
</template>

<script>
import loadProject from '../lib/loadProject';
import AddRecord from './AddRecord.vue';

export default {
  props: ['projectId'],

  data() {
    return {
      loading: true,
      isSaveInProgress: false,
      fields: [],
      error: null,
      title: '',
      project: null,
    };
  },

  components: {
    AddRecord
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
          console.log(project);
          this.fields = project.headers.map(header => ({
            title: header.title,
            value: '',
          }));

          this.loading = false;
          this.title = project.title;
          this.project = project;
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
