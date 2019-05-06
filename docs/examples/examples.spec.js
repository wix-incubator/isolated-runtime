const basic = require("./basic");

describe("Docs Examples", () => {
  describe("Basic", () => {
    test("runs the sum function and returns the result", async () => {
      const result = await basic();

      expect(result).toEqual(5);
    });
  });
});
