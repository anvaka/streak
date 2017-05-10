<template>
  <div>
    <router-link :to='{name: "userPage", params: {userId: project.ownerId}}' class='by-line' v-if='project.owner'>{{project.owner.name}}</router-link>
    <h2 class='project-title' v-if='project'>{{project.title}}</h2>
  </div>
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
  display: none;
}

@media only screen and (max-width: small-screen-size) {
  h2.project-title {
    margin-top: 7px;
    margin-bottom: 14px;
  }
  .by-line {
    font-size: 14px;
    display: block;
    margin-top: 14px;
  }
}
</style>
