const path = require("path");
const createPool = require("thread-pool-node");
const { RuntimeTimeoutError } = require("./errors");

class IsolatedRuntime {
  static get DEFAULT_TIMEOUT() {
    return 5000;
  }

  constructor({
    poolOptions,
    sourceExtensions,
    compilerModulePath,
    resolverModulePath,
    timeout = IsolatedRuntime.DEFAULT_TIMEOUT
  } = {}) {
    this._pool = createPool({
      workerPath: path.resolve(__dirname, "worker.js"),
      workerOptions: {
        workerData: {
          sourceExtensions,
          resolverModulePath,
          compilerModulePath
        }
      },
      poolOptions
    });

    this._timeout = timeout;
  }

  run({
    root,
    file,
    funcName,
    args,
    context,
    external,
    whitelistedPaths,
    resolverOptions
  }) {
    return new Promise(async (resolve, reject) => {
      const worker = await this._pool.acquire();

      const killThread = async () => {
        await this._pool.destroy(worker);
        reject(new RuntimeTimeoutError());
      };

      const timeoutId = setTimeout(killThread, this._timeout);

      const onMessage = responseText => {
        clearTimeout(timeoutId);
        worker.removeListener("message", onMessage);
        const response = JSON.parse(responseText);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
        this._pool.release(worker);
      };

      worker.on("message", onMessage);
      worker.postMessage({
        root,
        file,
        funcName,
        args,
        context,
        external,
        whitelistedPaths,
        resolverOptions
      });
    });
  }

  async shutdown() {
    await this._pool.drain();
    await this._pool.clear();
  }
}

module.exports = { IsolatedRuntime };
