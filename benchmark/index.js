const { IsolatedRuntime } = require("isolated-runtime");
const { Context } = require("isolated-runtime-test-commons");
const benchmark = require("./benchmark");

let runtime;
let context;

async function setup() {
  runtime = new IsolatedRuntime({
    poolOptions: {
      min: 100,
      max: 500
    }
  });
  context = await new Context({ basePath: __dirname })
    .withFunction("echo", ["x"], "return x")
    .build();
}

async function teardown() {
  await runtime.shutdown();
  await context.destroy();
}

(async function run() {
  await setup();

  const [count, totalTime] = process.argv
    .slice(2)
    .map(arg => parseInt(arg, 10));

  const observed = () =>
    runtime.run({
      root: context.basePath,
      file: Context.DEFAULT_FILE_NAME,
      funcName: "echo",
      args: [1]
    });

  const results = await benchmark(observed, { count, totalTime });

  // eslint-disable-next-line no-console
  console.log({
    total: results.total,
    errors: results.errors,
    success: results.success,
    mean: results.mean,
    median: results.median,
    p70: results.percentile(0.7),
    p90: results.percentile(0.9),
    p95: results.percentile(0.95),
    p99: results.percentile(0.99)
  });

  await teardown();
})();
