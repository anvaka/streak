<template>
  <div class='add-record-container'>
      <add-record v-if='project && !project.loading'
        :show-actions='!isSaveInProgress'
        :fields='fields' :row='row'
        @commit='commitChanges' @cancel='goToProjects'></add-record>

    <div v-if='isSaveInProgress'>
      <ui-icon-button icon='refresh' :loading='true' type='secondary'></ui-icon-button>
      Saving record...
    </div>
    <div v-if='error'>
      <h2 class='error-title'>I am sorry...</h2>
      <p>
      An error has happened. Please try saving this record again.
      </p>
      <p>If the error happens again, email technical details to me: <a href='mailto:anvaka@gmail.com'>anvaka@gmail.com</a></p>
      <pre>{{error}}</pre>
    </div>
  </div>
</template>
<script>
import UiIconButton from 'keen-ui/src/UiIconButton';

import InputTypes from 'src/types/InputTypes';
import { getDateFromFilterString, getNow } from 'src/lib/dateUtils';

import AddRecord from './AddRecord.vue';

export default {
  name: 'AddRecordContainer',
  props: ['project', 'row', 'date'],
  components: {
    AddRecord,
    UiIconButton
  },
  created() {
    this.ensureFieldsLoaded();
  },
  watch: {
    'project.loading': function projectLoadingChanged() {
      // TODO: this seem to be very complex. I cannot use
      // computed properties because keen ui/vue do not save updated values.
      // need to figure out what is wrong.
      this.ensureFieldsLoaded();
    }
  },
  data() {
    return {
      error: null,
      isSaveInProgress: false,
      fields: []
    };
  },
  methods: {
    ensureFieldsLoaded() {
      if (!this.project || this.project.loading) return;

      const dateString = this.$route.query.date;
      const date = dateString ? getDateFromFilterString(dateString) : undefined;

      this.fields = getFieldsFromProject(this.project, this.row, date);
    },
    commitChanges(newRowValues) {
      this.error = null;
      this.isSaveInProgress = true;

      this.project.updateRow(newRowValues, this.row).then(() => {
        this.isSaveInProgress = false;
        this.goToProjects();
      }).catch(err => {
        this.isSaveInProgress = false;
        this.error = err;
      });
    },
    goToProjects() {
      this.$router.push({ name: 'project-overview' });
    },
  }
};

function getFieldsFromProject(project, row, date) {
  const rowWithData = (project.sheetData && project.sheetData[row]) || {};

  return project.headers.map((header, index) => {
    let fieldValue = rowWithData[index] || '';
    const { valueType, title } = header;
    if (valueType === InputTypes.DATE) {
      if (!fieldValue && date) {
        // date was set via query string, and field didn't have a default date:
        fieldValue = date;
      } else if (!fieldValue) {
        // Set date to now.
        fieldValue = getNow();
      }
    }

    const field = {
      title,
      valueType,
      value: fieldValue,
    };

    if (header.autocomplete) {
      field.autocomplete = header.autocomplete;
      field.hasMultiline = header.hasMultiline;
    }

    return field;
  });
}
</script>

<style lang='stylus'>
@import '../styles/variables.styl'

.add-record-container {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.add-record-container h2 {
  margin: 12px 0 24px 0;
  font-weight: normal;
}
</style>
