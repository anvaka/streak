<template>
  <div class='project-details-container'>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}} </h2>
    <contributions-wall :project='project' @filter='filterContributions' v-if='!error && !loading'></contributions-wall>
    <div v-if='noRecordsAtAll'>This project does not have any records yet... Start your journey and <router-link class='add-record-link action' :to='{name: "add-record", params: {projectId}}'>add the first record</router-link>.</div>
    <selected-filters :from='$route.query.from' :to='$route.query.to' :project-id='projectId'></selected-filters>
    <div v-if='noRecordsWithThisFilter'>There is nothing recorded {{getFilterPeriodMessage()}}. <router-link class='add-record-link action' :to='{name: "add-record", params: {projectId}, query: {date: getFromDate()}}'>add record</router-link>.</div>
    <router-link class='add-record-link action' :to='{name: "add-record", params: {projectId}}' v-if='hasSomethingOnTheWall'>Add record</router-link>

    <div v-if='project && project.projectHistory' class='project-details list' ref='projectList'>
      <div v-for='groupRecord in project.projectHistory.groups' class='group-record'>
        <h4>{{getUICellValue(groupRecord.group)}}</h4>
        <div v-for='row in groupRecord.items' class='subgroup'>
          <div v-for='column in row' v-if='column.value'  class='cell-record'>
            <div class='secondary column-title'>{{column.title}}</div>
            <div class='column-value cell-container' v-html='getUICellValue(column)'>
            </div>
          </div>
          <div class='actions-row'>
            <router-link class='edit-record-link action' :to='{name: "edit-record", params: {projectId, row: groupRecord.group.rowIndex}}'>edit</router-link>
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
import marked from 'marked'; // makrdown renderer
import InputTypes from 'src/types/InputTypes';
import loadProject from 'src/lib/loadProject';

import ContributionsWall from './ContributionsWall.vue';
import SelectedFilters from './SelectedFilters.vue';

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
    hasSomethingOnTheWall() {
      return this.hasValidProject() && this.project.projectHistory.groups.length > 0;
    },
    noRecordsAtAll() {
      return this.hasValidProject() && this.project.projectHistory.recordsCount === 0;
    },
    noRecordsWithThisFilter() {
      if (!this.hasValidProject()) return false;
      const { projectHistory } = this.project;

      return projectHistory.recordsCount > 0 && projectHistory.groups.length === 0;
    }
  },

  watch: {
    $route(/* to, from */) {
      this.loadCurrentProject();
    }
  },

  components: {
    ContributionsWall,
    SelectedFilters
  },

  methods: {
    getFromDate() {
      return this.$route.query.from;
    },
    hasValidProject() {
      return !this.loading && !this.error && this.project;
    },
    getFilterPeriodMessage() {
      const { from, to } = this.$route.query;
      if (!to || from === to) {
        return 'on this day';
      }

      return 'on these days';
    },
    filterContributions(from, to) {
      const query = { from };
      if (to !== from) {
        query.to = to;
      }
      this.$router.push({
        name: 'project-details',
        params: {
          projectId: this.projectId,
        },
        query
      });
    },

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
          project.projectHistory.filter(this.$route.query.from, this.$route.query.to);

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
    font-size: 24px;
    text-decoration: none;
  }
  .actions-row {
    text-align: center;
    width: 100%;
    .edit-record-link {
      text-decoration: none;
      font-size: 14px;
    }
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
