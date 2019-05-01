const { Context, randoms } = require("isolated-runtime-test-commons");
const {
  CodeRunner,
  errors: { ModuleNotFound }
} = require("../");

describe("Sandbox", () => {
  let context;

  describe("fs", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFile(`require('fs')`)
        .build();
    });
    afterEach(() => context.destroy());

    test("can't require the fs module", async () => {
      const runner = new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      });

      expect.assertions(2);

      try {
        await runner.run({
          funcName: "dummy",
          args: []
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ModuleNotFound);
        expect(error.message).toEqual(`Cannot find module 'fs'`);
      }
    });
  });

  describe("require", () => {
    let otherContext;
    let secret;

    beforeEach(async () => {
      secret = randoms.secret();
      otherContext = await new Context({ basePath: __dirname })
        .withFile(
          `
          const secret = '${secret}'

          module.exports = {
            secret
          }`
        )
        .build();

      context = await new Context({ basePath: __dirname })
        .withFunction(
          "escape",
          [],
          `return require('${otherContext.basePath}/${
            Context.DEFAULT_FILE_NAME
          }').secret`
        )
        .build();
    });
    afterEach(() => Promise.all([context.destroy(), otherContext.destroy()]));

    test("can't require other users code", async () => {
      const runner = new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      });

      try {
        await runner.run({
          funcName: "escape",
          args: []
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ModuleNotFound);
        expect(error.message).toInclude(
          `${otherContext.basePath}/${Context.DEFAULT_FILE_NAME}`
        );
      }
    });
  });

  describe("process.exit", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("exit", [], "process.exit()")
        .build();
    });
    afterEach(() => context.destroy());

    test("can't call process.exit", async () => {
      const runner = await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      });

      await expect(runner.run({ funcName: "exit", args: [] })).rejects.toThrow(
        `process.exit is not a function`
      );
    });
  });

  describe("modifying global scope", () => {
    let otherContext;

    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFunction("modify", [], "global.a = 1")
        .build();
      otherContext = await new Context({ basePath: __dirname })
        .withFunction("globalA", [], "return global.a")
        .build();
    });
    afterEach(() => Promise.all([context.destroy(), otherContext.destroy()]));

    test("can't modify host global scope", () => {
      expect(global.a).toBeUndefined();
    });

    test("cant modify other users' global scope", async () => {
      await new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME
      }).run({
        funcName: "modify",
        args: []
      });

      const globalA = await new CodeRunner({
        root: otherContext.basePath,
        file: Context.DEFAULT_FILE_NAME
      }).run({
        funcName: "globalA",
        args: []
      });

      expect(globalA).toBeUndefined();
    });
  });

  describe("console", () => {
    let secret;
    const consoleCalls = {};
    const onConsole = (method, ...args) => {
      consoleCalls[method] = args;
    };

    beforeEach(async () => {
      secret = randoms.secret();
      context = await new Context({ basePath: __dirname })
        .withFunction("log", ["arg"], "console.log(arg)")
        .build();
    });
    afterEach(() => context.destroy());

    test("allows passing custom console logic", async () => {
      const runner = new CodeRunner({
        root: context.basePath,
        file: Context.DEFAULT_FILE_NAME,
        onConsole
      });

      await runner.run({
        funcName: "log",
        args: [secret]
      });

      expect(consoleCalls).toHaveProperty("log", [secret]);
    });
  });

  describe("stack trace", () => {
    beforeEach(async () => {
      context = await new Context({ basePath: __dirname })
        .withFile(
          `
        function entry() {
          second()
        }

        function second() {
          explode()
        }

        function explode() {
          throw new Error('Boom!')
        }

        module.exports = {
          entry
        }`
        )
        .build();
    });
    afterEach(() => context.destroy());

    test("should only include code frames from sandbox", async () => {
      expect.assertions(1);

      try {
        await new CodeRunner({
          root: context.basePath,
          file: Context.DEFAULT_FILE_NAME
        }).run({
          funcName: "entry",
          args: []
        });
      } catch (e) {
        expect(e.stack).toEqual(`Error: Boom!
    at explode (/index.js:11:17)
    at second (/index.js:7:11)
    at entry (/index.js:3:11)`);
      }
    });
  });
});
