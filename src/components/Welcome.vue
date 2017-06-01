<template>
  <div class='welcome'>
    <h1>Welcome to Streak!</h1>
    <p>This is a simple life logging application, that helps you <b>build habits</b> and <b>achieve commitments</b>.</p>
    <p>Everything is saved directly into Google Drive, so you are always in control of your data. Log it here and analyze it later. </p>
    <ui-button @click.prevent='signIn' color='red'>Sign in to Google Drive</ui-button>

    <h2>How to use it?</h2>
    <p>
      Step 1: Set your goal.
    </p><p>
      Step 2: Configure a project to record your progress towards goal
    </p><p>
      Step 3: Log every step that brings your closer to your goal.
    </p><p>
      Don't forget to look back at your history, share and inspire your friends
    </p>


    <h4>Soure code</h4>
    <p>
      Streak was created by <a href='https://streak.anvaka.com/#/114708134049085210473'>Andrei Kashcha</a>.
      The source code of this website is fully available on our <a href='https://github.com/anvaka/streak'>GitHub page</a>
    </p>

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
}
</style>
