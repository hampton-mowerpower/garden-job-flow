import { Part } from '@/types/job';

// Common parts with Australian market pricing + 20% markup based on research
// Prices based on Supercheap Auto, Repco, GA Spares, and other Australian suppliers
export const DEFAULT_PARTS: Part[] = [
  // Engine Parts
  {
    id: 'spark-plug-standard',
    name: 'Spark Plug (Standard)',
    category: 'Engine',
    basePrice: 8.96,
    sellPrice: 10.75,
    markup: 20,
    inStock: true,
    description: 'Standard spark plug for most lawn equipment (Champion, NGK)'
  },
  {
    id: 'spark-plug-premium',
    name: 'Spark Plug (Premium Iridium)',
    category: 'Engine',
    basePrice: 14.96,
    sellPrice: 17.95,
    markup: 20,
    inStock: true,
    description: 'Premium iridium spark plug - longer lasting'
  },
  {
    id: 'air-filter-foam',
    name: 'Air Filter (Foam)',
    category: 'Engine',
    basePrice: 5.79,
    sellPrice: 6.95,
    markup: 20,
    inStock: true,
    description: 'Foam air filter element'
  },
  {
    id: 'air-filter-paper',
    name: 'Air Filter (Paper)',
    category: 'Engine',
    basePrice: 10.79,
    sellPrice: 12.95,
    markup: 20,
    inStock: true,
    description: 'Paper air filter element'
  },
  {
    id: 'fuel-filter',
    name: 'Fuel Filter',
    category: 'Engine',
    basePrice: 6.63,
    sellPrice: 7.95,
    markup: 20,
    inStock: true,
    description: 'Inline fuel filter'
  },
  {
    id: 'oil-filter',
    name: 'Oil Filter',
    category: 'Engine',
    basePrice: 13.29,
    sellPrice: 15.95,
    markup: 20,
    inStock: true,
    description: 'Engine oil filter'
  },

  // Maintenance Items
  {
    id: 'engine-oil-4stroke',
    name: 'Engine Oil (4-Stroke) 1L',
    category: 'Fluids',
    basePrice: 15.79,
    sellPrice: 18.95,
    markup: 20,
    inStock: true,
    description: 'Premium 4-stroke engine oil'
  },
  {
    id: '2stroke-oil',
    name: '2-Stroke Oil 1L',
    category: 'Fluids',
    basePrice: 14.13,
    sellPrice: 16.95,
    markup: 20,
    inStock: true,
    description: 'High-quality 2-stroke mixing oil'
  },
  {
    id: 'fuel-stabilizer',
    name: 'Fuel Stabilizer',
    category: 'Fluids',
    basePrice: 10.79,
    sellPrice: 12.95,
    markup: 20,
    inStock: true,
    description: 'Prevents fuel degradation'
  },

  // Mower Parts
  {
    id: 'mower-blade-18inch',
    name: 'Mower Blade (18")',
    category: 'Cutting',
    basePrice: 20.79,
    sellPrice: 24.95,
    markup: 20,
    inStock: true,
    description: '18 inch mulching mower blade'
  },
  {
    id: 'mower-blade-21inch',
    name: 'Mower Blade (21")',
    category: 'Cutting',
    basePrice: 24.96,
    sellPrice: 29.95,
    markup: 20,
    inStock: true,
    description: '21 inch mulching mower blade'
  },
  {
    id: 'drive-belt',
    name: 'Drive Belt',
    category: 'Drive System',
    basePrice: 27.46,
    sellPrice: 32.95,
    markup: 20,
    inStock: true,
    description: 'Self-propelled drive belt'
  },
  {
    id: 'deck-belt',
    name: 'Deck Belt',
    category: 'Drive System',
    basePrice: 38.29,
    sellPrice: 45.95,
    markup: 20,
    inStock: true,
    description: 'Mower deck drive belt'
  },

  // Chainsaw Parts
  {
    id: 'chainsaw-chain-16inch',
    name: 'Chainsaw Chain (16")',
    category: 'Cutting',
    basePrice: 29.96,
    sellPrice: 35.95,
    markup: 20,
    inStock: true,
    description: '16 inch chainsaw chain'
  },
  {
    id: 'chainsaw-bar-16inch',
    name: 'Chainsaw Bar (16")',
    category: 'Cutting',
    basePrice: 54.96,
    sellPrice: 65.95,
    markup: 20,
    inStock: true,
    description: '16 inch guide bar'
  },
  {
    id: 'bar-oil',
    name: 'Bar & Chain Oil 1L',
    category: 'Fluids',
    basePrice: 12.46,
    sellPrice: 14.95,
    markup: 20,
    inStock: true,
    description: 'Chainsaw bar and chain lubricant'
  },

  // Common Hardware
  {
    id: 'pull-cord',
    name: 'Pull Start Cord',
    category: 'Hardware',
    basePrice: 7.46,
    sellPrice: 8.95,
    markup: 20,
    inStock: true,
    description: 'Replacement pull start cord'
  },
  {
    id: 'throttle-cable',
    name: 'Throttle Cable',
    category: 'Hardware',
    basePrice: 16.63,
    sellPrice: 19.95,
    markup: 20,
    inStock: true,
    description: 'Throttle control cable'
  },
  {
    id: 'fuel-line',
    name: 'Fuel Line (per metre)',
    category: 'Hardware',
    basePrice: 4.13,
    sellPrice: 4.95,
    markup: 20,
    inStock: true,
    description: 'Fuel line tubing'
  }
];