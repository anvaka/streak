<template>
  <div class='user'>
      <ui-button color='primary' has-dropdown ref="profileButton">
          <ui-menu contain-focus has-icons has-secondary-text slot="dropdown" :options="profileOptions"
                  @select='onMenuClick'
                  @close="$refs.profileButton.closeDropdown()">
          </ui-menu>
        {{profile.name}}
      </ui-button>
  </div>
</template>

<script>
import { UiButton, UiMenu } from 'keen-ui';

export default {
  name: 'UserInfo',
  props: ['profile'],
  data() {
    return {
      profileOptions: [{
        id: 'sign-out',
        label: 'Sign out'
      }]
    };
  },
  methods: {
    onMenuClick(option) {
      if (option.id === 'sign-out') {
        this.$emit('signOut');
      }
    }
  },
  components: {
    UiButton,
    UiMenu
  }
};
</script>

<style scoped>
.user1 {
  -webkit-background-size: 32px 32px;
  background-size: 32px 32px;
  -webkit-border-radius: 50%;
  border-radius: 50%;
  display: block;
  margin: -1px;
  overflow: hidden;
  position: relative;
  height: 32px;
  width: 32px;
  z-index: 0;
}
</style>
