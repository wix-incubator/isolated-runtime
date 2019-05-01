const path = require("path");

module.exports = ({ additionalModulesPath }) => moduleName =>
  path.join(additionalModulesPath, moduleName);
