<template>
  <div class='about'>
    <h2>About Streak</h2>
    <p>Streak is a simple life logging application, that helps you <b>build habits</b> and <b>achieve commitments</b>.</p>
    <p>Everything is saved directly into Google Drive, so you are always in control of your data</p>
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
    <router-link :to='{name: "redirectToUser"}'>Back to home</router-link>
  </div>
</template>
<script>
import setPageTitle from '../lib/setPageTitle.js';

export default {
  name: 'NewProject',
  data() {
    return { };
  },
  mounted() {
    setPageTitle('About Streak');
  },

};
</script>

<style scoped lang='stylus'>
.about {
  margin: 14px;
}
</style>
