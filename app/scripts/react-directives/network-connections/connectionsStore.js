'use strict';

import { action, computed, makeObservable, observable } from 'mobx';
import { SingleConnection, makeConnectionSchema, getConnectionJson } from './singleConnectionStore';

function connectionTypeCompare(cn1, cn2) {
  if (cn1.data.type > cn2.data.type) {
    return 1;
  }
  if (cn1.data.type < cn2.data.type) {
    return -1;
  }
  return 0;
}

function stableSort(arr, compare) {
  return arr
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);
}

function findIndexForNewConnectionName(pattern, connections) {
  let index = 1;
  const re = new RegExp(pattern);
  connections.forEach(cn => {
    if (cn.data.connection_id) {
      const match = cn.data.connection_id.match(re);
      if (match) {
        const next = parseInt(match[1]) + 1;
        index = next > index ? next : index;
      }
    }
  });
  return index;
}

function getNewConnectionData(type, connections) {
  let connection_id = '';
  if (type === 'can') {
    return { type: type, 'allow-hotplug': true, auto: true, options: { bitrate: 125000 } };
  }
  if (type === '01_nm_ethernet') {
    return {
      type: type,
      connection_uuid: '',
      connection_id:
        'Wired connection ' + findIndexForNewConnectionName('Wired connection (\\d+)', connections),
    };
  }
  if (type === '02_nm_modem') {
    return {
      type: type,
      connection_uuid: '',
      connection_id: 'gsm ' + findIndexForNewConnectionName('gsm (\\d+)', connections),
    };
  }
  return { type: type, connection_uuid: '', connection_id: connection_id };
}

class Connections {
  constructor() {
    this.connections = [];
    this.schema = {};
    this.additionalData = {};
    this.selectedConnectionIndex = 0;

    makeObservable(this, {
      connections: observable,
      selectedConnectionIndex: observable,
      deprecatedConnections: computed,
      isDirty: computed,
      setSchemaAndData: action,
      addConnection: action,
      removeConnection: action,
      setSelectedConnectionIndex: action,
      submit: action,
      reset: action,
    });
  }

  get deprecatedConnections() {
    return this.connections.filter(cn => cn.isDeprecated).map(cn => cn.name);
  }

  findConnection(uuid) {
    if (uuid === undefined) {
      return undefined;
    }
    return this.connections.find(item => item.data.connection_uuid == uuid);
  }

  setSchemaAndData(schema, data) {
    this.schema = schema;
    this.additionalData = data;
  }

  addConnection({ type, connectionData, state }) {
    connectionData = connectionData ?? getNewConnectionData(type, this.connections);
    connectionData.data = this.additionalData;

    const connection = new SingleConnection(
      makeConnectionSchema(type, this.schema),
      connectionData,
      state
    );
    this.connections.push(connection);
    this.connections = stableSort(this.connections, connectionTypeCompare);
    return this.connections.findIndex(cn => cn === connection);
  }

  removeConnection(connection) {
    const index = this.connections.findIndex(el => el === connection);
    if (index === -1) {
      return false;
    }
    this.connections.splice(index, 1);
    if (index === this.selectedConnectionIndex) {
      this.selectedConnectionIndex = 0;
    }
    return true;
  }

  setSelectedConnectionIndex(index) {
    if (index >= 0 && index < this.connections.length) {
      this.selectedConnectionIndex = index;
    }
  }

  submit() {
    this.connections.forEach(cn => cn.submit());
  }

  reset() {
    this.connections.forEach(cn => cn.reset());
    const newConnections = this.connections.filter(cn => cn.isNew);
    newConnections.forEach(cn => this.removeConnection(cn));
  }

  get isDirty() {
    return this.connections.some(cn => cn.isDirty);
  }
}

export function connectionsToJson(connections) {
  return connections.map(cn => getConnectionJson(cn.editedData));
}

export function connectionsStoreFromJson(store, json) {
  json.ui.connections.forEach(cn => store.addConnection({ type: cn.type, connectionData: cn }));
  if (store.connections.length) {
    store.setSelectedConnectionIndex(0);
  }
}

export default Connections;
