# Isolated Runtime

[![npm version](https://badge.fury.io/js/isolated-runtime.svg)](https://badge.fury.io/js/isolated-runtime)
[![Build Status](https://api.travis-ci.org/wix-incubator/isolated-runtime.svg)](https://travis-ci.org/wix-incubator/isolated-runtime)

`isolated-runtime` requires node v10 and above.

## Getting Started
Install isolated-runtime:

```npm install --save isolated-runtime```

A simple example of using `isolated-runtime` for running un-trusted code:
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

## Development
- `npm i`

To run tests:
- `npm t`

To run benchmark tests:
- `npm run benchmark`
