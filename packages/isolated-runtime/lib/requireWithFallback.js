module.exports = (path, fallback = undefined) => {
  if (path) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(path);
  }

  return fallback;
};
