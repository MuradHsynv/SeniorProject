// src/services/VoiceGuidance.js
import { instructions } from '../utils/instructions';

class VoiceGuidance {
  constructor() {
    this.currentStep = 0;
    this.detectedComponents = new Set();
  }

  getInstructions(detections) {
    if (!detections || detections.length === 0) {
      return 'No coffee machine components detected. Please adjust your camera angle.';
    }

    // Get highest confidence detection
    const primaryDetection = detections.reduce((prev, current) =>
      prev.confidence > current.confidence ? prev : current
    );

    const component = primaryDetection.class;
    this.detectedComponents.add(component);

    // Get instruction for this component
    const instruction = instructions[component];
    
    if (instruction) {
      return instruction.description;
    }

    return `${component} detected. ${this.getGeneralGuidance(detections)}`;
  }

  getGeneralGuidance(detections) {
    const components = detections.map(d => d.class);
    
    // Check for power button first
    if (components.includes('power')) {
      return 'Power button located. Press to turn on the machine.';
    }

    // Check for espresso/coffee buttons
    const coffeeButtons = ['espresso_button', 'lungo_button', 'ristretto_button', 
                           'cappuccino_button', 'flat_white_button'];
    const hasCoffeeButton = components.some(c => coffeeButtons.includes(c));
    
    if (hasCoffeeButton) {
      return 'Coffee selection buttons detected. Choose your preferred coffee type.';
    }

    // Check for maintenance
    const maintenanceButtons = ['descale', 'rinse'];
    const hasMaintenance = components.some(c => maintenanceButtons.includes(c));
    
    if (hasMaintenance) {
      return 'Maintenance controls detected.';
    }

    return 'Coffee machine controls detected. Follow the voice instructions.';
  }

  getStepByStepGuidance() {
    const steps = [
      'Step 1: Locate the power button and turn on the machine.',
      'Step 2: Wait for the machine to warm up. You will hear a beep.',
      'Step 3: Ensure the water tank is filled.',
      'Step 4: Place a cup under the coffee dispenser.',
      'Step 5: Select your desired coffee type button.',
      'Step 6: Wait for brewing to complete.',
      'Step 7: Enjoy your coffee!',
    ];

    if (this.currentStep < steps.length) {
      return steps[this.currentStep++];
    }

    return 'Coffee making process complete!';
  }

  reset() {
    this.currentStep = 0;
    this.detectedComponents.clear();
  }

  getComponentLocation(bbox) {
    // Convert bbox to clock position for better accessibility
    const [ymin, xmin, ymax, xmax] = bbox;
    const centerX = (xmin + xmax) / 2;
    const centerY = (ymin + ymax) / 2;

    let horizontal = '';
    let vertical = '';

    if (centerX < 0.33) horizontal = 'left';
    else if (centerX > 0.66) horizontal = 'right';
    else horizontal = 'center';

    if (centerY < 0.33) vertical = 'top';
    else if (centerY > 0.66) vertical = 'bottom';
    else vertical = 'middle';

    return `${vertical} ${horizontal}`;
  }
}

export default new VoiceGuidance();