const { EventEmitter } = require("events");
const { randoms } = require("isolated-runtime-test-commons");
const handleConsole = require("../../lib/handleConsole");

describe("handleConsole", () => {
  const vm = new EventEmitter();
  const calls = {};
  const onConsole = (method, ...args) => {
    calls[method] = args;
  };
  handleConsole(vm, onConsole);

  test("forwards console.debug events to handler", () => {
    const args = [randoms.secret()];
    vm.emit("console.debug", ...args);

    expect(calls).toHaveProperty("debug", args);
  });

  test("forwards console.log events to handler", () => {
    const args = [randoms.secret()];
    vm.emit("console.log", ...args);

    expect(calls).toHaveProperty("log", args);
  });

  test("forwards console.info events to handler", () => {
    const args = [randoms.secret()];
    vm.emit("console.info", ...args);

    expect(calls).toHaveProperty("info", args);
  });

  test("forwards console.warn events to handler", () => {
    const args = [randoms.secret()];
    vm.emit("console.warn", ...args);

    expect(calls).toHaveProperty("warn", args);
  });

  test("forwards console.error events to handler", () => {
    const args = [randoms.secret()];
    vm.emit("console.error", ...args);

    expect(calls).toHaveProperty("error", args);
  });
});
