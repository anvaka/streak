<template>
  <div class='action-row'>
    <div v-if='!deleteInProgress'>
      <router-link class='edit-record-link action' :to='{name: "edit-record", params: { row: row.rowIndex}}'>edit</router-link>
      <div class='delete-block'>
        <a v-if='!showDeleteConfirmation' href='#'
          @click.prevent='showDeleteConfirmation = true'>delete</a>
        <span v-if='showDeleteConfirmation'>
          <span class='accent'>are you sure?</span> <a href='#' @click.prevent='deleteRecordClick(row)'>yes</a> &#47; <a href='#' @click.prevent='showDeleteConfirmation = false'>no</a>
        </span>
      </div>
    </div>
    <div v-if='deleteInProgress' class='secondary'>
      <ui-icon-button icon="refresh" :loading="true" type='secondary'></ui-icon-button>
      removing row...
    </div>
    <div v-if='error'>Something is wrong. Reload the page?</div>
  </div>
</template>

<script>
import { UiIconButton } from 'keen-ui';
import { deleteRow } from '../lib/sheetOperations.js';
import bus from '../lib/bus.js';

export default {
  name: 'ActionRow',
  props: ['row', 'project'],
  data() {
    return {
      showDeleteConfirmation: false,
      deleteInProgress: false,
      error: false,
    };
  },

  methods: {
    deleteRecordClick(row) {
      this.deleteInProgress = true;
      this.error = false;
      deleteRow(this.project.spreadsheetId, row.rowIndex)
        .then(() => {
          bus.fire('reload-project');
          this.showDeleteConfirmation = false;
          this.deleteInProgress = false;
        })
        .catch((e) => {
          console.log('Failed to delete row', e);
          this.error = true;
          this.deleteInProgress = false;
        });
    },
  },
  components: {
    UiIconButton
  }
};
</script>

<style lang='stylus'>
.action-row {
  text-align: center;
  width: 100%;
  .edit-record-link {
    font-size: 14px;
  }
}
.delete-block {
  display: inline-block;
  margin-left: 28px;
  a {
    font-size: 12px;
  }
}
</style>
