import Vue from 'vue';
import Router from 'vue-router';
import Home from '../components/Home.vue';
import Dashboard from '../components/Dashboard.vue';
import NewProject from '../components/NewProject.vue';
// import ProjectDetails from '../components/ProjectDetails.vue';

Vue.use(Router);

export default new Router({
  routes: [{
    path: '/',
    component: Home,
    children: [{
      path: '',
      name: 'dashboard',
      component: Dashboard
    }, {
      path: '/new-project',
      name: 'new-project',
      component: NewProject
    }, {
      path: '/:projectId',
      name: 'project-details',
      component: Dashboard,
      props: true
    }]
  }],
});
