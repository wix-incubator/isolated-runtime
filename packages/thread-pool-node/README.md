# Thread Pool

A Thread pool for nodejs worker-threads, which is based on [generic-pool](https://www.npmjs.com/package/generic-pool).

It relies on the generic-pool mechanism to handle the resources.

## Usage Example
```js
// index.js
const createPool = require('thread-pool-node')

const pool = createPool({
  workerPath: './path/to/worker.js',
  workerOptions: {
    workerData: {
      magicNumber: 42
    }
  },
  poolOptions: {
    min: 2,
    max: 4
  }
})

const worker = await pool.acquire();
const onMessage = result => {
  // do something with worker
  doSomeHeavyComputation();
  // release back to thread pool
  pool.release(worker);
  worker.removeListener("message", onMessage);
};

worker.on("message", onMessage);
worker.postMessage(args);
```

```js
// worker.js
const { parentPort, workerData } = require("worker_threads");

parentPort.on("message", message => {
  parentPort.postMessage({ result: workerData.magicNumber })
});
```


For more info regarding how to configure the pool to your needs, please follow the [generic-pool README](https://github.com/coopernurse/node-pool#readme)

