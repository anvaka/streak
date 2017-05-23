const test = require('tap').test;
const request = require('request');
const createUser = require('./lib/create-user.js');
const encodeUser = require('./lib/encode-user.js');

const endpoint = process.env.REST_STREAK_INTEGRATION;

if (!endpoint) {
  console.log('Make sure to specify REST_STREAK_INTEGRATION endpoint in environment variables');
  process.exit(1);
}

console.log('Starting tests at ' + endpoint);

test('it can update user info', t => {
  const userName = 'john smith 1';
  const userPicture = 'www.site.com/picture.png';
  const user = createUser(userName, userPicture);

  rp('post', {
    qs: { id_token: user },
    form: { operation: 'update-user-info' }
  })
  .then(() => rp('get', {
    qs: {
      id_token: user,
      operation: 'list-users'
    }
  })).then(response => {
    const ourUserIsHere = response.users.find(u => {
      return u.name === userName && u.picture === userPicture;
    });

    t.ok(ourUserIsHere, 'User info updated');

    t.end();
  })
  .catch(err => {
    t.fail(err);
  });
});

test('it can update project info', t => {
  const user = createUser('Anna Bella');

  const project = {
    projectId: 'anna_project_1',
    name: 'my project',
    description: 'simple project',
    isPublic: true
  };

  setProjectPublic(project, true)
  .then(listProjects)
  .then(response => {
    t.equals(response.user.name, user.data.name, 'user name is correct');
    t.equals(response.user.id, user.id, 'project owner is correct');
    t.equals(response.projects.length, 1, 'number of projects is correct');
    const myProject = response.projects[0];

    t.equals(myProject.id, project.projectId, 'project id is valid');
    t.equals(myProject.data.name, project.name, 'project name is avlid');
    t.equals(myProject.data.description, project.description, 'project description is valid');
  })
    // Now lets remove this project from public
  .then(() => setProjectPublic(project, false))
  .then(listProjects)
  .then(response => {
    t.equals(response.user.name, user.data.name, 'user name is still here');
    t.equals(response.user.id, user.id, 'project owner is still correct');
    t.equals(response.projects.length, 0, 'no public projects');

    t.end();
  });

  function setProjectPublic(project, isPublic) {
    const form = Object.assign({
      operation: 'set-project-public',
    }, project);
    form.isPublic = isPublic;

    return rp('post', {
      form,
      qs: { id_token: user }
    });
  }

  function listProjects() {
    return rp('get', {
      qs: {
        id_token: user,
        operation: 'list-projects',
        userId: user.id
      }
    });
  }
});


function rp(method, options) {
  if (options.qs.id_token) {
    options.qs.id_token = encodeUser(options.qs.id_token);
  }

  return new Promise((resolve, reject) => {
    request[method](endpoint, options, (error, response, body) => {
      if (error) reject(error);
      if (body) resolve(JSON.parse(body));
      else resolve(body);
    });
  });
}
