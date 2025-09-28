import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { BarChart3, FileText, Download, TrendingUp, Users, Package, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'
import { DateRange } from 'react-day-picker'
import { addDays, format } from 'date-fns'

interface DailyTakings {
  date: string
  total_jobs: number
  total_revenue: number
  completed_jobs: number
  pending_jobs: number
}

interface TechnicianProductivity {
  technician_name: string
  total_jobs: number
  completed_jobs: number
  total_revenue: number
  avg_completion_time: number
  completion_rate: number
}

interface PartsUsage {
  part_name: string
  sku: string
  category: string
  quantity_used: number
  total_value: number
  times_ordered: number
}

interface JobTurnaround {
  job_number: string
  customer_name: string
  created_at: string
  completed_at: string | null
  days_to_complete: number | null
  status: string
  total_value: number
}

export function ReportsManager() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  })
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all')
  const [dailyTakings, setDailyTakings] = useState<DailyTakings[]>([])
  const [techProductivity, setTechProductivity] = useState<TechnicianProductivity[]>([])
  const [partsUsage, setPartsUsage] = useState<PartsUsage[]>([])
  const [jobTurnaround, setJobTurnaround] = useState<JobTurnaround[]>([])
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const { hasPermission } = useAuth()

  useEffect(() => {
    loadTechnicians()
  }, [])

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      loadReports()
    }
  }, [dateRange, selectedTechnician])

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('role', 'technician')

      if (error) throw error
      setTechnicians(data?.map(t => ({ id: t.id, name: t.full_name || 'Unknown' })) || [])
    } catch (error) {
      console.error('Error loading technicians:', error)
    }
  }

  const loadReports = async () => {
    if (!dateRange?.from || !dateRange?.to) return
    
    setLoading(true)
    try {
      await Promise.all([
        loadDailyTakings(),
        loadTechnicianProductivity(),
        loadPartsUsage(),
        loadJobTurnaround()
      ])
    } catch (error) {
      console.error('Error loading reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const loadDailyTakings = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    try {
      const { data, error } = await supabase
        .rpc('get_daily_takings', {
          start_date: format(dateRange.from, 'yyyy-MM-dd'),
          end_date: format(dateRange.to, 'yyyy-MM-dd')
        })

      if (error) throw error
      setDailyTakings(data || [])
    } catch (error) {
      console.error('Error loading daily takings:', error)
    }
  }

  const loadTechnicianProductivity = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    try {
      const { data, error } = await supabase
        .rpc('get_technician_productivity', {
          start_date: format(dateRange.from, 'yyyy-MM-dd'),
          end_date: format(dateRange.to, 'yyyy-MM-dd'),
          technician_id: selectedTechnician === 'all' ? null : selectedTechnician
        })

      if (error) throw error
      setTechProductivity(data || [])
    } catch (error) {
      console.error('Error loading technician productivity:', error)
    }
  }

  const loadPartsUsage = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    try {
      const { data, error } = await supabase
        .rpc('get_parts_usage_report', {
          start_date: format(dateRange.from, 'yyyy-MM-dd'),
          end_date: format(dateRange.to, 'yyyy-MM-dd')
        })

      if (error) throw error
      setPartsUsage(data || [])
    } catch (error) {
      console.error('Error loading parts usage:', error)
    }
  }

  const loadJobTurnaround = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    try {
      const { data, error } = await supabase
        .from('jobs_db')
        .select(`
          job_number,
          created_at,
          completed_at,
          status,
          grand_total,
          customer_id,
          customers_db!inner(name)
        `)
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedData = data?.map((job: any) => ({
        job_number: job.job_number,
        customer_name: job.customers_db?.name || 'Unknown',
        created_at: job.created_at,
        completed_at: job.completed_at,
        days_to_complete: job.completed_at 
          ? Math.ceil((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : null,
        status: job.status,
        total_value: job.grand_total
      })) || []

      setJobTurnaround(processedData)
    } catch (error) {
      console.error('Error loading job turnaround:', error)
    }
  }

  const exportReport = (reportType: string, data: any[]) => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(item => Object.values(item).join(',')).join('\n')
    const csv = `${headers}\n${rows}`
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!hasPermission('all') && !hasPermission('view_reports')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You don't have permission to view reports.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reports & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <Label>Date Range</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div>
              <Label>Technician</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="daily-takings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="daily-takings">Daily Takings</TabsTrigger>
              <TabsTrigger value="technician-productivity">Technician Productivity</TabsTrigger>
              <TabsTrigger value="parts-usage">Parts Usage</TabsTrigger>
              <TabsTrigger value="job-turnaround">Job Turnaround</TabsTrigger>
            </TabsList>

            <TabsContent value="daily-takings">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Daily Takings
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport('daily-takings', dailyTakings)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Jobs</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyTakings.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell>{format(new Date(day.date), 'PPP')}</TableCell>
                          <TableCell>{day.total_jobs}</TableCell>
                          <TableCell>{day.completed_jobs}</TableCell>
                          <TableCell>{day.pending_jobs}</TableCell>
                          <TableCell className="font-medium">${day.total_revenue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technician-productivity">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Technician Productivity
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport('technician-productivity', techProductivity)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Technician</TableHead>
                        <TableHead>Total Jobs</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Avg. Completion Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {techProductivity.map((tech) => (
                        <TableRow key={tech.technician_name}>
                          <TableCell className="font-medium">{tech.technician_name}</TableCell>
                          <TableCell>{tech.total_jobs}</TableCell>
                          <TableCell>{tech.completed_jobs}</TableCell>
                          <TableCell>{(tech.completion_rate * 100).toFixed(1)}%</TableCell>
                          <TableCell>${tech.total_revenue.toFixed(2)}</TableCell>
                          <TableCell>{tech.avg_completion_time.toFixed(1)} days</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parts-usage">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Parts Usage
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport('parts-usage', partsUsage)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity Used</TableHead>
                        <TableHead>Times Ordered</TableHead>
                        <TableHead>Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partsUsage.map((part) => (
                        <TableRow key={part.sku}>
                          <TableCell className="font-medium">{part.part_name}</TableCell>
                          <TableCell className="font-mono">{part.sku}</TableCell>
                          <TableCell>{part.category}</TableCell>
                          <TableCell>{part.quantity_used}</TableCell>
                          <TableCell>{part.times_ordered}</TableCell>
                          <TableCell>${part.total_value.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="job-turnaround">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Job Turnaround Times
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport('job-turnaround', jobTurnaround)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Days to Complete</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobTurnaround.map((job) => (
                        <TableRow key={job.job_number}>
                          <TableCell className="font-mono">{job.job_number}</TableCell>
                          <TableCell>{job.customer_name}</TableCell>
                          <TableCell>{format(new Date(job.created_at), 'PP')}</TableCell>
                          <TableCell>
                            {job.completed_at ? format(new Date(job.completed_at), 'PP') : '-'}
                          </TableCell>
                          <TableCell>
                            {job.days_to_complete ? `${job.days_to_complete} days` : '-'}
                          </TableCell>
                          <TableCell className="capitalize">{job.status}</TableCell>
                          <TableCell>${job.total_value.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}