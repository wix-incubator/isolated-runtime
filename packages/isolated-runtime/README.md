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
  poolOptions?: Options;
  sourceExtensions?: string[];
  resolverModulePath?: string;
  compilerModulePath?: string;
  timeout?: number;
})
```

`IsolatedRuntime` is the object providing the runtime functionality for executing the untrusted code, and allows controlling its priviliges and contraints by using the following options:

* `poolOptions` - an options object to be passed to the underlying thread-pool implementation - see the `opts` section of the [generic-pool documentation](https://www.npmjs.com/package/generic-pool).
* `sourceExtensions` - array of strings holding the allowed extensions of file that can be `require()`-ed by the code executed by the `run()` method.
* `resolverModulePath` - a path to a module exporting a factory function returning a custom module-resolver function. The factory function takes the `resolverOptions` passed by the `run()` function, and returns a function of the form `(moduleName: string) => string`. That resolver function is expected to return the full path of the resolved module, or `null` if the module at the request path could not be found. e.g., a custom resolver that blacklists modules of given paths the vary from run to run be implemented the following way:
```js
function resolverFactory (resolverOptions) {
  return (moduleName) => resolverOptions.blacklistedNames.some(b => moduleName.contains(b)) ? 
      null : 
      '/some/path/to/module'
}
```
* `compilerModulePath` - In case the untrusted code need to be transpiled prior to being run, this argument can provide an absolute path to a module exporting a transpilation function of the form `(code: string) => string`, where `code` is the source code to transpile and the returned string is the transpiled code to be run.
* `timeout` - number of milliseconds alotted to the unstructed code to completed prior to aborting the thread that runs it.
  
### run(/* options */) => Promise<any>
```js
options: {
  root: string;
  file: string;
  funcName: string;
  args: any[];
  context?: object;
  external?: string[];
  whitelistedPaths?: string[];
  resolverOptions?: object;
}
```

Returns a Promise that resolves to the value returned by the untrusted code, or rejects to an error thrown by that code or by the `run` method itself. Takes the following options:

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
1. `context` - an object provding globals to be made available to the untrusted code. e.g:
```js
runner.run({
  file: 'index.js',
  funcName: 'foo',
  root: '...',
  context: {
    a: 1,
    b: {
      c: () => 2
    }
  }
})

// index.js
function foo() {
   console.log(global.a) // prints 1
   console.log(global.b.c()) // prints 2
}
```
1. `external` - an array of strings, representing names of node-modules that are allowed to be loaded by the untrusted code (from a non-relative or absolute path stemming from `root`). Modules listed under `external` must also have their absolute path listed under `whitelistedPaths`, otherwise the module could not be loaded.
1. `whitelistedPaths` - the paths of modules listed under the `external` argument.
1. `resolverOptions` - if `resolverModulePath` was passed to the `IsolatedRuntime` constructor, that resolver will be provided with `resolverOptions` as an arguemnt 

## Known Limitations
Note that arguements passed to the invoked function *must* be serializable - passing `Buffer`s, for example, is not supported and will result in an exception being thrown and the code not being invoked.
