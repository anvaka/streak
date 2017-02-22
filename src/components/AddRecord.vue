<template>
  <form @submit.prevent='commitChanges'>
    <div class='input-container' v-for='field in fields'>
      <div v-if='field.valueType === "date"'>
        <date :vm='field'></date>
      </div>
      <div v-if='field.valueType === "multiline-text"'>
        <multi-line-text :vm='field'></multi-line-text>
      </div>
      <div v-if='field.valueType === "string"'>
        <single-line-text :vm='field'></single-line-text>
      </div>
      <div v-if='field.valueType === "number"'>
        <number :vm='field'></number>
      </div>
    </div>
    <ui-button type='secondary' class='commit-btn' v-if='!isSaveInProgress' color='primary'  buttonType='submit'>
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
import resetFields from 'src/lib/resetFields';
import Date from './inputs/Date';
import MultiLineText from './inputs/MultiLineText';
import SingleLineText from './inputs/SingleLineText';
import Number from './inputs/Number';

import appendRecord from '../lib/appendRecord';

export default {
  props: ['fields', 'spreadsheetId'],
  components: {
    UiTextbox,
    UiButton,
    UiIconButton,
    Date,
    MultiLineText,
    SingleLineText,
    Number
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
      appendRecord(this.spreadsheetId, sheetRow).then(() => {
        this.isSaveInProgress = false;
        resetFields(this.fields);
      });
    },
  }
};
</script>

<style>
.commit-btn {
  padding-left: 0;
}
</style>
