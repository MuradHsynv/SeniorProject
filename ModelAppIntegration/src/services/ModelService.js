// src/services/ModelService.js
import { TFLite } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

class ModelService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Loading TFLite model...');
      
      // Load labels
      await this.loadLabels();
      
      // Load TFLite model
      const modelAsset = Asset.fromModule(require('../../assets/models/model.tflite'));
      await modelAsset.downloadAsync();
      
      // Initialize TFLite model
      this.model = await TFLite.loadModel({
        model: modelAsset.localUri,
      });
      
      console.log('Model loaded successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Model initialization error:', error);
      return false;
    }
  }

  async loadLabels() {
    try {
      const labelsAsset = Asset.fromModule(require('../../assets/models/labels.txt'));
      await labelsAsset.downloadAsync();
      
      const labelsText = await FileSystem.readAsStringAsync(labelsAsset.localUri);
      this.labels = labelsText.split('\n').filter(line => line.trim() !== '');
      
      console.log('Labels loaded:', this.labels);
    } catch (error) {
      console.error('Error loading labels:', error);
      this.labels = [
        'hot_milk_button', 'hot_foam_button', 'lungo_button',
        'descale', 'rinse', 'power',
        'flat_white_button', 'espresso_button', 'ristretto_button', 'cappuccino_button',
      ];
    }
  }

  async detect(imageUri) {
    if (!this.isInitialized || !this.model) {
      console.warn('Model not ready');
      return [];
    }

    try {
      // Run detection
      const results = await this.model.detect(imageUri, {
        numResults: 10,
        threshold: 0.5,
      });

      // Format results
      const detections = results.map(result => ({
        class: this.labels[result.classIndex] || 'unknown',
        confidence: result.confidence,
        bbox: [
          result.boundingBox.top,
          result.boundingBox.left,
          result.boundingBox.bottom,
          result.boundingBox.right,
        ],
      }));

      console.log(`Detected ${detections.length} objects`);
      return detections;
    } catch (error) {
      console.error('Detection error:', error);
      return [];
    }
  }
}

export default new ModelService();