import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

// TFJS Imports
import * as tf from '@tensorflow/tfjs';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';

import { loadTFLiteModel } from '@tensorflow/tfjs-tflite';

import { SettingsContext } from '../context/GlobalSettings';
import { useGuidance } from '../context/GuidanceContext';

// Load Assets
const MODEL_ASSET = require('../../assets/model/model.tflite');
const LABELS_ASSET = require('../../assets/model/labels.txt');

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusText, setStatusText] = useState('Initializing AI...');
  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState([]);

  // Loop control refs
  const mockDetectionRef = useRef(null);
  const detectionInterval = useRef(null);
  const cameraRef = useRef(null);
  const isProcessing = useRef(false);

  const isFocused = useIsFocused();
  const { voiceSpeed, hapticFeedback } = useContext(SettingsContext);
  const guidance = useGuidance();

  // 1. Initialize AI
  useEffect(() => {
    const init = async () => {
      try {
        await tf.ready();
        
        // Load Labels
        const labelAsset = Asset.fromModule(LABELS_ASSET);
        await labelAsset.downloadAsync();
        const text = await (await fetch(labelAsset.uri)).text();
        setLabels(text.split('\n').map(l => l.trim()).filter(Boolean));

        // Load Model
        const modelAsset = Asset.fromModule(MODEL_ASSET);
        await modelAsset.downloadAsync();
        const loadedModel = await loadTFLiteModel(modelAsset.uri);
        setModel(loadedModel);
        
        setStatusText('AI Ready. Press Start.');
      } catch (e) {
        console.error('AI Init Failed:', e);
        setStatusText('AI Failed. Using Sim Mode.');
      }
    };
    init();
  }, []);

  // 2. Real Inference Logic
  const runInference = async () => {
    if (isProcessing.current || !model || !cameraRef.current) return;
    isProcessing.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3, base64: true, skipProcessing: true
      });

      const imgBuffer = tf.util.encodeString(photo.base64, 'base64');
      const raw = new Uint8Array(imgBuffer);
      const imageTensor = decodeJpeg(raw);
      const resized = tf.image.resizeBilinear(imageTensor, [320, 320]); // Adjust input size if needed
      const input = resized.expandDims(0);
      
      const predictions = model.predict(input);
      // Adjust indices based on your specific model output structure!
      // This logic tries to find the standard [boxes, classes, scores, count] outputs
      const scores = await predictions[Object.keys(predictions)[2]]?.array();
      const classes = await predictions[Object.keys(predictions)[1]]?.array();

      let bestLabel = null;
      if (scores && classes) {
        for (let i = 0; i < scores[0].length; i++) {
          if (scores[0][i] > 0.5) { // 50% Threshold
            bestLabel = labels[Math.round(classes[0][i])];
            break; 
          }
        }
      }

      tf.dispose([imageTensor, resized, input]);
      if (predictions.dispose) predictions.dispose();

      if (bestLabel) handleDetection(bestLabel);

    } catch (e) {
      console.log('Inference Error:', e);
    } finally {
      isProcessing.current = false;
    }
  };

  // 3. Central Handler
  const handleDetection = useCallback((label) => {
    const item = mockDetectionRef.current || label;
    if (!item) return;

    const { instruction, advance } = guidance.getInstruction(item);
    
    if (instruction) {
      Speech.speak(instruction, { rate: voiceSpeed });
      setStatusText(instruction);
    }

    if (hapticFeedback) {
      if (advance) Vibration.vibrate(50);
      else if (!advance) Vibration.vibrate([10, 50]);
    }
    
    mockDetectionRef.current = null;
  }, [guidance, voiceSpeed, hapticFeedback]);

  // 4. Main Loop
  useEffect(() => {
    if (isDetecting) {
      detectionInterval.current = setInterval(() => {
        if (mockDetectionRef.current) handleDetection(null); // Prioritize Sim
        else runInference(); // Run Real AI
      }, 1000);
    } else {
      clearInterval(detectionInterval.current);
    }
    return () => clearInterval(detectionInterval.current);
  }, [isDetecting, model]);

  // Handlers
  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
    if (!isDetecting) {
      const msg = guidance.resetGuidance();
      Speech.speak(`Started. ${msg}`, { rate: voiceSpeed });
      setStatusText('Started. Looking for machine...');
    } else {
      Speech.speak("Stopped.", { rate: voiceSpeed });
      setStatusText("Stopped.");
    }
  };

  const simulate = (item) => {
    mockDetectionRef.current = item;
    setStatusText(`Simulating: ${item}`);
  };

  if (!permission || !permission.granted) return <View style={styles.container}><Text>No Camera</Text></View>;

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.overlay}>
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>

            {/* Simulation Buttons (Updated Names) */}
            <View style={styles.simContainer}>
              <TouchableOpacity style={styles.simBtn} onPress={() => simulate('coffee_dispenser')}><Text style={styles.simTxt}>Sim: Dispenser</Text></TouchableOpacity>
              <TouchableOpacity style={styles.simBtn} onPress={() => simulate('power')}><Text style={styles.simTxt}>Sim: Power</Text></TouchableOpacity>
              <TouchableOpacity style={styles.simBtn} onPress={() => simulate('water_reservoir')}><Text style={styles.simTxt}>Sim: Water</Text></TouchableOpacity>
              <TouchableOpacity style={styles.simBtn} onPress={() => simulate('espresso_button')}><Text style={styles.simTxt}>Sim: Espresso</Text></TouchableOpacity>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
                <MaterialIcons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.captureBtn]} onPress={toggleDetection}>
                <MaterialIcons name={isDetecting ? "stop" : "play-arrow"} size={40} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.btn} /> 
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  statusBox: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 10, marginTop: 40 },
  statusText: { color: 'white', textAlign: 'center', fontSize: 18 },
  simContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  simBtn: { backgroundColor: 'rgba(255, 255, 0, 0.5)', padding: 8, borderRadius: 5 },
  simTxt: { fontWeight: 'bold', fontSize: 12 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6B4423', borderWidth: 4, borderColor: 'white' },
});