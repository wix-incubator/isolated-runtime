# Isolated Runtime Core

Provides a runtime environment for executing Javascript code loaded from a provided file, within a controlled (isolated) context.
The core functionality of this module is provided by the `CodeRunner` class, which takes the root path in which the code to be run resides, and the file in which source code of the functions to exectute is stored.

## What does "isolated" actually mean?
The isolation-level provided by this library has several aspects:
1. A function cannot `require()` any module other than ones pre-defined upon creating a `CodeRunner` instance.
1. A function cannot access files located in the hosting process in which `CodeRunner` is being used (thus executing `process.exit(1)` will result in an exception as `process` will be `undefined`
1. Different invocations of the same function cannot share any state with each other.

### Isolation illustrated
Once an instance of `CodeRunner` is created, it can be used to execute any number of calls to the functions within the provided file, but some restrictions apply - each run is isolated from a preceding or consequent run, meaning that if your function modifies the global scope to save some state, those changes will not be persisted:
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

## API

```js
CodeRunner({
  root: string,
  file: string,
  onConsole: function?,
  sourceExtensions: string[]?,
  compiler: string?,
  external: string[]?,
  whitelistedPaths: string[]?,
  resolve: function?
})
```
* `root` - an absolute path containing the code-file provided via the `file` argument (e.g., `/var/usr/my-code`)
* `file` - a file-name to run the code from when the `run()` method is being called. (e.g., `index.js`)
`onConsole` - a callback to invoke for every call to `console.<method>` performed in the executed code. Since `console.<method>` calls are not redirected to the `stdout` stream of the parent process hosting `CodeRunner`, `onConsole` provides a way to act upon those calls and possibly write them the parent process' stdout.
`onConsole` is invoked with two arguments: `(method, ...args)`, where `method` is the name of the orignally method invoked on `console` from the executed function, and `args` are the arguments passed to that console method.
* `sourceExtensions` - allows requiring files with extensions other than `.js`, by passing an array of the allows extensions:. e.g.: `['.js1', '.xyz']`
* `compiler` - an optional function to transform the code prior to execution. Takes a single argument - `code`, that holds the source code to transpile, and expected to return the transpiled code as a string.
* `external` - if you wish to allow your code to `require()` modules that are not relative to the function being executed, those module names can passed through this array. e.g.: `['fs', 'lodash']`
* `whitelistedPaths` - a list of absolute paths to allow loading relative modules from. Required since loading relative modules is restricted to paths stemming from the `root` folder by default. e.g: `['/var/usr/a', '/b/c/d']`
* `resolve` - an optional function to provide custom module-resolving logic, in case the traditional lookup logic implemented in Node needs to be extended or restricted. Once a module `require()`-ed by the executed-code cannot be found, the requested module id (path / name) is passed to this function and it's expected to return a string with the absolute path to the module file, or `null` if the lookup did not succeed.
