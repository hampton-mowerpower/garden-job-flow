import { Part } from '@/types/job';

// Parts extracted from Hampton Mowerpower A4 form with Australian pricing + 20% markup
export const A4_PARTS: Part[] = [
  // ENGINE PARTS
  {
    id: 'flywheel-key',
    name: 'Flywheel Key',
    category: 'Engine',
    basePrice: 7.46,
    sellPrice: 8.95,
    markup: 20,
    inStock: true,
    description: 'Engine flywheel key'
  },
  {
    id: 'valves',
    name: 'Valves',
    category: 'Engine',
    basePrice: 38.29,
    sellPrice: 45.95,
    markup: 20,
    inStock: true,
    description: 'Engine valves (inlet/exhaust)'
  },
  {
    id: 'muffler',
    name: 'Muffler',
    category: 'Engine',
    basePrice: 54.96,
    sellPrice: 65.95,
    markup: 20,
    inStock: true,
    description: 'Engine exhaust muffler'
  },
  {
    id: 'cylinder-head',
    name: 'Cylinder Head',
    category: 'Engine',
    basePrice: 104.96,
    sellPrice: 125.95,
    markup: 20,
    inStock: true,
    description: 'Engine cylinder head assembly'
  },
  {
    id: 'piston-rings',
    name: 'Piston Rings',
    category: 'Engine',
    basePrice: 29.96,
    sellPrice: 35.95,
    markup: 20,
    inStock: true,
    description: 'Engine piston ring set'
  },
  {
    id: 'oil-seal-top',
    name: 'Oil Seal - Top',
    category: 'Engine',
    basePrice: 10.79,
    sellPrice: 12.95,
    markup: 20,
    inStock: true,
    description: 'Top crankshaft oil seal'
  },
  {
    id: 'oil-seal-bottom',
    name: 'Oil Seal - Bottom',
    category: 'Engine',
    basePrice: 10.79,
    sellPrice: 12.95,
    markup: 20,
    inStock: true,
    description: 'Bottom crankshaft oil seal'
  },
  {
    id: 'gaskets',
    name: 'Gaskets',
    category: 'Engine',
    basePrice: 15.79,
    sellPrice: 18.95,
    markup: 20,
    inStock: true,
    description: 'Engine gasket set'
  },
  {
    id: 'bearings',
    name: 'Bearings',
    category: 'Engine',
    basePrice: 24.13,
    sellPrice: 28.95,
    markup: 20,
    inStock: true,
    description: 'Crankshaft bearings'
  },
  {
    id: 'oil-change',
    name: 'Oil Change',
    category: 'Engine',
    basePrice: 21.63,
    sellPrice: 25.95,
    markup: 20,
    inStock: true,
    description: 'Engine oil change service'
  },
  {
    id: 'spark-plug',
    name: 'Spark Plug',
    category: 'Engine',
    basePrice: 8.96,
    sellPrice: 10.75,
    markup: 20,
    inStock: true,
    description: 'Standard spark plug'
  },
  {
    id: 'decompressor',
    name: 'Decompressor',
    category: 'Engine',
    basePrice: 19.13,
    sellPrice: 22.95,
    markup: 20,
    inStock: true,
    description: 'Engine decompressor valve'
  },

  // STARTER PARTS
  {
    id: 'starter-cord',
    name: 'Starter Cord',
    category: 'Starter',
    basePrice: 7.46,
    sellPrice: 8.95,
    markup: 20,
    inStock: true,
    description: 'Pull start cord'
  },
  {
    id: 'mainspring',
    name: 'Mainspring',
    category: 'Starter',
    basePrice: 13.29,
    sellPrice: 15.95,
    markup: 20,
    inStock: true,
    description: 'Recoil starter mainspring'
  },
  {
    id: 'starter-pulley',
    name: 'Starter Pulley',
    category: 'Starter',
    basePrice: 21.63,
    sellPrice: 25.95,
    markup: 20,
    inStock: true,
    description: 'Recoil starter pulley'
  },
  {
    id: 'ferrule',
    name: 'Ferrule',
    category: 'Starter',
    basePrice: 3.29,
    sellPrice: 3.95,
    markup: 20,
    inStock: true,
    description: 'Starter cord ferrule'
  },
  {
    id: 'starter-handle',
    name: 'Starter Handle',
    category: 'Starter',
    basePrice: 5.79,
    sellPrice: 6.95,
    markup: 20,
    inStock: true,
    description: 'Pull start handle'
  },
  {
    id: 'starter-wash',
    name: 'Starter Wash',
    category: 'Starter',
    basePrice: 2.46,
    sellPrice: 2.95,
    markup: 20,
    inStock: true,
    description: 'Starter washer'
  },

  // CARBURETOR PARTS
  {
    id: 'air-gaskets',
    name: 'Air Gaskets',
    category: 'Carburetor',
    basePrice: 4.96,
    sellPrice: 5.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor air gasket set'
  },
  {
    id: 'diaphragm',
    name: 'Diaphragm',
    category: 'Carburetor',
    basePrice: 10.79,
    sellPrice: 12.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor diaphragm'
  },
  {
    id: 'poppet-valve',
    name: 'Poppet Valve',
    category: 'Carburetor',
    basePrice: 7.46,
    sellPrice: 8.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor poppet valve'
  },
  {
    id: 'end-cap',
    name: 'End Cap',
    category: 'Carburetor',
    basePrice: 6.63,
    sellPrice: 7.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor end cap'
  },
  {
    id: 'needle-seat',
    name: 'Needle & Seat',
    category: 'Carburetor',
    basePrice: 13.29,
    sellPrice: 15.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor needle and seat assembly'
  },
  {
    id: 'float',
    name: 'Float',
    category: 'Carburetor',
    basePrice: 15.79,
    sellPrice: 18.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor float'
  },
  {
    id: 'jet',
    name: 'Jet',
    category: 'Carburetor',
    basePrice: 8.29,
    sellPrice: 9.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor main jet'
  },
  {
    id: 'vent',
    name: 'Vent',
    category: 'Carburetor',
    basePrice: 4.13,
    sellPrice: 4.95,
    markup: 20,
    inStock: true,
    description: 'Tank vent'
  },

  // FUEL SYSTEM
  {
    id: 'grommet',
    name: 'Grommet',
    category: 'Fuel System',
    basePrice: 3.29,
    sellPrice: 3.95,
    markup: 20,
    inStock: true,
    description: 'Fuel tank grommet'
  },
  {
    id: 'lifter',
    name: 'Lifter',
    category: 'Fuel System',
    basePrice: 5.79,
    sellPrice: 6.95,
    markup: 20,
    inStock: true,
    description: 'Fuel lifter'
  },
  {
    id: 'primer-face',
    name: 'Primer Face',
    category: 'Fuel System',
    basePrice: 7.46,
    sellPrice: 8.95,
    markup: 20,
    inStock: true,
    description: 'Primer bulb face'
  },
  {
    id: 'fuel-tank',
    name: 'Fuel Tank',
    category: 'Fuel System',
    basePrice: 38.29,
    sellPrice: 45.95,
    markup: 20,
    inStock: true,
    description: 'Fuel tank assembly'
  },
  {
    id: 'fuel-tap',
    name: 'Fuel Tap',
    category: 'Fuel System',
    basePrice: 15.79,
    sellPrice: 18.95,
    markup: 20,
    inStock: true,
    description: 'Fuel shut-off tap'
  },
  {
    id: 'fuel-line-metre',
    name: 'Fuel Line (per metre)',
    category: 'Fuel System',
    basePrice: 4.13,
    sellPrice: 4.95,
    markup: 20,
    inStock: true,
    description: 'Fuel line tubing'
  },
  {
    id: 'air-filter',
    name: 'Air Filter',
    category: 'Fuel System',
    basePrice: 10.79,
    sellPrice: 12.95,
    markup: 20,
    inStock: true,
    description: 'Air filter element'
  },
  {
    id: 'fuel-filter-a4',
    name: 'Fuel Filter',
    category: 'Fuel System',
    basePrice: 6.63,
    sellPrice: 7.95,
    markup: 20,
    inStock: true,
    description: 'Inline fuel filter'
  },

  // CONTROLS
  {
    id: 'throttle-cable-a4',
    name: 'Throttle Cable',
    category: 'Controls',
    basePrice: 16.63,
    sellPrice: 19.95,
    markup: 20,
    inStock: true,
    description: 'Throttle control cable'
  },
  {
    id: 'throttle-control',
    name: 'Throttle Control',
    category: 'Controls',
    basePrice: 21.63,
    sellPrice: 25.95,
    markup: 20,
    inStock: true,
    description: 'Throttle control lever'
  },

  // CUTTING EQUIPMENT
  {
    id: 'chainsaw-chain',
    name: 'Chainsaw Chain',
    category: 'Cutting',
    basePrice: 29.96,
    sellPrice: 35.95,
    markup: 20,
    inStock: true,
    description: 'Replacement chainsaw chain'
  },
  {
    id: 'mower-blade',
    name: 'Mower Blade',
    category: 'Cutting',
    basePrice: 24.96,
    sellPrice: 29.95,
    markup: 20,
    inStock: true,
    description: 'Lawn mower blade'
  },
  {
    id: 'brushcutter-head',
    name: 'Brushcutter Head',
    category: 'Cutting',
    basePrice: 38.29,
    sellPrice: 45.95,
    markup: 20,
    inStock: true,
    description: 'Brushcutter cutting head'
  }
];

// Categories for organizing parts
export const PART_CATEGORIES = [
  'Engine',
  'Starter',
  'Carburetor',
  'Fuel System',
  'Controls',
  'Cutting',
  'Drive System',
  'Hardware',
  'Fluids'
];