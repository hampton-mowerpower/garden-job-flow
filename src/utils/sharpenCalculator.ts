/**
 * Sharpen Service Pricing Calculator for Hampton Mowerpower
 * 
 * Chainsaw sharpening:
 * - 14-16" & ≤60 links: Chain-only $18/chain, Whole chainsaw $22/chain
 * - ≥18" (incl. 18") or ≥61 links: Chain-only $25/chain, Whole-saw $29/chain
 * 
 * Additional services:
 * - Garden tool sharpen: $18 each
 * - Knife sharpen: $8 each
 * - Hedge trimmer sharpen — Battery: $95
 * - Hedge trimmer sharpen — Petrol: $95
 * - Hedge trimmer sharpen — Electric: $65
 * - Cylinder mower sharpen: $125
 * - Hand mower sharpen: $75
 * - Lawn mower blade sharpen: $35
 */

export type ChainsawBarSize = '14-16' | '18+';
export type ChainsawMode = 'chain-only' | 'whole-saw';
export type HedgeTrimmerType = 'battery' | 'petrol' | 'electric';
export type SharpenItemType = 'chainsaw' | 'garden-tool' | 'knife' | 'hedge-trimmer' | 'cylinder-mower' | 'hand-mower' | 'lawn-mower-blade';

export interface ChainsawSharpenItem {
  type: 'chainsaw';
  barSize: ChainsawBarSize;
  linkCount: number;
  mode: ChainsawMode;
  quantity: number;
}

export interface HedgeTrimmerSharpenItem {
  type: 'hedge-trimmer';
  hedgeTrimmerType: HedgeTrimmerType;
  quantity: number;
  memo?: string;
}

export interface OtherSharpenItem {
  type: 'garden-tool' | 'knife' | 'cylinder-mower' | 'hand-mower' | 'lawn-mower-blade';
  quantity: number;
  memo?: string;
}

export type SharpenItem = ChainsawSharpenItem | HedgeTrimmerSharpenItem | OtherSharpenItem;

export interface SharpenPricing {
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  description: string;
}

/**
 * Calculate chainsaw sharpening price
 */
export const calculateChainsawSharpen = (
  barSize: ChainsawBarSize,
  linkCount: number,
  mode: ChainsawMode,
  quantity: number
): SharpenPricing => {
  // Determine if it's small or large category
  const isLarge = barSize === '18+' || linkCount >= 61;
  
  let unitPrice: number;
  if (isLarge) {
    unitPrice = mode === 'chain-only' ? 25 : 29;
  } else {
    unitPrice = mode === 'chain-only' ? 18 : 22;
  }
  
  const totalPrice = unitPrice * quantity;
  const description = `Sharpen: ${barSize}" | ${linkCount} links | ${mode === 'chain-only' ? 'Chain-only' : 'Whole-saw'} | Qty ${quantity}`;
  
  return {
    unitPrice,
    quantity,
    totalPrice,
    description
  };
};

/**
 * Calculate hedge trimmer sharpening price
 */
export const calculateHedgeTrimmerSharpen = (type: HedgeTrimmerType, quantity: number, memo?: string): SharpenPricing => {
  let unitPrice: number;
  let typeLabel: string;
  
  switch (type) {
    case 'battery':
      unitPrice = 95;
      typeLabel = 'Battery';
      break;
    case 'petrol':
      unitPrice = 95;
      typeLabel = 'Petrol';
      break;
    case 'electric':
      unitPrice = 65;
      typeLabel = 'Electric';
      break;
  }
  
  return {
    unitPrice,
    quantity,
    totalPrice: unitPrice * quantity,
    description: `Sharpen: Hedge trimmer (${typeLabel})${memo ? ` - ${memo}` : ''} | Qty ${quantity}`
  };
};

/**
 * Calculate cylinder mower sharpening price
 */
export const calculateCylinderMowerSharpen = (quantity: number, memo?: string): SharpenPricing => {
  const unitPrice = 125;
  return {
    unitPrice,
    quantity,
    totalPrice: unitPrice * quantity,
    description: `Sharpen: Cylinder mower${memo ? ` - ${memo}` : ''} | Qty ${quantity}`
  };
};

/**
 * Calculate hand mower sharpening price
 */
export const calculateHandMowerSharpen = (quantity: number, memo?: string): SharpenPricing => {
  const unitPrice = 75;
  return {
    unitPrice,
    quantity,
    totalPrice: unitPrice * quantity,
    description: `Sharpen: Hand mower${memo ? ` - ${memo}` : ''} | Qty ${quantity}`
  };
};

/**
 * Calculate lawn mower blade sharpening price
 */
export const calculateLawnMowerBladeSharpen = (quantity: number, memo?: string): SharpenPricing => {
  const unitPrice = 35;
  return {
    unitPrice,
    quantity,
    totalPrice: unitPrice * quantity,
    description: `Sharpen: Lawn mower blade${memo ? ` - ${memo}` : ''} | Qty ${quantity}`
  };
};

/**
 * Calculate garden tool sharpening price
 */
export const calculateGardenToolSharpen = (quantity: number): SharpenPricing => {
  const unitPrice = 18;
  return {
    unitPrice,
    quantity,
    totalPrice: unitPrice * quantity,
    description: `Sharpen: Garden tool | Qty ${quantity}`
  };
};

/**
 * Calculate knife sharpening price
 */
export const calculateKnifeSharpen = (quantity: number): SharpenPricing => {
  const unitPrice = 8;
  return {
    unitPrice,
    quantity,
    totalPrice: unitPrice * quantity,
    description: `Sharpen: Knife | Qty ${quantity}`
  };
};

/**
 * Calculate pricing for any sharpen item
 */
export const calculateSharpenPrice = (item: SharpenItem): SharpenPricing => {
  if (item.type === 'chainsaw') {
    return calculateChainsawSharpen(
      item.barSize,
      item.linkCount,
      item.mode,
      item.quantity
    );
  } else if (item.type === 'hedge-trimmer') {
    return calculateHedgeTrimmerSharpen(
      item.hedgeTrimmerType,
      item.quantity,
      item.memo
    );
  } else if (item.type === 'garden-tool') {
    return calculateGardenToolSharpen(item.quantity);
  } else if (item.type === 'knife') {
    return calculateKnifeSharpen(item.quantity);
  } else if (item.type === 'cylinder-mower') {
    return calculateCylinderMowerSharpen(item.quantity, item.memo);
  } else if (item.type === 'hand-mower') {
    return calculateHandMowerSharpen(item.quantity, item.memo);
  } else if (item.type === 'lawn-mower-blade') {
    return calculateLawnMowerBladeSharpen(item.quantity, item.memo);
  }
  
  // Fallback
  return {
    unitPrice: 0,
    quantity: 1,
    totalPrice: 0,
    description: 'Unknown sharpen item'
  };
};

/**
 * Validate chainsaw sharpen inputs
 */
export const validateChainsawInputs = (barSize: string, linkCount: number): string | null => {
  if (!barSize) {
    return 'Bar size is required';
  }
  if (!linkCount || linkCount < 1) {
    return 'Link count must be at least 1';
  }
  if (linkCount > 200) {
    return 'Link count seems unusually high. Please verify.';
  }
  return null;
};