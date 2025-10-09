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
  smallRepairTotal: number = 0
): JobCalculations {
  // Calculate parts subtotal (GST-inclusive)
  const partsSubtotal = parts.reduce((sum, part) => sum + part.totalPrice, 0);
  
  // Calculate labour total (hours × rate, GST-inclusive)
  const labourTotal = labourHours * labourRate;
  
  // Calculate subtotal (all amounts are GST-inclusive)
  const subtotal = partsSubtotal + labourTotal + transportTotal + sharpenTotal + smallRepairTotal;
  
  // Convert to ex-GST for discount calculation (match invoice logic)
  const subtotalExGST = subtotal / (1 + GST_RATE);
  
  // Calculate discount amount (on ex-GST basis)
  let discountAmount = 0;
  if (discountType && discountValue && discountValue > 0) {
    if (discountType === 'PERCENT') {
      discountAmount = subtotalExGST * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
  }
  
  // Apply discount
  const subtotalAfterDiscountExGST = Math.max(0, subtotalExGST - discountAmount);
  
  // Calculate GST on discounted ex-GST amount (extract GST, don't add it)
  const gst = subtotalAfterDiscountExGST * GST_RATE;
  
  // Calculate grand total (ex-GST + GST)
  const grandTotal = subtotalAfterDiscountExGST + gst;
  
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