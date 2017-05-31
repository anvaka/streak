<template>
  <div class='sidebar-container' :class='{expanded: !projectId}' >
    <div class='owner-header' v-if='projectList.owner'>
      <img :src='projectList.owner.picture' class='avatar'>
      <div class='owner-name'>
        <div>{{projectList.owner.name}}</div>
        <div class='secondary byline'>Projects</div>
      </div>
    </div>

    <div v-if='noProjects' class='no-projects-sidebar' :class='{"has-no-avatar": !projectList.owner}'>
      There are no public projects here yet.
    </div>
    <router-link
      v-if='projectList.owner && myProjectList'
      :to='{name: "new-project"}' class='start-new-project'>Start a new project</router-link>
    <div class='project-list' :class='{mine: myProjectList}'>
        <router-link class='project-link'
          v-for='project in projectList.projects' :to='{name: "project-overview", params: {projectId: project.id, userId: project.ownerId}}'
          >{{project.title}}</router-link>
    </div>
    <router-link
      :to='{name: "userPage", params: { userId: myId }}' class='back-to-your-home'
      v-if='!myProjectList'>↰ back to your projects</router-link>
    <div class='about'>
      <div slot='brand' class='brand'>
        <router-link to='/' class='logo-text'> Streak <small title='Alpha version means that bugs are expected! Please do not use for anything critical.'>αλφα</small></router-link>
        <div class='go-outside'>
          <router-link to='/explore'>explore</router-link>
          <router-link to='/about' >about</router-link>
        </div>
      </div>
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
    };
  },
  computed: {
    myProjectList() {
      return this.myId === this.projectList.ownerId;
    },

    noProjects() {
      return !this.projectList.loading && this.projectList.projects.length === 0;
    },
  }
};
</script>

<style scoped lang='stylus'>
@import '../styles/variables.styl'

.brand {
  border-top: 1px solid border-color;
}
.go-outside {
  display: inline-block;
  a {
    padding: 14px;
  }
}

.project-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  flex-shrink: 0;
  overflow-y: auto;
}
.project-list.mine {
  padding-top: 14px;
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
.no-projects-sidebar {
  padding: default-padding;
  margin: 14px 0;
}

.no-projects-sidebar.has-no-avatar {
  margin-top: 50px;
}

.project-link.router-link-active  {
  color: black;
  background: border-color;
}
.sidebar-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 0;
  bottom: 0;
  width: sidebar-width;
  .start-new-project {
    font-size: 14px;
    color: action-color;
    width: 100%;
    display: block;
    padding: 14px;
    border-top: 1px solid border-color;
    border-bottom: 1px solid border-color;
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
.new-project {
  font-weight: normal;
  font-size: 14px;
  margin: 0;
}

.owner-header {
  padding: 14px;
  display: flex;
  flex-shrink: 0;
  font-size: 18px;
  img {
    width: 64px;
    height: 64px;
    margin-right: 14px;
  }
}

.logo-text {
  color: rgba(0, 0, 0, 0.2);
  text-decoration: none;
  font-size: 24px;
  small {
    font-size: 14px;
  }
}
.about {
  width: 100%;
  text-align: center;
  padding-bottom: 7px;
  background: white;
}
.small {
  font-size: 0.7rem;
}
.heart {
  color: rgba(255, 0, 43, 0.24)
}

@media only screen and (max-width: small-screen-size) {
  .sidebar-container {
    height: 100%;
    width: 100%;
    bottom: 0;
		overflow-y: hidden;
    background: screen-background;
    display: none;
  }

  .no-projects-sidebar.has-no-avatar {
    margin-top: 45vh;
  }
  .sidebar-container.expanded {
    display: flex;
  }

  .projects-overview {
    left: 0;
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
