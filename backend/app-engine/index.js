const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const extractUser = require('./lib/extractUser.js');
const updateProject = require('./lib/updateProject.js');
const listProjects = require('./lib/listProjects.js');

const app = express();

enableCors();

// app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/update-project', extractUser, (req, res) => {
  updateProject(req.body, req.user).then((results) => {
    console.log('project updated', results);

    res.status(200).send(JSON.stringify({})).end();
  });
});

app.get('/list-projects', extractUser, (req, res) => {
  listProjects(req.query).then(results => {
    res.status(200).send(JSON.stringify(results));
  });
});

// health check
app.get('/_ah/health', ok);
app.get('/', ok);

function ok(req, res) {
  res.status(200).send('ok');
}

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

function enableCors() {
  const whitelist = new Set(['https://streak.anvaka.com', 'http://localhost:8100']);

  const corsOptions = {
    origin(origin, callback) {
      console.log(origin);
      if (whitelist.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  };

  app.use(cors(corsOptions));
}
