`isolated-runtime` is a library that provides a secure, performant and dev-friendly approach for running untrusted JS code in an isolated context.

## Why untrusted code?
You might be offering your users to customize your product using custom JS code that will run for certain system events, provide a complete serverless solution for their code, or allow them to create their own rules engine based on JS objects and statements - whatever that might be, all of the scenarios above involve accepting JS code from the user and executing it on your own servers. That might pose a huge security risk in case you don't enforce any limitations on that code, unless you run it within some sort a sandbox - an isolated runtime-context that will prevent it from accessing or modifying undesired resources.

## Key concepts
The driving idea behind `isolated-runtime` is having the untrusted code as files deployed to some filesystem, then having `isolated-runtime` load a module from one of those files, and executing a function from that module with the provided arguments, returning a Promise that resolves to the function's return value. The function's runtime-context is isolated from the host's one, and even better - multiple instances of the same function can be run without clashing with each other via global state.

## Usage examples
For more examples, see the [examples](examples.md) page.

Assume the following file structure (with the `modules` folder represented code submitted from an untrusted source):

```
├───index.js
├───modules
│   ├─module1.js
│   ├─module2.js
```

```js
// module1.js

function a() {
  global.a = 1
  return global.a
}

// module2.js
function b() {
  return global.a
}

// index.js
const { IsolatedRuntime } = require("isolated-runtime");
const runtime = new IsolatedRuntime();

global.a = 3

const result1 = await runtime.run({
  folder: path.resolve('./modules')
  file: "module1.js",
  funcName: "a",
  args: []
});

console.log('result1: ', result1)
console.log('global.a: ', global.a)

const result2 = await runtime.run({
  folder: path.resolve('./modules')
  file: "module2.js",
  funcName: "b",
  args: []
});

console.log('result2: ', result2)
console.log('global.a: ', global.a)


```
The code above will print:
```
result1: 1
global.a: 3
result2: undefined
global.a: 3
```

Note that `global.a` was never modified by any of the invocations - since each got its own fresh, sandboxed version of `global` - completely detached from the `global` scope in `index.js`.

## Malicious behavior
With untrusted code comes untrusted behavior - imagine such code performs a `process.exit()` or `while (true) {}` statenents - in both cases someone is trying to abort or halt the main process hosting the untrusted code runtime. To eliminate that risk, we've combined two different concepts:
1. Context isolation - `process` is not availble in the untrusted code's runtime context (i.e., is not a variable that can be referenced in its closure).
1. Host-process isolation - `while (true) { }` cannot be blocked beforehand, but since the untrusted code is being run inside a thread - the infinite loop will only block that thread, and will eventually result in a timeout exception aborting the execution. That way, no untrusted code can affect the host *process* itself.

## Getting Started
Install isolated-runtime:

```npm install --save isolated-runtime```

In your script (that can be anything from a cli-tool up to a fully-blown Express-base Node server):

```js
const { IsolatedRuntime } = require("isolated-runtime");

const runtime = new IsolatedRuntime(/* options */);
const result = await runtime.run({
  folder: "/path/to/folder"
  file: "relative/path/to/file",
  funcName: "functionName",
  args: [/* function arguments */]
});
```
