import Vue from 'vue';
import Router from 'vue-router';
import UserPage from '../components/UserPage.vue';
import AddRecordContainer from '../components/AddRecordContainer.vue';
import NewProject from '../components/NewProject.vue';
import ProjectPage from '../components/ProjectPage.vue';
import AboutPage from '../components/AboutPage.vue';
import ProjectOverview from '../components/ProjectOverview.vue';
import ProjectSettings from '../components/settings/ProjectSettings.vue';

Vue.use(Router);

export default new Router({
  routes: [{
    // By default I want people to go to the user page. This might be changed
    // in future
    path: '/',
    name: 'redirectToUser',
  }, {
    path: '/about',
    name: 'about',
    component: AboutPage,
  }, {
    path: '/new-project',
    name: 'new-project',
    component: NewProject
  }, {
    path: '/:userId',
    name: 'userPage',
    component: UserPage,
    props: true
  }, {
    path: '/:userId/project/:projectId',
    component: UserPage,
    props: true,
    children: [{
      path: '',
      component: ProjectPage,
      props: true,
      children: [{
        path: '',
        name: 'project-overview',
        props: true,
        component: ProjectOverview
      }, {
        path: 'settings',
        name: 'project-settings',
        props: true,
        component: ProjectSettings
      }, {
        path: 'add',
        name: 'add-record',
        component: AddRecordContainer,
        props: true
      }, {
        path: 'edit-record/:row',
        name: 'edit-record',
        component: AddRecordContainer,
        props: true
      }]
    }]
  }],
});
