<template>
  <form @submit.prevent='updateProjectClick' class='settings-group'>
    <h3>{{formTitle}}</h3>
    <ui-textbox label="Project name" v-model="projectName" required :autofocus='focus'></ui-textbox>
    <ui-textbox label="Project description (Optional)" v-model="projectDescription"></ui-textbox>
    <div class='visibility-settings-container'>
      <div class='secondary'>Project visibility</div>
      <div class='visibility-settings-content'>
        <ui-radio v-model='projectVisibility' true-value='public' class='visibility-radio'>
          <div>
            <div class='visibility-header'>Public</div>
            <div class='visibility-help'>
              Public projects are visible to everyone.
            </div>
          </div>
        </ui-radio>
        <ui-radio v-model='projectVisibility' true-value='private' class='visibility-radio'>
          <div>
            <div class='visibility-header'>Private</div>
            <div class='visibility-help'>Only you can see this project.</div>
          </div>
        </ui-radio>
      </div>
    </div>
    <div>
      <slot>
        <div>
          <ui-button type='secondary' color='primary'
                    v-if='!loading'
                    buttonType='submit' class='update-project-name submit-button' :class='{"invalid-project": isProjectNameInvalid()}'>
            {{formAction}}
          </ui-button>
          <div v-if='loading'>
            <ui-icon-button icon='refresh' :loading='true' type='secondary'></ui-icon-button> Updating...
          </div>
        </div>
      </slot>
    </div>
  </form>
</template>
<script>
import UiTextbox from 'keen-ui/src/UiTextbox';
import UiButton from 'keen-ui/src/UiButton';
import UiRadio from 'keen-ui/src/UiRadio';
import UiIconButton from 'keen-ui/src/UiIconButton';

export default {
  name: 'NameAndDescription',
  props: {
    name: String,
    focus: Boolean,
    description: String,
    loading: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    formTitle: {
      type: String,
      default: 'Basics'
    },
    formAction: {
      type: String,
      default: 'Save'
    }
  },
  components: {
    UiButton,
    UiTextbox,
    UiRadio,
    UiIconButton
  },
  data() {
    return {
      projectName: this.name || '',
      projectDescription: this.description || '',
      projectVisibility: this.isPublic ? 'public' : 'private'
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
      this.$emit('updated', this.projectName, this.projectDescription, this.projectVisibility === 'public');
    }
  }

};
</script>
<style lang='stylus'>
@import '../../styles/variables.styl';

.visibility-settings-container {
  margin-top: 24px;
}

.visibility-settings-content {
  margin: 14px;
}
.settings-group {
  .visibility-radio {
    height: auto;
    margin-bottom: 14px;
    .visibility-help {
      color: secondary-text-color;
    }
  }
}
</style>
