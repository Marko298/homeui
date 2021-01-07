import mqttServiceModule from '../../../app/scripts/services/mqttService';

export default angular.module('homeuiApp.fakeMqtt', [mqttServiceModule])
  .factory("mqttBroker", ($rootScope, $timeout, topicMatches) => {
    var clientMap = Object.create(null),
        subscriptionMap = Object.create(null);

    function spread(msg) {
      var clients = [];
      Object.keys(subscriptionMap).sort().forEach(pattern => {
        if (!topicMatches(pattern, msg.topic))
          return;
        subscriptionMap[pattern].forEach(client => {
          if (clients.indexOf(client) < 0)
            clients.push(client);
        });
      });
      clients.forEach(client => { client._receive(msg); });
    }

    class Client {
      constructor () {
        this.stickySubscriptions = [];
        this.connected = false;
      }

      getID () { // FIXME: add this to the real mqttService
        return this.clientid;
      }

      connect (host, port, clientid, user, password) {
        if (this.connected)
          throw new Error("already connected");
        if (!clientid)
          throw new Error("bad or unspecified clientid");
        if (clientMap[clientid])
          throw new Error("clientid already in use");
        this.clientid = clientid;
        this.connected = true;
        this.callbackMap = Object.create(null); // TBD: add global callback
        clientMap[clientid] = this;
        this.stickySubscriptions.forEach(item => {
          this.subscribe(item.topic, item.callback);
        });
        $timeout(() => { $rootScope.$digest(); });
      }

      disconnect () {
        if (!this.connected)
          return;
        this.connected = false;
        this.callbackMap = Object.create(null);
        for (var topic in subscriptionMap) {
          if (subscriptionMap[topic].indexOf(this) >= 0)
            subscriptionMap[topic] = subscriptionMap[topic].filter(client => client != this);
        }
        delete clientMap[this.clientid];
        $timeout(() => { $rootScope.$digest(); });
      }

      isConnected () {
        return this.connected;
      }

      _receive (msg) {
        Object.keys(this.callbackMap).sort().forEach((pattern) => {
          if (!topicMatches(pattern, msg.topic))
            return;
          this.callbackMap[pattern].forEach((callback) => {
            callback(msg);
          });
        }, this);
      }

      subscribe (topic, callback) {
        if (!this.connected)
          throw new Error("not connected");
        var l = subscriptionMap[topic];
        if (!l)
          subscriptionMap[topic] = [ this ];
        else if (l.indexOf(this) < 0)
          l.push(this);
        this.callbackMap[topic] = (this.callbackMap[topic] || []).concat([callback]);
      }

      unsubscribe (topic) {
        if (!this.connected)
          throw new Error("not connected");
        if (!subscriptionMap[topic])
          return;
        subscriptionMap[topic] = subscriptionMap[topic].filter(client => client != this);
        delete this.callbackMap[topic];
      }

      addStickySubscription (topic, callback) {
        this.stickySubscriptions.push({ topic: topic, callback: callback });
        if (this.connected)
          this.subscribe(topic, callback);
      }

      send (topic, payload, retained, qos) {
        if (retained === undefined)
          retained = true; // FIXME: that's counterintuitive behavior
        if (qos === undefined)
          qos = 1; // FIXME: use QoS 1 globally
        spread({
          topic: topic,
          payload: payload,
          retained: retained,
          qos: qos
        });
      }
    }

    return {
      createClient () {
        return new Client();
      }
    };
  })

  .factory("mqttClient", ($rootScope, mqttBroker) => {
    return mqttBroker.createClient();
  })

  .factory("FakeMqttFixture", ($rootScope, mqttBroker, mqttClient, $timeout, whenMqttReady) => {
    var journal = [];
    return {
      $rootScope: $rootScope,
      $timeout: $timeout,
      broker: mqttBroker,
      mqttClient: mqttClient,
      extClient: mqttBroker.createClient(),
      whenMqttReady: whenMqttReady,
      useJSON: false,

      connect() {
        this.extClient.connect("localhost", 1883, "extclient", "", "");
        this.mqttClient.connect("localhost", 1883, "ui", "", "");
        $timeout.flush();
      },

      msgLogger(title) {
        return msg => {
          var p = msg.payload;
          if (this.useJSON)
            p = "-";
          journal.push(title + ": " + msg.topic + ": [" + p + "] (QoS " + msg.qos +
                       (msg.retained ? ", retained)" : ")"));
          if (this.useJSON)
            journal.push(JSON.parse(msg.payload));
        };
      },

      expectJournal() {
        var r = journal;
        journal = [];
        return expect(r);
      },

      delegateVia(target) {
        for (var k in this) {
          if (!this.hasOwnProperty(k))
            continue;
          var v = this[k];
          target[k] = k != "$timeout" && angular.isFunction(v) ? v.bind(this) : v;
        }
      }
    };
  })
  .name;
