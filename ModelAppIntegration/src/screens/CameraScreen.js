import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as Speech from 'expo-speech';
import * as ImageManipulator from 'expo-image-manipulator';
import { DRINK_RECIPES, getFingerGuidance } from '../utils/coffeeLogic';

// --- ROBUST CONVERTER (Replaces 'buffer' library to prevent crashes) ---
function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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
  const lastSpokenRef = useRef(0);

  // 1. Initial Instruction
  useEffect(() => {
    const step = DRINK_RECIPES[selectedDrink].steps[stepIndex];
    if (step) Speech.speak(step.instruction);
  }, [stepIndex]);

  // 2. THE DETECTION LOOP
  useEffect(() => {
    if (!permission?.granted) requestPermission();

    const intervalId = setInterval(async () => {
      if (!model || !cameraRef.current || isProcessing.current) return;

      isProcessing.current = true; 
      try {
        // A. Take Snapshot (Fastest settings)
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.5,
          skipProcessing: true 
        });

        // B. RESIZE to 640x640 (Critical for YOLO)
        const resized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 640, height: 640 } }], 
          { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );

        // C. Convert Base64 -> Uint8Array (Using manual helper)
        const uint8 = base64ToUint8Array(resized.base64);

        // D. RUN MODEL
        const detections = model.run(uint8); 

        // E. Run Guidance Logic
        runLogic(detections);

      } catch (e) {
        console.log("Loop Error:", e);
      } finally {
        isProcessing.current = false; 
      }
    }, 1000); // Runs every 1 second

    return () => clearInterval(intervalId);
  }, [model, stepIndex]); 

  // 3. THE BRAIN (Logic Engine)
  const runLogic = (detections) => {
    const now = Date.now();
    const currentStep = DRINK_RECIPES[selectedDrink].steps[stepIndex];
    const HAND_LABEL = 'finger'; // Ensure this matches your labels.txt

    if (!detections) return;

    // 1. Find the Machine Button (Target)
    const target = detections.find(d => d.label.startsWith(currentStep.target) && d.confidence > 0.4);
    
    // 2. Find the User's Hand
    const hand = detections.find(d => d.label === HAND_LABEL && d.confidence > 0.4);

    if (!target) {
      // Case A: Can't see the button
      if (now - lastSpokenRef.current > 5000) {
        setDebugMsg(`Looking for ${currentStep.target}...`);
        Speech.speak(`Cannot see ${currentStep.target.replace('_', ' ')}. Move camera slowly.`);
        lastSpokenRef.current = now;
      }
    } else if (target && hand) {
      // Case B: GPS Mode (We see both)
      const guidance = getFingerGuidance(hand.boundingBox, target.boundingBox);
      setDebugMsg(guidance);
      
      if (now - lastSpokenRef.current > 2000) {
        Speech.speak(guidance);
        lastSpokenRef.current = now;
        
        // If "Press down", wait a bit then move to next step
        if (guidance.includes("Press")) {
           if (stepIndex < DRINK_RECIPES[selectedDrink].steps.length - 1) {
             setTimeout(() => setStepIndex(prev => prev + 1), 4000);
           }
        }
      }
    } else {
       // Case C: Target found, but no hand
       if (now - lastSpokenRef.current > 5000) {
          setDebugMsg("Show Hand");
          Speech.speak("Button found. Please show me your hand.");
          lastSpokenRef.current = now;
       }
    }
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