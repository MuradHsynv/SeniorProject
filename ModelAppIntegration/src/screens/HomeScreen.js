import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  Platform,
  StatusBar
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons'; 

// The 7 Drink Options
const DRINK_OPTIONS = [
  { id: 'espresso', name: 'Espresso', color: '#4b3621' },
  { id: 'lungo', name: 'Lungo', color: '#8b4513' },
  { id: 'ristretto', name: 'Ristretto', color: '#3e2723' },
  { id: 'cappuccino', name: 'Cappuccino', color: '#cd853f' },
  { id: 'caffe_latte', name: 'Caffe Latte', color: '#d2b48c' },
  { id: 'flat_white', name: 'Flat White', color: '#f5deb3' },
  { id: 'hot_milk', name: 'Hot Milk', color: '#fff8dc' },
];

export default function HomeScreen({ navigation }) {

  // Single tap: Read the name
  const handlePress = (item) => {
    Speech.stop();
    Speech.speak(item.name);
  };

  // Long press: Confirm selection
  const handleConfirm = (item) => {
    Speech.stop();
    Speech.speak(`${item.name} selected. Loading camera.`);
    
    // Navigate to CameraScreen and pass selectedDrink
    navigation.navigate('CameraScreen', { selectedDrink: item.id });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.row, { backgroundColor: item.color }]} 
      activeOpacity={0.8}
      onPress={() => handlePress(item)}       
      onLongPress={() => handleConfirm(item)} 
      delayLongPress={500}
    >
      <Text style={[
        styles.text, 
        ['hot_milk', 'flat_white'].includes(item.id) ? { color: '#333' } : { color: 'white' }
      ]}>
        {item.name.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Select Drink</Text>
          <Text style={styles.headerSubtitle}>Tap to hear, Hold to select</Text>
        </View>
        
        {/* Settings Button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('SettingsScreen')}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-sharp" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={DRINK_OPTIONS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  header: { 
    padding: 20, 
    backgroundColor: '#6B4423', 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#ddd', fontSize: 14, marginTop: 5 },
  settingsButton: {
    padding: 10,
  },
  row: {
    height: 120, 
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  text: { fontSize: 28, fontWeight: 'bold', letterSpacing: 1 }
});