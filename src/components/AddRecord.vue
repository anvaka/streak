<template>
  <form @submit.prevent='commitChanges'>
    <div class='input-container' v-for='field in fields'>
      <div v-if='field.valueType === "date"'>
        <date :vm='field'></date>
      </div>
      <div v-if='field.valueType !== "date"'>
        <ui-textbox
              floating-label
              :label='field.title'
              v-model='field.value'></ui-textbox>
      </div>
    </div>
    <ui-button type='secondary' v-if='!isSaveInProgress' color='primary'  buttonType='submit'>
      Commit
    </ui-button>

    <div v-if='isSaveInProgress'>
      <ui-icon-button icon='refresh' :loading='true' type='secondary'></ui-icon-button>
      Committing new record...
    </div>
  </form>
</template>
<script>
import { UiTextbox, UiButton, UiIconButton } from 'keen-ui';
import Date from './inputs/Date';
import appendRecord from '../lib/appendRecord';

export default {
  props: ['fields', 'spreadsheetId'],
  components: {
    UiTextbox,
    UiButton,
    UiIconButton,
    Date
  },
  data() {
    return {
      isSaveInProgress: false
    };
  },
  methods: {
    commitChanges() {
      this.isSaveInProgress = true;
      const sheetRow = this.fields.map(field => field.value);
      appendRecord(this.spreadsheetId, sheetRow).then(() => this.isSaveInProgress = false);
    },
  }
};
</script>
