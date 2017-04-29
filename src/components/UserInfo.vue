<template>
  <div class='user'>
      <ui-button color='default' type='secondary' has-dropdown ref='profileButton' v-if='profile' class='avatar-container' :disableRipple='true'>
          <ui-menu contain-focus has-icons has-secondary-text slot="dropdown" :options="profileOptions"
                  @select='onMenuClick'
                  @close="$refs.profileButton.closeDropdown()">
          </ui-menu>
          <img :src='profile.image' class='avatar'>
      </ui-button>
  </div>
</template>

<script>
import UiButton from 'keen-ui/src/UiButton';
import UiMenu from 'keen-ui/src/UiMenu';

export default {
  name: 'UserInfo',
  props: ['profile'],
  methods: {
    onMenuClick(option) {
      if (option.id === 'sign-out') {
        this.$emit('signOut');
      }
    }
  },
  computed: {
    profileOptions() {
      if (!this.profile) return [];

      return [{
        label: 'Signed in as ' + this.profile.name,
        disabled: true
      }, {
        type: 'divider'
      }, {
        id: 'sign-out',
        label: 'Sign out'
      }];
    }
  },
  components: {
    UiButton,
    UiMenu
  }
};
</script>

<style lang='stylus'>
.user {
  .avatar-container {
    padding: 0;
    min-width: inherit;
    &:hover {
      background-color: transparent;
    }
  }
}
.avatar-container.has-dropdown-open {
    background-color: transparent;
}
.avatar {
  width: 20px;
  border-radius: 5px;
}
</style>
