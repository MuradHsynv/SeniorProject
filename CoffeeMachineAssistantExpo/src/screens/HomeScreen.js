import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useIsFocused } from '@react-navigation/native';

import { SettingsContext } from '../context/GlobalSettings';

export default function HomeScreen({ navigation }) {
  // Get settings from the global context
  const { hapticFeedback, voiceSpeed } = useContext(SettingsContext);
  const isFocused = useIsFocused();

  // Announce the screen when it comes into focus
  useEffect(() => {
    if (isFocused) {
      Speech.speak(
        'Welcome to the Coffee Machine Assistant. Tap the Start button in the middle of the screen to begin guidance, or tap Settings at the bottom.',
        {
          rate: voiceSpeed,
        },
      );
    } else {
      Speech.stop();
    }
  }, [isFocused, voiceSpeed]);

  // Helper function to trigger haptics based on settings
  const triggerHaptic = () => {
    if (hapticFeedback) {
      Vibration.vibrate(50);
    }
  };

  const handleStartPress = () => {
    triggerHaptic();
    navigation.navigate('CameraScreen');
  };

  const handleSettingsPress = () => {
    triggerHaptic();
    navigation.navigate('SettingsScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Welcome Section */}
      <View
        style={styles.welcomeContainer}
        accessible={true}
        accessibilityLabel="Welcome Section">
        <MaterialIcons name="local-cafe" size={80} color="#6B4423" />
        <Text style={styles.title}>Coffee Machine{'\n'}Assistant</Text>
        <Text style={styles.subtitle}>
          Voice-guided coffee making{'\n'}for independent operation
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartPress}
          accessible={true}
          accessibilityLabel="Start"
          accessibilityHint="Starts the camera to begin coffee machine guidance"
          accessibilityRole="button">
          <MaterialIcons name="play-circle-filled" size={50} color="#FFF" />
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSettingsPress}
          accessible={true}
          accessibilityLabel="Settings"
          accessibilityHint="Opens the settings screen for voice speed, haptics, and instructions"
          accessibilityRole="button">
          <MaterialIcons name="settings" size={30} color="#6B4423" />
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View
        style={styles.instructionsContainer}
        accessible={true}
        accessibilityLabel="Quick Start Instructions">
        <Text style={styles.instructionsTitle}>Quick Start:</Text>
        <Text style={styles.instructionsText}>
          1. Tap the Start button{'\n'}
          2. Point camera at coffee machine{'\n'}
          3. Follow voice instructions
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    justifyContent: 'space-around',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6B4423',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 20,
  },
  startButton: {
    backgroundColor: '#6B4423',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 80,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B4423',
    width: '80%',
    minHeight: 60,
  },
  secondaryButtonText: {
    color: '#6B4423',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  instructionsContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6B4423',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B4423',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});