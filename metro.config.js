
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Add cache reset configuration for web builds
config.resetCache = true;

// Configure transformer to include build timestamp in bundles
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    // Keep console logs in production for debugging
    compress: {
      ...config.transformer?.minifierConfig?.compress,
      drop_console: false,
    },
  },
};

module.exports = config;
