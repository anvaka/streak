<template>
  <div class='project-details-container'>
    <loading :isLoading='loading'></loading>
    <project-title :project='project'></project-title>
    <contributions-wall :project='project' @filter='filterContributions' v-if='!error && !loading'></contributions-wall>

    <div v-if='noRecordsAtAll'>
      <p>
      This project does not have any records yet.
      </p>
      <p>
      Start your journey and <router-link class='add-record-link action' :to='{name: "add-record", params: {projectId}}'>add the first record</router-link>
      </p>
    </div>

    <selected-filters :from='$route.query.from' :to='$route.query.to' :project-id='projectId'></selected-filters>

    <div v-if='noRecordsWithThisFilter' class='vertical-padding'>
      There is nothing recorded {{getFilterPeriodMessage()}}.
      <router-link  v-if='project.canEdit' class='add-record-link action' :to='{name: "add-record", params: {projectId}, query: {date: getFromDate()}}'>
        Add record
      </router-link>.
    </div>

    <router-link class='add-record-link action vertical-padding' :to='{name: "add-record", params: {projectId}}' v-if='hasSomethingOnTheWall && project.canEdit'>Add record</router-link>

    <div v-if='project && project.projectHistory' class='project-details list' ref='projectList'>
      <div v-for='groupRecord in project.projectHistory.groups' class='group-record'>
        <h4>{{getUICellValue(groupRecord.group, /* isHeader =*/ true)}}</h4>
        <div v-for='row in groupRecord.items' class='subgroup'>
          <div v-for='column in row' v-if='column.value'  class='cell-record'>
            <div class='secondary column-title'>{{column.title}}</div>
            <div class='column-value cell-container' v-html='getUICellValue(column)'></div>
          </div>
          <div class='actions-row'>
            <router-link class='edit-record-link action' :to='{name: "edit-record", params: {projectId, row: row.rowIndex}}' v-if='project.canEdit'>edit</router-link>
          </div>
        </div>
      </div>
    </div>
    <div v-if='error'>
      <h2 class='error-title'>Something is wrong...</h2>
      <pre>{{error}}</pre>
    </div>
    <ui-fab
        v-if='project && project.canEdit && !error'
        class='fab-add'
        color='primary'
        icon='add'
        size='small'
        @click='addRecordClick'
    ></ui-fab>
  </div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import InputTypes from 'src/types/InputTypes';
import loadProject from 'src/lib/loadProject';
import { UiFab } from 'keen-ui';

import renderMakrdown from '../lib/markdown/index.js';
import Loading from './Loading.vue';
import ProjectTitle from './ProjectTitle.vue';
import ContributionsWall from './ContributionsWall.vue';
import SelectedFilters from './SelectedFilters.vue';

export default {
  props: ['projectId'],

  data() {
    return {
      loading: true,
      isSaveInProgress: false,
      error: null,
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
    SelectedFilters,
    Loading,
    ProjectTitle,
    UiFab
  },

  methods: {
    addRecordClick() {
      this.$router.push({
        name: 'add-record',
        params: {
          projectId: this.projectId
        },
        query: {
          date: this.getFromDate()
        }
      });
    },
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

    getUICellValue(cell, isHeader) {
      const { value } = cell;

      // TODO: This should be more extensible. The `inputs` should
      // be related to the rendrers here.
      if (value instanceof Date) {
        const momentValue = moment(value);
        return isHeader ? momentValue.format('LL') : momentValue.format('HH:mm');
      }

      if (cell.valueType === InputTypes.MULTI_LINE_TEXT) {
        return renderMakrdown(value);
      }

      if (cell.valueType === InputTypes.IMAGE) {
        return `<img src='${value}'>`;
      }

      return _.escape(value);
    },

    loadCurrentProject() {
      this.error = null;
      this.loading = true;

      loadProject(this.projectId)
        .then((project) => {
          this.loading = false;
          this.project = project;
          project.projectHistory.filter(this.$route.query.from, this.$route.query.to);

          const { projectList } = this.$refs;

          if (projectList) {
            projectList.scrollTop = 0;
          }
        }).catch(err => {
          this.loading = false;
          this.project = null;
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

project-details-width = 941px;
column-title-width = 100px;

.vertical-padding {
  padding: 14px 0;
}

.fab-add {
  position: fixed;
  right: 14px;
  bottom: 14px;
  background-color: action-color;
}

.project-details-container {
  display: flex;
  flex-direction: column;

  .loading {
    margin-left: -8px;
  }

  .cell-container {
    p {
      margin: 0;
    }
  }


  .group-record {
    h4 {
      margin: 14px 0;
    }
  }

  .project-details {
    border-top: 1px solid border-color;
    flex: 1;
    max-width: project-details-width;
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
    max-width: column-title-width;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .column-value {
    display: table-cell;
    max-width: project-details-width - column-title-width;
  }
  .subgroup {
    padding-bottom: 10px;
  }
  .add-record-link {
    font-size: 24px;
  }
  .actions-row {
    text-align: center;
    width: 100%;
    .edit-record-link {
      font-size: 14px;
    }
  }
}

.error-title {
  margin: 0;
}

@media only screen and (max-width: small-screen-size) {
  .project-details-container {
    .column-title {
      text-align: left;
    }
    .cell-record {
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
