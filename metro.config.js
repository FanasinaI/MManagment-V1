// eslint-disable-next-line no-undef
const { getDefaultConfig } = require('expo/metro-config');

// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

// expo-sqlite's web backend (wa-sqlite) ships a .wasm file that Metro
// doesn't treat as a bundleable asset by default.
config.resolver.assetExts.push('wasm');

// eslint-disable-next-line no-undef
module.exports = config;
