import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Save, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TransportConfig {
  id: string;
  small_medium_base: number;
  large_base: number;
  included_km: number;
  per_km_rate: number;
  origin_address: string;
}

export const TransportSettingsAdmin: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<TransportConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_charge_configs')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig(data);
      } else {
        // Create default config
        const defaultConfig = {
          small_medium_base: 15,
          large_base: 30,
          included_km: 5,
          per_km_rate: 5,
          origin_address: '87 Ludstone Street, Hampton VIC 3188'
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('transport_charge_configs')
          .insert(defaultConfig)
          .select()
          .single();

        if (insertError) throw insertError;
        setConfig(newData);
      }
    } catch (error) {
      console.error('Error loading transport config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transport settings',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('transport_charge_configs')
        .update({
          small_medium_base: config.small_medium_base,
          large_base: config.large_base,
          included_km: config.included_km,
          per_km_rate: config.per_km_rate,
          origin_address: config.origin_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      toast({
        title: 'Success',
        description: 'Transport settings saved'
      });
    } catch (error) {
      console.error('Error saving transport config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save transport settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Transport Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Transport Settings (Pick-Up & Delivery)
          </CardTitle>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="w-4 h-4" />
                Saved
              </span>
            )}
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="small-medium-base">Small/Medium Base Fee ($) per leg</Label>
            <Input
              id="small-medium-base"
              type="number"
              min="0"
              step="0.01"
              value={config.small_medium_base}
              onChange={(e) => setConfig({ ...config, small_medium_base: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              For Chainsaw, Mower, Blower, Trimmer, etc.
            </p>
          </div>

          <div>
            <Label htmlFor="large-base">Large Base Fee ($) per leg</Label>
            <Input
              id="large-base"
              type="number"
              min="0"
              step="0.01"
              value={config.large_base}
              onChange={(e) => setConfig({ ...config, large_base: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              For Shredder, Ride-on, Floor Saw, Chipper, etc.
            </p>
          </div>

          <div>
            <Label htmlFor="included-km">Included Distance (km)</Label>
            <Input
              id="included-km"
              type="number"
              min="0"
              step="0.1"
              value={config.included_km}
              onChange={(e) => setConfig({ ...config, included_km: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Free km included in base fee
            </p>
          </div>

          <div>
            <Label htmlFor="per-km-rate">Extra $/km</Label>
            <Input
              id="per-km-rate"
              type="number"
              min="0"
              step="0.01"
              value={config.per_km_rate}
              onChange={(e) => setConfig({ ...config, per_km_rate: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Charged for distance beyond included km
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="origin-address">Origin Address</Label>
          <Input
            id="origin-address"
            value={config.origin_address}
            onChange={(e) => setConfig({ ...config, origin_address: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Starting point for distance calculations
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-2">Calculation Preview:</p>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>• Small/Medium, 12 km, Pick-Up only: ${config.small_medium_base} + {Math.ceil(Math.max(0, 12 - config.included_km))}km × ${config.per_km_rate} = ${config.small_medium_base + Math.ceil(Math.max(0, 12 - config.included_km)) * config.per_km_rate}</p>
            <p>• Large, 12 km, Pick-Up + Delivery: (${config.large_base} + {Math.ceil(Math.max(0, 12 - config.included_km))}km × ${config.per_km_rate}) × 2 legs = ${(config.large_base + Math.ceil(Math.max(0, 12 - config.included_km)) * config.per_km_rate) * 2}</p>
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            All prices are GST-inclusive
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Changes sync immediately with New Job Booking
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
