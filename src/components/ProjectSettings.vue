<template>
  <div>
    <form @submit.prevent='updateProjectClick' >
      <ui-textbox label="Project Name" v-model="projectName" required></ui-textbox>
      <ui-textbox label="Description (Optional)" v-model="description"></ui-textbox>

      <ui-button type='secondary' class='cancel-btn'  buttonType='button' @click.prevent='cancel'>
        Cancel
      </ui-button>
      <ui-button type='secondary' color='primary'
        buttonType='submit' class='update-project' :class='{"invalid-project": isProjectNameInvalid()}'>
        Update Project
      </ui-button>
    </form>
  </div>
</template>

<script>
import { UiTextbox, UiButton } from 'keen-ui';

import { updateNameAndDescription } from '../lib/projectList.js';

export default {
  name: 'ProjectSettings',
  props: ['project'],

  components: {
    UiTextbox,
    UiButton
  },

  data() {
    if (this.project) {
      return {
        projectName: this.project.title || '',
        description: this.project.description || ''
      };
    }

    return {
      projectName: '',
      description: ''
    };
  },

  watch: {
    'project.title': function onTitleChanged(newTitle) {
      this.projectName = newTitle;
    }
  },

  methods: {
    isProjectNameInvalid() {
      return this.projectName.length === 0;
    },
    updateProjectClick() {
      if (this.isProjectNameInvalid()) {
        return;
      }

      this.loading = true;
      updateNameAndDescription(this.project.spreadsheetId, this.projectName, this.description)
        .then(() => {
          // eventual consistency :( - this is probably not very reliable.
          // We are waiting to let Google read endpoint catch up
          // with our latest changes.
          // TODO: Should probably update local copy in memory...
          setTimeout(() => {
            this.loading = false;
            this.goToParent();
          }, 300);
        });
    },

    cancel() {
      this.goToParent();
    },

    goToParent() {
      this.$router.push({
        name: 'project-overview',
        params: {
          projectId: this.project.id
        }
      });
    }
  }
};
</script>
