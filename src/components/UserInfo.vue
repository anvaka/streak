<template>
  <div class='user'>
      <div v-if='profile' class='avatar-container' ref='profileButton'>
          <img :src='profile.image' class='avatar' @click='toggleMenu'>
          <div v-if='menuOpen' class='user-menu'>
            <div class='user-menu-item disabled'>Signed in as {{profile.name}}</div>
            <hr class='user-menu-divider'>
            <div class='user-menu-item' @click='signOutClick'>Sign out</div>
          </div>
      </div>
  </div>
</template>

<script>
export default {
  name: 'UserInfo',
  props: ['profile'],
  data() {
    return {
      menuOpen: false
    };
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    signOutClick() {
      this.menuOpen = false;
      this.$emit('signOut');
    },
    onExternalClick(e) {
      if (this.$refs.profileButton && !this.$refs.profileButton.contains(e.target)) {
        this.menuOpen = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.onExternalClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onExternalClick);
  }
};
</script>

<style lang='stylus'>
.user {
  .avatar-container {
    position: relative;
    cursor: pointer;
  }
}
.avatar {
  width: 20px;
  border-radius: 5px;
}
.user-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 100;
  padding: 4px 0;
}
.user-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.875rem;
  white-space: nowrap;
  &:hover {
    background-color: #f5f5f5;
  }
  &.disabled {
    color: rgba(0, 0, 0, 0.38);
    cursor: default;
    &:hover {
      background-color: transparent;
    }
  }
}
.user-menu-divider {
  margin: 4px 0;
  border: none;
  border-top: 1px solid #eee;
}
</style>
