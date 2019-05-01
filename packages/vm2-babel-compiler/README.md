# VM2 Babel Compiler

A module for compiling nodejs code with Babel.

Since newer versions of node.js (8 and above) support almost everything natively, this module only uses the `@babel/plugin-transform-modules-commonjs` plugin to transpile `import/export` to `require` and `module.exports`.

## Getting Started
Install:

```npm install --save vm2-babel-compiler```

A basic usage example:
```js
const compile = require('vm2-babel-compiler');
const compiled = compile(code)
```

Passing this compiler to [VM2](https://github.com/patriksimek/vm2/):
```js
const { NodeVM } = require("vm2");
const compile = require('vm2-babel-compiler');

new NodeVM({
  compile
});
```
