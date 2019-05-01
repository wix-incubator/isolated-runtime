const { parentPort, workerData } = require("worker_threads");
const messages = require("./messages");

const echo = str => str;
const multiply = by => workerData.multiplyFactor * by;

parentPort.on("message", message => {
  switch (message.code) {
    case messages.ECHO:
      parentPort.postMessage(echo(message.str));
      break;
    case messages.MULTIPLY:
      parentPort.postMessage(multiply(message.multiplyBy));
      break;
    default:
      parentPort.close();
  }
});
