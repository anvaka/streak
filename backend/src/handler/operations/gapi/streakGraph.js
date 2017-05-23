const Datastore = require('@google-cloud/datastore');

const projectId = process.env.DATASTORE_PROJECT_ID || 'streak-146302';
const datastore = Datastore({ projectId });

console.log('Data store initialized. Project id: ', projectId);

module.exports = {
  addNode,
  addEdge,
  removeNode,
  removeEdge,
  getEdgesFrom,
  getNode,
  queryNode
};

function queryNode(kind, pageCursor) {
  const query = datastore.createQuery(kind)
      .order('created', { descending: true })
      .limit(20);

  if (pageCursor) {
    query.start(pageCursor);
  }

  return datastore.runQuery(query)
    .then((results) => {
      const entities = results[0];
      const info = results[1];
      let nextPage = null;
      if (info.moreResults !== Datastore.NO_MORE_RESULTS) {
        nextPage = info.endCursor;
      }

      return {
        users: entities.map(toUserWithId),
        pageCursor: nextPage
      };
    });
}

function toUserWithId(entity) {
  entity.id = entity[datastore.KEY].name;
  return entity;
}

function addNode(node) {
  const transaction = datastore.transaction();
  const nodeKey = [node.kind, node.id];
  const key = datastore.key([node.kind, node.id]);
  console.log(nodeKey, 'addNode ', JSON.stringify(node));

  return transaction.run().then(() => {
    return transaction.get(key);
  }).then((results) => {
    // we set timestamp only it is not created yet.
    const previousNode = results && results[0];
    console.log(nodeKey, 'addNode -> previousNode', JSON.stringify(results));
    if (sameNodes(previousNode, node.data)) {
      console.log(nodeKey, 'node ' + node.id + ' has not changed. Ignoring');

      return transaction.rollback();
    }

    const nodeToSave = Object.assign({}, previousNode, node.data);

    if (!nodeToSave.created) nodeToSave.created = new Date();

    console.log(nodeKey, 'Saving', JSON.stringify(nodeToSave), JSON.stringify(key));
    transaction.save({
      key,
      data: nodeToSave
    });
    return transaction.commit();
  })
  .catch((e) => {
    console.log('Failed to run transaction', e);
    transaction.rollback();
  });
}

function addEdge(fromId, verb, toId) {
  const transaction = datastore.transaction();

  return transaction.run()
    .then(() => {
      const query = transaction.createQuery('edges')
        .filter('fromId', '=', fromId)
        .filter('verb', '=', verb)
        .filter('toId', '=', toId);

      return datastore.runQuery(query);
    }).then((results) => {
      const edges = results && results[0];
      const edgeData = {
        fromId,
        verb,
        toId,
        created: new Date()
      };

      if (edges.length > 0) {
        // edge already exist
        console.log('edge already exist', edgeData);
        return transaction.rollback();
      }
      console.log('Creating edge', edgeData);
      transaction.save({
        key: datastore.key(['edges']),
        data: edgeData
      });

      return transaction.commit();
    });
}

function removeEdge(fromId, verb, toId) {
  console.log('Removing edge', fromId, verb, toId);

  const query = datastore.createQuery('edges')
      .filter('fromId', '=', fromId)
      .filter('verb', '=', verb)
      .filter('toId', '=', toId);

  return datastore.runQuery(query)
    .then((results) => {
      console.log('remove edge results', JSON.stringify(results));
      const edges = results && results[0];
      if (!edges) return;

      return datastore.delete(
        edges.map(edge => edge[datastore.KEY])
      );
    });
}

function removeNode(kind, id) {
  console.log('Removing node', kind, id);
  const nodeKey = datastore.key([kind, id]);
  return datastore.delete(nodeKey);
}

/**
 * Checks if two nodes are the same. 'created' key is ignored.
 */
function sameNodes(a, b) {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;

  const aKeys = Object.keys(a);

  for (let i = 0; i < aKeys.length; ++i) {
    const key = aKeys[i];
    // Ignore this one, as the new node may not have this key.
    if (key === 'created') continue;

    // one level deep equality for now.
    if (b[key] !== a[key]) return false;
  }

  return true;
}

function getEdgesFrom(fromId, verb) {
  console.log('get edges', fromId, verb);
  const query = datastore.createQuery('edges')
      .filter('fromId', '=', fromId)
      .filter('verb', '=', verb)
      .order('created', {
        descending: true
      })
      .limit(20);

  return datastore.runQuery(query)
    .then((results) => {
      const edges = results && results[0];
      return edges || [];
    });
}

function getNode(nodeIds) {
  if (!Array.isArray(nodeIds)) nodeIds = [nodeIds];

  console.log('Get node', nodeIds);

  return datastore.get(nodeIds.map(node => datastore.key([node.kind, node.id])))
    .then(result => {
      console.log('Get node results ', JSON.stringify(result));
      return result[0].map(x => ({
        data: x,
        key: x[datastore.KEY]
      }));
    });
}
