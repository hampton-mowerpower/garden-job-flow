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
 */

export type ChainsawBarSize = '14-16' | '18+';
export type ChainsawMode = 'chain-only' | 'whole-saw';
export type SharpenItemType = 'chainsaw' | 'garden-tool' | 'knife';

export interface ChainsawSharpenItem {
  type: 'chainsaw';
  barSize: ChainsawBarSize;
  linkCount: number;
  mode: ChainsawMode;
  quantity: number;
}

export interface OtherSharpenItem {
  type: 'garden-tool' | 'knife';
  quantity: number;
}

export type SharpenItem = ChainsawSharpenItem | OtherSharpenItem;

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
  } else if (item.type === 'garden-tool') {
    return calculateGardenToolSharpen(item.quantity);
  } else {
    return calculateKnifeSharpen(item.quantity);
  }
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