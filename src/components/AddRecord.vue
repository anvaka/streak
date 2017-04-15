<template>
  <form @submit.prevent='commitChanges' class='editor-form'>
    <div class='input-fields'>
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
        <div v-if='field.valueType === "image"'>
          <image-input :vm='field'></image-input>
        </div>
      </div>
    </div>
    <div class='actions' v-if='!isSaveInProgress'>
      <ui-button type='secondary' class='cancel-btn'  buttonType='button' @click.prevent='cancel'>
        Cancel
      </ui-button>
      <ui-button type='secondary' class='commit-btn' v-if='!isSaveInProgress' color='primary'  buttonType='submit'>
        Save record
      </ui-button>
    </div>

    <div v-if='isSaveInProgress'>
      <ui-icon-button icon='refresh' :loading='true' type='secondary'></ui-icon-button>
      Committing new record...
    </div>

    <div v-if='error'>
      <h2 class='error-title'>I am sorry...</h2>
      <p>
      An error has happened. Please try saving this record again.
      </p>
      <p>If the error happens again, email technical details to me: <a href='mailto:anvaka@gmail.com'>anvaka@gmail.com</a></p>
      <pre>{{error}}</pre>
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
import ImageInput from './inputs/Image';

import { updateRow } from '../lib/sheetOperations.js';

export default {
  props: ['fields', 'spreadsheetId', 'row'],
  components: {
    UiTextbox,
    UiButton,
    UiIconButton,
    Date,
    MultiLineText,
    SingleLineText,
    Number,
    ImageInput
  },
  data() {
    return {
      isSaveInProgress: false,
      error: null
    };
  },
  methods: {
    commitChanges() {
      this.error = null;
      this.isSaveInProgress = true;

      const newRowValues = this.fields.map(field => field.value);

      updateRow(this.spreadsheetId, newRowValues, this.row).then(() => {
        this.isSaveInProgress = false;
        resetFields(this.fields);
        this.$emit('saved');
      }).catch(err => {
        this.isSaveInProgress = false;
        this.error = err;
      });
    },
    cancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style lang='stylus'>
.actions {
  display: flex;
  justify-content: space-between;
  margin: 14px 0;
}

.editor-form {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.input-fields {
  overflow-y: auto;
  flex: 1;
}
</style>
