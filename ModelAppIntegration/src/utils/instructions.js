export const instructions = {
  power: {
    name: 'Power Button',
    description: 'Power button detected. Press to turn the machine on or off. You will hear a beep when pressed.',
    action: 'Press once to toggle power',
  },
  
  espresso_button: {
    name: 'Espresso Button',
    description: 'Espresso button detected. Press to brew a single shot of espresso.',
    action: 'Press once for espresso',
  },
  
  lungo_button: {
    name: 'Lungo Button',
    description: 'Lungo button detected. Press to brew a long coffee.',
    action: 'Press once for lungo',
  },
  
  ristretto_button: {
    name: 'Ristretto Button',
    description: 'Ristretto button detected. Press to brew a short, strong espresso.',
    action: 'Press once for ristretto',
  },
  
  cappuccino_button: {
    name: 'Cappuccino Button',
    description: 'Cappuccino button detected. Press to brew cappuccino with milk foam.',
    action: 'Press once for cappuccino',
  },
  
  flat_white_button: {
    name: 'Flat White Button',
    description: 'Flat white button detected. Press to brew flat white coffee.',
    action: 'Press once for flat white',
  },
  
  hot_milk_button: {
    name: 'Hot Milk Button',
    description: 'Hot milk button detected. Press to dispense hot milk only.',
    action: 'Press once for hot milk',
  },
  
  hot_foam_button: {
    name: 'Hot Foam Button',
    description: 'Hot foam button detected. Press to dispense hot milk foam.',
    action: 'Press once for hot foam',
  },
  
  descale: {
    name: 'Descale Indicator',
    description: 'Descale indicator detected. If blinking, the machine needs descaling. Follow the descaling procedure in the manual.',
    action: 'Press and hold for 3 seconds to start descaling',
  },
  
  rinse: {
    name: 'Rinse Button',
    description: 'Rinse button detected. Press to rinse the coffee system with hot water.',
    action: 'Press once to start rinsing cycle',
  },
};

export const makeCoffeeSteps = [
  {
    step: 1,
    component: 'power',
    instruction: 'First, locate and press the power button to turn on the machine.',
  },
  {
    step: 2,
    component: null,
    instruction: 'Wait for the machine to warm up. This usually takes 20 to 30 seconds.',
  },
  {
    step: 3,
    component: null,
    instruction: 'Make sure the water tank is filled and a cup is placed under the dispenser.',
  },
  {
    step: 4,
    component: 'coffee_buttons',
    instruction: 'Now select your desired coffee type by pressing one of the coffee buttons.',
  },
  {
    step: 5,
    component: null,
    instruction: 'Wait for the brewing process to complete. The machine will stop automatically.',
  },
  {
    step: 6,
    component: null,
    instruction: 'Your coffee is ready. Carefully remove the cup.',
  },
];