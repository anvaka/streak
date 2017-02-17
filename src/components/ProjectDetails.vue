<template>
  <div>
    <div class='loading' v-if='loading'>Loading...</div>
    <h2>{{title}}</h2>
    <div v-if='project'>
      <form @submit.prevent='commitChanges'>
        <div class='input-container' v-for='header in project.headers'>
          <ui-textbox
                floating-label
                :label='header.title'
                v-model='inputs[header.title]'
            ></ui-textbox>
        </div>
        <ui-button type='secondary' v-if='!isSaveInProgress' color='primary'  buttonType='submit'>
          Commit
        </ui-button>

        <div v-if='isSaveInProgress'>
            <ui-icon-button icon='refresh' :loading='true' type='secondary'></ui-icon-button>
            Committing new record...
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { UiTextbox, UiButton } from 'keen-ui';
import loadProject from '../lib/loadProject';
import appendRecord from '../lib/appendRecord';

export default {
  props: ['projectId'],

  data() {
    return {
      loading: true,
      isSaveInProgress: false,
      error: null,
      title: '',
      project: null,
      inputs: null,
    };
  },

  components: {
    UiTextbox,
    UiButton,
  },

  created() {
    this.loadCurrentProject();
  },

  watch: {
    $route(/* to, from */) {
      this.loadCurrentProject();
    }
  },

  methods: {
    commitChanges() {
      this.isSaveInProgress = true;
      const sheetRow = this.project.headers.map(header => this.inputs[header.title]);
      appendRecord(this.project.spreadsheetId, sheetRow).then(() => this.isSaveInProgress = false);
    },

    loadCurrentProject() {
      this.error = null;
      this.loading = true;

      loadProject(this.projectId)
        .then((project) => {
          console.log(project);
          this.inputs = {};
          project.headers.forEach(header => {
            this.inputs[header.title] = '';
          });

          this.loading = false;
          this.title = project.title;
          this.project = project;
        });
    }
  }
};
</script>

<style scoped>
.loading {
  position: absolute;
  text-align: right;
  top: 0;
  right: 16px;
}
</style>
