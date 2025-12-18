import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as Speech from 'expo-speech';
import * as ImageManipulator from 'expo-image-manipulator';
import { DRINK_RECIPES, getFingerGuidance } from '../utils/coffeeLogic';


const LABELS = [
  "caffe_latte_button", "caffe_latte_buttonrotation", "cappuccino_button", "cappuccino_buttonrotation",
  "coffee_dispenser", "coffee_dispenserrotation", "descale", "descalerotation",
  "drip_tray", "drip_trayrotation", "espresso_button", "espresso_buttonrotation",
  "flat_white_button", "flat_white_buttonrotation", "hot_foam_button", "hot_foam_buttonrotation",
  "hot_milk_button", "hot_milk_buttonrotation", "latte_macchiato_button", "latte_macchiato_buttonrotation",
  "lungo_button", "lungo_buttonrotation", "milk_frother_wand", "milk_frother_wandrotation",
  "power", "powerrotation", "rinse", "rinserotation",
  "ristretto_button", "ristretto_buttonrotation", "water_reservoir", "water_reservoirrotation",
  "finger"
];

// Robust Converter
function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// NMS Decoder
// data format: [x1, y1, x2, y2, batch_id(0), class_id]
function decodeNMSOutput(data, imgWidth, imgHeight) {
  const results = [];
  const stride = 6; 
  
  for (let i = 0; i < data.length; i += stride) {
    const x1 = data[i];
    const y1 = data[i+1];
    const x2 = data[i+2];
    const y2 = data[i+3];
    // const batchId = data[i+4]; 
    const classId = data[i+5];

    // 1. Sanity Check: Invalid Class
    if (classId < 0 || classId >= LABELS.length) continue;

    // 2. Sanity Check: Box Size
    // If the box is impossibly small (e.g., < 1% of screen), it's noise.
    if ((x2 - x1) < 0.02 || (y2 - y1) < 0.02) continue;

    // 3. Sanity Check: Edge Hallucinations
    // If a box is stuck perfectly to the edge (0.0 or 1.0), it's usually a glitch.
    if (x1 < 0.01 || x2 > 0.99 || y1 < 0.01 || y2 > 0.99) continue;

    // Calculate dimensions
    const width = (x2 - x1) * imgWidth;
    const height = (y2 - y1) * imgHeight;
    const left = x1 * imgWidth;
    const top = y1 * imgHeight;

    results.push({
      label: LABELS[classId],
      confidence: 1.0, 
      boundingBox: { left, top, width, height }
    });
  }
  return results;
}

export default function CameraScreen({ route }) {
  const { selectedDrink } = route.params; 
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  const tflite = useTensorflowModel(require('../../assets/models/model.tflite'));
  const model = tflite.state === "loaded" ? tflite.model : undefined;

  const [stepIndex, setStepIndex] = useState(0);
  const [debugMsg, setDebugMsg] = useState("Initializing...");
  const isProcessing = useRef(false);
  const lastSpokenRef = useRef(0);

  useEffect(() => {
    const step = DRINK_RECIPES[selectedDrink].steps[stepIndex];
    if (step) Speech.speak(step.instruction);
  }, [stepIndex]);

  useEffect(() => {
    if (!permission?.granted) requestPermission();

    const intervalId = setInterval(async () => {
      if (!model || !cameraRef.current || isProcessing.current) return;

      isProcessing.current = true; 
      try {
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.5, skipProcessing: true 
        });

        const resized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 640, height: 640 } }], 
          { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );

        const uint8 = base64ToUint8Array(resized.base64);
        
        // Run Model
        const output = await model.run([uint8]); 
        console.log(output)
        const rawData = output[0] ? output[0] : output; 

        // Decode using NMS logic
        const detections = decodeNMSOutput(rawData, 640, 640);
        
        runLogic(detections);
      

      } catch (e) {
        console.log("Loop Error:", e);
      } finally {
        isProcessing.current = false; 
      }
    }, 1000); 

    return () => clearInterval(intervalId);
  }, [model, stepIndex]); 

const runLogic = (detections) => {
    // 1. Safety Check: If detections is null/empty, stop immediately.
    if (!detections || detections.length === 0) return;

    const currentStep = DRINK_RECIPES[selectedDrink].steps[stepIndex];
    
    // 2. Debug Log: See exactly what the camera sees (helps you test!)
    // console.log("Detected:", detections.map(d => d.label)); 

    const HAND_LABEL = 'finger'; 

    // 3. Find Target (Safe check)
    // We add "d.label &&" to ensure we don't crash if a label is missing
    const target = detections.find(d => d.label && d.label.startsWith(currentStep.target));
    // Center of Screen acts as our finger for now
    const virtualFinger = {
      left: 320 - 25, // Center X (640/2)
      top: 320 - 25,  // Center Y (640/2)
      width: 50,
      height: 50
    };

    const now = Date.now();

    if (!target) {
      if (now - lastSpokenRef.current > 5000) {
        setDebugMsg(`Scanning for ${currentStep.target}...`);
        Speech.speak(`Cannot see ${currentStep.target.replace('_', ' ')}.`);
        lastSpokenRef.current = now;
      }
    } else {
      // Guide the user
      const guidance = getFingerGuidance(virtualFinger, target.boundingBox);
      setDebugMsg(guidance);
      
      if (now - lastSpokenRef.current > 2000) {
        Speech.speak(guidance);
        lastSpokenRef.current = now;
        
        if (guidance.includes("Press")) {
           if (stepIndex < DRINK_RECIPES[selectedDrink].steps.length - 1) {
             setTimeout(() => setStepIndex(prev => prev + 1), 4000);
           }
        }
      }
    }
  };

  if (!permission?.granted) return <View />;

  return (
    <View style={{flex: 1}}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />
      <View style={styles.overlay}>
        <Text style={styles.text}>{DRINK_RECIPES[selectedDrink].name}</Text>
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