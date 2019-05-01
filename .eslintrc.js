module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true,
    jest: true
  },
  extends: ["airbnb-base", "prettier", "plugin:jest/recommended"],
  plugins: ["jest", "prettier"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    "no-underscore-dangle": 0,
    "prettier/prettier": "error",
    "import/no-extraneous-dependencies": 0
  },
  settings: {
    "import/core-modules": ["worker_threads"]
  }
};
