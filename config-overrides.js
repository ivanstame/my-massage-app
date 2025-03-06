// config-overrides.js
module.exports = function override(config, env) {
  // Add webpack node polyfills
  config.resolve.fallback = {
    ...config.resolve.fallback,
    http: false,
    https: false,
    util: false,
    zlib: false,
    stream: false,
    url: false,
    crypto: false,
    assert: false
  };

  // config.externals = {
  //   ...config.externals,
  //   axios: 'axios'
  // };

  return config;
};
