# Thread Pool

Based on [generic-pool](https://www.npmjs.com/package/generic-pool).

## Example
```js
// index.js
const createPool = require('thread-pool-node')

const pool = createPool({
  workerPath: './path/to/worker.js',
  workerOptions: {
    workerData: {
      a: 1
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
  parentPort.postMessage({ result: workerData.a * 2 })
});
```
