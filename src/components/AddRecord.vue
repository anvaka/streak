<template>
  <form @submit.prevent='commitChanges'>
    <div class='input-container' v-for='field in fields'>
      <ui-textbox
            floating-label
            :label='field.title'
            v-model='field.value'
        ></ui-textbox>
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
import appendRecord from '../lib/appendRecord';

export default {
  props: ['fields', 'spreadsheetId'],
  components: {
    UiTextbox,
    UiButton,
    UiIconButton,
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
