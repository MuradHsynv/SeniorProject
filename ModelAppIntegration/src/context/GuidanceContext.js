import React, { createContext, useContext, useState } from 'react';
import { SettingsContext } from './GlobalSettings';

const STEPS = {
  STEP_0_FIND_MACHINE: 'STEP_0_FIND_MACHINE',
  STEP_1_FIND_POWER: 'STEP_1_FIND_POWER',
  STEP_2_FIND_WATER_TANK: 'STEP_2_FIND_WATER_TANK',
  STEP_3_FIND_BREW_BUTTON: 'STEP_3_FIND_BREW_BUTTON',
  STEP_4_COMPLETED: 'STEP_4_COMPLETED',
};

// Guidance Logic
const GUIDANCE_LOGIC = {
  [STEPS.STEP_0_FIND_MACHINE]: {
    target: 'coffee_dispenser',
    instruction: {
      simple: 'Machine found. Find power button.',
      detailed: 'I see the coffee dispenser. You are facing the machine. Now locate the power button.',
    },
    nextStep: STEPS.STEP_1_FIND_POWER,
  },
  [STEPS.STEP_1_FIND_POWER]: {
    target: 'power',
    instruction: {
      simple: 'Power button found. Press it.',
      detailed: 'Power button detected. Press it to turn on the machine.',
    },
    nextStep: STEPS.STEP_2_FIND_WATER_TANK,
  },
  [STEPS.STEP_2_FIND_WATER_TANK]: {
    target: 'water_reservoir',
    instruction: {
      simple: 'Water tank found. Fill it.',
      detailed: 'Water reservoir detected. Please fill it with water and place it back.',
    },
    nextStep: STEPS.STEP_3_FIND_BREW_BUTTON,
  },
  [STEPS.STEP_3_FIND_BREW_BUTTON]: {
    target: 'espresso_button', 
    instruction: {
      simple: 'Espresso button found. Press it.',
      detailed: 'Espresso button detected. Place your cup and press it to start.',
    },
    nextStep: STEPS.STEP_4_COMPLETED,
  },
  [STEPS.STEP_4_COMPLETED]: {
    target: null,
    instruction: {
      simple: 'Done. Enjoy.',
      detailed: 'Coffee is brewing! The process is complete. Enjoy your coffee.',
    },
    nextStep: STEPS.STEP_4_COMPLETED,
  },
};

const GuidanceContext = createContext({
  currentStep: STEPS.STEP_0_FIND_MACHINE,
  getInstruction: (detection) => '',
  resetGuidance: () => {},
});

export const GuidanceProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.STEP_0_FIND_MACHINE);
  const { detailedInstructions } = useContext(SettingsContext);

  const getInstruction = (detection) => {
    const stepLogic = GUIDANCE_LOGIC[currentStep];
    const useDetailed = detailedInstructions;

    if (!detection) {
      const msg = useDetailed ? 'Point your camera at the machine.' : 'Point at machine.';
      return { instruction: msg, advance: false };
    }

    // Success Case 
    if (detection === stepLogic.target || detection.includes(stepLogic.target)) {
      setCurrentStep(stepLogic.nextStep);
      return { 
        instruction: useDetailed ? stepLogic.instruction.detailed : stepLogic.instruction.simple, 
        advance: true 
      };
    }

    // Wrong Item Case
    if (detection !== stepLogic.target) {
      const name = detection.replace(/_/g, ' ').replace('rotation', '');
      const targetName = stepLogic.target.replace(/_/g, ' ');
      const msg = useDetailed 
        ? `I see ${name}, but I'm looking for the ${targetName}.` 
        : `Found ${name}. Find ${targetName}.`;
      return { instruction: msg, advance: false };
    }

    return { instruction: '', advance: false };
  };

  const resetGuidance = () => {
    setCurrentStep(STEPS.STEP_0_FIND_MACHINE);
    return 'Guidance reset.';
  };

  return (
    <GuidanceContext.Provider value={{ currentStep, getInstruction, resetGuidance }}>
      {children}
    </GuidanceContext.Provider>
  );
};

export const useGuidance = () => useContext(GuidanceContext);