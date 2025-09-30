import { Job, Customer, JobBookingStats, MachineCategory, JobPart } from '@/types/job';

const DB_NAME = 'JobBookingSystem';
const DB_VERSION = 2;

class JobBookingDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Create customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('name', 'name', { unique: false });
          customerStore.createIndex('phone', 'phone', { unique: false });
        }

        // Create jobs store
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('jobNumber', 'jobNumber', { unique: true });
          jobStore.createIndex('customerId', 'customerId', { unique: false });
          jobStore.createIndex('status', 'status', { unique: false });
          jobStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create settings store for categories, parts, templates
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Version 2 upgrades - ensure settings store exists
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
          console.log('Database upgraded to version 2 - settings store ready');
        }
      };
    });
  }

  // Customer operations
  async saveCustomer(customer: Customer): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');
    
    return new Promise((resolve, reject) => {
      const request = store.put(customer);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomer(id: string): Promise<Customer | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['customers'], 'readonly');
    const store = transaction.objectStore('customers');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['customers'], 'readonly');
    const store = transaction.objectStore('customers');
    const customers: Customer[] = [];
    
    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const customer = cursor.value as Customer;
          if (
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            customer.phone.includes(query) ||
            customer.address.toLowerCase().includes(query.toLowerCase())
          ) {
            customers.push(customer);
          }
          cursor.continue();
        } else {
          resolve(customers);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCustomers(): Promise<Customer[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['customers'], 'readonly');
    const store = transaction.objectStore('customers');
    const customers: Customer[] = [];
    
    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          customers.push(cursor.value);
          cursor.continue();
        } else {
          resolve(customers);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Job operations
  async saveJob(job: Job): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['jobs'], 'readwrite');
    const store = transaction.objectStore('jobs');
    
    return new Promise((resolve, reject) => {
      const request = store.put(job);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getJob(id: string): Promise<Job | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['jobs'], 'readonly');
    const store = transaction.objectStore('jobs');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getJobByNumber(jobNumber: string): Promise<Job | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['jobs'], 'readonly');
    const store = transaction.objectStore('jobs');
    const index = store.index('jobNumber');
    
    return new Promise((resolve, reject) => {
      const request = index.get(jobNumber);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllJobs(): Promise<Job[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['jobs'], 'readonly');
    const store = transaction.objectStore('jobs');
    const jobs: Job[] = [];
    
    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          jobs.push(cursor.value);
          cursor.continue();
        } else {
          resolve(jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      };
      request.onerror = () => reject(request.error);
    });
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
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['jobs'], 'readwrite');
    const store = transaction.objectStore('jobs');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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

  // Settings operations
  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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
}

export const jobBookingDB = new JobBookingDB();