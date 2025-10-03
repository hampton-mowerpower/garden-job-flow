import { Job, Customer, JobBookingStats, MachineCategory, JobPart } from '@/types/job';
import { supabase } from '@/integrations/supabase/client';

class JobBookingDB {
  async init(): Promise<void> {
    // No initialization needed for Supabase
    return Promise.resolve();
  }

  // Customer operations
  async saveCustomer(customer: Customer): Promise<void> {
    const { error } = await supabase
      .from('customers_db')
      .upsert({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        address: customer.address,
        notes: customer.notes || null
      });
    
    if (error) throw error;
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers_db')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address,
      notes: data.notes || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers_db')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,address.ilike.%${query}%`)
      .order('name');
    
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email || '',
      address: d.address,
      notes: d.notes || '',
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at)
    }));
  }

  async getAllCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers_db')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email || '',
      address: d.address,
      notes: d.notes || '',
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at)
    }));
  }

  // Job operations
  async saveJob(job: Job): Promise<void> {
    // First save customer
    await this.saveCustomer(job.customer);
    
    const { error } = await supabase
      .from('jobs_db')
      .upsert([{
        id: job.id,
        job_number: job.jobNumber,
        customer_id: job.customer.id,
        machine_category: job.machineCategory,
        machine_brand: job.machineBrand,
        machine_model: job.machineModel,
        machine_serial: job.machineSerial || null,
        problem_description: job.problemDescription,
        service_performed: job.servicePerformed || null,
        notes: job.notes || null,
        recommendations: job.recommendations || null,
        parts_required: job.partsRequired || null,
        labour_hours: job.labourHours,
        labour_rate: job.labourRate,
        parts_subtotal: job.partsSubtotal,
        labour_total: job.labourTotal,
        subtotal: job.subtotal,
        discount_type: job.discountType || null,
        discount_value: job.discountValue || 0,
        gst: job.gst,
        grand_total: job.grandTotal,
        service_deposit: job.serviceDeposit || 0,
        deposit_date: job.depositDate ? new Date(job.depositDate).toISOString() : null,
        deposit_method: job.depositMethod || null,
        quotation_amount: job.quotationAmount || null,
        status: job.status,
        created_at: new Date(job.createdAt).toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
  }

  async getJob(id: string): Promise<Job | null> {
    const { data: jobData, error } = await supabase
      .from('jobs_db')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!jobData) return null;
    
    const customer = await this.getCustomer(jobData.customer_id);
    if (!customer) return null;
    
    return this.mapJobFromDb(jobData, customer);
  }

  async getJobByNumber(jobNumber: string): Promise<Job | null> {
    const { data: jobData, error } = await supabase
      .from('jobs_db')
      .select('*')
      .eq('job_number', jobNumber)
      .maybeSingle();
    
    if (error) throw error;
    if (!jobData) return null;
    
    const customer = await this.getCustomer(jobData.customer_id);
    if (!customer) return null;
    
    return this.mapJobFromDb(jobData, customer);
  }

  async getAllJobs(): Promise<Job[]> {
    const { data: jobsData, error } = await supabase
      .from('jobs_db')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const jobs: Job[] = [];
    for (const jobData of jobsData || []) {
      const customer = await this.getCustomer(jobData.customer_id);
      if (customer) {
        jobs.push(this.mapJobFromDb(jobData, customer));
      }
    }
    
    return jobs;
  }

  async searchJobs(query: string): Promise<Job[]> {
    const allJobs = await this.getAllJobs();
    const lowerQuery = query.toLowerCase();
    
    return allJobs.filter(job => 
      job.jobNumber.toLowerCase().includes(lowerQuery) ||
      job.customer.name.toLowerCase().includes(lowerQuery) ||
      job.customer.phone.includes(query) ||
      job.machineCategory.toLowerCase().includes(lowerQuery) ||
      job.machineBrand.toLowerCase().includes(lowerQuery) ||
      job.problemDescription.toLowerCase().includes(lowerQuery)
    );
  }

  async getJobStats(): Promise<JobBookingStats> {
    const jobs = await this.getAllJobs();
    
    const totalJobs = jobs.length;
    const pendingJobs = jobs.filter(job => job.status === 'pending').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const totalRevenue = jobs
      .filter(job => job.status === 'completed')
      .reduce((sum, job) => sum + job.grandTotal, 0);
    const averageJobValue = completedJobs > 0 ? totalRevenue / completedJobs : 0;

    return {
      totalJobs,
      pendingJobs,
      completedJobs,
      totalRevenue,
      averageJobValue
    };
  }

  async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs_db')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Helper function to map database row to Job object
  private mapJobFromDb(jobData: any, customer: Customer): Job {
    return {
      id: jobData.id,
      jobNumber: jobData.job_number,
      customerId: jobData.customer_id,
      customer,
      machineCategory: jobData.machine_category,
      machineBrand: jobData.machine_brand,
      machineModel: jobData.machine_model,
      machineSerial: jobData.machine_serial || '',
      problemDescription: jobData.problem_description,
      servicePerformed: jobData.service_performed || '',
      notes: jobData.notes || '',
      recommendations: jobData.recommendations || '',
      partsRequired: jobData.parts_required || '',
      parts: [],
      labourHours: jobData.labour_hours,
      labourRate: jobData.labour_rate,
      partsSubtotal: jobData.parts_subtotal,
      labourTotal: jobData.labour_total,
      subtotal: jobData.subtotal,
      discountType: jobData.discount_type || undefined,
      discountValue: jobData.discount_value || 0,
      gst: jobData.gst,
      grandTotal: jobData.grand_total,
      serviceDeposit: jobData.service_deposit || 0,
      depositDate: jobData.deposit_date || undefined,
      depositMethod: jobData.deposit_method || undefined,
      quotationAmount: jobData.quotation_amount || undefined,
      status: jobData.status,
      createdAt: jobData.created_at,
      updatedAt: jobData.updated_at
    };
  }

  // Utility function to generate next job number
  async getNextJobNumber(): Promise<string> {
    const jobs = await this.getAllJobs();
    const currentYear = new Date().getFullYear();
    const yearJobs = jobs.filter(job => 
      new Date(job.createdAt).getFullYear() === currentYear
    );
    
    const nextNumber = yearJobs.length + 1;
    return `JB${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Export/Import functions
  async exportData(): Promise<{ customers: Customer[], jobs: Job[] }> {
    const customers = await this.getAllCustomers();
    const jobs = await this.getAllJobs();
    return { customers, jobs };
  }

  // Settings operations - use localStorage for settings (not user-specific)
  async getSetting(key: string): Promise<any> {
    const value = localStorage.getItem(`jobBooking_${key}`);
    return value ? JSON.parse(value) : null;
  }

  async saveSetting(key: string, value: any): Promise<void> {
    localStorage.setItem(`jobBooking_${key}`, JSON.stringify(value));
  }

  async saveCustomCategories(categories: MachineCategory[]): Promise<void> {
    return this.saveSetting('customCategories', categories);
  }

  async getCustomCategories(): Promise<MachineCategory[]> {
    const categories = await this.getSetting('customCategories');
    return categories || [];
  }

  async saveCustomParts(parts: JobPart[]): Promise<void> {
    return this.saveSetting('customParts', parts);
  }

  async getCustomParts(): Promise<JobPart[]> {
    const parts = await this.getSetting('customParts');
    return parts || [];
  }

  async saveServiceTemplates(templates: string[]): Promise<void> {
    return this.saveSetting('serviceTemplates', templates);
  }

  async getServiceTemplates(): Promise<string[]> {
    const templates = await this.getSetting('serviceTemplates');
    return templates || [];
  }

  async saveQuickDescriptions(descriptions: string[]): Promise<void> {
    return this.saveSetting('quickDescriptions', descriptions);
  }

  async getQuickDescriptions(): Promise<string[]> {
    const descriptions = await this.getSetting('quickDescriptions');
    return descriptions || [
      'Full Service Required',
      'Blade Sharpen',
      'Carburetor Clean',
      'Chain Sharpen', 
      'Recoil Cord Replacement',
      'Oil Change',
      'Spark Plug Replacement',
      'Air Filter Clean/Replace',
      'Fuel System Service',
      'Engine Tune-Up',
      'Belt Replacement',
      'Tire Repair',
      'Deck Clean & Adjust',
      'Safety Check',
      'Won\'t Start',
      'Runs Rough',
      'No Power',
      'Smoking',
      'Overheating'
    ];
  }

  async saveCustomMachineData(data: any): Promise<void> {
    return this.saveSetting('customMachineData', data);
  }

  async getCustomMachineData(): Promise<any> {
    const data = await this.getSetting('customMachineData');
    return data || {
      categories: [],
      brands: {},
      models: {}
    };
  }

  // Print settings
  async savePrintSettings(settings: {
    autoPrintLabel?: boolean;
    defaultLabelTemplate?: 'thermal-large' | 'thermal-small' | 'a4';
    defaultLabelQuantity?: number;
  }): Promise<void> {
    return this.saveSetting('printSettings', settings);
  }

  async getPrintSettings(): Promise<{
    autoPrintLabel: boolean;
    defaultLabelTemplate: 'thermal-large' | 'thermal-small' | 'a4';
    defaultLabelQuantity: number;
  }> {
    const settings = await this.getSetting('printSettings');
    return settings || {
      autoPrintLabel: true, // Default to true for better UX
      defaultLabelTemplate: 'thermal-large',
      defaultLabelQuantity: 1,
    };
  }
}


export const jobBookingDB = new JobBookingDB();