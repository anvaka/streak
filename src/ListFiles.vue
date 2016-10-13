<template>
  <div>
    <div v-if='empty'>
      <h3>No streak sheets?</h3>
      <p>I could not find any Streak in your account. <a v-link="{path: '/create-streak'}">Create new streak</a>.
      </p>
    </div>
    <div v-if='filesLoaded && !empty'>
      <h4>Your Streaks</h4>
      <div class="collection">
        <a class="collection-item"
           v-for='file in files'
           v-link="{path: '/streak/' + file.id}">{{file.name}}</a>
      </div>
      <div class='fixed-action-btn'>
        <a class='btn-floating btn-small red' v-link="{path: '/create-streak'}" title='Create new streak'>
          <i class='small material-icons'>add</i>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import appModel from './lib/appModel.js'

export default {
  data() {
    return appModel
  },
  route: {
    data() {
      appModel.pageName = 'Select Streak'
    }
  },

  computed: {
    empty() {
      return appModel.files.length === 0 && appModel.filesLoaded
    }
  }
}
</script>
