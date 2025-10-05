import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ShoppingCart, CreditCard, Plus, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function POSInterface() {
  const [activeTab, setActiveTab] = useState('sale');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Point of Sale</h2>
          <p className="text-muted-foreground">
            Unified checkout for machinery, parts, and service
          </p>
        </div>
        <Button variant="outline">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart (0)
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          <strong>POS System - Phase 1 Complete</strong>
          <br />
          The database foundation for machinery sales, invoicing, and payments is now ready.
          Full POS interface with cart, checkout, and receipt printing will be built in the next phase.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Sell Machinery
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Sell Parts
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Service/Labour
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Scan barcode or search by name, SKU..."
                className="w-full"
              />
              <div className="text-sm text-muted-foreground text-center py-8">
                Search for machinery, parts, or services to add to cart
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="sale">New Sale</TabsTrigger>
              <TabsTrigger value="quote">New Quote</TabsTrigger>
              <TabsTrigger value="refund">Refund</TabsTrigger>
            </TabsList>

            <TabsContent value="sale" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Cart is empty</p>
                <p className="text-sm">Add items to start a sale</p>
              </div>
            </TabsContent>

            <TabsContent value="quote" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                Quote functionality coming soon
              </div>
            </TabsContent>

            <TabsContent value="refund" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                Refund processing coming soon
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
