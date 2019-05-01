const path = require("path");
const { NodeVM } = require("vm2");
const { adaptError } = require("./lib/error-adapter");
const errors = require("./lib/errors");
const handleConsole = require("./lib/handleConsole");

class CodeRunner {
  constructor({
    root,
    file,
    onConsole,
    sourceExtensions,
    compiler,
    external = [],
    whitelistedPaths = [],
    resolve
  }) {
    this._root = root;
    this._file = path.join(root, file);
    this._onConsole = onConsole;
    this._sourceExtensions = sourceExtensions;
    this._compiler = compiler;
    this._external = external;
    this._whitelistedPaths = whitelistedPaths;
    this._resolve = resolve;
  }

  async run({
    funcName,
    args,
    context = {},
    running = () => {},
    resolveArguments = i => i
  }) {
    return new Promise((resolve, reject) => {
      const vm = new NodeVM({
        console: this._onConsole ? "redirect" : "off",
        sourceExtensions: this._sourceExtensions,
        compiler: this._compiler,
        require: {
          external: this._external,
          context: "sandbox",
          root: [this._root, ...this._whitelistedPaths],
          resolve: this._resolve
        },
        sandbox: {
          __globals__: {
            file: this._file,
            funcName,
            args: resolveArguments(args),
            resolve,
            reject,
            running,
            __context__: context
          }
        }
      });

      if (this._onConsole) {
        handleConsole(vm, this._onConsole);
      }

      vm.run(
        `(async function() {
          try {
            const m = require(__globals__.file);
            const f = m[__globals__.funcName];
            if (typeof f !== 'function') {
              throw new TypeError('${funcName} is not a function');
            }
            __globals__.running()
            const result = await f(...__globals__.args);
            __globals__.resolve(result)
          } catch(e) {
            __globals__.reject(e)
          }
        })()`,
        this._file
      );
    }).catch(error => {
      throw adaptError(this._root, error);
    });
  }
}

module.exports = {
  CodeRunner,
  errors
};
