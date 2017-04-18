<template>
  <div>
    <name-and-description @updated='onProjectNameUpdated'
      form-action='Update name and description'
      :name='name'
      :description='description'>
    </name-and-description>

    <project-structure :fields='fields' @updated='onProjectStructureUpdated'></project-structure>

    <form class='settings-group'>
      <h3 class='danger'>Risky actions</h3>
      <div class='row'>
        <div class='col'>
          <div>Open in Google Sheets</div>
          <div class='secondary'>
            You own your data. Feel free to explore it from Google Sheets, but please
            note that we haven't tested external modifications yet. So you might
            encounter bugs or even loose your streaks if you edit your data outside.
          </div>
        </div>
        <a class='danger-trigger-button danger' :href='spreadSheetUrl'>Open Sheets</a>
      </div>
      <div class='row' v-if='!deleteConfirm'>
        <div class='col'>
          <div>Delete this project</div>
          <div class='secondary'>
            The project will be moved to your <a href='https://drive.google.com/drive/trash'>Trash</a> folder.
          </div>
        </div>
        <ui-button type='secondary' class='danger-trigger-button' color='red' @click.prevent='deleteConfirm = true'>Delete Project</ui-button>
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
import { UiButton } from 'keen-ui';

import NameAndDescription from './NameAndDescription.vue';
import ProjectStructure from './ProjectStructure.vue';
import { updateNameAndDescription, deleteProject, updateProjectStructure } from '../../lib/projectList.js';

export default {
  name: 'ProjectSettings',
  props: ['project'],

  components: {
    UiButton,
    NameAndDescription,
    ProjectStructure
  },

  computed: {
    name() {
      return this.project && this.project.title;
    },

    description() {
      return this.project && this.project.description;
    },
    fields() {
      // TODO: should call this consistently (headers/fields/columns are all the same);
      return this.project && this.project.headers;
    },
    spreadSheetUrl() {
      if (!this.project) return '';

      return `https://docs.google.com/spreadsheets/d/${this.project.spreadsheetId}/edit`;
    },
  },

  data() {
    return {
      deleteConfirm: false
    };
  },

  methods: {
    onProjectNameUpdated(name, description) {
      this.loading = true;
      updateNameAndDescription(this.project.spreadsheetId, name, description)
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

    onProjectStructureUpdated(projectStructure) {
      updateProjectStructure(this.project, projectStructure).then(() => {
        this.goToParent();
      });
    },

    deleteProjectClick() {
      deleteProject(this.project.id).then(() => {
        this.$router.replace({
          name: 'dashboard'
        });
      });
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
@import '../../styles/variables.styl';

.settings-group {
  padding: 14px;
  border: 1px solid strong-border-color;
  max-width: 600px;
  margin-bottom: 28px;
  h3 {
    margin: 0 0 14px 0;
  }
}
a.danger {
  text-align: center;
  text-transform: uppercase;
  font-size: 0.875rem;
  font-weight: 500;
}
.row, .row-confirm {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}
.danger-trigger-button {
  min-width: 150px;
}

@media only screen and (max-width: small-screen-size) {
  .row {
    flex-wrap: wrap;
  }
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
