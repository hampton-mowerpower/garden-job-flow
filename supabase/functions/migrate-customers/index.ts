import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  suburb: string | null;
  postcode: string | null;
  company_name: string | null;
  customer_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

interface MigrationStats {
  totalRead: number;
  inserted: number;
  updated: number;
  skippedDeleted: number;
  deduped: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create clients for old and new projects
    const oldSupabase = createClient(
      'https://kyiuojjaownbvouffqbm.supabase.co',
      Deno.env.get('OLD_SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    const newSupabase = createClient(
      'https://zqujcxgnelnzxzpfykxn.supabase.co',
      Deno.env.get('NEW_SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    const stats: MigrationStats = {
      totalRead: 0,
      inserted: 0,
      updated: 0,
      skippedDeleted: 0,
      deduped: 0,
      errors: [],
    };

    console.log('🚀 Starting customer migration...');

    // Export old customers before migration
    console.log('📦 Exporting old customers...');
    const { data: allOldCustomers, error: exportError } = await oldSupabase
      .from('customers_db')
      .select('*')
      .order('created_at', { ascending: true });

    if (exportError) {
      throw new Error(`Failed to export old customers: ${exportError.message}`);
    }

    // Read customers in batches
    const BATCH_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    const seenKeys = new Map<string, Customer>(); // For deduplication

    while (hasMore) {
      console.log(`📖 Reading batch at offset ${offset}...`);

      const { data: customers, error: readError } = await oldSupabase
        .from('customers_db')
        .select('*')
        .order('created_at', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1);

      if (readError) {
        stats.errors.push(`Read error at offset ${offset}: ${readError.message}`);
        break;
      }

      if (!customers || customers.length === 0) {
        hasMore = false;
        break;
      }

      stats.totalRead += customers.length;

      // Process each customer
      for (const customer of customers as Customer[]) {
        // Skip soft-deleted
        if (customer.is_deleted) {
          stats.skippedDeleted++;
          continue;
        }

        // Normalize data
        const normalizedEmail = customer.email?.toLowerCase().trim() || null;
        const normalizedPhone = customer.phone?.replace(/\D/g, '') || '';
        const normalizedName = customer.name?.trim() || '';

        // Create deduplication key (email or phone)
        const dedupKey = normalizedEmail || normalizedPhone;

        // Check for duplicates
        if (dedupKey && seenKeys.has(dedupKey)) {
          const existing = seenKeys.get(dedupKey)!;
          // Keep the one with most recent updated_at
          if (new Date(customer.updated_at) > new Date(existing.updated_at)) {
            seenKeys.set(dedupKey, customer);
          }
          stats.deduped++;
          continue;
        }

        if (dedupKey) {
          seenKeys.set(dedupKey, customer);
        }
      }

      offset += BATCH_SIZE;

      // Safety limit
      if (offset > 50000) {
        console.warn('⚠️ Reached safety limit of 50k customers');
        hasMore = false;
      }
    }

    // Insert deduplicated customers into new database
    console.log(`💾 Inserting ${seenKeys.size} unique customers...`);

    const customersToInsert = Array.from(seenKeys.values());
    const INSERT_BATCH = 500;

    for (let i = 0; i < customersToInsert.length; i += INSERT_BATCH) {
      const batch = customersToInsert.slice(i, i + INSERT_BATCH);

      const { error: upsertError } = await newSupabase
        .from('customers_db')
        .upsert(
          batch.map((c) => ({
            id: c.id, // Preserve UUID
            name: c.name?.trim() || '',
            phone: c.phone || '',
            email: c.email?.toLowerCase().trim() || null,
            address: c.address || '',
            suburb: c.suburb || null,
            postcode: c.postcode || null,
            company_name: c.company_name || null,
            customer_type: c.customer_type || 'domestic',
            notes: c.notes || null,
            created_at: c.created_at,
            updated_at: c.updated_at,
            is_deleted: false,
          })),
          { onConflict: 'id' }
        );

      if (upsertError) {
        stats.errors.push(`Upsert error (batch ${i}): ${upsertError.message}`);
        console.error('❌ Upsert failed:', upsertError);
      } else {
        stats.inserted += batch.length;
        console.log(`✅ Inserted batch ${i / INSERT_BATCH + 1}`);
      }
    }

    // Export new customers after migration for verification
    console.log('📦 Exporting new customers...');
    const { data: allNewCustomers, error: newExportError } = await newSupabase
      .from('customers_db')
      .select('*')
      .order('created_at', { ascending: true });

    if (newExportError) {
      stats.errors.push(`Failed to export new customers: ${newExportError.message}`);
    }

    // Generate verification samples
    const samples = allNewCustomers?.slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
    })) || [];

    console.log('✅ Migration complete!');

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        samples,
        oldCustomersExport: allOldCustomers?.length || 0,
        newCustomersExport: allNewCustomers?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
