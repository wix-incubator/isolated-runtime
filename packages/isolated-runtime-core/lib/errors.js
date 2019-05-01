class IsolatedRuntimeError extends Error {
  constructor(message) {
    super(message);
    this.stack = "";
    this.name = this.constructor.name;
  }
}
class ModuleNotFound extends IsolatedRuntimeError {
  constructor(moduleName) {
    super(`Cannot find module '${moduleName}'`);
  }
}

module.exports = {
  ModuleNotFound
};
