<template>
  <form @submit.prevent='updateProjectClick' class='settings-group'>
    <h3>Name and description</h3>
    <ui-textbox label="Project name" v-model="projectName" required></ui-textbox>
    <ui-textbox label="Project description (Optional)" v-model="projectDescription"></ui-textbox>

    <div>
      <ui-button type='secondary' color='primary'
        buttonType='submit' class='update-project submit-button' :class='{"invalid-project": isProjectNameInvalid()}'>
        {{formName}}
      </ui-button>
    </div>
  </form>
</template>
<script>
import { UiTextbox, UiButton } from 'keen-ui';

export default {
  name: 'NameAndDescription',
  props: ['name', 'description', 'formName'],
  components: {
    UiButton,
    UiTextbox
  },
  data() {
    return {
      projectName: this.name || '',
      projectDescription: this.description || ''
    };
  },
  watch: {
    name(newName) {
      this.projectName = newName || '';
    },
    description(newDescription) {
      this.projectDescription = newDescription || '';
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
      this.$emit('updated', this.projectName, this.projectDescription);
    }
  }

};
</script>
