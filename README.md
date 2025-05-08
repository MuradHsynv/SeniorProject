For Testing of Detection function of the model: (Project file)

1. Go into CV Module directory:

cd ./Project/cv_Module

2. Create the environment inside cv_Module:

python -m venv cv_env

3. Activate Virtual Environment, do it each time you want to work on the project:

cv_env\Scripts\Activate.ps1 (for PowerShell terminal)

(If you get an error about execution policy, you might need to run PowerShell as Administrator and execute Set-ExecutionPolicy RemoteSigned -Scope CurrentUser, then try activating again)

cv_env\Scripts\activate.bat (for Command Prompt terminal)

source cv_env/bin/activate (for Mac/Linux)

4. Install the essential libraries:

pip install tensorflow tensorflow-hub opencv-python numpy matplotlib

5. Run the test file:

python .\models\test_tflite.py


For setup of MobileApp:

1. Create the React Native project

npx @react-native-community/cli init MobileApp

2. Go into cd MobileApp and install Tensor Flow library

npm install react-native-fast-tflite

3. Install react-native-vision-camera through npm and follow the guides for further setups:

npm install react-native-vision-camera react-native-reanimated react-native-worklets-core

https://react-native-vision-camera.com/docs/guides
https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/

4. Add our model tflite file to MobileApp/android/app/src/main/assets/ (create assets folder if needed)

5. Keep metro running in terminal: 

npx react-native start --reset-cache

6. Run on Android in another terminal:

npx react-native run-android