import { Job, Customer, JobBookingStats, MachineCategory, JobPart } from '@/types/job';
import { supabase } from '@/integrations/supabase/client';

class JobBookingDB {
  async init(): Promise<void> {
    // No initialization needed for Supabase
    return Promise.resolve();
  }

  // Customer operations
  async saveCustomer(customer: Customer): Promise<Customer> {
    const customerData: any = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address,
      notes: customer.notes || null
    };
    
    // Only include ID if it exists and is a valid UUID
    if (customer.id && this.isValidUUID(customer.id)) {
      customerData.id = customer.id;
    }
    
    const { data, error } = await supabase
      .from('customers_db')
      .upsert(customerData)
      .select()
      .single();
    
    if (error) throw error;
    
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
  
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
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
  async saveJob(job: Job): Promise<Job> {
    // First save customer and get the returned customer with UUID
    const savedCustomer = await this.saveCustomer(job.customer);
    
    const jobData: any = {
      job_number: job.jobNumber,
      customer_id: savedCustomer.id,
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
      quotation_amount: job.quotationAmount || null,
      status: job.status,
      balance_due: Math.max(0, job.grandTotal - (job.serviceDeposit || 0)),
      updated_at: new Date().toISOString()
    };
    
    // Only include ID and created_at for updates
    if (job.id && this.isValidUUID(job.id)) {
      jobData.id = job.id;
      jobData.created_at = new Date(job.createdAt).toISOString();
    }
    
    const { data, error } = await supabase
      .from('jobs_db')
      .upsert(jobData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Save job parts to junction table
    if (job.parts && job.parts.length > 0) {
      // First, delete existing parts for this job
      await supabase
        .from('job_parts')
        .delete()
        .eq('job_id', data.id);
      
      // Process parts and look up UUIDs from parts_catalogue
      const partsToInsert = [];
      for (const part of job.parts) {
        if (!part.partName || part.partName.trim() === '') continue;
        
        let cataloguePartId = null;
        
        // If partId looks like a UUID, use it directly
        if (part.partId && this.isValidUUID(part.partId)) {
          cataloguePartId = part.partId;
        } else if (part.partId && part.partId !== 'custom') {
          // Otherwise, look up the part in parts_catalogue by SKU (which matches the old string IDs)
          const { data: cataloguePart } = await supabase
            .from('parts_catalogue')
            .select('id')
            .eq('sku', part.partId)
            .maybeSingle();
          
          if (cataloguePart) {
            cataloguePartId = cataloguePart.id;
          }
        }
        // For custom parts (partId === 'custom'), cataloguePartId stays null
        
        partsToInsert.push({
          job_id: data.id,
          part_id: cataloguePartId,
          description: part.partName, // Store part name for custom parts
          quantity: part.quantity,
          unit_price: part.unitPrice,
          total_price: part.totalPrice
        });
      }
      
      if (partsToInsert.length > 0) {
        const { error: partsError } = await supabase
          .from('job_parts')
          .insert(partsToInsert);
        
        if (partsError) throw partsError;
      }
    } else {
      // If no parts, delete any existing parts for this job
      await supabase
        .from('job_parts')
        .delete()
        .eq('job_id', data.id);
    }
    
    return this.mapJobFromDb(data, savedCustomer, job.parts);
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
    
    // Load parts from job_parts table
    const parts = await this.getJobParts(id);
    
    return this.mapJobFromDb(jobData, customer, parts);
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
    
    // Load parts from job_parts table
    const parts = await this.getJobParts(jobData.id);
    
    return this.mapJobFromDb(jobData, customer, parts);
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
        const parts = await this.getJobParts(jobData.id);
        jobs.push(this.mapJobFromDb(jobData, customer, parts));
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
    // Delete job parts first
    await supabase
      .from('job_parts')
      .delete()
      .eq('job_id', id);
    
    // Then delete the job
    const { error } = await supabase
      .from('jobs_db')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Get parts for a specific job
  private async getJobParts(jobId: string): Promise<JobPart[]> {
    const { data, error } = await supabase
      .from('job_parts')
      .select('*')
      .eq('job_id', jobId);
    
    if (error) throw error;
    if (!data) return [];
    
    // Load part details from parts_catalogue
    const parts: JobPart[] = [];
    for (const partData of data) {
      let partName = 'Unknown Part';
      let category = '';
      
      if (partData.part_id) {
        // Load from catalogue if part_id exists
        const { data: cataloguePart } = await supabase
          .from('parts_catalogue')
          .select('name, category')
          .eq('id', partData.part_id)
          .maybeSingle();
        
        if (cataloguePart) {
          partName = cataloguePart.name;
          category = cataloguePart.category;
        }
      } else if (partData.description) {
        // Use stored description for custom parts
        partName = partData.description;
        category = 'Custom';
      }
      
      parts.push({
        id: partData.id,
        partId: partData.part_id || 'custom',
        partName,
        quantity: partData.quantity,
        unitPrice: partData.unit_price,
        totalPrice: partData.total_price,
        category
      });
    }
    
    return parts;
  }

  // Helper function to map database row to Job object
  private mapJobFromDb(jobData: any, customer: Customer, parts: JobPart[] = []): Job {
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
      parts,
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
      quotationAmount: jobData.quotation_amount || undefined,
      balanceDue: jobData.balance_due || 0,
      status: jobData.status,
      createdAt: jobData.created_at,
      updatedAt: jobData.updated_at
    };
  }

  // Payment operations
  async savePayment(payment: {
    jobId: string;
    amount: number;
    gstComponent: number;
    method: string;
    reference?: string;
    notes?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('job_payments')
      .insert({
        job_id: payment.jobId,
        amount: payment.amount,
        gst_component: payment.gstComponent,
        method: payment.method,
        reference: payment.reference || null,
        notes: payment.notes || null
      });
    
    if (error) throw error;
    
    // Update job balance_due
    await this.updateJobBalance(payment.jobId);
  }

  async getPayments(jobId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('job_payments')
      .select('*')
      .eq('job_id', jobId)
      .order('paid_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  private async updateJobBalance(jobId: string): Promise<void> {
    // Get job totals
    const job = await this.getJob(jobId);
    if (!job) return;
    
    // Get all payments
    const payments = await this.getPayments(jobId);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Calculate new balance
    const balanceDue = Math.max(0, job.grandTotal - totalPaid);
    
    // Update job
    await supabase
      .from('jobs_db')
      .update({ balance_due: balanceDue })
      .eq('id', jobId);
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