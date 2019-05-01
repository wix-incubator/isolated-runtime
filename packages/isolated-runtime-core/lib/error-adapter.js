const { VMError } = require("vm2");
const { takeWhile } = require("lodash");
const { ModuleNotFound } = require("./errors");

const messagesRegex = [
  /^Access denied to require '(.*)'$/,
  /^Module '(.*)' is not allowed to be required. The path is outside the border!$/,
  /^The module '(.*)' is not whitelisted in VM.$/
];
const vmStackFrameRegex = /at NodeVM.run/;

const extractModuleName = e =>
  messagesRegex.map(regex => e.message.match(regex)).find(match => match)[1];

const getCustomError = error => {
  if (error instanceof VMError && error.code === "EDENIED") {
    return new ModuleNotFound(extractModuleName(error));
  }

  return error;
};

const sanitize = (root, stack) => {
  const stackFrames = stack.split("\n");
  const sandboxFrames = takeWhile(
    stackFrames,
    frame => !frame.match(vmStackFrameRegex)
  )
    .slice(0, -2)
    .map(frame => frame.replace(root, ""));

  return sandboxFrames.join("\n");
};

const adaptError = (root, error) => {
  const e = getCustomError(error);
  e.stack = sanitize(root, e.stack);
  return e;
};

module.exports = {
  adaptError
};
