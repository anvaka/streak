<template>
  <div class='dashboard'>
    <div v-if='noProjects' class='no-projects-sidebar' :class='{someone: projectId}'>
      You don't have any projects yet. <router-link :to='{name: "new-project"}'>Start a new project</router-link>
    </div>

    <div class='projects-overview' v-if='projectId || hasProjects' ref='mainContent'>
      <div v-if='!projectId'>
         <h3 class='welcome-message'>Welcome!</h3>
           Please select a project to get started.
         </div>
      <router-view></router-view>
    </div>


    <div class='projects-list-container' :class='{expanded: projectsListExpanded}' v-if='hasProjects'>
      <div class='projects-header'>
        <h2><span>Your Projects </span><router-link :to='{name: "new-project"}' class='start-new-project'>New project</router-link> </h2>
      </div>
      <div class='project-list'>
          <router-link class='project-link'
            v-for='project in projectList.projects' :to='{name: "project-overview", params: {projectId: project.id}}'
            >{{project.name}}</router-link>
      </div>
    </div>
  </div>
</template>
<script>
import { UiButton, UiIconButton } from 'keen-ui';
import projectList, { loadProjects } from '../lib/projectList.js';

export default {
  name: 'Dashboard',
  props: ['projectId'],
  data() {
    return {
      projectList,
      // If there is no project ID, we are looking at home page
      projectsListExpanded: this.projectId === undefined
    };
  },
  created () {
    loadProjects();
  },

  watch: {
    $route(to) {
      // TODO: this doesn't work very well, if you click on the same project.
      // if we clicked on the "Home" folder, the name is not projects anymore
      this.projectsListExpanded = to.name === 'dashboard';
      const { mainContent } = this.$refs;

      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    }
  },
  computed: {
    hasProjects() {
      return !projectList.loading && projectList.projects.length > 0;
    },
    noProjects() {
      return !projectList.loading && projectList.projects.length === 0;
    }
  },
  methods: {},
  components: {
    UiButton,
    UiIconButton,
  },
};
</script>

<style scoped lang='stylus'>
@import '../styles/variables.styl'

.dashboard {
  flex: 1;
}

.welcome-message {
  margin: 7px 0 14px 0;
}

.projects-overview {
  left: sidebar-width;
  border-left: 1px solid strong-border-color;
  bottom: 0;
  right: 0;
  top: 0;
  padding: default-padding;
  overflow-y: auto;
  position: absolute;
  -webkit-overflow-scrolling: touch;
}

.no-projects-sidebar {
  position: absolute;
  padding: default-padding;
}

.no-projects-sidebar.someone {
  width: sidebar-width;
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

.project-list {
  display: flex;
  flex-direction: column;
}

.projects-list-container {
  position: absolute;
  width: sidebar-width;
  .start-new-project {
    font-size: 14px;
    color: action-color;
  }
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
    font-weight: normal;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.4);
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
