<template>
  <div class='projects-list-container' :class='{expanded: !projectId}'>
    <div class='projects-header' v-if='!projectList.owner'>
      <h2><span>Your Projects </span><router-link :to='{name: "new-project"}' class='start-new-project'>New project</router-link> </h2>
    </div>
    <div v-if='projectList.owner' >
      <router-link :to='{name: "userPage", params: { userId: myId }}' class='back-to-your-home'>↰ back to your projects</router-link>
    <div class='owner-header'>
      <img :src='projectList.owner.picture' class='avatar'>
      <div class='owner-name'>
        <div class='secondary byline'>Projects by</div>
        <div>{{projectList.owner.name}}</div>
      </div>
    </div>
    </div>
    <div class='project-list'>
        <router-link class='project-link'
          v-for='project in projectList.projects' :to='{name: "project-overview", params: {projectId: project.id, userId: project.ownerId}}'
          >{{project.title}}</router-link>
    </div>
  </div>
</template>
<script>
import { getCurrentUserId } from '../lib/auth.js';

export default {
  name: 'ProjectList',
  props: ['projectList', 'projectId'],
  data() {
    return {
      myId: getCurrentUserId(),
    }
  },
};
</script>

<style scoped lang='stylus'>
@import '../styles/variables.styl'

.project-list {
  display: flex;
  flex-direction: column;
}
.project-link {
  color: secondary-text-color;
  line-height: 24px;
  font-size: 18px;
  display: inline-block;
  padding: default-padding;
  padding-top: 6px;
  padding-bottom: 7px;
  &:hover {
    color: black;
  }
}

.project-link.router-link-active  {
  color: black;
  background: border-color;
}
.projects-list-container {
  position: absolute;
  width: sidebar-width;
  .start-new-project {
    font-size: 14px;
    color: action-color;
  }
}

.byline {
  font-size: 12px;
}

.back-to-your-home {
  padding: 14px;
  display: block;
  border-bottom: 1px solid;
  border-top: 1px solid;
  border-color: border-color;
}
h2 {
  font-weight: normal;
  font-size: 14px;
}
.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: default-padding;
  border: 1px solid border-color;
  height: 37px;
  h2 {
    flex: 1;
    margin: 0;
    display: flex;
    justify-content: space-between;
    color: rgba(0, 0, 0, 0.4);
  }
}
.owner-header {
  padding: 14px;
  display: flex;
  align-items: center;
  font-size: 18px;
  img {
    width: 64px;
    height: 64px;
    margin-right: 14px;
  }
}

@media only screen and (max-width: small-screen-size) {
  .projects-list-container {
    height: 100%;
    padding-top: 12px;
    bottom: 0;
    overflow-y: auto;
    background: screen-background;
    display: none;
  }
  .projects-list-container.expanded {
    top: 56px;
    display: block;
  }

  .projects-overview {
    left: 0;
    top: 55px;
    bottom: 0;
    padding-top: 0;
  }
  .toggle-list {
    display: inline-block;
    font-size: 14px;
    color: action-color;
  }
}

</style>
