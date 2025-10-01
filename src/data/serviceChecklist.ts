// Service Checklist Data - Universal and Category-Specific Checks

export interface ChecklistDefinition {
  label: string;
  category: 'universal' | string;
}

// Universal checks - always applicable
export const UNIVERSAL_CHECKS: ChecklistDefinition[] = [
  { label: 'Engine compression test', category: 'universal' },
  { label: 'Adjust carb/tune (idle/high)', category: 'universal' },
  { label: 'Flush/replace stale fuel; clean tank', category: 'universal' },
  { label: 'Charge/test battery (where fitted)', category: 'universal' },
  { label: 'Verify operating performance under load', category: 'universal' },
  { label: 'Inspect all electrical wiring/connectors', category: 'universal' },
  { label: 'Check oil level/quality; inspect for leaks', category: 'universal' },
  { label: 'Inspect/clean/replace air filter', category: 'universal' },
  { label: 'Inspect/replace spark plug; gap check', category: 'universal' },
  { label: 'Check coil/ignition output', category: 'universal' },
  { label: 'Check/adjust governor spring/linkage', category: 'universal' },
  { label: 'Inspect throttle cable & return spring', category: 'universal' },
  { label: 'Inspect brake/stop switch operation', category: 'universal' },
  { label: 'Check belt condition/tension (if fitted)', category: 'universal' },
  { label: 'Grease gearbox/shaft points (if fitted)', category: 'universal' },
  { label: 'Inspect fasteners/mounts for vibration', category: 'universal' },
  { label: 'Test safety features (stops/guards)', category: 'universal' },
  { label: 'Document recommendations/parts required', category: 'universal' }
];

// Category-specific checks
export const CATEGORY_CHECKS: Record<string, ChecklistDefinition[]> = {
  'Lawn Mower': [
    { label: 'Blade condition & balance', category: 'Lawn Mower' },
    { label: 'Deck/chute/catcher fit', category: 'Lawn Mower' },
    { label: 'Height adjuster mechanism', category: 'Lawn Mower' },
    { label: 'Wheel/tyre/bearings', category: 'Lawn Mower' },
    { label: 'Handle locks/cables', category: 'Lawn Mower' },
    { label: 'Blade carrier torque', category: 'Lawn Mower' }
  ],
  'Ride-on Mower': [
    { label: 'Deck spindles/bearings', category: 'Ride-on Mower' },
    { label: 'Deck level/cut height', category: 'Ride-on Mower' },
    { label: 'PTO clutch operation', category: 'Ride-on Mower' },
    { label: 'Hydro drive/leaks', category: 'Ride-on Mower' },
    { label: 'Steering neutral/tracking', category: 'Ride-on Mower' },
    { label: 'Battery/charging system', category: 'Ride-on Mower' },
    { label: 'Safety interlocks', category: 'Ride-on Mower' },
    { label: 'Tyre pressures', category: 'Ride-on Mower' }
  ],
  'Zero-turn Mower': [
    { label: 'Deck spindles/bearings', category: 'Zero-turn Mower' },
    { label: 'Deck level/cut height', category: 'Zero-turn Mower' },
    { label: 'PTO clutch operation', category: 'Zero-turn Mower' },
    { label: 'Hydro drive/leaks', category: 'Zero-turn Mower' },
    { label: 'Steering neutral/tracking', category: 'Zero-turn Mower' },
    { label: 'Battery/charging system', category: 'Zero-turn Mower' },
    { label: 'Safety interlocks', category: 'Zero-turn Mower' },
    { label: 'Tyre pressures', category: 'Zero-turn Mower' }
  ],
  'Trimmer': [
    { label: 'Head/line feed mechanism', category: 'Trimmer' },
    { label: 'Guard condition', category: 'Trimmer' },
    { label: 'Shaft/gearbox grease', category: 'Trimmer' },
    { label: 'Anti-vibe mounts', category: 'Trimmer' },
    { label: 'Throttle smoothness', category: 'Trimmer' }
  ],
  'Brushcutter': [
    { label: 'Head/line feed or blade', category: 'Brushcutter' },
    { label: 'Guard condition', category: 'Brushcutter' },
    { label: 'Shaft/gearbox grease', category: 'Brushcutter' },
    { label: 'Anti-vibe mounts', category: 'Brushcutter' },
    { label: 'Throttle smoothness', category: 'Brushcutter' }
  ],
  'Chainsaw': [
    { label: 'Chain sharpness/depth gauges', category: 'Chainsaw' },
    { label: 'Bar wear pattern', category: 'Chainsaw' },
    { label: 'Chain tension adjustment', category: 'Chainsaw' },
    { label: 'Oiler flow & pump', category: 'Chainsaw' },
    { label: 'Chain brake function', category: 'Chainsaw' },
    { label: 'Clutch/sprocket wear', category: 'Chainsaw' },
    { label: 'Anti-vibe mounts', category: 'Chainsaw' },
    { label: 'Choke/primer operation', category: 'Chainsaw' }
  ],
  'Blower': [
    { label: 'Impeller/fan housing', category: 'Blower' },
    { label: 'Cruise control (if fitted)', category: 'Blower' },
    { label: 'Tube/nozzle connections', category: 'Blower' }
  ],
  'Vacuum': [
    { label: 'Impeller/fan housing', category: 'Vacuum' },
    { label: 'Vac bag/zip condition', category: 'Vacuum' },
    { label: 'Tube/nozzle connections', category: 'Vacuum' }
  ],
  'Hedge Trimmer': [
    { label: 'Blade sharpness/clearance', category: 'Hedge Trimmer' },
    { label: 'Gear case lubrication', category: 'Hedge Trimmer' },
    { label: 'Tip guard condition', category: 'Hedge Trimmer' }
  ],
  'Pole Pruner': [
    { label: 'Pole locks/extensions', category: 'Pole Pruner' },
    { label: 'Drive couplings', category: 'Pole Pruner' },
    { label: 'Chain/bar/oiler (saw head)', category: 'Pole Pruner' }
  ],
  'Edger': [
    { label: 'Blade wear/guard', category: 'Edger' },
    { label: 'Belt tension', category: 'Edger' },
    { label: 'Height adjuster', category: 'Edger' }
  ],
  'Demo Saw': [
    { label: 'Belt tension', category: 'Demo Saw' },
    { label: 'Water kit flow (if fitted)', category: 'Demo Saw' },
    { label: 'Guard condition', category: 'Demo Saw' },
    { label: 'Decompressor function', category: 'Demo Saw' }
  ],
  'Power Cutter': [
    { label: 'Belt tension', category: 'Power Cutter' },
    { label: 'Water kit flow (if fitted)', category: 'Power Cutter' },
    { label: 'Guard condition', category: 'Power Cutter' },
    { label: 'Decompressor function', category: 'Power Cutter' }
  ],
  'Tiller': [
    { label: 'Tine wear/shafts', category: 'Tiller' },
    { label: 'Gearbox lubrication', category: 'Tiller' },
    { label: 'Drive belts/chains', category: 'Tiller' },
    { label: 'Safety lever function', category: 'Tiller' }
  ],
  'Cultivator': [
    { label: 'Tine wear/shafts', category: 'Cultivator' },
    { label: 'Gearbox lubrication', category: 'Cultivator' },
    { label: 'Drive belts/chains', category: 'Cultivator' },
    { label: 'Safety lever function', category: 'Cultivator' }
  ],
  'Shredder': [
    { label: 'Knife/flail condition & torque', category: 'Shredder' },
    { label: 'Feed chute switch', category: 'Shredder' },
    { label: 'Discharge guard', category: 'Shredder' }
  ],
  'Chipper': [
    { label: 'Knife/flail condition & torque', category: 'Chipper' },
    { label: 'Feed chute switch', category: 'Chipper' },
    { label: 'Discharge guard', category: 'Chipper' }
  ],
  'Automower': [
    { label: 'Blade disc/blades condition', category: 'Automower' },
    { label: 'Wheel motors', category: 'Automower' },
    { label: 'Firmware/boundary wire', category: 'Automower' },
    { label: 'Base station power', category: 'Automower' },
    { label: 'Battery health', category: 'Automower' },
    { label: 'Sensors/collision detection', category: 'Automower' }
  ],
  'Generator': [
    { label: 'Output voltage/frequency under load', category: 'Generator' },
    { label: 'AVR operation', category: 'Generator' },
    { label: 'Fuel/oil leaks', category: 'Generator' },
    { label: 'Recoil/e-start', category: 'Generator' },
    { label: 'Low-oil shutdown', category: 'Generator' }
  ],
  'Pressure Washer': [
    { label: 'Pump pressure/leaks', category: 'Pressure Washer' },
    { label: 'Unloader valve', category: 'Pressure Washer' },
    { label: 'Hose/lance/nozzle', category: 'Pressure Washer' },
    { label: 'Detergent pickup', category: 'Pressure Washer' }
  ],
  'Water Pump': [
    { label: 'Prime test', category: 'Water Pump' },
    { label: 'Flow rate', category: 'Water Pump' },
    { label: 'Seals/leaks', category: 'Water Pump' },
    { label: 'Suction screen', category: 'Water Pump' },
    { label: 'Impeller wear', category: 'Water Pump' }
  ],
  'Engine': [
    { label: 'Compression test', category: 'Engine' },
    { label: 'Governor setup', category: 'Engine' },
    { label: 'Oil/fuel leaks', category: 'Engine' },
    { label: 'Throttle/choke linkage', category: 'Engine' },
    { label: 'Charging coil (if fitted)', category: 'Engine' }
  ]
};

// Get checklist for a specific category
export const getChecklistForCategory = (category: string): ChecklistDefinition[] => {
  const categoryChecks = CATEGORY_CHECKS[category] || [];
  return [...UNIVERSAL_CHECKS, ...categoryChecks];
};

// Initialize checklist from definitions (unchecked by default)
export const initializeChecklist = (category: string) => {
  return getChecklistForCategory(category).map(def => ({
    label: def.label,
    checked: false,
    note: '',
    category: def.category
  }));
};
