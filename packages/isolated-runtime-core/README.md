# Isolated Runtime Core

Provides a runtime environment for executing Javascript code loaded from a provided file, within a controlled (isolated) context.
The core functionality of this module is provided by the `CodeRunner` class, which takes the root path in which the code to be run resides, and the file in which source code of the functions to exectute is stored.

## What does "isolated" actually mean?
The isolation-level provided by this library has several aspects:
1. A function cannot `require()` any module other than ones pre-defined upon creating a `CodeRunner` instance.
1. A function cannot access files located in the hosting process in which `CodeRunner` is being used (thus executing `process.exit(1)` will result in an exception as `process` will be `undefined`
1. Different invocations of the same function cannot share any state with each other.

## Restrictions
Once an instance of `CodeRunner` is created, it can be used to execute any number of calls to the functions within the provided file, with some restrictions applied:

1. Each run is isolated from a preceding or consequent run. That means that if you function modifies the global scope to save some state, those changes will not be persisted:
```js
global.bar = 0

// my-module/index.js
function foo(n) {
  global.bar = (global.bar || 0) + 1
  return global.bar
```

```js
const runner = new CodeRunner({ root: '.', file: 'my-module.js' })

const result1 = await runner.run({
  funcName: 'foo',
  args: [1]
})

console.log(result1) // 1 
console.log(global.bar) // 0

const result2 = await runner.run({
  funcName: 'foo',
  args: [2]
})

console.log(result2) // 1
console.log(global.bar) // 0
```
Note that the assignments made to `global.bar` did not change its value, and the functions get its value as `0` every time.
1. Arguments passed to the function (via the `args` option) with no proper resolver (see next section) must be of a serializable type:
```js
const result2 = await runner.run({
  funcName: 'foo',
  args: [ { a: 1, b: [true, false, 'a', 'b'] } ] // Works fine
})

const result2 = await runner.run({
  funcName: 'foo',
  args: [ { a: 1, b: new Buffer() } ] // The call will fail since the Buffer passed is not serializable
})
