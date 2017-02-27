<template>
  <div class='add-record-container'>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}}</h2>
    <add-record :fields='fields' :row='row'
      :spreadsheet-id='project.spreadsheetId'
      v-if='project'
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
  props: ['projectId', 'row'],
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

      loadProject(this.projectId, /* allowCachedData = */ true)
        .then((project) => {
          this.fields = getFieldsFromProject(project, this.row);
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

function getFieldsFromProject(project, row) {
  const rowWithData = (project.sheetData && project.sheetData[row]) || {};

  return project.headers.map((header, index) => ({
    title: header.title,
    value: rowWithData[index] || '',
    valueType: header.valueType
  }));
}
</script>

<style>
.add-record-container {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.add-record-container h2 {
  margin: 0 0 24px 0;
}
</style>
