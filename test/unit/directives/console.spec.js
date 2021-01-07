import mqttDirectiveFixtureModule from '../mock/mqttdirectivefixture';
import fakeTimeModule from '../mock/faketime';

describe("Directive: console", () => {
  var f, FakeTime;

  beforeEach(angular.mock.module(mqttDirectiveFixtureModule, fakeTimeModule));

  beforeEach(angular.mock.inject(($rootScope, _FakeTime_, MqttDirectiveFixture) => {
    FakeTime = _FakeTime_;
    // Note that month index '5' means June here due to JS Date() API specifics
    FakeTime.setTime(new Date(2015, 5, 19, 20, 25, 6));
    f = new MqttDirectiveFixture("<console></console>");
    f.element.find(".console-messages").css({
      fontSize: "12px",
      position: "absolute",
      left: 0,
      top: 0,
      width: "200px",
      maxHeight: "50px",
      margin: 0,
      padding: 0,
      overflowY: "auto"
    });
  }));

  afterEach(() => { f.remove(); });

  function extractMessages () {
    var result =  f.element.find(".console-message").toArray().map(el => {
      el = $(el);
      var levelClasses = el.prop("className")
            .replace(/^\s+|\s+$/g, "")
            .split(/\s+/)
            .filter(className => /^console-message-level-/.test(className)),
          ts = el.find(".console-message-ts"),
          text = el.find(".console-message-text");
      expect(levelClasses.length).toBe(1);
      expect(ts).toHaveLength(1);
      expect(text).toHaveLength(1);
      return {
        level: levelClasses[0].replace(/^console-message-level-/, ""),
        ts: ts.text(),
        text: text.text()
      };
    });
    return result;
  }

  it("should not display any messages initially", () => {
    expect(extractMessages()).toEqual([]);
  });

  it("should receive and display console messages", () => {
    f.extClient.send("/wbrules/log/info", "Info message");
    expect(extractMessages()).toEqual([
      { level: "info", ts: "2015-06-19 20:25:06", text: "Info message" }
    ]);

    FakeTime.setTime(new Date(2015, 5, 19, 20, 25, 16));
    f.extClient.send("/wbrules/log/debug", "Debug message");
    FakeTime.setTime(new Date(2015, 5, 19, 20, 25, 26));
    f.extClient.send("/wbrules/log/warning", "Warning message");
    FakeTime.setTime(new Date(2015, 5, 19, 20, 25, 36));
    f.extClient.send("/wbrules/log/error", "Error message");

    expect(extractMessages()).toEqual([
      { level: "info",    ts: "2015-06-19 20:25:06", text: "Info message" },
      { level: "debug",   ts: "2015-06-19 20:25:16", text: "Debug message" },
      { level: "warning", ts: "2015-06-19 20:25:26", text: "Warning message" },
      { level: "error",   ts: "2015-06-19 20:25:36", text: "Error message" }
    ]);
  });

  it("should scroll to the bottom after receiving messages", () => {
    for (var i = 0; i < 60; ++i) {
      FakeTime.setTime(new Date(2015, 5, 19, 20, 25, 16));
      f.extClient.send("/wbrules/log/info", "Info message");
      if (i > 30)
        f.$timeout.flush();
    }
    var messagesEl = f.element.find(".console-messages");
    expect(messagesEl).toExist();
    expect(messagesEl.scrollTop()).toBeGreaterThan(0);
    expect(messagesEl.scrollTop()).toBe(messagesEl.prop("scrollHeight") - messagesEl.height());
  });

  describe("toggle switch", () => {
    var sw;

    beforeEach(() => {
      sw = f.container.find("input[type=checkbox][name='debug']");
    });

    it("should accept 'Rule debugging' values", () => {
      expect(sw).toExist();
      expect(sw.prop("checked")).toBe(false);
      f.extClient.send("/devices/wbrules/controls/Rule debugging", "1");
      f.$rootScope.$digest();
      expect(sw.prop("checked")).toBe(true);
      f.extClient.send("/devices/wbrules/controls/Rule debugging", "0");
      f.$rootScope.$digest();
      expect(sw.prop("checked")).toBe(false);
    });

    it("should toggle 'Rule debugging' when clicked", () => {
      f.expectJournal().toEqual([]);
      sw.click();
      f.$rootScope.$digest();
      f.expectJournal().toEqual([
        "ext: /devices/wbrules/controls/Rule debugging/on: [1] (QoS 1)"
      ]);
      sw.click();
      f.$rootScope.$digest();
      f.expectJournal().toEqual([
        "ext: /devices/wbrules/controls/Rule debugging/on: [0] (QoS 1)"
      ]);
    });
  });
});
