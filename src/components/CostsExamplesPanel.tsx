import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Check, X, Eye } from 'lucide-react';
import { SharpenItem } from '@/utils/sharpenCalculator';

interface CostsExamplesPanelProps {
  // Live breakdown data
  transportTotal?: number;
  transportBreakdown?: string;
  sharpenTotal?: number;
  sharpenBreakdown?: string;
  additionalNotes?: string;
  onLoadExample?: (example: ExampleData) => void;
}

interface ExampleData {
  name: string;
  description: string;
  transportData?: {
    pickupRequired: boolean;
    deliveryRequired: boolean;
    sizeTier: 'SMALL_MEDIUM' | 'LARGE';
    distanceKm: number;
    expectedTotal: number;
  };
  sharpenData?: {
    items: SharpenItem[];
    expectedTotal: number;
  };
}

const TRANSPORT_EXAMPLES: ExampleData[] = [
  {
    name: 'SM 12km Pick-Up Only',
    description: 'Small/Medium machine, 12km, pick-up only',
    transportData: {
      pickupRequired: true,
      deliveryRequired: false,
      sizeTier: 'SMALL_MEDIUM',
      distanceKm: 12,
      expectedTotal: 50 // Base $15 + 7km × $5 = $50
    }
  },
  {
    name: 'LG 18.2km Both Ways',
    description: 'Large machine, 18.2km, pick-up AND delivery',
    transportData: {
      pickupRequired: true,
      deliveryRequired: true,
      sizeTier: 'LARGE',
      distanceKm: 18.2,
      expectedTotal: 200 // Per leg: ceil(18.2-5)=14, 14×$5=$70 + $30 = $100 × 2 legs = $200
    }
  }
];

const SHARPEN_EXAMPLES: ExampleData[] = [
  {
    name: 'Chainsaw 16" Chain-only ×2',
    description: '16", 58 links, Chain-only, Qty 2',
    sharpenData: {
      items: [{
        type: 'chainsaw',
        barSize: '14-16',
        linkCount: 58,
        mode: 'chain-only',
        quantity: 2
      }],
      expectedTotal: 36 // $18 × 2 = $36
    }
  },
  {
    name: 'Chainsaw 18" Whole-saw ×1',
    description: '18", 72 links, Whole-saw, Qty 1',
    sharpenData: {
      items: [{
        type: 'chainsaw',
        barSize: '18+',
        linkCount: 72,
        mode: 'whole-saw',
        quantity: 1
      }],
      expectedTotal: 29 // $29
    }
  },
  {
    name: 'Garden Tool ×3',
    description: 'Garden tool, Qty 3',
    sharpenData: {
      items: [{
        type: 'garden-tool',
        quantity: 3
      }],
      expectedTotal: 54 // $18 × 3 = $54
    }
  },
  {
    name: 'Knife ×5',
    description: 'Knife, Qty 5',
    sharpenData: {
      items: [{
        type: 'knife',
        quantity: 5
      }],
      expectedTotal: 40 // $8 × 5 = $40
    }
  }
];

export const CostsExamplesPanel: React.FC<CostsExamplesPanelProps> = ({
  transportTotal = 0,
  transportBreakdown = '',
  sharpenTotal = 0,
  sharpenBreakdown = '',
  additionalNotes = '',
  onLoadExample
}) => {
  const checkMatch = (expected: number, actual: number): boolean => {
    return Math.abs(expected - actual) < 0.01;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Costs & Examples
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live">Live Breakdown</TabsTrigger>
            <TabsTrigger value="examples">Example Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            {/* Transport Breakdown */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Transport</h4>
              {transportTotal > 0 ? (
                <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground whitespace-pre-wrap">{transportBreakdown}</p>
                  <p className="font-bold pt-2 border-t">
                    Total: ${transportTotal.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No transport charges</p>
              )}
            </div>

            {/* Sharpen Breakdown */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Sharpen Services</h4>
              {sharpenTotal > 0 ? (
                <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground whitespace-pre-wrap">{sharpenBreakdown}</p>
                  <p className="font-bold pt-2 border-t">
                    Total: ${sharpenTotal.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No sharpen services</p>
              )}
            </div>

            {/* Additional Notes */}
            {additionalNotes && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Additional Notes</h4>
                <div className="text-sm p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">{additionalNotes}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ Will print on 79mm & A4 labels (ellipsis if long)
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            {/* Transport Examples */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Transport Examples</h4>
              <div className="space-y-2">
                {TRANSPORT_EXAMPLES.map((example, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{example.name}</p>
                        <p className="text-xs text-muted-foreground">{example.description}</p>
                        <p className="text-sm font-semibold mt-1">
                          Expected: ${example.transportData?.expectedTotal.toFixed(2)}
                        </p>
                      </div>
                      {onLoadExample && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onLoadExample(example)}
                        >
                          Load
                        </Button>
                      )}
                    </div>
                    {transportTotal > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        {checkMatch(example.transportData?.expectedTotal || 0, transportTotal) ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Matches expected ✓</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">
                              Mismatch (current: ${transportTotal.toFixed(2)})
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sharpen Examples */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Sharpen Examples</h4>
              <div className="space-y-2">
                {SHARPEN_EXAMPLES.map((example, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{example.name}</p>
                        <p className="text-xs text-muted-foreground">{example.description}</p>
                        <p className="text-sm font-semibold mt-1">
                          Expected: ${example.sharpenData?.expectedTotal.toFixed(2)}
                        </p>
                      </div>
                      {onLoadExample && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onLoadExample(example)}
                        >
                          Load
                        </Button>
                      )}
                    </div>
                    {sharpenTotal > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        {checkMatch(example.sharpenData?.expectedTotal || 0, sharpenTotal) ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Matches expected ✓</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">
                              Mismatch (current: ${sharpenTotal.toFixed(2)})
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};