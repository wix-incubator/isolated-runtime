# isolated-runtime

Running untrusted Javascript code (provided as a user-input, e.g.) incurs two possible risks:
1. The code being run can interfere and modify the hosting process' state, breaching it's memory, files and global scope.
1. The code might perform CPU-intensive operations that run for an indefinite time-period, and even block the hosting process by running `while (true) {}`.

Those two risks are addressed by various libraries and design-approaches, but we felt that each had its own drawbacks when it comes to balancing productivity, ease of use and functionality - for instance, using V8 isolates can provide a tight isolation between the untrusted code and the process running it, but is hard to implement, provides no Node.js related functionality (such as the CommonJS module system, build-in modules such as `fs`, etc.) and requires C++ code and tooling.

isolated-runtime  aims to strike a balance between being secure, performnat and still support most of the features your code could utilize would it run on a "plain" Node.js installtion.

## Architecture

In order to achieve a good level of isolation between the untrusted code and the hosting process, yet being resource-efficient, we chose to use the [Worker Threads](https://nodejs.org/api/worker_threads.html) fetaure in Node. 

Threads are more lightweight compared to forking processes to execute the untrusted code, and combined with our custom implementation of a [thread-pool](../thread-pool-node) they form a robust runtime infrastructure that's capable of handling many simulataneous instances untrusted code running on the same host in an efficient manner.

## API
```js
IsolatedRuntime({
  root: string,
  file: string,
  funcName: string,
  args: any[],
  context: object,
  external: string[],
  whitelistedPaths: string[],
  resolverOptions: object
})
```
`IsolatedRuntime` is the object providing the runtime functionality for executing the untrusted code, and allows controlling its priviliges and contraints by using the following options:
1. `root` - to restrict untrusted code from loading code (using `require()`) from sources other than its own folder,  only paths that stem from `root` will be successfully `require()`-ed.
1. `file` - the source-code file from which the function to execute should be loaded. This file is assumed to be a CommonJS module (i.e., exporting functions using `module.exports = { foo: () => 'foo' }` or `exports.foo = () => 'foo'`.
1. `funcName` - the function name exported from the module provided as `file`
1 `args` - an array of arguments to be provided to the function - e.g., if your exported function is:
```js
function a(b, c, d) {
  return b + c + d
}  
```
passing `[1, 1, 1]` will result in the functions returning `3`. See the [limitations](#known-limitations) section for important notes about what args are supported.
1. `context` - 
1. `external` - 
1. `whitelistedPaths` -
1. `resolverOptions` -

## Known Limitations
Note that arguements passed to the invoked function *must* be serializable - passing `Buffer`s, for example, is not supported and will result in an exception being thrown and the code not being invoked.
