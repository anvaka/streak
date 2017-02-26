<template>
  <div class='project-details-container'>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}} </h2>
    <div v-if='!loading && hasNoData && !error'>This project does not have any records yet... Start your journey and <router-link class='add-record-link action' :to='{name: "add-record", params: {projectId}}'>add the first record</router-link>.
    </div>
    <router-link class='add-record-link action' :to='{name: "add-record", params: {projectId}}' v-if='!hasNoData'>Add record</router-link>

    <div v-if='project && project.projectHistory' class='project-details list' ref='projectList'>
      <div v-for='groupRecord in project.projectHistory.groups' class='group-record'>
        <h4>{{getUICellValue(groupRecord.group)}}</h4>
        <div v-for='row in groupRecord.items' class='subgroup'>
          <div v-for='column in row' v-if='column.value'  class='cell-record'>
            <div class='secondary column-title'>{{column.title}}</div>
            <div class='column-value cell-container' v-html='getUICellValue(column)'>
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
import _ from 'lodash';
import moment from 'moment';
import marked from 'marked';
import InputTypes from 'src/types/InputTypes';
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

  computed: {
    hasNoData() {
      return !this.project || this.project.projectHistory.groups.length === 0;
    }
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

      if (cell.valueType === InputTypes.MULTI_LINE_TEXT) {
        return marked(value);
      }

      return _.escape(value);
    },

    loadCurrentProject() {
      this.error = null;
      this.loading = true;

      loadProject(this.projectId)
        .then((project) => {
          this.loading = false;
          this.title = project.title;
          this.project = project;
          const { projectList } = this.$refs;

          if (projectList) {
            projectList.scrollTop = 0;
          }
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

<style lang='stylus'>
@import '../styles/variables.styl';

.project-details-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .loading {
    position: absolute;
    text-align: left;
    top: -42px;
  }

  .cell-container {
    p {
      margin: 0;
    }
  }

  h2 {
    margin: 0;
  }

  .project-details {
    flex: 1;
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
}

@media only screen and (max-width: small-screen-size) {
  .project-details-container {
    .cell-record {
      display: flex;
      flex-direction: column;
    }
    .loading {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      left: 0;
      display: flex;
      align-items: center;
      text-align: center;
      justify-content: center;
    }
  }
}
</style>
