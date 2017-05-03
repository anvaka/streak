<template>
  <div class='user-page'>

    <loading :isLoading='projectList.loading' class='project-list-loading'>Loading project list...</loading>
    <div v-if='noProjects' class='no-projects-sidebar' :class='{someone: projectId}'>
      You don't have any projects yet. <router-link :to='{name: "new-project"}'>Start a new project</router-link>
    </div>

    <div class='projects-overview' v-if='projectId || hasProjects' ref='mainContent'>
      <div v-if='!projectId'>
         <h3 class='welcome-message'>Welcome!</h3>
           Please select a project to get started.
      </div>
      <router-view :project='currentProject' v-if='currentProject'></router-view>

      <div v-if='!currentProject && !projectList.loading && projectId'>
        <!-- This can happen when someone edited the url -->
        <h3> ¯\_(ツ)_/¯</h3>
        <p>
          Hmm, I can't find this project. Are you sure the website address is correct?
        </p>
      </div>
    </div>

    <project-list :project-list='projectList' v-if='hasProjects' :project-id='projectId' ></project-list>
  </div>
</template>
<script>
import UiButton from 'keen-ui/src/UiButton';
import UiIconButton from 'keen-ui/src/UiIconButton';

import ProjectList from './ProjectList.vue';
import Loading from './Loading.vue';

import getProjectList from '../lib/getProjectList.js';
import setPageTitle from '../lib/setPageTitle.js';

export default {
  name: 'UserPage',
  props: ['projectId', 'userId'],
  components: {
    ProjectList,
    UiButton,
    UiIconButton,
    Loading,
  },
  data() {
    return {
      projectList: getProjectList(this.userId),
      projectsListExpanded: this.projectId === undefined
    };
  },
  created() {
    setPageTitle();
  },
  watch: {
    $route(to, from) {
      const { mainContent } = this.$refs;

      if (mainContent) {
        mainContent.scrollTop = 0;
      }

      if (to.params.userId !== from.params.userId) {
        this.projectList = getProjectList(to.params.userId);
      }

      const isProjectPage = to.params && to.params.projectId;
      if (!isProjectPage) {
        setPageTitle();
      }
    }
  },
  computed: {
    hasProjects() {
      return !this.projectList.loading && this.projectList.projects.length > 0;
    },
    noProjects() {
      return !this.projectList.loading && this.projectList.projects.length === 0;
    },
    currentProject() {
      if (this.projectList.loading) return null;
      return this.projectList.get(this.projectId);
    }
  },
};
</script>

<style scoped lang='stylus'>
@import '../styles/variables.styl'

.user-page {
  flex: 1;
}

.project-list-loading {
  margin-left: 5px;
  margin-top: 13px;
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

@media only screen and (max-width: small-screen-size) {
  .projects-overview {
    left: 0;
    top: 55px;
    bottom: 0;
    padding-top: 0;
  }
}
</style>
