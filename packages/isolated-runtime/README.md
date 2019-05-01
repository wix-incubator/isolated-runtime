# Isolated Runtime

## Example
```js
const { IsolatedRuntime } = require('isolated-runtime');

const runtime = new IsolatedRuntime(/* options */)

try {
  await run({
    folder,
    file,
    funcName,
    args,
    context
  })
} catch(e) {
  // handle error
}
```
