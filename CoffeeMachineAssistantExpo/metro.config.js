const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Add asset extensions for TFLite and text files
config.resolver.assetExts.push('tflite');
config.resolver.assetExts.push('bin');
config.resolver.assetExts.push('txt');

// 2. Fix resolution for modules that expect react-native-fs
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-fs': require.resolve('expo-file-system'),
};

// 3. Manually resolve the problematic TensorFlow file
// This is the specific fix for your error
try {
  config.resolver.extraNodeModules['./tflite_web_api_client'] = 
    require.resolve('@tensorflow/tfjs-tflite/dist/tflite_web_api_client.js');
} catch (e) {
  // If specific file resolution fails, try resolving just the package
  // This helps if the internal structure changes slightly between versions
  try {
     config.resolver.extraNodeModules['./tflite_web_api_client'] = 
        path.resolve(require.resolve('@tensorflow/tfjs-tflite/package.json'), '../dist/tflite_web_api_client.js');
  } catch (err) {
      console.warn("Warning: Could not resolve tflite_web_api_client. TFLite might fail.");
  }
}

module.exports = config;