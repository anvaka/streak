<template>
  <div>
    <h1>Welcome to Streak!</h1>
    <p>This is a simple life logging application, that helps you achieve important long-lasting commitments.</p>
    <p>Everything is saved directly into Google Drive, so you are always in control of your data. Log it here and analyze it later. </p>
    <button class="mui-btn mui-btn--danger" @click.prevent='signIn'>Sign in to Google Drive</button>
  </div>
</template>
<script>
export default {
  name: 'Welcome',
  methods: {
    signIn() {
      gapi.auth2.getAuthInstance().signIn();
    }
  },
};
</script>
