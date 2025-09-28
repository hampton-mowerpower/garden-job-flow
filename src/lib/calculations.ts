import { JobPart } from '@/types/job';

export const GST_RATE = 0.10; // 10% GST for Australia

export interface JobCalculations {
  partsSubtotal: number;
  labourTotal: number;
  subtotal: number;
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
  labourRate: number
): JobCalculations {
  // Calculate parts subtotal
  const partsSubtotal = parts.reduce((sum, part) => sum + part.totalPrice, 0);
  
  // Calculate labour total (hours × rate)
  const labourTotal = labourHours * labourRate;
  
  // Calculate subtotal (parts + labour)
  const subtotal = partsSubtotal + labourTotal;
  
  // Calculate GST
  const gst = subtotal * GST_RATE;
  
  // Calculate grand total
  const grandTotal = subtotal + gst;
  
  return {
    partsSubtotal: Math.round(partsSubtotal * 100) / 100,
    labourTotal: Math.round(labourTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
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