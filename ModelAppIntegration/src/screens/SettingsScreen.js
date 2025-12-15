import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import { SettingsContext } from '../context/GlobalSettings';

export default function SettingsScreen() {
  const {
    voiceSpeed,
    detailedInstructions,
    updateVoiceSpeed,
    updateDetailedInstructions,
    updateHapticFeedback, // Imported to force it ON
  } = useContext(SettingsContext);

  // Requirement: "Make it on all the time"
  // We force Haptic Feedback to TRUE whenever this screen opens,
  // and we removed the UI toggle so it cannot be turned off.
  useEffect(() => {
    updateHapticFeedback(true);
  }, []);

  const testVoice = () => {
    Speech.stop();
    Speech.speak('Voice speed check.', { rate: voiceSpeed });
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* Voice Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.headerTitle}>Preferences</Text>

        {/* 1. Voice Speed Slider */}
        <View style={styles.itemContainer}>
          <View style={styles.rowLabel}>
            <Text style={styles.label}>Voice Speed</Text>
            <Text style={styles.value}>{voiceSpeed.toFixed(1)}x</Text>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.1}
            value={voiceSpeed}
            onValueChange={updateVoiceSpeed}
            minimumTrackTintColor="#6B4423"
            maximumTrackTintColor="#DDD"
            thumbTintColor="#6B4423"
          />
          
          <TouchableOpacity style={styles.testBtn} onPress={testVoice}>
            <Text style={styles.testBtnText}>Test Audio</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* 2. Detailed Instructions Switch */}
        <View style={[styles.itemContainer, styles.rowBetween]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.label}>Detailed Instructions</Text>
            <Text style={styles.subLabel}>
              Provide extra guidance steps
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#DDD', true: '#A67C52' }}
            thumbColor={detailedInstructions ? '#6B4423' : '#f4f3f4'}
            onValueChange={updateDetailedInstructions}
            value={detailedInstructions}
          />
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.itemContainer}>
          <Text style={styles.infoText}>Coffee Machine Assistant v1.0</Text>
          <Text style={styles.infoText}>TEDU Senior Project 2025</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B4423',
    marginBottom: 15,
  },
  itemContainer: {
    marginVertical: 5,
  },
  rowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B4423',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  testBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0EBE7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 5,
  },
  testBtnText: {
    color: '#6B4423',
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 15,
  },
  infoText: {
    color: '#555',
    marginBottom: 5,
  },
});