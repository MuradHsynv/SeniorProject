const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add tflite as supported asset type
config.resolver.assetExts.push('tflite', 'txt');

module.exports = config;