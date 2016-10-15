<template>
<div>
  <form @submit.prevent='logIt'>
    <div class='input-field'>
      <label for='name'>Notes <small>(optional)</small>:</label>
      <input id='name' type='text' v-model='note' autofocus>
    </div>

    <div class='row' v-if='saveState !== "saving"'>
      <input type='submit' class='waves-effect waves-light btn col s12' value='Did it!'/>
    </div>
  </form>

  <div v-if='status === "saving"'>
    <h4>Saving to sheets...</h4>
    <div class='progress'>
      <div class='indeterminate'></div>
    </div>
  </div>

  <div v-if='error' class='card-panel red-text'>
    <h4>Error...</h4>
    <pre><code>{{error}}</code></pre>
    <div>
      Refresh the page and retry maybe?
    </div>
  </div>

  <div class='fixed-action-btn' style='bottom: 12px; right: 12px;'>
    <a class='btn-floating btn-small red' :href='editLink' title='Edit records...' target='_blank'>
      <i class='small material-icons'>mode_edit</i>
    </a>
  </div>
</div>
</template>

<script>
import appModel from './lib/appModel.js'
import {logStreak, getSheetTitle, getError} from './lib/goog.js'

export default {
  data() {
    return {
      note: '',
      saveState: '',
      status: '',
      error: ''
    }
  },

  computed: {
    /**
     * Provides a Google Docs link to edit a spreadsheet
     */
    editLink() {
      const sheetId = this.$route.params.sheetId
      return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    }
  },

  created () {
    this.fetchTitle()
  },

  watch: {
    // call again the method if the route changes
    '$route': 'fetchTitle'
  },

  methods: {
    fetchTitle() {
      getSheetTitle(this.$route.params.sheetId, title => {
        appModel.pageName = title
      })
    },
    logIt() {
      this.saveState = 'saving'
      const spreadsheetId = this.$route.params.sheetId

      logStreak(spreadsheetId, this.note)
        .then(() => {
          this.note = ''
          this.saveState = 'done'
          this.error = ''
        }, response => {
          this.saveState = 'error'
          this.error = getError(response)
        })
    }
  }
}
</script>
