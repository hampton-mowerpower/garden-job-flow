// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface DailyTakings {
  date: string;
  total_jobs: number;
  total_revenue: number;
  average_job_value: number;
}

interface TechnicianProductivity {
  technician_id: string;
  technician_name: string;
  jobs_completed: number;
  total_revenue: number;
  average_job_time: number;
}

interface PartsUsage {
  part_id: string;
  part_name: string;
  sku: string;
  total_quantity: number;
  total_value: number;
}

interface JobTurnaround {
  id: string;
  job_number: string;
  status: string;
  days_to_complete: number;
  created_at: string;
  completed_at: string;
}

interface Technician {
  id: string;
  full_name: string;
}

export function ReportsManager() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  
  const [dailyTakings, setDailyTakings] = useState<DailyTakings[]>([]);
  const [techProductivity, setTechProductivity] = useState<TechnicianProductivity[]>([]);
  const [partsUsage, setPartsUsage] = useState<PartsUsage[]>([]);
  const [jobTurnaround, setJobTurnaround] = useState<JobTurnaround[]>([]);
  
  const [loading, setLoading] = useState(false);
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      loadReports();
    }
  }, [dateRange, selectedTechnician]);

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('role', 'technician');

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const loadReports = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadDailyTakings(),
        loadTechnicianProductivity(),
        loadPartsUsage(),
        loadJobTurnaround(),
      ]);
    } catch (error) {
      toast({
        title: "Error loading reports",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDailyTakings = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    try {
      const { data, error } = await supabase.rpc('get_daily_takings', {
        p_start_date: format(dateRange.from, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      setDailyTakings(data as any || []);
    } catch (error) {
      console.error('Error loading daily takings:', error);
    }
  };

  const loadTechnicianProductivity = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    try {
      const { data, error } = await supabase.rpc('get_technician_productivity', {
        p_start_date: format(dateRange.from, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      setTechProductivity(data as any || []);
    } catch (error) {
      console.error('Error loading technician productivity:', error);
    }
  };

  const loadPartsUsage = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    try {
      const { data, error } = await supabase.rpc('get_parts_usage_report', {
        p_start_date: format(dateRange.from, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      setPartsUsage(data as any || []);
    } catch (error) {
      console.error('Error loading parts usage:', error);
    }
  };

  const loadJobTurnaround = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    try {
      const { data, error } = await supabase
        .from('jobs_db')
        .select('id, job_number, status, created_at, completed_at')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedData = (data || []).map(job => ({
        ...job,
        days_to_complete: job.completed_at
          ? Math.ceil((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      }));
      
      setJobTurnaround(processedData);
    } catch (error) {
      console.error('Error loading job turnaround:', error);
    }
  };

  const exportReport = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!hasPermission('all')) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            You don't have permission to view reports.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6" />
              <CardTitle>Reports & Analytics</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Technicians" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="daily-takings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily-takings">Daily Takings</TabsTrigger>
              <TabsTrigger value="technician-productivity">Technician Productivity</TabsTrigger>
              <TabsTrigger value="parts-usage">Parts Usage</TabsTrigger>
              <TabsTrigger value="job-turnaround">Job Turnaround</TabsTrigger>
            </TabsList>

            <TabsContent value="daily-takings">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Daily Takings</CardTitle>
                    <Button
                      onClick={() => exportReport(dailyTakings, 'daily_takings')}
                      disabled={dailyTakings.length === 0}
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
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Average Job Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyTakings.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{format(new Date(row.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{row.total_jobs}</TableCell>
                          <TableCell>${Number(row.total_revenue).toFixed(2)}</TableCell>
                          <TableCell>${Number(row.average_job_value).toFixed(2)}</TableCell>
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
                    <CardTitle>Technician Productivity</CardTitle>
                    <Button
                      onClick={() => exportReport(techProductivity, 'technician_productivity')}
                      disabled={techProductivity.length === 0}
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
                        <TableHead>Jobs Completed</TableHead>
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Avg Job Time (hrs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {techProductivity.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.technician_name}</TableCell>
                          <TableCell>{row.jobs_completed}</TableCell>
                          <TableCell>${Number(row.total_revenue).toFixed(2)}</TableCell>
                          <TableCell>{Number(row.average_job_time).toFixed(1)}</TableCell>
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
                    <CardTitle>Parts Usage</CardTitle>
                    <Button
                      onClick={() => exportReport(partsUsage, 'parts_usage')}
                      disabled={partsUsage.length === 0}
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
                        <TableHead>Total Quantity</TableHead>
                        <TableHead>Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partsUsage.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.part_name}</TableCell>
                          <TableCell>{row.sku}</TableCell>
                          <TableCell>{row.total_quantity}</TableCell>
                          <TableCell>${Number(row.total_value).toFixed(2)}</TableCell>
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
                    <CardTitle>Job Turnaround Times</CardTitle>
                    <Button
                      onClick={() => exportReport(jobTurnaround, 'job_turnaround')}
                      disabled={jobTurnaround.length === 0}
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
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Days to Complete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobTurnaround.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.job_number}</TableCell>
                          <TableCell className="capitalize">{row.status}</TableCell>
                          <TableCell>{format(new Date(row.created_at), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {row.completed_at ? format(new Date(row.completed_at), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>{row.completed_at ? row.days_to_complete : '-'}</TableCell>
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
  );
}