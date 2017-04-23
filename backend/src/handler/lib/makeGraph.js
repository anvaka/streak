const DyGraph = require('./DyGraph.js');
const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient({
// TODO: Should come from config?
  region: 'us-west-2'
});

module.exports = function makeGraph() {
  return new DyGraph({
    edgesTable: 'Streak_Graph_Edges',
    nodesTable: 'Streak_Graph_Nodes',
    dynamo
  });
};
