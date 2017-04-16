<template>
  <form @submit.prevent='updateProjectClick' class='settings-group'>
    <h3>Project structure</h3>
    <div class='secondary'>
      Configure what information you want to capture. Each field becomes
      an input box when you add records to your project.
    </div>
    <div>
      <field-pair v-for='field in currentFields' :field='field' @remove='removeField'></field-pair>
      <div class='add-field' v-if='canAddMore'>
        <a @click.prevent='addField' class='add-column' href='#'>Add field</a>
      </div>
    </div>

    <ui-button type='secondary' color='primary' buttonType='submit'>
      {{formName}}
    </ui-button>
  </form>
</template>

<script>
import { UiButton } from 'keen-ui';

import FieldPair from './FieldPair.vue';
import { MULTI_LINE_TEXT, getFieldByType } from '../../types/FieldTypes.js';

// We limit it to 26 because sheetOpartions.js assumes range names can anly be
// within engilsih alphabet. This is soft limit and can be easily changed.
const MAX_COLUMNS = 26;

export default {
  name: 'ProjectStructure',
  props: ['fields'],
  components: {
    FieldPair,
    UiButton
  },
  watch: {
    fields(newFields) {
      this.currentFields = cloneFields(newFields);
    },
  },
  data() {
    return {
      // should be props
      formName: 'Update project structure',
      currentFields: cloneFields(this.fields)
    };
  },
  computed: {
    canAddMore() {
      return this.currentFields.length < MAX_COLUMNS;
    }
  },
  methods: {
    updateProjectClick() {
      this.formName = ':) not implemented yet. Check tomorrow';
      this.$emit('updated', this.currentFields);
    },

    addField() {
      this.currentFields.push({
        title: '',
        type: MULTI_LINE_TEXT
      });
    },

    removeField(field) {
      const idxToRemove = this.currentFields.indexOf(field);
      if (idxToRemove < 0) throw new Error('Wrong index to remove');

      this.currentFields.splice(idxToRemove, 1);
    }
  }
};

function cloneFields(fields) {
  if (!fields) return [];

  return fields.map(f => ({
    title: f.title,
    type: getFieldByType(f.valueType)
  }));
}
</script>

<style lang='stylus'>
@import '../../styles/variables.styl';

.add-field {
  height: 82px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid strong-border-color;
  margin-top: 14px;
  margin-bottom: 14px;
}
</style>
