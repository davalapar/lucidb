
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const ungzip = promisify(zlib.gunzip);
const gzipConfig = {
  flush: zlib.constants.Z_NO_FLUSH,
  level: zlib.constants.Z_BEST_COMPRESSION,
  memLevel: zlib.constants.Z_BEST_COMPRESSION,
  strategy: zlib.constants.Z_DEFAULT_STRATEGY,
  info: false,
};
const brotli = promisify(zlib.brotliCompress);
const unbrotli = promisify(zlib.brotliDecompress);
const brotliConfig = {
  params: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
    [zlib.constants.BROTLI_PARAM_LGWIN]: zlib.constants.BROTLI_MAX_WINDOW_BITS,
    [zlib.constants.BROTLI_PARAM_LGBLOCK]: zlib.constants.BROTLI_MAX_INPUT_BLOCK_BITS,
  },
};

module.exports = {
  gzip,
  ungzip,
  brotli,
  unbrotli,
  gzipConfig,
  brotliConfig,
};
