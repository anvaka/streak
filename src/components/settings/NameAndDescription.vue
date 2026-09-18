<template>
  <form @submit.prevent='updateProjectClick' class='settings-group'>
    <h3>{{formTitle}}</h3>
    <div class='form-field'>
      <label>Project name</label>
      <input type='text' v-model='projectName' required :autofocus='focus'>
    </div>
    <div class='form-field'>
      <label>Project description (Optional)</label>
      <input type='text' v-model='projectDescription'>
    </div>
    <div class='visibility-settings-container'>
      <div class='secondary'>Project visibility</div>
      <div class='visibility-settings-content'>
        <label class='radio-label visibility-radio'>
          <input type='radio' v-model='projectVisibility' value='public'>
          <div>
            <div class='visibility-header'>Public</div>
            <div class='visibility-help'>
              Public projects are visible to everyone.
            </div>
          </div>
        </label>
        <label class='radio-label visibility-radio'>
          <input type='radio' v-model='projectVisibility' value='private'>
          <div>
            <div class='visibility-header'>Private</div>
            <div class='visibility-help'>Only you can see this project.</div>
          </div>
        </label>
      </div>
    </div>
    <div>
      <slot>
        <div>
          <button type='submit' class='btn btn--primary update-project-name submit-button'
                  v-if='!loading'
                  :class='{"invalid-project": isProjectNameInvalid()}'>
            {{formAction}}
          </button>
          <div v-if='loading' class='loading-spinner'>
            <span class='spinner'></span> Updating...
          </div>
        </div>
      </slot>
    </div>
  </form>
</template>
<script>
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
