const babel = require("@babel/standalone");
const importExportPlugin = require("@babel/plugin-transform-modules-commonjs");

module.exports = code =>
  babel.transform(code, {
    plugins: [importExportPlugin]
  }).code;
