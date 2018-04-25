<template>
  <div class='welcome'>
    <h1>Welcome to Streak!</h1>
    <p>This is a simple life logging application, that helps you <b>build habits</b> and <b>achieve commitments</b>.</p>
    <p>Everything is saved directly into Google Drive, so you are always in control of your data. Log it here and analyze it later. </p>
    <ui-button @click.prevent='signIn' color='red'>Sign in to Google Drive</ui-button>
    <div class='how-to'>
    <h2>How to use it?</h2>
    <h3>
      Step 1: Set your goal
    </h3>
    <img src='static/step-1-configure.gif'>
    <h3>
      Step 2: Configure what you want to capture
    </h3>

    <img src='static/step-2-structure.gif'>
    <h3>
      Step 3: Log every step that brings your closer to your goal.
    </h3>

    <img src='static/step-3-create.gif'>
    <p>
      Don't forget to look back at your history, share and inspire your friends
    </p>

    <h4>Soure code</h4>
    <p>
      Streak was created by <a href='https://streak.anvaka.com/#/114708134049085210473'>Andrei Kashcha</a>.
      The source code of this website is fully available on our <a href='https://github.com/anvaka/streak'>GitHub page</a>.
      Also don't forget to check our <a href='https://github.com/anvaka/streak/blob/master/privacy.md'>Privacy policy</a>.

    </p>
    </div>

  </div>
</template>
<script>
import UiButton from 'keen-ui/src/UiButton';

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

<style lang='stylus' scoped>
@import '../styles/variables.styl';

.welcome {
  padding: default-padding;
  overflow: auto;
}
</style>
