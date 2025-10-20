// @ts-nocheck
import { supabase } from '@/lib/supabase';

export const jobQueries = {
  async getAllJobs() {
    const { data, error } = await supabase
      .from('jobs_db')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },
  
  async getJobById(jobId) {
    const { data, error } = await supabase
      .from('jobs_db')
      .select('*')
      .eq('id', jobId)
      .single();
    return { data, error };
  },
  
  async updateJobStatus(jobId, status) {
    const { error } = await supabase
      .from('jobs_db')
      .update({ status })
      .eq('id', jobId);
    return { error };
  },
  
  async addJobNote(jobId, noteText, userId) {
    const { error } = await supabase
      .from('job_notes')
      .insert({
        job_id: jobId,
        user_id: userId,
        note_text: noteText,
        visibility: 'internal'
      });
    return { error };
  },

  async getJobNotes(jobId) {
    const { data, error } = await supabase
      .from('job_notes')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  }
};

export const customerQueries = {
  async searchCustomers(searchTerm) {
    const { data, error } = await supabase.rpc('fn_search_customers', {
      p_search: searchTerm
    });
    return { data: data || [], error };
  },

  async getAllCustomers() {
    const { data, error } = await supabase
      .from('customers_db')
      .select('*')
      .eq('is_deleted', false)
      .order('name');
    return { data: data || [], error };
  }
};

export const partsQueries = {
  async getAllParts() {
    const { data, error } = await supabase
      .from('parts_catalogue')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    return { data: data || [], error };
  },

  async addPart(partData) {
    const { error } = await supabase
      .from('parts_catalogue')
      .insert([{ ...partData, part_number: partData.sku }]);
    return { error };
  },

  async updatePart(partId, partData) {
    const { error } = await supabase
      .from('parts_catalogue')
      .update(partData)
      .eq('id', partId);
    return { error };
  }
};

export const reportQueries = {
  async getDailyTakings(startDate, endDate) {
    const { data, error } = await supabase.rpc('get_daily_takings', {
      p_start_date: startDate,
      p_end_date: endDate
    });
    return { data: data || [], error };
  },

  async getTechnicianProductivity(startDate, endDate) {
    const { data, error } = await supabase.rpc('get_technician_productivity', {
      p_start_date: startDate,
      p_end_date: endDate
    });
    return { data: data || [], error };
  },

  async getPartsUsage(startDate, endDate) {
    const { data, error } = await supabase.rpc('get_parts_usage_report', {
      p_start_date: startDate,
      p_end_date: endDate
    });
    return { data: data || [], error };
  }
};
