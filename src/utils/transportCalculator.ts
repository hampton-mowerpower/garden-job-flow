/**
 * Transport Charge Calculator for Hampton Mowerpower
 * 
 * Pricing rules:
 * - Small/Medium machines: $15 base per leg
 * - Large machines: $30 base per leg
 * - First 5km included
 * - Every additional 1km or part thereof: $5
 * - Distance calculated per leg (pickup, delivery)
 */

export type MachineSizeTier = 'SMALL_MEDIUM' | 'LARGE';

export interface TransportConfig {
  small_medium_base: number;
  large_base: number;
  included_km: number;
  per_km_rate: number;
  origin_address: string;
}

export interface TransportLeg {
  type: 'pickup' | 'delivery';
  distance_km: number;
  base_fee: number;
  distance_fee: number;
  total: number;
}

export interface TransportCalculation {
  legs: TransportLeg[];
  subtotal: number;
  description: string;
}

/**
 * Calculate transport charges for a single leg
 */
export const calculateLegCharge = (
  distanceKm: number,
  sizeTier: MachineSizeTier,
  config: TransportConfig
): { baseFee: number; distanceFee: number; total: number } => {
  const baseFee = sizeTier === 'SMALL_MEDIUM' ? config.small_medium_base : config.large_base;
  
  // Calculate extra km beyond included distance
  const extraKm = Math.max(0, Math.ceil(distanceKm - config.included_km));
  const distanceFee = extraKm * config.per_km_rate;
  
  return {
    baseFee,
    distanceFee,
    total: baseFee + distanceFee
  };
};

/**
 * Calculate total transport charges including pickup and/or delivery
 */
export const calculateTransportCharges = (
  pickupDistanceKm: number | null,
  deliveryDistanceKm: number | null,
  sizeTier: MachineSizeTier,
  config: TransportConfig
): TransportCalculation => {
  const legs: TransportLeg[] = [];
  
  if (pickupDistanceKm !== null && pickupDistanceKm > 0) {
    const pickup = calculateLegCharge(pickupDistanceKm, sizeTier, config);
    legs.push({
      type: 'pickup',
      distance_km: pickupDistanceKm,
      base_fee: pickup.baseFee,
      distance_fee: pickup.distanceFee,
      total: pickup.total
    });
  }
  
  if (deliveryDistanceKm !== null && deliveryDistanceKm > 0) {
    const delivery = calculateLegCharge(deliveryDistanceKm, sizeTier, config);
    legs.push({
      type: 'delivery',
      distance_km: deliveryDistanceKm,
      base_fee: delivery.baseFee,
      distance_fee: delivery.distanceFee,
      total: delivery.total
    });
  }
  
  const subtotal = legs.reduce((sum, leg) => sum + leg.total, 0);
  
  // Build description string
  const descriptions: string[] = [];
  legs.forEach(leg => {
    const extraKm = Math.max(0, Math.ceil(leg.distance_km - config.included_km));
    const desc = `${leg.type === 'pickup' ? 'Pick-up' : 'Delivery'}: ${leg.distance_km.toFixed(1)}km | Base $${leg.base_fee.toFixed(2)}${extraKm > 0 ? ` + ${extraKm}km × $${config.per_km_rate} = $${leg.total.toFixed(2)}` : ''}`;
    descriptions.push(desc);
  });
  
  return {
    legs,
    subtotal,
    description: descriptions.join(' | ')
  };
};

/**
 * Format transport charge for invoice line item
 */
export const formatTransportLineItem = (
  calculation: TransportCalculation,
  sizeTier: MachineSizeTier
): string => {
  const size = sizeTier === 'SMALL_MEDIUM' ? 'SM' : 'LG';
  return `Transport (${size}) — ${calculation.description}`;
};