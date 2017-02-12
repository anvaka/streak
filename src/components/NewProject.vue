<template>
  <div>
    <h3>Start a new project</h3>
    <form @submit.prevent='createProject' >
      <ui-textbox
                autocomplete="off"
                error="Project name is required"
                label="Project Name"
                placeholder="Enter project name here"
                required
                :invalid="nameTouched && projectName.length === 0"
                @touch="nameTouched = true"
                v-model="projectName"
            ></ui-textbox>
      <ui-button type='secondary' v-if='!isLoading' color='primary'  buttonType='submit'>
        Create project
      </ui-button>
      <div v-if='isLoading'>
          <ui-icon-button icon="refresh" :loading="true" type='secondary'></ui-icon-button>
          Creating new project...
      </div>
    </form>
  </div>
</template>
<script>
import { UiTextbox, UiIconButton, UiButton } from 'keen-ui';
import createProject from '../lib/createProject';

export default {
  name: 'NewProject',
  data() {
    return {
      isLoading: false,
      projectName: '',
      nameTouched: false,
    };
  },
  methods: {
    createProject() {
      if (this.projectName) {
        this.isLoading = true;

        createProject(this.projectName).then((file) => {
          this.isLoading = false;

          this.$router.push({
            name: 'project-details',
            params: {
              id: file.id
            }
          });
        });
      }
    }
  },
  components: {
    UiTextbox,
    UiButton,
    UiIconButton,
  }
};
</script>
