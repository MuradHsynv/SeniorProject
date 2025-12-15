import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// keys for storage
const VOICE_SPEED_KEY = '@settings_voiceSpeed';
const HAPTIC_KEY = '@settings_hapticFeedback';
const DETAILED_KEY = '@settings_detailedInstructions';

// default values
const defaultState = {
  isLoading: true,
  voiceSpeed: 1.0,
  hapticFeedback: true,
  detailedInstructions: true,
  updateVoiceSpeed: () => {},
  updateHapticFeedback: () => {},
  updateDetailedInstructions: () => {},
};

export const SettingsContext = createContext(defaultState);

// provider component
export const SettingsProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [detailedInstructions, setDetailedInstructions] = useState(true);

  // Load settings from storage when the app starts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [speed, haptic, detailed] = await Promise.all([
          AsyncStorage.getItem(VOICE_SPEED_KEY),
          AsyncStorage.getItem(HAPTIC_KEY),
          AsyncStorage.getItem(DETAILED_KEY),
        ]);

        if (speed !== null) {
          setVoiceSpeed(JSON.parse(speed));
        }
        if (haptic !== null) {
          setHapticFeedback(JSON.parse(haptic));
        }
        if (detailed !== null) {
          setDetailedInstructions(JSON.parse(detailed));
        }
      } catch (e) {
        console.error('Failed to load settings.', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateVoiceSpeed = async (value) => {
    try {
      setVoiceSpeed(value);
      await AsyncStorage.setItem(VOICE_SPEED_KEY, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save voice speed.', e);
    }
  };

  const updateHapticFeedback = async (value) => {
    try {
      setHapticFeedback(value);
      await AsyncStorage.setItem(HAPTIC_KEY, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save haptic feedback.', e);
    }
  };

  const updateDetailedInstructions = async (value) => {
    try {
      setDetailedInstructions(value);
      await AsyncStorage.setItem(DETAILED_KEY, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save detailed instructions.', e);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        isLoading,
        voiceSpeed,
        hapticFeedback,
        detailedInstructions,
        updateVoiceSpeed,
        updateHapticFeedback,
        updateDetailedInstructions,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};