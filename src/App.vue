<template>
  <div id="app">
    <div class='loading' v-if='loading'>
        Checking Google Authentication....
    </div>
    <div class='error' v-if='error'>
      <p>Something is wrong. Try refreshing the page. If error persists, please reach out to me at <a href='mailto:anvaka@gmail.com'>anvaka@gmail.com</a>.</p>
      <pre>{{error}}</pre>
    </div>
    <div v-if='signedIn' class='router-container'>
      <router-view></router-view>
    </div>
    <div v-if='signedOut'>
      <welcome />
    </div>
  </div>
</template>

<script>
import auth from './lib/auth';
import Welcome from './components/Welcome.vue';

export default {
  name: 'app',
  data() {
    return auth.signInStatus;
  },
  components: {
    Welcome
  },

  created () {
    this.loading = true;
    this.error = null;

    auth.initiateSignInStatus();
  }

};
</script>

<style lang='stylus'>
@import './styles/variables.styl'

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.router-container {
  width: 100%;
  height: 100%;
}
.secondary {
  color: secondary-text-color;
}
</style>
