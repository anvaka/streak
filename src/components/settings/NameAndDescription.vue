<template>
  <form @submit.prevent='updateProjectClick' class='settings-group'>
    <h3>{{formTitle}}</h3>
    <ui-textbox label="Project name" v-model="projectName" required :autofocus='focus'></ui-textbox>
    <ui-textbox label="Project description (Optional)" v-model="projectDescription"></ui-textbox>
    <div>
      <slot>
        <ui-button type='secondary' color='primary'
          buttonType='submit' class='update-project-name submit-button' :class='{"invalid-project": isProjectNameInvalid()}'>
          {{formAction}}
        </ui-button>
      </slot>
    </div>
  </form>
</template>
<script>
import { UiTextbox, UiButton } from 'keen-ui';

export default {
  name: 'NameAndDescription',
  props: {
    name: String,
    focus: Boolean,
    description: String,
    formTitle: {
      type: String,
      default: 'Name and description'
    },
    formAction: {
      type: String,
      default: 'Update name and description'
    }
  },
  components: {
    UiButton,
    UiTextbox
  },
  data() {
    return {
      projectName: this.name || '',
      projectDescription: this.description || '',
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
