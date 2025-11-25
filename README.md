🏁 Getting Started

This project is built with Expo, making it easy to run on your physical device using the Expo Go app.

Prerequisites:
Node.js installed.
Expo Go app installed on your Android/iOS device.

Installation
1. Clone the repository:
git clone [https://github.com/your-username/coffee-machine-assistant.git](https://github.com/your-username/coffee-machine-assistant.git)
cd coffee-machine-assistant
2. Install dependencies:
npm install
3. Start the server:
npx expo start

Coffee Machine Assistant for the Visually Impaired ☕📱

A Computer Vision-Based Mobile Application for Independent Living
TED University - Senior Project (CMPE 491)

📖 Abstract

This project addresses the challenge of independent coffee machine operation for visually impaired individuals. Modern appliances often rely on visual interfaces (screens, small buttons) that are inaccessible. This mobile application utilizes Computer Vision (CV) and Voice Guidance to provide real-time, step-by-step audio instructions, empowering users to operate a coffee machine independently.

🚀 Key Features

Sequential Voice Guidance: A state-machine "brain" that guides the user through specific steps (Find Machine -> Find Power -> Find Water -> Find Brew Button).
Accessibility-First Design: Large touch targets, high-contrast UI, and screen-reader compatibility.
Haptic Feedback: Differentiated vibration patterns for "Correct Object Found" (short buzz) vs. "Wrong Object Found" (double pulse).

Customizable Settings:
Voice Speed: Adjustable speech rate.
Instruction Detail: Toggle between "Simple" (short commands) and "Detailed" (descriptive context).
Haptics: Toggle vibration feedback.

Persistent Storage: User preferences are saved on the device using AsyncStorage.
Simulation Mode: Built-in development tools to simulate object detection events for testing guidance logic without the machine present.

🛠️ Technology Stack

Framework: React Native (via Expo)
Language: JavaScript (ES6+)
State Management: React Context API
Storage: @react-native-async-storage/async-storage
Device Features: expo-camera, expo-speech, expo-haptics
Future Integration: TensorFlow Lite (EfficientDet) for object detection.

📂 Project Structure

CoffeeMachineAssistantExpo/
├── assets/                 # Images and future model files
├── src/
│   ├── context/
│   │   ├── GlobalSettings.js   # Manages app settings & persistence
│   │   └── GuidanceContext.js  # The "Brain": State machine for step-by-step logic
│   ├── screens/
│   │   ├── HomeScreen.js       # Landing page & navigation
│   │   ├── CameraScreen.js     # Main guidance loop & simulation UI
│   │   └── SettingsScreen.js   # User preference configuration
│   └── ...
├── App.js                  # Entry point & Navigation setup
└── ...
