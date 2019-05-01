# Isolated Runtime Core

## Example
```js
const { CodeRunner } = require('isolated-runtime-core')

const runner = new CodeRunner({
  root,
  file
})

const response = await runner.run({
  funcName,
  args,
  context
})

if (response.error) {
  reject(new Error(response.error.message))
} else {
  resolve(response.result)
}
```
