module.exports = (vm, onConsole) => {
  vm.on("console.debug", (...args) => onConsole("debug", ...args));
  vm.on("console.log", (...args) => onConsole("log", ...args));
  vm.on("console.info", (...args) => onConsole("info", ...args));
  vm.on("console.warn", (...args) => onConsole("warn", ...args));
  vm.on("console.error", (...args) => onConsole("error", ...args));
};
