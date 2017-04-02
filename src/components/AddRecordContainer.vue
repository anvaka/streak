<template>
  <div class='add-record-container'>
    <add-record :fields='fields' :row='row'
      :spreadsheet-id='project.spreadsheetId'
      v-if='project'
      @saved='goToProjects' @cancel='goToProjects'></add-record>
  </div>
</template>
<script>
import InputTypes from 'src/types/InputTypes';
import { getDateFromFilterString, getNow } from 'src/lib/dateUtils';

import AddRecord from './AddRecord.vue';

export default {
  name: 'AddRecordContainer',
  props: ['project', 'row', 'date'],
  components: {
    AddRecord
  },

  data() {
    return {
      fields: [],
    };
  },

  watch: {
    project(newProject, oldProject) {
      const dateString = this.$route.query.date;
      const date = dateString ? getDateFromFilterString(dateString) : undefined;
      this.fields = getFieldsFromProject(newProject, this.row, date);
    }
  },

  methods: {
    goToProjects() {
      this.$router.push({
        name: 'project-overview',
        params: {
          projectId: this.project.id
        }
      });
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

    if (header.autocomplete) field.autocomplete = header.autocomplete;

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
