const path = require("path");
const express = require("express");
const { IsolatedRuntime } = require("isolated-runtime");
const bodyParser = require("body-parser");

module.exports = ({ basePath, poolOptions }) => {
  const runtime = new IsolatedRuntime({ poolOptions });
  const app = express();

  app.use(bodyParser.json());
  app.post("/:folderName/:file(*)/:funcName", async (req, res) => {
    const { funcName, file, folderName } = req.params;
    const root = path.join(basePath, folderName);

    try {
      await runtime.run({
        poolOptions,
        root,
        file,
        funcName,
        args: []
      });
      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(500);
    }
  });

  const server = app.listen(0);

  return {
    close: async () => {
      await runtime.shutdown();
      await server.close();
    },
    port: server.address().port
  };
};
