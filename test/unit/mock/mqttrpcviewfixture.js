import appModule from '../../../app/scripts/app';
import mqttRpcServiceModule from '../../../app/scripts/services/rpc';
import fakeMqttModule from '../mock/fakemqtt';
import viewfixtureModule from '../mock/viewfixture';

export default angular.module("homeuiApp.mqttRpcViewFixture", 
  [appModule, fakeMqttModule, viewfixtureModule, mqttRpcServiceModule])
  .factory("MqttRpcViewFixture", (FakeMqttFixture, ViewFixture) => {
    var reqId = 1;

    function doExpectRequest(topic, params) {
      FakeMqttFixture.expectJournal().toEqual([
        "ext: " + topic + "/ui: [-] (QoS 1)",
        {
          id: reqId,
          params: params
        }
      ]);
    }

    class MqttRpcViewFixture extends ViewFixture {
      constructor(topic, url, controllerName, locals) {
        super(url, controllerName, locals, { topic: topic });
      }

      setup(options) {
        FakeMqttFixture.useJSON = true;
        FakeMqttFixture.delegateVia(this);
        this.connect();
        this.extClient.subscribe(options.topic + "/+/+", FakeMqttFixture.msgLogger("ext"));
        super.setup(options);
      }

      expectRequest(topic, params, response) {
        doExpectRequest(topic, params);
        this.extClient.send(
          topic + "/ui/reply",
          JSON.stringify({
            id: reqId++,
            result: response
          }));
        this.$rootScope.$digest(); // resolve the promise
      }

      expectRequestAndFail(topic, params, error) {
        doExpectRequest(topic, params);
        this.extClient.send(
          topic + "/ui/reply",
          JSON.stringify({
            id: reqId++,
            error: error
          }));
        this.$rootScope.$digest(); // resolve the promise
      }
    }

    return MqttRpcViewFixture;
  })
  .name;
