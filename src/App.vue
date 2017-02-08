<template>
  <div id="app">
    <div class='loading' v-if='loading'>
        Checking Google Authentication....
    </div>
    <div class='error' v-if='error'>
      <p>Something is wrong. Try refreshing the page. If error persists, please reach out to me at <a href='mailto:anvaka@gmail.com'>anvaka@gmail.com</a>.</p>
      <pre>{{error}}</pre>
    </div>
    <div v-if='authStatus.signedIn'>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import auth from './lib/auth';

export default {
  name: 'app',
  data() {
    return {
      loading: true,
      error: null,
      authStatus: {
        signedIn: false
      }
    };
  },
  created () {
    this.loading = true;
    this.error = null;

    auth.checkStatus().then((authStatus) => {
      this.authStatus.signedIn = !!authStatus.profile;
      this.loading = false;
    }).catch(err => {
      this.error = err;
      this.loading = false;
    });
  }

};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
