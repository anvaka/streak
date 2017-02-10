<template>
  <div>
    <h1>Welcome to Streak!</h1>
    <p>This is a simple life logging application, that helps you <b>build habits</b> and <b>achieve commitments</b>.</p>
    <p>Everything is saved directly into Google Drive, so you are always in control of your data. Log it here and analyze it later. </p>
    <ui-button @click.prevent='signIn' color='red'>Sign in to Google Drive</ui-button>
  </div>
</template>
<script>
import { UiButton } from 'keen-ui';

export default {
  name: 'Welcome',
  methods: {
    signIn() {
      gapi.auth2.getAuthInstance().signIn();
    }
  },
  components: {
    UiButton
  }
};
</script>
