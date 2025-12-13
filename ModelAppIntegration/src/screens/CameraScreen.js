import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';

import { SettingsContext } from '../context/GlobalSettings';
import { useGuidance } from '../context/GuidanceContext';

// Model Assets
const MODEL_ASSET = require('../../assets/models/model.tflite');
const LABELS_ASSET = require('../../assets/models/labels.txt');

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusText, setStatusText] = useState('Loading model...');
  const [labels, setLabels] = useState([]);

  // TFLite Model Hook
  const model = useTensorflowModel(MODEL_ASSET);

  const mockDetectionRef = useRef(null);
  const detectionInterval = useRef(null);
  const cameraRef = useRef(null);
  const isProcessing = useRef(false);

  const isFocused = useIsFocused();
  const { voiceSpeed, hapticFeedback } = useContext(SettingsContext);
  const guidance = useGuidance();

  // Load Labels
  useEffect(() => {
    const loadLabels = async () => {
      try {
        const labelsAsset = Asset.fromModule(LABELS_ASSET);
        await labelsAsset.downloadAsync();
        const response = await fetch(labelsAsset.uri);
        const text = await response.text();
        const labelsList = text.split('\n').map(l => l.trim()).filter(Boolean);
        setLabels(labelsList);
        console.log('Labels loaded:', labelsList);
      } catch (err) {
        console.error('Error loading labels:', err);
      }
    };
    loadLabels();
  }, []);

  // Check Model Status
  useEffect(() => {
    if (model.state === 'loaded') {
      console.log('Model loaded successfully');
      setStatusText('Model ready. Point at machine.');
    } else if (model.state === 'loading') {
      setStatusText('Loading model...');
    } else if (model.state === 'error') {
      console.error('Model loading error:', model.error);
      setStatusText('Error loading model.');
    }
  }, [model.state]);

  // Core AI Detection Function
  const runModelOnFrame = async () => {
    if (model.state !== 'loaded' || !cameraRef.current || isProcessing.current) {
      return;
    }
    
    isProcessing.current = true;

    try {
      // Capture image from camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });

      // Run TFLite model on the image
      // Adjust input shape based on your model (common: 320x320, 640x640)
      const outputs = model.model.runSync([{
        data: photo.uri,
        dataType: 'uint8',
        shape: [1, 320, 320, 3] // Adjust to your model's input shape
      }]);

      // Parse outputs (adjust based on your model's output format)
      // Common object detection outputs:
      // outputs[0] = detection_boxes [1, N, 4]
      // outputs[1] = detection_classes [1, N]
      // outputs[2] = detection_scores [1, N]
      // outputs[3] = num_detections [1]

      const detectionScores = outputs[2]; // Scores
      const detectionClasses = outputs[1]; // Classes
      
      // Find best detection above confidence threshold
      let bestLabel = null;
      let highestScore = 0;
      const CONFIDENCE_THRESHOLD = 0.6; // 60% confidence

      // Iterate through detections
      for (let i = 0; i < detectionScores.length; i++) {
        const score = detectionScores[i];
        if (score > CONFIDENCE_THRESHOLD && score > highestScore) {
          highestScore = score;
          const classIndex = Math.floor(detectionClasses[i]);
          
          // Handle label indexing (some models start at 0, some at 1)
          if (classIndex >= 0 && classIndex < labels.length) {
            bestLabel = labels[classIndex];
          }
        }
      }

      // Log detection for debugging
      if (bestLabel) {
        console.log(`Detected: ${bestLabel} (${(highestScore * 100).toFixed(1)}%)`);
      }

      // Send result to guidance system
      handleDetectionResult(bestLabel);

    } catch (error) {
      console.error("Detection error:", error);
      setStatusText(`Detection error: ${error.message}`);
    } finally {
      isProcessing.current = false;
    }
  };

  // Process Detection Result
  const handleDetectionResult = (detectedItem) => {
    const item = mockDetectionRef.current || detectedItem;

    const { instruction, advance } = guidance.getInstruction(item);

    if (instruction) {
      // Speak instruction for visually impaired users
      Speech.speak(instruction, { rate: voiceSpeed });
      setStatusText(instruction);
    }

    // Haptic feedback for confirmation
    if (hapticFeedback && advance) {
      Vibration.vibrate(50); // Success vibration
    } else if (hapticFeedback && item && !advance) {
      Vibration.vibrate([10, 50]); // Attention vibration
    }
    
    mockDetectionRef.current = null;
  };

  // Camera Ready Effect
  useEffect(() => {
    if (isFocused && permission?.granted && model.state === 'loaded') {
      Speech.speak('Camera ready. Tap Start.', { rate: voiceSpeed });
    } else {
      Speech.stop();
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      setIsDetecting(false);
    }
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isFocused, permission?.granted, voiceSpeed, model.state]);

  // Detection Loop Effect
  useEffect(() => {
    if (isDetecting && model.state === 'loaded') {
      // Run detection every 1 second for real-time guidance
      // Adjust interval based on model speed and user testing
      detectionInterval.current = setInterval(runModelOnFrame, 1000);
    } else {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    }
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isDetecting, model.state]);

  // Toggle Detection Handler
  const toggleDetection = () => {
    if (model.state !== 'loaded') {
      Speech.speak("Model is still loading, please wait.", { rate: voiceSpeed });
      return;
    }
    
    if (hapticFeedback) Vibration.vibrate(50);
    const newState = !isDetecting;
    setIsDetecting(newState);
    
    if (newState) {
      const resetMsg = guidance.resetGuidance();
      Speech.speak(`Started detection. ${resetMsg}`, { rate: voiceSpeed });
      setStatusText("Detecting...");
    } else {
      Speech.speak("Detection stopped.", { rate: voiceSpeed });
      setStatusText("Stopped.");
    }
  };
  
  const handleGoBack = () => {
    if (hapticFeedback) Vibration.vibrate(50);
    Speech.stop();
    navigation.goBack();
  };

  // Simulation for testing (remove in production)
  const simulateDetection = (item) => {
    mockDetectionRef.current = item;
    setStatusText(`Testing: ${item}`);
  };

  // Permission Handling
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Camera access is required</Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.overlay}>
            {/* Status Display */}
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{statusText}</Text>
              {model.state === 'loading' && (
                <Text style={styles.subStatusText}>Preparing AI model...</Text>
              )}
            </View>

            {/* Test Buttons (Remove in Production) */}
            {__DEV__ && (
              <View style={styles.simulationContainer}>
                <TouchableOpacity 
                  style={styles.simButton} 
                  onPress={() => simulateDetection('coffee_machine')}
                >
                  <Text style={styles.simButtonText}>Test: Machine</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.simButton} 
                  onPress={() => simulateDetection('power_button')}
                >
                  <Text style={styles.simButtonText}>Test: Power</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.simButton} 
                  onPress={() => simulateDetection('water_reservoir')}
                >
                  <Text style={styles.simButtonText}>Test: Water</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Camera Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={handleGoBack}
                accessible={true}
                accessibilityLabel="Close camera"
              >
                <MaterialIcons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.captureButton, 
                  isDetecting && styles.captureButtonActive,
                  model.state !== 'loaded' && styles.captureButtonDisabled
                ]} 
                onPress={toggleDetection}
                disabled={model.state !== 'loaded'}
                accessible={true}
                accessibilityLabel={isDetecting ? "Stop detection" : "Start detection"}
              >
                <MaterialIcons 
                  name={isDetecting ? 'stop' : 'play-arrow'} 
                  size={40} 
                  color="#FFF" 
                />
              </TouchableOpacity>
              
              <View style={styles.controlButton} />
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  camera: { 
    flex: 1, 
    width: '100%' 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'transparent', 
    justifyContent: 'space-between' 
  },
  statusContainer: { 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    padding: 20, 
    marginTop: 60, 
    marginHorizontal: 20, 
    borderRadius: 10 
  },
  statusText: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: 'bold',
    textAlign: 'center' 
  },
  subStatusText: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5
  },
  simulationContainer: { 
    position: 'absolute', 
    top: 180, 
    left: 10, 
    right: 10, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 8, 
    flexWrap: 'wrap' 
  },
  simButton: { 
    backgroundColor: 'rgba(255, 255, 0, 0.6)', 
    padding: 8, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  simButtonText: { 
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 12 
  },
  controlsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: 40, 
    paddingHorizontal: 30 
  },
  captureButton: { 
    backgroundColor: '#6B4423', 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 4, 
    borderColor: '#FFF' 
  },
  captureButtonActive: { 
    backgroundColor: '#C00' 
  },
  captureButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5
  },
  controlButton: { 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  permissionButton: {
    backgroundColor: '#6B4423',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});