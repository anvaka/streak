<template>
  <h2 class='project-title' v-if='project'>
    <span>{{project.title}}</span> <span v-if='!project.canEdit' class='by-line'>by {{project.owner.displayName}}</span>
  </h2>
</template>

<script>
export default {
  name: 'ProjectTitle',
  props: ['project'],
};
</script>

<style lang='stylus' scoped>

@import '../styles/variables.styl';

h2.project-title {
  margin: 12px 0;
  font-weight: normal;
}

.avatar {
  width: 18px;
  height: 18px;
  border-radius: 3px;
}

.by-line {
  font-size: 14px;
}

@media only screen and (max-width: small-screen-size) {
  h2.project-title {
    margin: 14px 0;
  }
}
</style>
