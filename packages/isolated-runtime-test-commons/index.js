const fs = require("fs-extra");
const path = require("path");
const { flatMap } = require("lodash");
const chance = require("chance")();

class Context {
  static get DEFAULT_FILE_NAME() {
    return "index.js";
  }

  constructor({ basePath = __dirname, root = chance.guid() } = {}) {
    this._folderName = root;
    this._basePath = path.resolve(basePath, this._folderName);
    this._files = new Map();
  }

  withFile(file, content) {
    if (content) {
      this._save(file, content);
    } else {
      this._save(Context.DEFAULT_FILE_NAME, file);
    }

    return this;
  }

  withFunction(name, args, content) {
    return this.withFile(
      `
      function ${name}(${args.join(", ")}) {
        ${content}
      }

      module.exports = {
        ${name}
      }
      `
    );
  }

  get basePath() {
    return this._basePath;
  }

  async build() {
    await this._createNestedFolders();
    await this._createNestedFiles();

    return this;
  }

  async destroy() {
    await fs.remove(this._basePath);
  }

  _save(file, content) {
    const fullPath = path.join(this._basePath, file);
    const folder = path.dirname(fullPath);

    if (!this._files.has(folder)) {
      this._files.set(folder, new Set());
    }

    this._files.get(folder).add({ fullPath, content });
  }

  get _folders() {
    return Array.from(this._files.keys());
  }

  _filesOf(folder) {
    return Array.from(this._files.get(folder));
  }

  async _createNestedFolders() {
    await Promise.all(this._folders.map(folder => fs.mkdirp(folder)));
  }

  async _createNestedFiles() {
    await Promise.all(
      flatMap(this._folders, this._createNestedFilesIn.bind(this))
    );
  }

  _createNestedFilesIn(folder) {
    return this._filesOf(folder).map(({ fullPath, content }) =>
      fs.writeFile(fullPath, content, "utf8")
    );
  }
}

module.exports = {
  Context,
  randoms: {
    secret() {
      return chance.word();
    },
    folder() {
      return chance.guid();
    }
  }
};
