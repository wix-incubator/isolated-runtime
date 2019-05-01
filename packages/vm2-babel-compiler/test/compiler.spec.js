const { NodeVM } = require("vm2");
const compiler = require("..");

describe("VM2 Babel Compiler", () => {
  test("compiles a file with babel", () => {
    const vm = new NodeVM({ compiler });

    expect(() =>
      vm.run(`
    export function multiply(a, b) {
      return a * b
    }`)
    ).not.toThrow();
  });
});
