import { Part } from '@/types/job';

// Parts extracted from Hampton Mowerpower A4 form with Australian pricing + 20% markup
export const A4_PARTS: Part[] = [
  // ENGINE PARTS
  {
    id: 'flywheel-key',
    name: 'Flywheel Key',
    category: 'Engine',
    price: 8.95,
    markup: 20,
    inStock: true,
    description: 'Engine flywheel key'
  },
  {
    id: 'valves',
    name: 'Valves',
    category: 'Engine',
    price: 45.95,
    markup: 20,
    inStock: true,
    description: 'Engine valves (inlet/exhaust)'
  },
  {
    id: 'muffler',
    name: 'Muffler',
    category: 'Engine',
    price: 65.95,
    markup: 20,
    inStock: true,
    description: 'Engine exhaust muffler'
  },
  {
    id: 'cylinder-head',
    name: 'Cylinder Head',
    category: 'Engine',
    price: 125.95,
    markup: 20,
    inStock: true,
    description: 'Engine cylinder head assembly'
  },
  {
    id: 'piston-rings',
    name: 'Piston Rings',
    category: 'Engine',
    price: 35.95,
    markup: 20,
    inStock: true,
    description: 'Engine piston ring set'
  },
  {
    id: 'oil-seal-top',
    name: 'Oil Seal - Top',
    category: 'Engine',
    price: 12.95,
    markup: 20,
    inStock: true,
    description: 'Top crankshaft oil seal'
  },
  {
    id: 'oil-seal-bottom',
    name: 'Oil Seal - Bottom',
    category: 'Engine',
    price: 12.95,
    markup: 20,
    inStock: true,
    description: 'Bottom crankshaft oil seal'
  },
  {
    id: 'gaskets',
    name: 'Gaskets',
    category: 'Engine',
    price: 18.95,
    markup: 20,
    inStock: true,
    description: 'Engine gasket set'
  },
  {
    id: 'bearings',
    name: 'Bearings',
    category: 'Engine',
    price: 28.95,
    markup: 20,
    inStock: true,
    description: 'Crankshaft bearings'
  },
  {
    id: 'oil-change',
    name: 'Oil Change',
    category: 'Engine',
    price: 25.95,
    markup: 20,
    inStock: true,
    description: 'Engine oil change service'
  },
  {
    id: 'spark-plug',
    name: 'Spark Plug',
    category: 'Engine',
    price: 10.75,
    markup: 20,
    inStock: true,
    description: 'Standard spark plug'
  },
  {
    id: 'decompressor',
    name: 'Decompressor',
    category: 'Engine',
    price: 22.95,
    markup: 20,
    inStock: true,
    description: 'Engine decompressor valve'
  },

  // STARTER PARTS
  {
    id: 'starter-cord',
    name: 'Starter Cord',
    category: 'Starter',
    price: 8.95,
    markup: 20,
    inStock: true,
    description: 'Pull start cord'
  },
  {
    id: 'mainspring',
    name: 'Mainspring',
    category: 'Starter',
    price: 15.95,
    markup: 20,
    inStock: true,
    description: 'Recoil starter mainspring'
  },
  {
    id: 'starter-pulley',
    name: 'Starter Pulley',
    category: 'Starter',
    price: 25.95,
    markup: 20,
    inStock: true,
    description: 'Recoil starter pulley'
  },
  {
    id: 'ferrule',
    name: 'Ferrule',
    category: 'Starter',
    price: 3.95,
    markup: 20,
    inStock: true,
    description: 'Starter cord ferrule'
  },
  {
    id: 'starter-handle',
    name: 'Starter Handle',
    category: 'Starter',
    price: 6.95,
    markup: 20,
    inStock: true,
    description: 'Pull start handle'
  },
  {
    id: 'starter-wash',
    name: 'Starter Wash',
    category: 'Starter',
    price: 2.95,
    markup: 20,
    inStock: true,
    description: 'Starter washer'
  },

  // CARBURETOR PARTS
  {
    id: 'air-gaskets',
    name: 'Air Gaskets',
    category: 'Carburetor',
    price: 5.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor air gasket set'
  },
  {
    id: 'diaphragm',
    name: 'Diaphragm',
    category: 'Carburetor',
    price: 12.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor diaphragm'
  },
  {
    id: 'poppet-valve',
    name: 'Poppet Valve',
    category: 'Carburetor',
    price: 8.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor poppet valve'
  },
  {
    id: 'end-cap',
    name: 'End Cap',
    category: 'Carburetor',
    price: 7.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor end cap'
  },
  {
    id: 'needle-seat',
    name: 'Needle & Seat',
    category: 'Carburetor',
    price: 15.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor needle and seat assembly'
  },
  {
    id: 'float',
    name: 'Float',
    category: 'Carburetor',
    price: 18.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor float'
  },
  {
    id: 'jet',
    name: 'Jet',
    category: 'Carburetor',
    price: 9.95,
    markup: 20,
    inStock: true,
    description: 'Carburetor main jet'
  },
  {
    id: 'vent',
    name: 'Vent',
    category: 'Carburetor',
    price: 4.95,
    markup: 20,
    inStock: true,
    description: 'Tank vent'
  },

  // FUEL SYSTEM
  {
    id: 'grommet',
    name: 'Grommet',
    category: 'Fuel System',
    price: 3.95,
    markup: 20,
    inStock: true,
    description: 'Fuel tank grommet'
  },
  {
    id: 'lifter',
    name: 'Lifter',
    category: 'Fuel System',
    price: 6.95,
    markup: 20,
    inStock: true,
    description: 'Fuel lifter'
  },
  {
    id: 'primer-face',
    name: 'Primer Face',
    category: 'Fuel System',
    price: 8.95,
    markup: 20,
    inStock: true,
    description: 'Primer bulb face'
  },
  {
    id: 'fuel-tank',
    name: 'Fuel Tank',
    category: 'Fuel System',
    price: 45.95,
    markup: 20,
    inStock: true,
    description: 'Fuel tank assembly'
  },
  {
    id: 'fuel-tap',
    name: 'Fuel Tap',
    category: 'Fuel System',
    price: 18.95,
    markup: 20,
    inStock: true,
    description: 'Fuel shut-off tap'
  },
  {
    id: 'fuel-line-metre',
    name: 'Fuel Line (per metre)',
    category: 'Fuel System',
    price: 4.95,
    markup: 20,
    inStock: true,
    description: 'Fuel line tubing'
  },
  {
    id: 'air-filter',
    name: 'Air Filter',
    category: 'Fuel System',
    price: 12.95,
    markup: 20,
    inStock: true,
    description: 'Air filter element'
  },
  {
    id: 'fuel-filter',
    name: 'Fuel Filter',
    category: 'Fuel System',
    price: 7.95,
    markup: 20,
    inStock: true,
    description: 'Inline fuel filter'
  },

  // CONTROLS
  {
    id: 'throttle-cable',
    name: 'Throttle Cable',
    category: 'Controls',
    price: 19.95,
    markup: 20,
    inStock: true,
    description: 'Throttle control cable'
  },
  {
    id: 'throttle-control',
    name: 'Throttle Control',
    category: 'Controls',
    price: 25.95,
    markup: 20,
    inStock: true,
    description: 'Throttle control lever'
  },

  // CUTTING EQUIPMENT
  {
    id: 'chainsaw-chain',
    name: 'Chainsaw Chain',
    category: 'Cutting',
    price: 35.95,
    markup: 20,
    inStock: true,
    description: 'Replacement chainsaw chain'
  },
  {
    id: 'mower-blade',
    name: 'Mower Blade',
    category: 'Cutting',
    price: 29.95,
    markup: 20,
    inStock: true,
    description: 'Lawn mower blade'
  },
  {
    id: 'brushcutter-head',
    name: 'Brushcutter Head',
    category: 'Cutting',
    price: 45.95,
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