<template>
  <div class='new-project'>
    <form @submit.prevent='createProject' >
      <h3 class='title'>Step 1: Give your project a name</h3>
      <ui-textbox
                autofocus
                autocomplete='off'
                error='Project name is required'
                placeholder='Enter project name here'
                required
                :invalid='nameTouched && isProjectNameInvalid()'
                @touch='nameTouched = true'
                v-model='projectName'
            ></ui-textbox>
      <div class='columns-config' :class='{"invalid-project": isProjectNameInvalid()}'>
        <h3 class='title' title='Describe which columns to record for each log entry'>Step 2: Configure project columns</h3>
        <div v-for='column in columns' class='column-pair'>
          <ui-textbox
                label='Column name'
                autocomplete='off'
                placeholder='Give this column a name'
                v-model='column.name'
            ></ui-textbox>
          <ui-select
                label='Column type'
                placeholder='Select a column type'
                :options='columnTypes'
                v-model='column.type'
            ></ui-select>
          <ui-button type='secondary' class='remove-row' @click.prevent='removeColumn(column)' buttonType='button'>Remove</ui-button>
        </div>
        <ui-button type='secondary' @click.prevent='addColumn' class='add-column' buttonType='button'>
          Add column
        </ui-button>
      </div>

      <ui-button type='secondary' v-if='!isLoading' color='primary'
        buttonType='submit' class='create-project' :class='{"invalid-project": isProjectNameInvalid()}'>
        Create project
      </ui-button>
      <div v-if='isLoading'>
          <ui-icon-button icon='refresh' :loading='true' type='secondary'></ui-icon-button>
          Creating new project...
      </div>

      <div v-if='error' class='error'>
        <h3>Something is wrong...</h3>
          I couldn't create a new project. Please try again. If error persists, please reach out to me at <a href='mailto:anvaka@gmail.com'>anvaka@gmail.com</a>.</p>
          <h4>Technical details</h4>
          <pre>{{error}}</pre>
      </div>
    </form>
  </div>
</template>
<script>
import { UiTextbox, UiIconButton, UiButton, UiSelect } from 'keen-ui';
import createProject from '../lib/createProject';

const MAX_COLUMNS = 26; // TODO: this should come from shared place

const DATE = {
  label: 'Date',
  value: 'date'
};

const MULTI_LINE_TEXT = {
  label: 'Multiline text',
  value: 'multiline-text',
};

const SINGLE_LINE_TEXT = {
  label: 'Single line text',
  value: 'string'
};

const NUMBER = {
  label: 'Number',
  value: 'number'
};

const COLUMN_TYPES = [DATE, MULTI_LINE_TEXT, SINGLE_LINE_TEXT, NUMBER];

export default {
  name: 'NewProject',
  data() {
    return {
      columnTypes: COLUMN_TYPES,
      isLoading: false,
      projectName: '',
      nameTouched: false,
      projectStructureStep: false,
      error: null,
      columns: [{
        name: 'Date',
        type: DATE
      }, {
        name: 'Note',
        type: MULTI_LINE_TEXT
      }]
    };
  },
  methods: {
    isProjectNameInvalid() {
      return this.projectName.length === 0;
    },

    removeColumn(column) {
      const idxToRemove = this.columns.indexOf(column);
      if (idxToRemove < 0) throw new Error('Wrong index to remove');

      this.columns.splice(idxToRemove, 1);

      // TODO: Should I disable removing all columns?
    },

    addColumn() {
      if (this.columns.length > MAX_COLUMNS) {
        throw new Error('So much columns! Not supported yet');
      }

      this.columns.push({
        name: '',
        type: MULTI_LINE_TEXT
      });
    },

    createProject() {
      if (this.projectName) {
        this.isLoading = true;

        createProject(this.projectName, this.columns).then((projectId) => {
          this.isLoading = false;
          this.error = null;

          this.$router.push({
            name: 'project-details',
            params: {
              projectId
            }
          });
        }, err => {
          this.isLoading = false;
          this.error = err;
        });
      }
    }
  },
  components: {
    UiTextbox,
    UiButton,
    UiSelect,
    UiIconButton,
  }
};
</script>

<style scoped lang='stylus'>
@import '../styles/variables.styl'

.title {
  text-transform: uppercase;
}
.error {
  color: orangered;
}
.new-project {
  padding: 8px;
}
.title {
  .secondary {
    font-weight: normal;
  }
}

.invalid-project {
  opacity: 0.2;
}

.column-pair {
  display: flex;
  width: 100%;
  div {
    flex: 1;
  }
}

.remove-row {
  align-self: flex-end;
  margin-bottom: 16px;
  padding-top: 16px;
  color: secondary-text-color;
  font-size: 10px;
}

.create-project {
  width: 100%;
  font-size: 26px;
}

.add-column {
  padding-left: 0;
  color: secondary-text-color;
}
</style>
