import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'

interface PartsCatalogueItem {
  id: string
  sku: string
  upc?: string
  name: string
  description?: string
  category: string
  base_price: number
  sell_price: number
  markup?: number
  competitor_price?: number
  source?: string
  in_stock: boolean
  stock_quantity: number
  supplier?: string
  created_at: string
  updated_at: string
}

interface PartFormData {
  sku: string
  upc: string
  name: string
  description: string
  category: string
  base_price: number
  sell_price: number
  markup: number
  competitor_price: number
  source: string
  in_stock: boolean
  stock_quantity: number
  supplier: string
}

const CATEGORIES = [
  'Engine Parts',
  'Hydraulic Parts',
  'Electrical',
  'Filters',
  'Belts & Chains',
  'Blades & Cutting',
  'Fuel System',
  'Cooling System',
  'Other'
]

export function PartsCatalogue() {
  const [parts, setParts] = useState<PartsCatalogueItem[]>([])
  const [filteredParts, setFilteredParts] = useState<PartsCatalogueItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<PartsCatalogueItem | null>(null)
  const [loading, setLoading] = useState(false)
  const { hasPermission } = useAuth()

  const [formData, setFormData] = useState<PartFormData>({
    sku: '',
    upc: '',
    name: '',
    description: '',
    category: '',
    base_price: 0,
    sell_price: 0,
    markup: 0,
    competitor_price: 0,
    source: '',
    in_stock: true,
    stock_quantity: 0,
    supplier: ''
  })

  useEffect(() => {
    loadParts()
  }, [])

  useEffect(() => {
    filterParts()
  }, [parts, searchTerm, selectedCategory])

  const loadParts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parts_catalogue')
        .select('*')
        .order('name')

      if (error) throw error
      setParts(data || [])
    } catch (error) {
      console.error('Error loading parts:', error)
      toast.error('Failed to load parts catalogue')
    } finally {
      setLoading(false)
    }
  }

  const filterParts = () => {
    let filtered = parts

    if (searchTerm) {
      filtered = filtered.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.upc?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(part => part.category === selectedCategory)
    }

    setFilteredParts(filtered)
  }

  const resetForm = () => {
    setFormData({
      sku: '',
      upc: '',
      name: '',
      description: '',
      category: '',
      base_price: 0,
      sell_price: 0,
      markup: 0,
      competitor_price: 0,
      source: '',
      in_stock: true,
      stock_quantity: 0,
      supplier: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingPart) {
        // Update existing part
        const { error } = await supabase
          .from('parts_catalogue')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPart.id)

        if (error) throw error
        toast.success('Part updated successfully')
      } else {
        // Create new part
        const { error } = await supabase
          .from('parts_catalogue')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        toast.success('Part added successfully')
      }

      setIsAddDialogOpen(false)
      setEditingPart(null)
      resetForm()
      loadParts()
    } catch (error) {
      console.error('Error saving part:', error)
      toast.error('Failed to save part')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (part: PartsCatalogueItem) => {
    setEditingPart(part)
    setFormData({
      sku: part.sku,
      upc: part.upc || '',
      name: part.name,
      description: part.description || '',
      category: part.category,
      base_price: part.base_price,
      sell_price: part.sell_price,
      markup: part.markup || 0,
      competitor_price: part.competitor_price || 0,
      source: part.source || '',
      in_stock: part.in_stock,
      stock_quantity: part.stock_quantity,
      supplier: part.supplier || ''
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this part?')) return

    try {
      const { error } = await supabase
        .from('parts_catalogue')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Part deleted successfully')
      loadParts()
    } catch (error) {
      console.error('Error deleting part:', error)
      toast.error('Failed to delete part')
    }
  }

  if (!hasPermission('view_parts')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You don't have permission to view the parts catalogue.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parts Catalogue
              </CardTitle>
            </div>
            {hasPermission('all') && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Part
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPart ? 'Edit Part' : 'Add New Part'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="upc">UPC/Barcode</Label>
                        <Input
                          id="upc"
                          value={formData.upc}
                          onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="name">Part Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={formData.supplier}
                          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="base_price">Base Price *</Label>
                        <Input
                          id="base_price"
                          type="number"
                          step="0.01"
                          value={formData.base_price}
                          onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="markup">Markup %</Label>
                        <Input
                          id="markup"
                          type="number"
                          step="0.01"
                          value={formData.markup}
                          onChange={(e) => {
                            const markup = parseFloat(e.target.value) || 0
                            const sellPrice = formData.base_price * (1 + markup / 100)
                            setFormData({ ...formData, markup, sell_price: sellPrice })
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sell_price">Sell Price *</Label>
                        <Input
                          id="sell_price"
                          type="number"
                          step="0.01"
                          value={formData.sell_price}
                          onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="competitor_price">Competitor Price</Label>
                        <Input
                          id="competitor_price"
                          type="number"
                          step="0.01"
                          value={formData.competitor_price}
                          onChange={(e) => setFormData({ ...formData, competitor_price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="source">Price Source</Label>
                        <Input
                          id="source"
                          value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                          placeholder="e.g., Google, Amazon"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stock_quantity">Stock Quantity</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 0
                            setFormData({ ...formData, stock_quantity: quantity, in_stock: quantity > 0 })
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : editingPart ? 'Update Part' : 'Add Part'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search parts by name, SKU, UPC, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Sell Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  {hasPermission('all') && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading parts...
                    </TableCell>
                  </TableRow>
                ) : filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No parts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-mono">{part.sku}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{part.name}</div>
                          {part.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {part.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{part.category}</TableCell>
                      <TableCell>${part.base_price.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${part.sell_price.toFixed(2)}</TableCell>
                      <TableCell>{part.stock_quantity}</TableCell>
                      <TableCell>
                        <Badge variant={part.in_stock ? "default" : "destructive"}>
                          {part.in_stock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </TableCell>
                      {hasPermission('all') && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(part)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(part.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}