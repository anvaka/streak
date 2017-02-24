<template>
  <div class='add-record-container'>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}}</h2>
    <add-record :fields='fields' :spreadsheet-id='project.spreadsheetId' v-if='project'
      @saved='goToProjects' @cancel='goToProjects'></add-record>
    <div v-if='error'>
      <h3>Something is wrong...</h3>
      <pre>{{error}}</pre>
    </div>
  </div>
</template>
<script>
import loadProject from 'src/lib/loadProject';
import AddRecord from './AddRecord.vue';

export default {
  name: 'AddRecordContainer',
  props: ['projectId'],
  components: {
    AddRecord
  },

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
  created() {
    this.loadCurrentProject();
  },

  methods: {
    goToProjects() {
      this.$router.push({
        name: 'project-details',
        params: {
          projectId: this.projectId
        }
      });
    },
    loadCurrentProject() {
      // TODO: This is copy-paste from ProjectDetails.vue. If this code
      // proven to be exactly the same - extract it into common module.
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

<style>
.add-record-container {
  margin: 7px;
  max-width: 600px;
}

.add-record-container h2 {
  margin: 0 0 24px 0;
}
</style>
