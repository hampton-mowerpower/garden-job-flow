import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const PartsImportTester: React.FC = () => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    totalParts: number;
    byCategory: Record<string, number>;
    sampleParts: any[];
  } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      // Query all active parts
      const { data: allParts, error } = await supabase
        .from('parts_catalogue')
        .select('*')
        .eq('in_stock', true)
        .is('deleted_at', null)
        .order('category', { ascending: true });

      if (error) throw error;

      // Count by category
      const byCategory: Record<string, number> = {};
      allParts?.forEach(part => {
        const cat = part.category || 'Uncategorized';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });

      // Get sample parts from each category
      const sampleParts = Object.keys(byCategory).slice(0, 5).map(cat => {
        return allParts?.find(p => p.category === cat);
      }).filter(Boolean);

      setResults({
        totalParts: allParts?.length || 0,
        byCategory,
        sampleParts: sampleParts || []
      });

      toast({
        title: 'Test Complete',
        description: `Found ${allParts?.length || 0} parts in ${Object.keys(byCategory).length} categories`
      });
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parts Import Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest} disabled={testing}>
          {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {testing ? 'Testing...' : 'Test Parts Catalog'}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Import Successful</p>
                <p className="text-sm text-green-700">
                  {results.totalParts} parts loaded from {Object.keys(results.byCategory).length} categories
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Parts by Category:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(results.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <Badge key={category} variant="outline">
                      {category}: {count}
                    </Badge>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Sample Parts:</h4>
              <div className="space-y-2">
                {results.sampleParts.map((part, idx) => (
                  <div key={idx} className="p-2 border rounded text-sm">
                    <p className="font-medium">{part.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {part.category} • ${part.sell_price.toFixed(2)}
                      {part.part_group && ` • ${part.part_group}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
