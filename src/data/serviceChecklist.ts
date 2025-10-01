// Service Checklist Data - Universal and Category-Specific Checks

import { ChecklistItem } from '@/types/job';
import { nanoid } from 'nanoid';

// Universal checks - always applicable
const UNIVERSAL_CHECKS_LABELS = [
  'Engine compression test',
  'Adjust carb/tune (idle/high)',
  'Flush/replace stale fuel; clean tank',
  'Charge/test battery (where fitted)',
  'Verify operating performance under load',
  'Inspect all electrical wiring/connectors',
  'Check oil level/quality; inspect for leaks',
  'Inspect/clean/replace air filter',
  'Inspect/replace spark plug; gap check',
  'Check coil/ignition output',
  'Check/adjust governor spring/linkage',
  'Inspect throttle cable & return spring',
  'Inspect brake/stop switch operation',
  'Check belt condition/tension (if fitted)',
  'Grease gearbox/shaft points (if fitted)',
  'Inspect fasteners/mounts for vibration',
  'Test safety features (stops/guards)',
  'Document recommendations/parts required',
];

// Category-specific checks
const CATEGORY_CHECKS_LABELS: Record<string, string[]> = {
  'Lawn Mower': [
    'Blade condition & balance',
    'Deck/chute/catcher fit',
    'Height adjuster mechanism',
    'Wheel/tyre/bearings',
    'Handle locks/cables',
    'Blade carrier torque',
  ],
  'Ride-on Mower': [
    'Deck spindles/bearings',
    'Deck level/cut height',
    'PTO clutch operation',
    'Hydro drive/leaks',
    'Steering neutral/tracking',
    'Battery/charging system',
    'Safety interlocks',
    'Tyre pressures',
  ],
  'Zero-turn Mower': [
    'Deck spindles/bearings',
    'Deck level/cut height',
    'PTO clutch operation',
    'Hydro drive/leaks',
    'Steering neutral/tracking',
    'Battery/charging system',
    'Safety interlocks',
    'Tyre pressures',
  ],
  'Trimmer': [
    'Head/line feed mechanism',
    'Guard condition',
    'Shaft/gearbox grease',
    'Anti-vibe mounts',
    'Throttle smoothness',
  ],
  'Brushcutter': [
    'Head/line feed or blade',
    'Guard condition',
    'Shaft/gearbox grease',
    'Anti-vibe mounts',
    'Throttle smoothness',
  ],
  'Chainsaw': [
    'Chain sharpness/depth gauges',
    'Bar wear pattern',
    'Chain tension adjustment',
    'Oiler flow & pump',
    'Chain brake function',
    'Clutch/sprocket wear',
    'Anti-vibe mounts',
    'Choke/primer operation',
  ],
  'Blower': [
    'Impeller/fan housing',
    'Cruise control (if fitted)',
    'Tube/nozzle connections',
  ],
  'Vacuum': [
    'Impeller/fan housing',
    'Vac bag/zip condition',
    'Tube/nozzle connections',
  ],
  'Hedge Trimmer': [
    'Blade sharpness/clearance',
    'Gear case lubrication',
    'Tip guard condition',
  ],
  'Pole Pruner': [
    'Pole locks/extensions',
    'Drive couplings',
    'Chain/bar/oiler (saw head)',
  ],
  'Edger': [
    'Blade wear/guard',
    'Belt tension',
    'Height adjuster',
  ],
  'Demo Saw': [
    'Belt tension',
    'Water kit flow (if fitted)',
    'Guard condition',
    'Decompressor function',
  ],
  'Power Cutter': [
    'Belt tension',
    'Water kit flow (if fitted)',
    'Guard condition',
    'Decompressor function',
  ],
  'Tiller': [
    'Tine wear/shafts',
    'Gearbox lubrication',
    'Drive belts/chains',
    'Safety lever function',
  ],
  'Cultivator': [
    'Tine wear/shafts',
    'Gearbox lubrication',
    'Drive belts/chains',
    'Safety lever function',
  ],
  'Shredder': [
    'Knife/flail condition & torque',
    'Feed chute switch',
    'Discharge guard',
  ],
  'Chipper': [
    'Knife/flail condition & torque',
    'Feed chute switch',
    'Discharge guard',
  ],
  'Automower': [
    'Blade disc/blades condition',
    'Wheel motors',
    'Firmware/boundary wire',
    'Base station power',
    'Battery health',
    'Sensors/collision detection',
  ],
  'Generator': [
    'Output voltage/frequency under load',
    'AVR operation',
    'Fuel/oil leaks',
    'Recoil/e-start',
    'Low-oil shutdown',
  ],
  'Pressure Washer': [
    'Pump pressure/leaks',
    'Unloader valve',
    'Hose/lance/nozzle',
    'Detergent pickup',
  ],
  'Water Pump': [
    'Prime test',
    'Flow rate',
    'Seals/leaks',
    'Suction screen',
    'Impeller wear',
  ],
  'Engine': [
    'Compression test',
    'Governor setup',
    'Oil/fuel leaks',
    'Throttle/choke linkage',
    'Charging coil (if fitted)',
  ],
};

// Get universal checks
export function getUniversalChecklist(): ChecklistItem[] {
  return UNIVERSAL_CHECKS_LABELS.map(label => ({
    id: nanoid(),
    label,
    checked: false,
    note: '',
    isCustom: false,
  }));
}

// Get category-specific checks
export function getCategoryChecklist(category: string): ChecklistItem[] {
  const categoryLabels = CATEGORY_CHECKS_LABELS[category] || [];
  return categoryLabels.map(label => ({
    id: nanoid(),
    label,
    checked: false,
    note: '',
    isCustom: false,
  }));
}

// Initialize both checklists for a category
export function initializeChecklists(category: string): {
  universal: ChecklistItem[];
  category: ChecklistItem[];
} {
  return {
    universal: getUniversalChecklist(),
    category: getCategoryChecklist(category),
  };
}
