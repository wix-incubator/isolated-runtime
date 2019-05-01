const { parentPort, workerData } = require("worker_threads");
const { CodeRunner } = require("isolated-runtime-core");
const requireWithFallback = require("./requireWithFallback");

const { sourceExtensions } = workerData;
const compiler = requireWithFallback(workerData.compilerModulePath);
const resolver = requireWithFallback(workerData.resolverModulePath, () => {});

function buildArgs(args) {
  if (Array.isArray(args)) {
    return { argumentList: args };
  }

  const { resolverPath, original } = args;
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const resolveArguments = require(resolverPath);
  return { argumentList: original, resolveArguments };
}

parentPort.on(
  "message",
  async ({
    root,
    file,
    funcName,
    args,
    context,
    external,
    whitelistedPaths,
    resolverOptions = {}
  }) => {
    const runner = new CodeRunner({
      root,
      file,
      sourceExtensions,
      compiler,
      external,
      whitelistedPaths,
      resolve: resolver(resolverOptions)
    });

    try {
      const { argumentList, resolveArguments } = buildArgs(args);
      const result = await runner.run({
        funcName,
        args: argumentList,
        context,
        resolveArguments
      });
      parentPort.postMessage(JSON.stringify({ result }));
    } catch (e) {
      parentPort.postMessage(JSON.stringify({ error: { message: e.message } }));
    }
  }
);
