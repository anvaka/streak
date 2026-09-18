<template>
  <form @submit.prevent='updateProjectClick' class='settings-group'>
    <h3>{{formTitle}}</h3>
    <div class='secondary'>
      Configure what information you want to capture. Each field becomes
      an input box when you add records to your project.
    </div>
    <div>
      <field-pair v-for='field in currentFields' :field='field' @remove='removeField' :focused='field === focusedField' :readonly='loading'></field-pair>
      <a @click.prevent='addField' class='add-field' href='#' v-if='canAddMore && !loading'>Add field</a>
    </div>

    <slot :hasError='hasError'>
      <div>
        <button type='submit' class='btn btn--primary' :disabled='hasError' v-if='!loading'>
          {{formName}}
        </button>
        <div v-if='loading' class='loading-spinner'>
          <span class='spinner'></span> Updating...
        </div>
      </div>
    </slot>
    <div v-if='hasError'>
      <div v-for='error in errors' class='error'>&gt; {{error}}</div>
    </div>
  </form>
</template>

<script>
import FieldPair from './FieldPair.vue';
import { TEXT, DATE, getFieldByType } from '../../types/FieldTypes.js';

const MAX_COLUMNS = 26;

export default {
  name: 'ProjectStructure',
  props: {
    fields: Array,
    loading: {
      type: Boolean,
      default: false
    },
    formTitle: {
      type: String,
      default: 'Project structure'
    }
  },
  components: {
    FieldPair,
  },
  watch: {
    fields(newFields) {
      this.currentFields = cloneFields(newFields);
    },
  },
  data() {
    return {
      formName: 'Update project structure',
      currentFields: cloneFields(this.fields),
      focusedField: null
    };
  },
  computed: {
    canAddMore() {
      return this.currentFields.length < MAX_COLUMNS;
    },

    hasError() {
      return this.errors.length > 0;
    },

    errors() {
      const foundErrors = [];
      const nameToField = new Map();

      let hasDate = false;
      let nameIsRequired = false;
      let duplicateNames = false;

      this.currentFields.forEach(f => {
        if (f.type === DATE) hasDate = true;
        if (!f.title) {
          f.error = true;
          nameIsRequired = true;
        } else {
          const fieldTitle = f.title.toLowerCase();
          const fieldWithTheSameTitle = nameToField.get(fieldTitle);
          if (fieldWithTheSameTitle) {
            duplicateNames = true;
            fieldWithTheSameTitle.error = true;
            f.error = true;
          } else {
            f.error = false;
          }

          nameToField.set(fieldTitle, f);
        }
      });

      if (!hasDate) {
        foundErrors.push('At least one date field is required');
      }
      if (nameIsRequired) {
        foundErrors.push('Name is required for all fields');
      }
      if (duplicateNames) {
        foundErrors.push('All fields should have a unique name');
      }

      return foundErrors;
    },
  },
  methods: {
    updateProjectClick() {
      this.$emit('updated', this.currentFields);
    },

    addField() {
      const field = {
        title: '',
        error: false,
        type: TEXT
      };
      this.currentFields.push(field);
      this.focusedField = field;
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

  return fields.map((f, idx) => ({
    title: f.title,
    originalTitle: f.title,
    error: false,
    type: getFieldByType(f.valueType),
    columnIndex: idx
  }));
}
</script>

<style lang='stylus'>
@import '../../styles/variables.styl';

.error {
  color: error-color;
}
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
