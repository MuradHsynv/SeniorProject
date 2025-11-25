import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useIsFocused } from '@react-navigation/native';

import { SettingsContext } from '../context/GlobalSettings';
import { useGuidance } from '../context/GuidanceContext';

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusText, setStatusText] = useState('Point at coffee machine');

  const mockDetectionRef = useRef(null);
  const isFocused = useIsFocused();
  const detectionInterval = useRef(null);

  const { voiceSpeed, hapticFeedback } = useContext(SettingsContext);
  const guidance = useGuidance();

  // Announce screen and manage detection state
  useEffect(() => {
    if (isFocused && permission?.granted) {
      Speech.speak('Camera screen. Tap the detection button to start.', {
        rate: voiceSpeed,
      });
    } else {
      Speech.stop();
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      setIsDetecting(false);
    }
    return () => {
      Speech.stop();
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isFocused, permission?.granted, voiceSpeed]);

  // The Detection Loop (connected to the "brain")
  useEffect(() => {
    if (isDetecting) {
      detectionInterval.current = setInterval(() => {
        const detectionResult = mockDetectionRef.current;
        const { instruction, advance } = guidance.getInstruction(detectionResult);

        Speech.speak(instruction, { rate: voiceSpeed });
        setStatusText(instruction);

        // --- 1. Differentiated Haptic Feedback ---
        if (hapticFeedback) {
          if (advance) {
            Vibration.vibrate(50); // Short buzz for SUCCESS
          } else if (detectionResult) {
            Vibration.vibrate([10, 50]); // "buh-bump" pulse for WRONG ITEM
          }
        }

        mockDetectionRef.current = null;
      }, 3000);
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
  }, [isDetecting, voiceSpeed, hapticFeedback, guidance]);

  const toggleDetection = () => {
    if (hapticFeedback) Vibration.vibrate(50);
    const newState = !isDetecting;
    setIsDetecting(newState);

    if (newState) {
      const resetMsg = guidance.resetGuidance(); // Resets to STEP_0
      Speech.speak(`Detection started. ${resetMsg}`, { rate: voiceSpeed });
      // --- 2. Update initial status text ---
      setStatusText('Detection started. Looking for the machine.');
    } else {
      Speech.speak('Detection stopped.', { rate: voiceSpeed });
      setStatusText('Detection stopped.');
    }
  };

  const handleGoBack = () => {
    if (hapticFeedback) Vibration.vibrate(50);
    navigation.goBack();
  };

  const simulateDetection = (item) => {
    mockDetectionRef.current = item;
    setStatusText(`Simulating finding: ${item}`);
  };

  if (!permission) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="camera-alt" size={100} color="#999" />
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>

            {/* --- 3. SIMULATION BUTTONS (Added "Find Machine") --- */}
            <View style={styles.simulationContainer}>
              <TouchableOpacity
                style={styles.simButton}
                onPress={() => simulateDetection('coffee_machine')}>
                <Text style={styles.simButtonText}>Find Machine</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.simButton}
                onPress={() => simulateDetection('power_button')}>
                <Text style={styles.simButtonText}>Find Power</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.simButton}
                onPress={() => simulateDetection('water_tank')}>
                <Text style={styles.simButtonText}>Find Water</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.simButton}
                onPress={() => simulateDetection('brew_button')}>
                <Text style={styles.simButtonText}>Find Brew</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleGoBack}
                accessibilityLabel="Go Back">
                <MaterialIcons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  isDetecting && styles.captureButtonActive,
                ]}
                onPress={toggleDetection}
                accessibilityLabel={
                  isDetecting ? 'Stop Detection' : 'Start Detection'
                }>
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
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  statusContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    marginTop: 60,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  statusText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
  },
  simulationContainer: {
    position: 'absolute',
    top: 150,
    left: 10,
    right: 10,
    flexWrap: 'wrap', // Allow buttons to wrap
    flexDirection: 'row',
    justifyContent: 'center', // Center the buttons
    gap: 8, // Add spacing
  },
  simButton: {
    backgroundColor: 'rgba(255, 255, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  simButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  captureButton: {
    backgroundColor: '#6B4423',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureButtonActive: {
    backgroundColor: '#C00',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#6B4423',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});