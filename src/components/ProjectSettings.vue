<template>
  <div>
    <form @submit.prevent='updateProjectClick' class='settings-group'>
      <h3>Name and description</h3>
      <ui-textbox label="Project name" v-model="projectName" required></ui-textbox>
      <ui-textbox label="Project description (Optional)" v-model="description"></ui-textbox>

      <div>
        <ui-button type='secondary' color='primary'
          buttonType='submit' class='update-project submit-button' :class='{"invalid-project": isProjectNameInvalid()}'>
          Update Name and Description
        </ui-button>
      </div>
    </form>

    <form @submit.prevent='deleteProjectClick' class='settings-group'>
      <h3 class='danger'>Risky actions</h3>
      <div class='row' v-if='!deleteConfirm'>
        <div>Delete this project</div>
        <ui-button type='secondary' color='red' @click.prevent='deleteConfirm = true'>Delete Project</ui-button>
      </div>
      <div v-if='deleteConfirm'>
        <div>Are you sure you want to delete this project?</div>
        <div>This action cannot be undone from the streak website!</div>
        <div class='row-confirm'>
          <ui-button type='secondary' class='danger-confirm' color='red' @click.prevent='deleteProjectClick'>Delete the project</ui-button>
          <ui-button type='secondary' @click.prevent='deleteConfirm = false'>No. I changed my mind</ui-button>
        </div>
      </div>
    </form>

  </div>
</template>

<script>
// TODO: This page needs to handle errors properly
import { UiTextbox, UiButton } from 'keen-ui';

import { updateNameAndDescription, deleteProject } from '../lib/projectList.js';

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
        description: this.project.description || '',
        deleteConfirm: false
      };
    }

    return {
      projectName: '',
      description: '',
      deleteConfirm: false
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
    deleteProjectClick() {
      deleteProject(this.project.id).then(() => {
        this.$router.replace({
          name: 'dashboard'
        });
      });
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
<style lang='stylus'>
@import '../styles/variables.styl';

.settings-group {
  padding: 14px;
  border: 1px solid strong-border-color;
  max-width: 600px;
  margin-bottom: 28px;
  h3 {
    margin: 0 0 14px 0;
  }
}
.row, .row-confirm {
  display: flex;
  padding: 0 14px;
  justify-content: space-between;
  align-items: center;
}

@media only screen and (max-width: small-screen-size) {
  .row-confirm {
    flex-direction: column-reverse;
    align-items: initial;
    display: flex;
  }
  .danger-confirm {
    margin-top: 24px;
  }
}
</style>
