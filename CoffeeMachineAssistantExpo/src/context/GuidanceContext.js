import React, { createContext, useState, useContext } from 'react';
// --- 1. Import the SettingsContext ---
import { SettingsContext } from './GlobalSettings';

// --- 2. Define all the steps (with a new STEP_0) ---
const STEPS = {
  STEP_0_FIND_MACHINE: 'STEP_0_FIND_MACHINE',
  STEP_1_FIND_POWER: 'STEP_1_FIND_POWER',
  STEP_2_FIND_WATER_TANK: 'STEP_2_FIND_WATER_TANK',
  STEP_3_FIND_BREW_BUTTON: 'STEP_3_FIND_BREW_BUTTON',
  STEP_4_COMPLETED: 'STEP_4_COMPLETED',
};

// --- 3. Define the instructions (now with simple/detailed) ---
const GUIDANCE_LOGIC = {
  [STEPS.STEP_0_FIND_MACHINE]: {
    target: 'coffee_machine', // This is what the model should find first
    instruction: {
      simple: 'Machine found. Now find the power button.',
      detailed:
        'Great, I see the coffee machine. Let\'s start by finding the power button, which is usually at the top.',
    },
    wrongItem: (item) => ({
      simple: 'Looking for the machine.',
      detailed: `I see a ${item}, but I'm still looking for the coffee machine. Please scan the area.`,
    }),
    nextStep: STEPS.STEP_1_FIND_POWER,
  },
  [STEPS.STEP_1_FIND_POWER]: {
    target: 'power_button',
    instruction: {
      simple: 'Power button found. Press it.',
      detailed:
        'Power button detected. Press it to turn on the machine. You should hear a beep.',
    },
    wrongItem: (item) => ({
      simple: 'Find the power button.',
      detailed: `I see the ${item}, but let's find the power button first.`,
    }),
    nextStep: STEPS.STEP_2_FIND_WATER_TANK,
  },
  [STEPS.STEP_2_FIND_WATER_TANK]: {
    target: 'water_tank',
    instruction: {
      simple: 'Water tank found. Fill it.',
      detailed:
        'Water tank detected. Please remove it, fill it with water, and place it back securely.',
    },
    wrongItem: (item) => ({
      simple: 'Find the water tank.',
      detailed: `I see the ${item}, but now we need to find the water tank. It's usually on the side or back.`,
    }),
    nextStep: STEPS.STEP_3_FIND_BREW_BUTTON,
  },
  [STEPS.STEP_3_FIND_BREW_BUTTON]: {
    target: 'brew_button',
    instruction: {
      simple: 'Brew button found. Press it.',
      detailed:
        'Brew button detected. Place your cup underneath and press the brew button to start.',
    },
    wrongItem: (item) => ({
      simple: 'Find the brew button.',
      detailed: `I see the ${item}, but let's find the main brew button.`,
    }),
    nextStep: STEPS.STEP_4_COMPLETED,
  },
  [STEPS.STEP_4_COMPLETED]: {
    target: null,
    instruction: {
      simple: 'Done. Enjoy!',
      detailed: 'Coffee is brewing! The process is complete. Enjoy your coffee.',
    },
    wrongItem: () => ({
      simple: 'Done.',
      detailed: 'Process is complete.',
    }),
    nextStep: STEPS.STEP_4_COMPLETED,
  },
};

// --- 4. Create the Context ---
const GuidanceContext = createContext({
  currentStep: STEPS.STEP_0_FIND_MACHINE,
  getInstruction: (detection) => '',
  resetGuidance: () => {},
});

// --- 5. Create the Provider ---
export const GuidanceProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.STEP_0_FIND_MACHINE);
  // --- 6. Get detailedInstructions from our other context ---
  const { detailedInstructions } = useContext(SettingsContext);

  const getInstruction = (detection) => {
    const stepLogic = GUIDANCE_LOGIC[currentStep];
    const useDetailed = detailedInstructions; // Get the setting

    let result;

    if (!detection) {
      result = {
        simple: 'Point at the machine.',
        detailed: 'Point your camera at the coffee machine.',
      };
      return { instruction: useDetailed ? result.detailed : result.simple, advance: false };
    }

    // A. Correct item was detected
    if (detection === stepLogic.target) {
      setCurrentStep(stepLogic.nextStep); // Advance the step
      result = stepLogic.instruction;
      return { instruction: useDetailed ? result.detailed : result.simple, advance: true };
    }

    // B. Wrong item was detected
    if (detection !== stepLogic.target) {
      const friendlyName = detection.replace('_', ' ');
      result = stepLogic.wrongItem(friendlyName);
      return { instruction: useDetailed ? result.detailed : result.simple, advance: false };
    }

    // Fallback
    result = { simple: 'Point at machine.', detailed: 'Please point at the coffee machine.' };
    return { instruction: useDetailed ? result.detailed : result.simple, advance: false };
  };

  const resetGuidance = () => {
    setCurrentStep(STEPS.STEP_0_FIND_MACHINE); // Reset to Step 0
    return 'Guidance has been reset.';
  };

  return (
    <GuidanceContext.Provider
      value={{
        currentStep,
        getInstruction,
        resetGuidance,
      }}>
      {children}
    </GuidanceContext.Provider>
  );
};

// Helper hook
export const useGuidance = () => useContext(GuidanceContext);