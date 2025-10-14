import { Job, Customer, JobBookingStats, MachineCategory, JobPart, JobSalesItem } from '@/types/job';
import { supabase } from '@/integrations/supabase/client';

class JobBookingDB {
  async init(): Promise<void> {
    // No initialization needed for Supabase
    return Promise.resolve();
  }

  // Customer operations
  async saveCustomer(customer: Customer): Promise<Customer> {
    // Check if phone already exists for a different customer
    const { data: existingByPhone } = await supabase
      .from('customers_db')
      .select('*')
      .eq('phone', customer.phone)
      .eq('is_deleted', false)
      .maybeSingle();
    
    // If customer has a valid ID
    if (customer.id && this.isValidUUID(customer.id)) {
      // If phone is taken by another customer, use that customer instead
      if (existingByPhone && existingByPhone.id !== customer.id) {
        const { data, error } = await supabase
          .from('customers_db')
          .update({
            name: customer.name,
            email: customer.email || null,
            address: customer.address,
            notes: customer.notes || null,
            customer_type: customer.customerType || 'domestic',
            company_name: customer.companyName || null
          })
          .eq('id', existingByPhone.id)
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
          customerType: data.customer_type || 'domestic',
          companyName: data.company_name || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      }
      
      // Update the existing customer
      const { data, error } = await supabase
        .from('customers_db')
        .update({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
          address: customer.address,
          notes: customer.notes || null,
          customer_type: customer.customerType || 'domestic',
          company_name: customer.companyName || null
        })
        .eq('id', customer.id)
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
        customerType: data.customer_type || 'domestic',
        companyName: data.company_name || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    }
    
    // For new customers, if phone exists, update that customer
    if (existingByPhone) {
      const { data, error } = await supabase
        .from('customers_db')
        .update({
          name: customer.name,
          email: customer.email || null,
          address: customer.address,
          notes: customer.notes || null,
          customer_type: customer.customerType || 'domestic',
          company_name: customer.companyName || null
        })
        .eq('id', existingByPhone.id)
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
        customerType: data.customer_type || 'domestic',
        companyName: data.company_name || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    }
    
    // Insert new customer
    const { data, error } = await supabase
      .from('customers_db')
      .insert({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        address: customer.address,
        notes: customer.notes || null,
        customer_type: customer.customerType || 'domestic',
        company_name: customer.companyName || null
      })
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
      customerType: data.customer_type || 'domestic',
      companyName: data.company_name || undefined,
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
      customerType: data.customer_type || 'domestic',
      companyName: data.company_name || undefined,
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
      customerType: d.customer_type || 'domestic',
      companyName: d.company_name || undefined,
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
      customerType: d.customer_type || 'domestic',
      companyName: d.company_name || undefined,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at)
    }));
  }

  // Job operations
  async saveJob(job: Job): Promise<Job> {
    // First save customer and get the returned customer with UUID
    const savedCustomer = await this.saveCustomer(job.customer);
    
    // If job has an account, upsert a contact and link to it
    let contactId = null;
    if (job.accountCustomerId) {
      try {
        // Parse customer name into first and last
        const nameParts = savedCustomer.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        // Use the upsert_contact function
        const { data: contactIdData, error: contactError } = await supabase
          .rpc('upsert_contact', {
            p_account_id: job.accountCustomerId,
            p_first_name: firstName,
            p_last_name: lastName || null,
            p_phone: savedCustomer.phone || null,
            p_email: savedCustomer.email || null,
          });

        if (contactError) {
          console.error('Contact upsert error:', contactError);
        } else {
          contactId = contactIdData;
        }
      } catch (error) {
        console.error('Failed to upsert contact:', error);
        // Don't block the job save if contact creation fails
      }
    }
    
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
      additional_notes: job.additionalNotes || null,
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
      // Customer type and company
      customer_type: job.customerType || null,
      job_company_name: job.jobCompanyName || null,
      // Timestamps
      delivered_at: job.deliveredAt ? new Date(job.deliveredAt).toISOString() : null,
      completed_at: job.completedAt ? new Date(job.completedAt).toISOString() : null,
      // Quotation tracking
      quotation_status: job.quotationStatus || null,
      quotation_approved_at: job.quotationApprovedAt ? new Date(job.quotationApprovedAt).toISOString() : null,
      // Phase 2 fields
      requested_finish_date: job.requestedFinishDate 
        ? new Date(job.requestedFinishDate).toISOString().split('T')[0]
        : null,
      attachments: job.attachments || [],
      // Transport fields
      transport_pickup_required: job.transportPickupRequired || false,
      transport_delivery_required: job.transportDeliveryRequired || false,
      transport_size_tier: job.transportSizeTier || null,
      transport_distance_km: job.transportDistanceKm || null,
      transport_total_charge: job.transportTotalCharge || 0,
      transport_breakdown: job.transportBreakdown || null,
      // Sharpen fields
      sharpen_items: job.sharpenItems || [],
      sharpen_total_charge: job.sharpenTotalCharge || 0,
      sharpen_breakdown: job.sharpenBreakdown || null,
      // Small Repair fields
      small_repair_details: job.smallRepairDetails || null,
      small_repair_minutes: job.smallRepairMinutes || 0,
      small_repair_rate: job.smallRepairRate || 0,
      small_repair_total: job.smallRepairTotal || 0,
      // Account Customer and Contact links
      account_customer_id: job.accountCustomerId || null,
      contact_id: contactId,
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
    
    // Load sales items
    const salesItems = await this.getJobSalesItems(id);
    
    const job = this.mapJobFromDb(jobData, customer, parts);
    job.salesItems = salesItems;
    job.salesTotal = salesItems
      .filter(item => item.collect_with_job)
      .reduce((sum, item) => sum + item.amount, 0);
    
    return job;
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
    
    // Load sales items
    const salesItems = await this.getJobSalesItems(jobData.id);
    
    const job = this.mapJobFromDb(jobData, customer, parts);
    job.salesItems = salesItems;
    job.salesTotal = salesItems
      .filter(item => item.collect_with_job)
      .reduce((sum, item) => sum + item.amount, 0);
    
    return job;
  }

  async getAllJobs(): Promise<Job[]> {
    const { data: jobsData, error } = await supabase
      .from('jobs_db')
      .select('*')
      .is('deleted_at', null)
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
    // Soft delete - update deleted_at timestamp
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('jobs_db')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null
      })
      .eq('id', id)
      .is('deleted_at', null); // Only delete if not already deleted
    
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

  // Get sales items for a specific job
  private async getJobSalesItems(jobId: string): Promise<JobSalesItem[]> {
    const { data, error } = await supabase
      .from('job_sales_items')
      .select('*')
      .eq('job_id', jobId);
    
    if (error) throw error;
    if (!data) return [];
    
    return data.map(item => ({
      id: item.id,
      job_id: item.job_id,
      customer_id: item.customer_id,
      description: item.description,
      category: item.category as 'new_mower' | 'parts' | 'accessories' | 'other',
      amount: parseFloat(String(item.amount)) || 0,
      notes: item.notes || undefined,
      collect_with_job: item.collect_with_job || false,
      paid_status: item.paid_status as 'unpaid' | 'paid' | undefined,
      paid_date: item.paid_date ? new Date(item.paid_date) : undefined
    }));
  }

  // Helper function to map database row to Job object
  private mapJobFromDb(jobData: any, customer: Customer, parts: JobPart[] = []): Job {
    return {
      id: jobData.id,
      jobNumber: jobData.job_number,
      customerId: jobData.customer_id,
      customer,
      jobType: jobData.job_type || 'service',
      machineCategory: jobData.machine_category,
      machineBrand: jobData.machine_brand,
      machineModel: jobData.machine_model,
      machineSerial: jobData.machine_serial || '',
      problemDescription: jobData.problem_description,
      servicePerformed: jobData.service_performed || '',
      notes: jobData.notes || '',
      additionalNotes: jobData.additional_notes || '',
      recommendations: jobData.recommendations || '',
      partsRequired: jobData.parts_required || '',
      parts,
      labourHours: parseFloat(jobData.labour_hours) || 0,
      labourRate: parseFloat(jobData.labour_rate) || 0,
      partsSubtotal: parseFloat(jobData.parts_subtotal) || 0,
      labourTotal: parseFloat(jobData.labour_total) || 0,
      subtotal: parseFloat(jobData.subtotal) || 0,
      discountType: jobData.discount_type || undefined,
      discountValue: parseFloat(jobData.discount_value) || 0,
      gst: parseFloat(jobData.gst) || 0,
      grandTotal: parseFloat(jobData.grand_total) || 0,
      serviceDeposit: parseFloat(jobData.service_deposit) || 0,
      quotationAmount: jobData.quotation_amount || undefined,
      balanceDue: jobData.balance_due || 0,
      status: jobData.status,
      createdAt: jobData.created_at,
      updatedAt: jobData.updated_at,
      completedAt: jobData.completed_at ? new Date(jobData.completed_at) : undefined,
      deliveredAt: jobData.delivered_at ? new Date(jobData.delivered_at) : undefined,
      // Customer type and company
      customerType: jobData.customer_type || undefined,
      jobCompanyName: jobData.job_company_name || undefined,
      // Quotation tracking
      quotationStatus: jobData.quotation_status || undefined,
      quotationApprovedAt: jobData.quotation_approved_at ? new Date(jobData.quotation_approved_at) : undefined,
      // Phase 2 fields - ensure proper date parsing
      requestedFinishDate: jobData.requested_finish_date 
        ? new Date(jobData.requested_finish_date)
        : undefined,
      attachments: jobData.attachments || [],
      // Transport fields
      transportPickupRequired: jobData.transport_pickup_required || false,
      transportDeliveryRequired: jobData.transport_delivery_required || false,
      transportSizeTier: jobData.transport_size_tier || undefined,
      transportDistanceKm: jobData.transport_distance_km || undefined,
      transportTotalCharge: jobData.transport_total_charge || 0,
      transportBreakdown: jobData.transport_breakdown || '',
      // Sharpen fields
      sharpenItems: jobData.sharpen_items || [],
      sharpenTotalCharge: jobData.sharpen_total_charge || 0,
      sharpenBreakdown: jobData.sharpen_breakdown || '',
      // Small Repair fields
      smallRepairDetails: jobData.small_repair_details || '',
      smallRepairMinutes: jobData.small_repair_minutes || 0,
      smallRepairRate: parseFloat(jobData.small_repair_rate) || 0,
      smallRepairTotal: parseFloat(jobData.small_repair_total) || 0,
      // Account Customer link
      accountCustomerId: jobData.account_customer_id || undefined,
      // Unpaid sales (will be loaded separately)
      salesItems: [],
      salesTotal: 0
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
    const currentYear = new Date().getFullYear();
    const yearPrefix = `JB${currentYear}-`;
    
    // Query jobs for the current year and get the maximum job number
    const { data: jobs, error } = await supabase
      .from('jobs_db')
      .select('job_number')
      .like('job_number', `${yearPrefix}%`)
      .order('job_number', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching job numbers:', error);
      throw error;
    }
    
    let nextNumber = 1;
    
    if (jobs && jobs.length > 0) {
      // Extract the number from the last job number (e.g., "JB2025-0003" -> 3)
      const lastJobNumber = jobs[0].job_number;
      const match = lastJobNumber.match(/JB\d{4}-(\d{4})/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    return `${yearPrefix}${nextNumber.toString().padStart(4, '0')}`;
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