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
