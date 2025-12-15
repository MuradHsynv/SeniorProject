// --- 1. VECTOR MATH (The "GPS" Logic) ---
export const getFingerGuidance = (fingerBox, targetBox) => {
  // Find centers
  const fingerX = fingerBox.left + (fingerBox.width / 2);
  const fingerY = fingerBox.top + (fingerBox.height / 2);
  const targetX = targetBox.left + (targetBox.width / 2);
  const targetY = targetBox.top + (targetBox.height / 2);

  const dx = targetX - fingerX;
  const dy = targetY - fingerY; 
  
  // Calculate distance in pixels
  const distance = Math.sqrt(dx*dx + dy*dy);
  
  // THRESHOLD: How close is "close enough"? 
  // (Adjust based on your camera resolution, 80px is a good start)
  if (distance < 80) return "You are on it. Press down.";

  // Determine dominant direction
  // We want to give ONE clear instruction, not "Move Up and Left"
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal gap is bigger
    return dx > 0 ? "Move Right" : "Move Left";
  } else {
    // Vertical gap is bigger
    return dy > 0 ? "Move Down" : "Move Up";
  }
};

// --- 2. RECIPES (The 7 Options) ---
// Note: We reuse "power" and "drip_tray" for almost all of them.
export const DRINK_RECIPES = {
  espresso: {
    name: "Espresso",
    steps: [
      { target: "power", instruction: "First, locate the Power button." },
      { target: "drip_tray", instruction: "Locate the Drip Tray." },
      { target: "espresso_button", instruction: "Now, find the Espresso button." }
    ]
  },
  lungo: {
    name: "Lungo",
    steps: [
      { target: "power", instruction: "Find the Power button." },
      { target: "drip_tray", instruction: "Locate the Drip Tray." },
      { target: "lungo_button", instruction: "Find the Lungo button." }
    ]
  },
  ristretto: {
    name: "Ristretto",
    steps: [
      { target: "power", instruction: "Find Power." },
      { target: "ristretto_button", instruction: "Find the Ristretto button." }
    ]
  },
  cappuccino: {
    name: "Cappuccino",
    steps: [
      { target: "drip_tray", instruction: "Find the tray." },
      { target: "milk_frother_wand", instruction: "Locate the milk wand." },
      { target: "cappuccino_button", instruction: "Find Cappuccino button." }
    ]
  },
  caffe_latte: {
    name: "Caffe Latte",
    steps: [
      { target: "milk_frother_wand", instruction: "Align milk wand." },
      { target: "caffe_latte_button", instruction: "Find Latte button." }
    ]
  },
  flat_white: {
    name: "Flat White",
    steps: [
      { target: "milk_frother_wand", instruction: "Align milk wand." },
      { target: "flat_white_button", instruction: "Find Flat White button." }
    ]
  },
  hot_milk: {
    name: "Hot Milk",
    steps: [
      { target: "hot_milk_button", instruction: "Find Hot Milk button." }
    ]
  }
};