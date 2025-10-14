import { JobPart } from '@/types/job';

export const GST_RATE = 0.10; // 10% GST for Australia

export interface JobCalculations {
  partsSubtotal: number;
  labourTotal: number;
  subtotal: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  gst: number;
  grandTotal: number;
}

export interface ExtendedJobCalculations extends JobCalculations {
  serviceDeposit: number;
  finalTotal: number;
}

export function calculateJobTotals(
  parts: JobPart[],
  labourHours: number,
  labourRate: number,
  discountType?: 'PERCENT' | 'AMOUNT',
  discountValue?: number,
  transportTotal: number = 0,
  sharpenTotal: number = 0,
  smallRepairTotal: number = 0,
  salesTotal: number = 0 // NEW: Unpaid sales total
): JobCalculations {
  // All input prices are GST-inclusive
  const partsSubtotal = parts.reduce((sum, part) => sum + part.totalPrice, 0);
  const labourTotal = labourHours * labourRate;
  
  // Subtotal is sum of all GST-inclusive amounts
  const subtotal = partsSubtotal + labourTotal + transportTotal + sharpenTotal + smallRepairTotal + salesTotal;
  
  // Calculate discount on the GST-inclusive subtotal
  let discountAmount = 0;
  if (discountType && discountValue && discountValue > 0) {
    if (discountType === 'PERCENT') {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      // Discount amount is also GST-inclusive
      discountAmount = discountValue;
    }
  }
  
  // Apply discount to get subtotal after discount (still GST-inclusive)
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  
  // Back-calculate GST from the discounted GST-inclusive amount
  // If total is GST-inclusive: total = ex_gst + (ex_gst * GST_RATE) = ex_gst * (1 + GST_RATE)
  // Therefore: ex_gst = total / (1 + GST_RATE)
  // And: gst = total - ex_gst = total - (total / (1 + GST_RATE)) = total * (GST_RATE / (1 + GST_RATE))
  const gst = subtotalAfterDiscount * (GST_RATE / (1 + GST_RATE));
  
  // Grand total is the subtotal after discount (which already includes GST)
  const grandTotal = subtotalAfterDiscount;
  
  // Calculate ex-GST amount for interface
  const subtotalAfterDiscountExGST = subtotalAfterDiscount / (1 + GST_RATE);
  
  return {
    partsSubtotal: Math.round(partsSubtotal * 100) / 100,
    labourTotal: Math.round(labourTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    subtotalAfterDiscount: Math.round(subtotalAfterDiscountExGST * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(amount);
}

export function calculatePartTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}