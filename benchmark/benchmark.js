const { performance } = require("perf_hooks");
const assert = require("assert");
const stats = require("stats-lite");
const debug = require("debug")("benchmark");

function toStats(results) {
  return {
    raw: results,
    total: results.errors + results.success,
    errors: results.errors,
    success: results.success,
    mean: stats.mean(results.times),
    median: stats.median(results.times),
    percentile: p => stats.percentile(results.times, p),
    histogram: stats.histogram(results.times)
  };
}

function benchmark(observed, { count, totalTime } = {}) {
  const results = {
    errors: 0,
    success: 0,
    times: []
  };

  assert(typeof observed === "function", "observed must be a function");
  assert(Number.isInteger(count), "count must be an integer");
  assert(Number.isInteger(totalTime), "totalTime must be an integer");

  debug({ count, totalTime });
  const interval = totalTime / count;
  const operationsPerInterval = Math.ceil(count / totalTime);
  debug({ interval, operationsPerInterval });

  return new Promise(resolve => {
    const intervalId = setInterval(async () => {
      Array(operationsPerInterval)
        .fill(0)
        .map(async () => {
          const start = performance.now();
          try {
            await observed();
            results.success += 1;
          } catch (e) {
            debug({ error: e.message });
            results.errors += 1;
          } finally {
            results.times.push(performance.now() - start);
            const total = results.success + results.errors;
            if (total % 10 === 0) {
              debug({ total });
            }
            if (total === count) {
              clearInterval(intervalId);
              resolve(toStats(results));
            }
          }
        });
    }, interval);
  });
}

module.exports = benchmark;
