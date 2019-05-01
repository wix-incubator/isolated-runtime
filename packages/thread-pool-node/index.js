const path = require("path");
const fs = require("fs");
const { Worker } = require("worker_threads");
const genericPool = require("generic-pool");

const terminateWorker = worker => {
  return new Promise((resolve, reject) =>
    worker.terminate(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  );
};

module.exports = ({ workerPath, workerOptions, poolOptions }) => {
  const resolvedWorkerPath = path.resolve(workerPath);

  if (!fs.existsSync(resolvedWorkerPath)) {
    throw new Error(`Worker path ${resolvedWorkerPath} does not exist.`);
  }

  return genericPool.createPool(
    {
      create: () => new Worker(workerPath, workerOptions),
      destroy: terminateWorker
    },
    poolOptions
  );
};
