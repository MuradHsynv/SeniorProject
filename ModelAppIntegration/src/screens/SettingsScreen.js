import React, { useContext } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';

// Import from the new file name: GlobalSettings.js
import { SettingsContext } from '../context/GlobalSettings';

export default function SettingsScreen() {
  // Get values AND the new update functions from context
  const {
    voiceSpeed,
    hapticFeedback,
    detailedInstructions,
    updateVoiceSpeed,
    updateHapticFeedback,
    updateDetailedInstructions,
  } = useContext(SettingsContext);

  const testVoice = () => {
    Speech.speak('This is a test of the voice guidance system', {
      rate: voiceSpeed, 
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Voice Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="record-voice-over" size={24} color="#6B4423" />
          <Text style={styles.sectionTitle}>Voice Settings</Text>
        </View>

        {/* Voice Speed */}
        <View
          style={styles.settingItem}
          accessible={true}
          accessibilityLabel={`Voice Speed, ${voiceSpeed.toFixed(1)}x`}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Voice Speed</Text>
            <Text style={styles.settingValue}>{voiceSpeed.toFixed(1)}x</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.1}
            value={voiceSpeed}
            // Use the new update function
            onValueChange={updateVoiceSpeed}
            minimumTrackTintColor="#6B4423"
            maximumTrackTintColor="#DDD"
            thumbTintColor="#6B4423"
            accessibilityRole="adjustable"
            accessibilityHint="Adjusts the speed of the voice guidance. Swipe up to increase, down to decrease."
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Slower</Text>
            <Text style={styles.sliderLabel}>Faster</Text>
          </View>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testVoice}
            accessible={true}
            accessibilityLabel="Test Voice"
            accessibilityHint="Plays a test sentence at the currently selected voice speed"
            accessibilityRole="button">
            <MaterialIcons name="volume-up" size={20} color="#6B4423" />
            <Text style={styles.testButtonText}>Test Voice</Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Instructions */}
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Detailed Instructions</Text>
            <Text style={styles.settingDescription}>
              Get comprehensive guidance for each step
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#DDD', true: '#A67C52' }}
            thumbColor={detailedInstructions ? '#6B4423' : '#f4f3f4'}
            // Use the new update function
            onValueChange={updateDetailedInstructions}
            value={detailedInstructions}
            accessible={true}
            accessibilityLabel="Detailed Instructions"
            accessibilityHint="Toggles between simple and detailed voice instructions"
            accessibilityRole="switch"
          />
        </View>
      </View>

      {/* Accessibility Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="accessibility" size={24} color="#6B4423" />
          <Text style={styles.sectionTitle}>Accessibility</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>
              Vibration feedback for actions
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#DDD', true: '#A67C52' }}
            thumbColor={hapticFeedback ? '#6B4423' : '#f4f3f4'}
            // Use the new update function
            onValueChange={updateHapticFeedback}
            value={hapticFeedback}
            accessible={true}
            accessibilityLabel="Haptic Feedback"
            accessibilityHint="Toggles vibration feedback on or off for button presses and detections"
            accessibilityRole="switch"
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="info" size={24} color="#6B4423" />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View
          style={styles.aboutContainer}
          accessible={true}
          accessibilityLabel="About this app">
          <Text style={styles.aboutText}>Coffee Machine Assistant v1.0</Text>
          <Text style={styles.aboutText}>TEDU Senior Project 2025</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#FFF',
    marginVertical: 10,
    marginHorizontal: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B4423',
    marginLeft: 10,
  },
  settingItem: {
    marginVertical: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    minHeight: 48, 
  },
  settingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#6B4423',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#6B4423',
  },
  testButtonText: {
    color: '#6B4423',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  aboutContainer: {
    paddingVertical: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    lineHeight: 20,
  },
});