class DyGraph {
  constructor(options) {
    this.options = options;
    this._pendingNodes = [];
    this._pendingEdges = [];
  }

  addNode(nodeId, data) {
    this._pendingNodes.push({
      id: nodeId,
      data
    });
  }

  removeEdge(fromId, toId) {
    this._pendingEdges.push({
      operation: 'remove',
      fromId,
      toId
    });
  }

  addEdge(fromId, toId, data) {
    this._pendingEdges.push({
      operation: 'update',
      fromId,
      toId,
      data
    });
  }

  getOutEdges(fromId, beginsWith, onlyEdges) {
    const params = {
      TableName: this.options.edgesTable,
      KeyConditionExpression: 'FromId = :fromId',
      ExpressionAttributeValues: {
        ':fromId': fromId,
      }
    };

    if (beginsWith) {
      params.KeyConditionExpression += ' and begins_with(ToId, :beginsWith)';
      params.ExpressionAttributeValues[':beginsWith'] = beginsWith;
    }
    const { dynamo, nodesTable } = this.options;

    return new Promise((resolve, reject) => {
      dynamo.query(params).promise().then(resolve, reject);
    }).then(fetchOtherEnd);

    function fetchOtherEnd(response) {
      const edges = (response ? response.Items : []).map(edge => edge.ToId);
      if (onlyEdges) {
        return edges;
      }

      const nodesToFetch = edges.map(edgeId => ({
        // this will remove edge type prefix from the edge definition.
        // e.g.
        // "owns.project.0B8W6vQAc4byGT2t3dmRDYjNEdTQ"
        //   .split('.') // -> ["owns", "project", "0B8W6vQAc4byGT2t3dmRDYjNEdTQ"]
        //   .slice(1)  //  -> ["project", "0B8W6vQAc4byGT2t3dmRDYjNEdTQ"]
        //   .join('.')  // ->  "project.0B8W6vQAc4byGT2t3dmRDYjNEdTQ"
        NodeId: edgeId.split('.').slice(1).join('.')
      }));

      const request = {
        RequestItems: {
          [nodesTable]: { Keys: nodesToFetch },
        }
      };
      console.log('Fetching edges', JSON.stringify(request));

      return new Promise((resolve, reject) => {
        dynamo.batchGet(request).promise().then(resolve, reject);
      }).then(batchResult => {
        return batchResult.Responses[nodesTable] || [];
      });
    }
  }


  getInEdges(toId) {
    const params = {
      TableName: this.options.edgesTable,
      IndexName: 'ToId',
      KeyConditionExpression: 'ToId = :toId',
      ExpressionAttributeValues: {
        ':toId': toId,
      }
    };

    return new Promise((resolve, reject) => {
      this.options.dynamo.query(params).promise().then(resolve, reject);
    });
  }

  save() {
    const updates = this._pendingNodes.map(node => {
      return updateNode(this.options.dynamo, this.options.nodesTable, node);
    }).concat(this._pendingEdges.map(edge => {
      return edge.operation === 'update' ?
        updateEdge(this.options.dynamo, this.options.edgesTable, edge) :
        removeEdge(this.options.dynamo, this.options.edgesTable, edge);
    }));

    return Promise.all(updates);
  }
}

module.exports = DyGraph;

function updateNode(dynamo, table, node) {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: table,
      Key: { NodeId: node.id, },
      UpdateExpression: 'SET  createdTime = if_not_exists(createdTime, :createdTime)',
      ExpressionAttributeValues: {
        ':createdTime': (new Date()).toISOString(),
      }
    };

    const cleanData = removeEmptyAttributes(node.data);
    if (cleanData) {
      params.UpdateExpression += ', #data = :nodeData';
      params.ExpressionAttributeNames = { '#data': 'data' };
      params.ExpressionAttributeValues[':nodeData'] = cleanData;
    }

    dynamo.update(params).promise().then(resolve, reject);
  });
}

function removeEmptyAttributes(obj) {
  if (!obj) return;

  const result = {};
  let hasAttributes = false;
  Object.keys(obj).forEach(key => {
    if (obj[key]) {
      result[key] = obj[key];
      hasAttributes = true;
    }
  });

  return hasAttributes && result;
}

function updateEdge(dynamo, table, edge) {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: table,
      Key: {
        FromId: edge.fromId,
        ToId: edge.toId
      },
      UpdateExpression: 'SET createdTime = if_not_exists(createdTime, :createdTime)',
      ExpressionAttributeValues: {
        ':createdTime': (new Date()).toISOString(),
      }
    };

    if (edge.data) {
      params.UpdateExpression += ', #data = :edgeData';
      params.ExpressionAttributeNames = { '#data': 'data' };
      params.ExpressionAttributeValues[':edgeData'] = edge.data;
    }

    dynamo.update(params).promise().then(resolve, reject);
  });
}

function removeEdge(dynamo, table, edge) {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: table,
      Key: {
        FromId: edge.fromId,
        ToId: edge.toId
      },
    };

    dynamo.delete(params).promise().then(resolve, reject);
  });
}
