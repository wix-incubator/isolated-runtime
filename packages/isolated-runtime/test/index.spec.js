const { Context, randoms } = require("isolated-runtime-test-commons");
const path = require("path");
const {
  IsolatedRuntime,
  errors: { RuntimeTimeoutError }
} = require("../");

describe("isolated-runtime", () => {
  let context;
  let otherContext;
  let runtime;

  beforeEach(() => {
    runtime = new IsolatedRuntime({
      poolOptions: {
        min: 2,
        max: 2
      },
      sourceExtensions: ["jx", "js"],
      resolverModulePath: path.resolve(__dirname, "fixtures", "resolve.js"),
      compilerModulePath: path.resolve(__dirname, "fixtures", "compiler.js"),
      timeout: 1500
    });
  });

  afterEach(() => runtime.shutdown());

  describe("with an async function", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("multiply", ["a", "b"], "return a * b")
        .build();
    });
    afterEach(() => context.destroy());

    it("runs the code in a given file and returns a promise resolving to the result", async () => {
      const result = await runtime.run({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        funcName: "multiply",
        args: [2, 3]
      });

      expect(result).toEqual(6);
    });
  });

  describe("With multiple functions", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("timeSince", ["start"], "return Date.now() - start")
        .build();
      otherContext = await new Context({ basePath: __dirname })
        .withFunction(
          "sleep",
          ["delay"],
          "return new Promise(resolve => setTimeout(resolve, delay))"
        )
        .build();
    });
    afterEach(async () => {
      await context.destroy();
      await otherContext.destroy();
    });

    it("runs in parallel", async () => {
      const delay = 1000;
      const start = Date.now();

      const [, duration] = await Promise.all([
        runtime.run({
          root: otherContext.basePath,
          file: Context.DEFAULT_FILE_NAME,
          funcName: "sleep",
          args: [delay]
        }),
        runtime.run({
          root: context.basePath,
          file: Context.DEFAULT_FILE_NAME,
          funcName: "timeSince",
          args: [start]
        })
      ]);

      expect(duration).toBeLessThan(delay);
    });
  });

  describe("With a runtime context", () => {
    let key;
    let value;

    beforeEach(async () => {
      key = randoms.secret();
      value = randoms.secret();
      context = await new Context({
        basePath: __dirname
      })
        .withFunction(
          "fromContext",
          ["name"],
          "return __globals__.__context__[name]"
        )
        .build();
    });
    afterEach(() => context.destroy());

    test("passes the context as a global variable to the sandbox", async () => {
      const result = await runtime.run({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
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
      const result = await runtime.run({
        root: context.basePath,
        file: "aModule.jx",
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
      const result = await runtime.run({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        funcName: "multiply",
        args: [4, 5]
      });

      expect(result).toEqual(20);
    });
  });

  describe("With faulty code", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("multiply", ["a", "b"], "return a + ccccc")
        .build();
    });
    afterEach(() => context.destroy());

    test("reflects the underlying error", async () => {
      await expect(
        runtime.run({
          root: context.basePath,
          file: Context.DEFAULT_FILE_NAME,
          funcName: "multiply",
          args: [4, 5]
        })
      ).rejects.toBeInstanceOf(Error);
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

    test("allows requiring specific node modules", async () => {
      const result = await runtime.run({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        external: ["lodash"],
        funcName: "get",
        args: [{ a: 1 }, "a"]
      });

      expect(result).toEqual(1);
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

      const result = await runtime.run({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        whitelistedPaths: [additionalModulesPath],
        external: ["multiply"],
        resolverOptions: {
          additionalModulesPath
        },
        funcName: "multiply",
        args: [4, 5]
      });

      expect(result).toEqual(20);
    });
  });

  describe("Timeouts", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction(
          "sleep",
          ["delay"],
          "return new Promise(resolve => setTimeout(resolve, delay))"
        )
        .build();
    });

    afterEach(() => context.destroy());

    test("throws an error if the code execution times-out", async () => {
      expect.assertions(1);

      try {
        await runtime.run({
          root: context.basePath,
          file: Context.DEFAULT_FILE_NAME,
          funcName: "sleep",
          args: [5000]
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RuntimeTimeoutError);
      }
    });
  });

  describe("args resolver", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("multiply", ["a", "b"], "return a * b")
        .build();
    });
    afterEach(() => context.destroy());

    test("runs successfully", async () => {
      const result = await runtime.run({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        external: ["multiply"],
        funcName: "multiply",
        args: {
          resolverPath: path.resolve(__dirname, "fixtures", "args-resolver.js"),
          original: [1, 2]
        }
      });

      expect(result).toEqual(6);
    });
  });
});
