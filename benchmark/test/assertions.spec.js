const benchmark = require("../benchmark");

describe("Benchmark", () => {
  const observed = () => {};
  const count = 10;
  const totalTime = 100;

  test("throws when the passed observed parameter is not a function", () => {
    expect(() => benchmark(1)).toThrow("observed must be a function");
  });

  test("throws when the passed parameter count is not an integer", () => {
    expect(() => benchmark(observed)).toThrow("count must be an integer");
  });

  test("throws when the passed parameter totalTime is not an integer", () => {
    expect(() => benchmark(observed, { count })).toThrow(
      "totalTime must be an integer"
    );
  });

  test("it does not throw when all params are valid", () => {
    expect(() => benchmark(observed, { count, totalTime })).not.toThrow();
  });
});
