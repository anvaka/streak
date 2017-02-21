<template>
  <div>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}}</h2>
    <div v-if='project'>
      <add-record :fields='fields' :spreadsheet-id='project.spreadsheetId'></add-record>
    </div>
    <div v-if='error'>
      <h3>Something is wrong...</h3>
      <pre>{{error}}</pre>
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
          this.fields = project.headers.map(header => ({
            title: header.title,
            value: '',
            valueType: header.valueType
          }));

          this.loading = false;
          this.title = project.title;
          this.project = project;
        }).catch(err => {
          this.loading = false;
          this.project = null;
          this.title = '';
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

<style scoped>
.loading {
  position: absolute;
  text-align: right;
  top: 0;
  right: 16px;
}
</style>
