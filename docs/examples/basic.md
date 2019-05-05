Let's say we want to run this untrusted code:

```js
// untrusted.js

module.exports = {
  sum: (a, b) => a + b
}
```


This will be our simple isolated runtime setup:
```js
// index.js

const assert = require("assert");
const { IsolatedRuntime } = require("isolated-runtime");

module.exports = async function run() {
  // create a new instance
  const runtime = new IsolatedRuntime();

  // run with root as this folder, and let the args be 2 and 3
  const result = await runtime.run({
    root: __dirname,
    file: "untrusted.js",
    funcName: "sum",
    args: [2, 3]
  });

  // the result is retrieved asynchronously
  console.log({ result }); // { result: 5 }
  assert(result === 5, "basic example result must be 5");

  // shutdown the runtime will closed all VMs and kill all open threads
  await runtime.shutdown();
};
```
