/* eslint-disable no-console */
const axios = require("axios");
const { Context } = require("isolated-runtime-test-commons");
const { performance } = require("perf_hooks");
const stats = require("stats-lite");
const chance = require("chance")();
const listen = require("./server");

let server;
let client;
let context;

const root = chance.guid();

async function setup() {
  server = listen({
    basePath: __dirname,
    poolOptions: {
      min: 100,
      max: 500
    }
  });
  client = axios.create({
    baseURL: `http://localhost:${server.port}`,
    timeout: 500
  });
  context = await new Context({
    basePath: __dirname,
    root
  })
    .withFunction("echo", ["x"], "return x")
    .build();
}

async function teardown() {
  await context.destroy();
  await server.close();
}

function benchmark(requests, totalTime) {
  const results = {
    errors: 0,
    success: 0,
    times: []
  };

  const interval = totalTime / requests;
  const requestsPerInterval = Math.ceil(requests / totalTime);
  console.log({ interval, requestsPerInterval });

  return new Promise(resolve => {
    const intervalId = setInterval(async () => {
      Array(requestsPerInterval)
        .fill(0)
        .map(async () => {
          const start = performance.now();
          try {
            await client.post(`/${root}/${Context.DEFAULT_FILE_NAME}/echo`, {
              args: []
            });
            results.success += 1;
          } catch (e) {
            console.error({ error: e.message });
            results.errors += 1;
          } finally {
            results.times.push(performance.now() - start);
            const total = results.success + results.errors;
            if (total % 10 === 0) {
              console.log({ total: results.success + results.errors });
            }
            if (results.success + results.errors === requests) {
              clearInterval(intervalId);
              resolve(results);
            }
          }
        });
    }, interval);
  });
}

(async function run() {
  await setup();

  const [requests, totalTime] = process.argv
    .slice(2)
    .map(arg => parseInt(arg, 10));
  console.log({ requests, totalTime });

  const results = await benchmark(requests, totalTime);

  console.log({
    total: results.errors + results.success,
    error: results.errors,
    success: results.success,
    mean: stats.mean(results.times),
    median: stats.median(results.times),
    p70: stats.percentile(results.times, 0.7),
    p90: stats.percentile(results.times, 0.9),
    p95: stats.percentile(results.times, 0.95),
    p99: stats.percentile(results.times, 0.99)
  });

  await teardown();
})();
