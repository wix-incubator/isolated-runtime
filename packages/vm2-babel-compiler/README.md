# VM2 Babel Compiler

A module for compiling nodejs code with Babel.
Since node.js supports almost everything natively, this module only uses the `@babel/plugin-transform-modules-commonjs` plugin to support `import/export` in `.js` files.

## Getting Started
Install vm2-babel-compiler:
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
