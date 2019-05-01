# Isolated Runtime

## Overview

Running untrusted Javascript code (provided as a user-input, e.g.) incurs two possible risks:
1. The code being run can interfere and modify the hosting process' state, breaching it's memory, files and global scope.
1. The code might perform CPU-intensive operations that run for an indefinite time-period, and even block the hosting process by running `while (true) {}`.

Those two risks are addressed by various libraries and design-approaches, but we felt that each had its own drawbacks when it comes to balancing productivity, ease of use and functionality - for instance, using V8 isolates can provide a tight isolation between the untrusted code and the process running it, but is hard to implement, provides no Node.js related functionality (such as the CommonJS module system, build-in modules such as `fs`, etc.) and requires C++ code and tooling.

isolated-runtime  aims to strike a balance between being secure, performnat and still support most of the features your code could utilize would it run on a "plain" Node.js installtion.

## Architecture

In order to achieve a good level of isolation between the untrusted code and the hosting process, yet being resource-efficient, we chose to use the [Worker Threads](https://nodejs.org/api/worker_threads.html) fetaure in Node. 

Threads are more lightweight compared to forking processes to execute the untrusted code, and combined with our custom implementation of a [thread-pool](../thread-pool-node) they form a robust runtime infrastructure that's capable of handling many simulataneous instances untrusted code running on the same host in an efficient manner.

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
