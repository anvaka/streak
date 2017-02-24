<template>
  <div class='project-details-container'>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}} </h2>
    <router-link class='add-record-link action' :to='{name: "add-record", params: {projectId}}'>Add record</router-link>
    <div v-if='project' class='project-details'>
      <div v-if='project.projectHistory'>
        <div v-for='groupRecord in project.projectHistory.groups' class='group-record'>
          <h4>{{getUICellValue(groupRecord.group)}}</h4>
          <div v-for='row in groupRecord.items' class='subgroup'>
            <div v-for='column in row' v-if='column.value'  class='cell-record'>
              <div class='secondary column-title'>{{column.title}}</div>
              <div class='column-value'>
              {{getUICellValue(column)}}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if='error'>
      <h3>Something is wrong...</h3>
      <pre>{{error}}</pre>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import loadProject from 'src/lib/loadProject';

export default {
  props: ['projectId'],

  data() {
    return {
      loading: true,
      isSaveInProgress: false,
      error: null,
      title: '',
      project: null,
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
    getUICellValue(cell) {
      const { value } = cell;
      if (value instanceof Date) {
        return moment(value).format('LL');
      }

      return value;
    },

    loadCurrentProject() {
      this.error = null;
      this.loading = true;

      loadProject(this.projectId)
        .then((project) => {
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
  text-align: left;
  top: -42px;
}
.project-details-container {
  height: 100%;
  position: relative;
}

.project-details-container h2 {
  margin: 0;
}

.project-details {
  height: 100%;
  max-width: 941px;
  overflow-y: auto;
}
.cell-record {
  display: table-row;
}
.column-title {
  text-align: right;
  padding-right: 10px;
  display: table-cell;
  font-size: 12px;
}
.column-value {
  display: table-cell;
}
.subgroup {
  padding-bottom: 10px;
}
.add-record-link {
  font-size: 18px;
  text-decoration: none;
}
</style>
