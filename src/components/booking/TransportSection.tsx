import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Truck, MapPin } from 'lucide-react';
import { calculateTransportCharges, MachineSizeTier, TransportConfig } from '@/utils/transportCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TransportSectionProps {
  machineCategory?: string;
  onTransportChange: (data: {
    pickupRequired: boolean;
    deliveryRequired: boolean;
    sizeTier: MachineSizeTier | null;
    distanceKm: number;
    totalCharge: number;
    breakdown: string;
  }) => void;
  initialData?: {
    pickupRequired?: boolean;
    deliveryRequired?: boolean;
    sizeTier?: string;
    distanceKm?: number;
  };
}

export const TransportSection: React.FC<TransportSectionProps> = ({
  machineCategory,
  onTransportChange,
  initialData
}) => {
  const { toast } = useToast();
  const [pickupRequired, setPickupRequired] = useState(initialData?.pickupRequired || false);
  const [deliveryRequired, setDeliveryRequired] = useState(initialData?.deliveryRequired || false);
  const [sizeTier, setSizeTier] = useState<MachineSizeTier | null>(
    (initialData?.sizeTier as MachineSizeTier) || null
  );
  const [distanceKm, setDistanceKm] = useState<number>(initialData?.distanceKm || 5);
  const [manualOverride, setManualOverride] = useState(false);
  const [config, setConfig] = useState<TransportConfig | null>(null);

  // Load transport config
  useEffect(() => {
    loadTransportConfig();
  }, []);

  // Auto-determine size tier from category
  useEffect(() => {
    if (machineCategory && !sizeTier) {
      determineSizeTier(machineCategory);
    }
  }, [machineCategory]);

  // Calculate and notify parent of changes
  useEffect(() => {
    if (config && sizeTier && (pickupRequired || deliveryRequired)) {
      const calculation = calculateTransportCharges(
        pickupRequired ? distanceKm : null,
        deliveryRequired ? distanceKm : null,
        sizeTier,
        config
      );
      
      onTransportChange({
        pickupRequired,
        deliveryRequired,
        sizeTier,
        distanceKm,
        totalCharge: calculation.subtotal,
        breakdown: calculation.description
      });
    } else {
      onTransportChange({
        pickupRequired: false,
        deliveryRequired: false,
        sizeTier: null,
        distanceKm: 0,
        totalCharge: 0,
        breakdown: ''
      });
    }
  }, [pickupRequired, deliveryRequired, sizeTier, distanceKm, config]);

  const loadTransportConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_charge_configs')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data) {
        setConfig({
          small_medium_base: Number(data.small_medium_base),
          large_base: Number(data.large_base),
          included_km: Number(data.included_km),
          per_km_rate: Number(data.per_km_rate),
          origin_address: data.origin_address
        });
      }
    } catch (error) {
      console.error('Error loading transport config:', error);
      toast({
        title: 'Warning',
        description: 'Using default transport rates',
        variant: 'default'
      });
      // Use defaults
      setConfig({
        small_medium_base: 15,
        large_base: 30,
        included_km: 5,
        per_km_rate: 5,
        origin_address: '87 Ludstone Street, Hampton VIC 3188'
      });
    }
  };

  const determineSizeTier = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('machine_category_map')
        .select('size_tier')
        .ilike('category_name', category)
        .limit(1)
        .single();

      if (!error && data) {
        setSizeTier(data.size_tier as MachineSizeTier);
        return;
      }
    } catch (error) {
      console.error('Error determining size tier:', error);
    }

    // Fallback logic based on category name
    const categoryLower = category.toLowerCase();
    const largeMachines = ['shredder', 'cylinder mower', 'ride-on', 'floor saw', 'chipper', 'ride on'];
    const isLarge = largeMachines.some(term => categoryLower.includes(term));
    setSizeTier(isLarge ? 'LARGE' : 'SMALL_MEDIUM');
  };

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Transport (Pick-Up & Delivery)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading transport configuration...</p>
        </CardContent>
      </Card>
    );
  }

  const calculation = (pickupRequired || deliveryRequired) && sizeTier
    ? calculateTransportCharges(
        pickupRequired ? distanceKm : null,
        deliveryRequired ? distanceKm : null,
        sizeTier,
        config
      )
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Transport (Pick-Up & Delivery)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pickup-required"
              checked={pickupRequired}
              onCheckedChange={(checked) => setPickupRequired(checked as boolean)}
            />
            <Label htmlFor="pickup-required" className="cursor-pointer">
              Pick-Up Required
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="delivery-required"
              checked={deliveryRequired}
              onCheckedChange={(checked) => setDeliveryRequired(checked as boolean)}
            />
            <Label htmlFor="delivery-required" className="cursor-pointer">
              Delivery Required
            </Label>
          </div>
        </div>

        {(pickupRequired || deliveryRequired) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size-tier">Machine Size</Label>
                <Select
                  value={sizeTier || ''}
                  onValueChange={(value) => setSizeTier(value as MachineSizeTier)}
                >
                  <SelectTrigger id="size-tier">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL_MEDIUM">
                      Small/Medium (Chainsaw, Mower, Blower, Trimmer)
                    </SelectItem>
                    <SelectItem value="LARGE">
                      Large (Shredder, Ride-on, Floor Saw, Chipper)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="distance-km">Distance (km)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setManualOverride(!manualOverride)}
                    className="h-6 px-2 text-xs"
                  >
                    {manualOverride ? 'Auto' : 'Override'}
                  </Button>
                </div>
                <Input
                  id="distance-km"
                  type="number"
                  step="0.1"
                  min="0"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  disabled={!manualOverride}
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            {calculation && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-semibold">Transport Calculation:</p>
                {calculation.legs.map((leg, index) => {
                  const extraKm = Math.max(0, Math.ceil(leg.distance_km - config.included_km));
                  return (
                    <div key={index} className="text-sm">
                      <span className="font-medium capitalize">{leg.type}:</span>
                      {' '}Base ${leg.base_fee.toFixed(2)}
                      {extraKm > 0 && ` + ${extraKm}km × $${config.per_km_rate} = $${leg.total.toFixed(2)}`}
                      {extraKm === 0 && ' (within included distance)'}
                    </div>
                  );
                })}
                <div className="pt-2 border-t">
                  <span className="font-bold">Total Transport: ${calculation.subtotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 inline mr-1" />
              Origin: {config.origin_address} • First {config.included_km} km included per leg
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};