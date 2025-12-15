import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as Speech from 'expo-speech';
import * as ImageManipulator from 'expo-image-manipulator'; // NEW IMPORT
import { Buffer } from 'buffer'; // Ensure you ran: npm install buffer
import { DRINK_RECIPES, getFingerGuidance } from '../utils/coffeeLogic';

export default function CameraScreen({ route }) {
  const { selectedDrink } = route.params; 
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  // Load Model
  const tflite = useTensorflowModel(require('../../assets/models/model.tflite'));
  const model = tflite.state === "loaded" ? tflite.model : undefined;

  const [stepIndex, setStepIndex] = useState(0);
  const [debugMsg, setDebugMsg] = useState("Initializing...");
  const isProcessing = useRef(false);
  const lastSpoken = useRef(0);

  // Initial Instruction
  useEffect(() => {
    const step = DRINK_RECIPES[selectedDrink].steps[stepIndex];
    if (step) Speech.speak(step.instruction);
  }, [stepIndex]);

  // THE LOOP
  useEffect(() => {
    if (!permission?.granted) requestPermission();

    const intervalId = setInterval(async () => {
      if (!model || !cameraRef.current || isProcessing.current) return;

      isProcessing.current = true; 
      try {
        // 1. Take Picture (Fastest mode)
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.3,
          skipProcessing: true 
        });

        // 2. RESIZE IMAGE (Crucial Fix for "no ArrayBuffer" error)
        // We resize to 320x320 because that's usually what models want.
        // If your model needs 224x224 or 640x640, change these numbers!
        const resized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 640, height: 640 } }], 
          { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );

        // 3. Convert Base64 -> Uint8Array
        const binary = Buffer.from(resized.base64, 'base64');
        const uint8 = new Uint8Array(binary);

        // 4. PREPARE INPUT TENSOR
        // We need to know if the model wants Float32 or Uint8.
        // Most Object Detection models want Uint8, but let's be safe.
        let inputTensor;
        if (model.inputs[0].dataType === 'float32') {
           // Convert [0-255] integer to [0.0-1.0] float if required
           const float32 = new Float32Array(uint8.length);
           for (let i = 0; i < uint8.length; i++) {
             float32[i] = uint8[i] / 255.0; 
           }
           inputTensor = float32;
        } else {
           // Model likely wants Uint8 (Integers)
           inputTensor = uint8;
        }

        // 5. RUN MODEL
        const detections = model.run([inputTensor]); 

        // 6. Run Logic
        runLogic(detections, 640, 640); // Pass the resized dimensions!

      } catch (e) {
        console.log("Detection Loop Error:", e);
      } finally {
        isProcessing.current = false; 
      }
    }, 1000); 

    return () => clearInterval(intervalId);
  }, [model, stepIndex]); 

  const runLogic = (detections, width, height) => {
    // ... (Your Logic Code Here - same as before) ...
    const now = Date.now();
    const currentStep = DRINK_RECIPES[selectedDrink].steps[stepIndex];
    const HAND_LABEL = 'finger';

    // Note: detections might be an object or array depending on model type.
    // Assuming standard array of objects output:
    // If detections is not an array (e.g. it's a map), you might need: detections[0]
    
    // Safety check for empty detections
    if (!detections || detections.length === 0) return;

    // ... Rest of your logic ...
    // Copy the logic block from the previous response here
  };

  if (!permission?.granted) return <View />;

  return (
    <View style={{flex: 1}}>
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing="back"
        ref={cameraRef}
      />
      <View style={styles.overlay}>
        <Text style={styles.text}>{DRINK_RECIPES[selectedDrink].name} - Step {stepIndex + 1}</Text>
        <Text style={styles.guidance}>{debugMsg}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 15 },
  text: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  guidance: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 5 }
});