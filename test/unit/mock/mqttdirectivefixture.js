import fakeMqttModule from './fakemqtt';
import viewFixtureModule from './viewfixture';

export default angular.module("homeuiApp.mqttDirectiveFixture", [fakeMqttModule, viewFixtureModule])
  .factory("MqttDirectiveFixture", (FakeMqttFixture, HtmlFixture) => {
    const DEFAULT_TOPIC = "/devices/+/controls/+/on";

    class MqttDirectiveFixture extends HtmlFixture {
      constructor(html, options) {
        super(html, angular.extend({ topic: DEFAULT_TOPIC }, options || {}));
      }

      setup(options) {
        FakeMqttFixture.delegateVia(this);
        this.connect();
        this.extClient.subscribe(options.topic, FakeMqttFixture.msgLogger("ext"));
        super.setup(options);
      }
    }

    return MqttDirectiveFixture;
  })
  .name;