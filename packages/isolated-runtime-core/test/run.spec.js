const path = require("path");
const Chance = require("chance");
const { Context, randoms } = require("isolated-runtime-test-commons");
const { CodeRunner } = require("../");

const chance = new Chance();

describe("run", () => {
  let context;

  describe("With a single sync user function", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("multiply", ["a", "b"], "return a * b")
        .build();
    });
    afterEach(() => context.destroy());

    test("runs a sync method and returns the result", async () => {
      let ran = false;

      const result = await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      }).run({
        funcName: "multiply",
        args: [4, 5],
        running: () => {
          ran = true;
        }
      });

      expect(result).toEqual(20);
      expect(ran).toBeTrue();
    });
  });

  describe("With a single async user function", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("multiply", ["a", "b"], "return Promise.resolve(a * b)")
        .build();
    });
    afterEach(() => context.destroy());

    test("runs an async method and returns the result", async () => {
      const result = await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      }).run({
        funcName: "multiply",
        args: [4, 5]
      });

      expect(result).toEqual(20);
    });
  });

  describe("With a faulty sync user function", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("multiply", ["a", "b"], " throw new Error('Boom!')")
        .build();
    });
    afterEach(() => context.destroy());

    test("reflects the error thrown by the user function", async () => {
      const runner = new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      });

      expect.assertions(1);

      try {
        await runner.run({
          funcName: "multiply",
          args: []
        });
      } catch (error) {
        expect(error.message).toEqual("Boom!");
      }
    });
  });

  describe("With a faulty async user function", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction(
          "multiply",
          ["a", "b"],
          " return Promise.reject(new Error('Boom!'))"
        )
        .build();
    });
    afterEach(() => context.destroy());

    test("reflects the error thrown by the user function", async () => {
      const runner = new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      });

      await expect(
        runner.run({
          funcName: "multiply",
          args: []
        })
      ).rejects.toThrow("Boom!");
    });
  });

  describe("With requiring a node module", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFile(
          "node_modules/lodash/index.js",
          `
            exports.get = (obj, key) => obj[key]
          `
        )
        .withFile(
          `
          const _ = require('lodash')
          function get(obj, key) {
            return _.get(obj, key)
          }

          module.exports = {
            get
          }`
        )
        .build();
    });
    afterEach(() => context.destroy());

    test("reflects the error when node modules is not allowed", async () => {
      expect.assertions(1);

      try {
        await new CodeRunner({
          root: context.basePath,
          file: Context.DEFAULT_FILE_NAME
        }).run({
          funcName: "get",
          args: [{ a: 1 }, "a"]
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot find module 'lodash'`);
      }
    });

    test("allows requiring specific node modules", async () => {
      const result = await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        external: ["lodash"]
      }).run({
        funcName: "get",
        args: [{ a: 1 }, "a"]
      });

      expect(result).toEqual(1);
    });
  });

  describe("With user code requiring relative user-modules", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFile(
          "module1.js",
          `
          const { square } = require('./module2.js')

          function multiplySquare(a, b) {
            return square(a) * square(b)
          }

          module.exports = {
            multiplySquare
          }`
        )
        .withFile(
          "module2.js",
          `
          function square(n) {
            return (n * n)
          }

          module.exports = {
            square
          }`
        )
        .build();
    });
    afterEach(() => context.destroy());

    test("runs the user method with the requires and returns the result", async () => {
      const result = await new CodeRunner({
        root: context.basePath,
        file: "module1.js"
      }).run({
        funcName: "multiplySquare",
        args: [2, 3]
      });

      expect(result).toEqual(36);
    });
  });

  describe("With a nonexisting function name", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFile(
          `
          module.exports = {
            a: 1
          }`
        )
        .build();
    });
    afterEach(() => context.destroy());

    test("throws a FunctionNotFound error", async () => {
      const nonExistingFuncName = chance.word();
      const runner = new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      });

      expect.assertions(2);

      try {
        await runner.run({
          funcName: nonExistingFuncName,
          args: []
        });
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
        expect(error.message).toInclude(nonExistingFuncName);
      }
    });
  });

  describe("With a runtime context", () => {
    let key;
    let value;

    beforeEach(async () => {
      key = randoms.secret();
      value = randoms.secret();
      context = await new Context({ basePath: __dirname })
        .withFunction(
          "fromContext",
          ["name"],
          "return __globals__.__context__[name]"
        )
        .build();
    });
    afterEach(() => context.destroy());

    test("passes the context as a global variable to the sandbox", async () => {
      const result = await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      }).run({
        funcName: "fromContext",
        args: [key],
        context: {
          [key]: value
        }
      });

      expect(result).toEqual(value);
    });
  });

  describe("With a custom file extension", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFile(
          "aModule.jx",
          `
          function multiply(a, b) {
            return a * b
          }

          module.exports = {
            multiply
          }`
        )
        .build();
    });
    afterEach(() => context.destroy());

    test("passes the context as a global variable to the sandbox", async () => {
      const result = await new CodeRunner({
        root: context.basePath,
        file: "aModule.jx",
        sourceExtensions: ["jx"]
      }).run({
        funcName: "multiply",
        args: [4, 5]
      });

      expect(result).toEqual(20);
    });
  });

  describe("With a custom code compiler", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("multiply", ["a", "b"], "return a + b")

        .build();
    });
    afterEach(() => context.destroy());

    test("runs successfully", async () => {
      const result = await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        compiler: code => code.replace("+", "*")
      }).run({
        funcName: "multiply",
        args: [4, 5]
      });

      expect(result).toEqual(20);
    });
  });

  describe("With an arguments transformer", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("multiply", ["a", "b"], "return a * b")

        .build();
    });
    afterEach(() => context.destroy());

    test("runs successfully", async () => {
      const result = await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      }).run({
        funcName: "multiply",
        resolveArguments: args => args.map(a => a + 1),
        args: [4, 5]
      });

      expect(result).toEqual(30);
    });
  });

  describe("With multiple module paths and custom require", () => {
    let additionalModulesContext;

    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction(
          "multiply",
          ["a", "b"],
          `return require('multiply')(a, b)`
        )
        .build();

      additionalModulesContext = await new Context({
        basePath: __dirname
      })
        .withFile("multiply/index.js", "module.exports = (a, b) => a * b")
        .build();
    });
    afterEach(() =>
      Promise.all([context.destroy(), additionalModulesContext.destroy()])
    );

    test("runs successfully", async () => {
      const additionalModulesPath = additionalModulesContext.basePath;

      const result = await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        whitelistedPaths: [additionalModulesPath],
        external: ["multiply"],
        resolve: moduleName => path.join(additionalModulesPath, moduleName)
      }).run({
        funcName: "multiply",
        args: [4, 5]
      });

      expect(result).toEqual(20);
    });
  });
});
