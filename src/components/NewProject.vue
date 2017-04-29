<template>
  <div class='new-project'>
    <h2 class='step-header'>{{pageName}}</h2>
    <div v-if='step === 1'>
      <name-and-description
        form-title='Step 1: Give your project a name'
        :description='description'
        :name='projectName'
        :isPublic='isPublic'
        :focus='true' @updated='saveNameAndDescription'>
        <div class='step-actions'>
          <ui-button type='secondary' color='primary' @click.prevent='goBack' buttonType='button'>
            Go Back
          </ui-button>
          <ui-button type='secondary' color='primary' buttonType='submit'>
            Next
          </ui-button>
        </div>
      </name-and-description>
    </div>
    <div v-if='step === 2'>
      <project-structure form-title='Step 2: Project structure' @updated='saveFields' :fields='fields'>
        <template scope='props'>
        <div class='step-actions'>
          <ui-button type='secondary' color='primary' @click.prevent='step = 1' buttonType='button'>
            Go Back
          </ui-button>
          <ui-button type='secondary' color='primary' buttonType='submit' :disabled='props.hasError'>
            Create Project
          </ui-button>
        </div>
        </template>
      </project-structure>
    </div>
    <div v-if='step === 3'>
        <ui-icon-button icon='refresh' :loading='true' type='secondary'></ui-icon-button>
          Creating new project...
    </div>
    <div v-if='error' class='error'>
        <h3>Something is wrong...</h3>
          I couldn't create a new project. Please try again. If error persists, please reach out to me at <a href='mailto:anvaka@gmail.com'>anvaka@gmail.com</a>.</p>
          <h4>Technical details</h4>
          <pre>{{error}}</pre>
      </div>
  </div>
</template>
<script>
import UiIconButton from 'keen-ui/src/UiIconButton';
import UiButton from 'keen-ui/src/UiButton';

import { getCurrentUserId } from '../lib/auth.js';
import getProjectList from '../lib/getProjectList.js';
import setPageTitle from '../lib/setPageTitle.js';

import NameAndDescription from './settings/NameAndDescription.vue';
import ProjectStructure from './settings/ProjectStructure.vue';
import { MULTI_LINE_TEXT, DATE } from '../types/FieldTypes.js';

export default {
  name: 'NewProject',
  data() {
    return {
      step: 1,
      projectName: '',
      description: '',
      error: null,
      isPublic: true,
      fields: [{
        title: 'When',
        valueType: DATE.value
      }, {
        title: 'Note',
        valueType: MULTI_LINE_TEXT.value
      }]
    };
  },
  mounted() {
    setPageTitle('New project');
  },

  computed: {
    pageName() {
      if (this.projectName) {
        return 'New project - ' + this.projectName;
      }
      return 'New project';
    }
  },

  methods: {
    saveNameAndDescription(name, description, isPublic) {
      this.projectName = name;
      this.description = description;
      this.isPublic = isPublic;
      this.step = 2;
    },

    saveFields(newFields) {
      this.createProject(newFields);
    },

    goBack() {
      this.$router.go(-1);
    },

    createProject(fields) {
      if (!this.projectName) {
        return;
      }

      this.step = 3;

      const userId = getCurrentUserId();
      const projectList = getProjectList(userId);

      projectList.createNewProject(
        this.projectName,
        this.description,
        this.isPublic,
        fields
      ).then((projectId) => {
        this.error = null;

        this.$router.push({
          name: 'project-overview',
          params: { projectId, userId }
        });
      }, err => {
        // Go to previous wizard page
        this.step = 2;
        this.error = err;
      });
    }
  },
  components: {
    NameAndDescription,
    ProjectStructure,
    UiButton,
    UiIconButton,
  }
};
</script>

<style scoped lang='stylus'>
@import '../styles/variables.styl'

.step-header {
  margin-bottom: 28px;
}
.step-actions {
  display: flex;
  justify-content: space-between;
}

@media only screen and (max-width: small-screen-size) {
  .settings-group {
    border: none;
    padding: 0;
  }
}

.title {
  text-transform: uppercase;
}
.error {
  color: orangered;
}
.new-project {
  padding: default-padding;
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
  margin-top: 32px;
  width: 100%;
  font-size: 26px;
}

.add-column {
  padding-left: 0;
  color: secondary-text-color;
}
</style>
