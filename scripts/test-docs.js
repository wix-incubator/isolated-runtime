const path = require("path");
const fs = require("fs-extra");
const exec = require("util").promisify(require("child_process").exec);
const debug = require("debug")("docs-test");

const examplesBaseFolder = path.resolve(__dirname, "..", "docs", "examples");

const examples = fs
  .readdirSync(examplesBaseFolder)
  .filter(entry =>
    fs.statSync(path.join(examplesBaseFolder, entry)).isDirectory()
  )
  .map(example => path.join(examplesBaseFolder, example));

async function setup() {
  await Promise.all(
    examples.map(example => exec("npm i --no-package-lock", { cwd: example }))
  );
}

async function run() {
  try {
    await Promise.all(
      examples.map(exampleDir =>
        // eslint-disable-next-line import/no-dynamic-require, global-require
        require(exampleDir)()
      )
    );
  } catch (e) {
    debug({ e });
    process.exit(1);
  }
}

async function teardown() {
  await Promise.all([
    examples.map(example => fs.remove(path.join(example, "node_modules")))
  ]);
}

(async () => {
  debug("Testing docs");
  debug("Installing dependencies");
  await setup();
  debug("Running");
  await run();
  debug("Cleanup");
  await teardown();
})();
