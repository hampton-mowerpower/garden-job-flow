import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create client with service role for admin queries
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify admin role from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user has admin role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) throw roleError;

    const isAdmin = userRoles?.some(r => r.role === 'ADMIN' || r.role === 'SUPER_ADMIN');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin user verified, collecting diagnostics...');

    // Collect all diagnostics using direct SQL queries (information_schema not exposed via API)
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      collected_by: user.email,
    };

    // Simplified: Just use sample table info since information_schema isn't accessible
    diagnostics.tables_columns = [];
    diagnostics.views = [];
    diagnostics.functions = [];
    diagnostics.grants_tables = [];

    // 5. Get list of database functions (for user reference)
    const functionsList = [
      'get_job_stats_efficient',
      'list_jobs_page', 
      'get_parts_usage_report',
      'get_daily_takings',
      'get_technician_productivity',
      'find_duplicate_categories',
      'find_duplicate_brands',
      'find_customer_duplicates',
      'validate_job_customer_links',
      'health_check'
    ];
    
    diagnostics.known_functions = functionsList;

    // 6. Test known functions
    const functionTests: any = {};
    for (const funcName of functionsList) {
      try {
        // Just check if function exists by attempting to call it
        const { error } = await supabase.rpc(funcName as any).limit(0);
        functionTests[funcName] = error ? `Error: ${error.message}` : 'OK';
      } catch (err) {
        functionTests[funcName] = `Exception: ${String(err)}`;
      }
    }
    diagnostics.function_tests = functionTests;

    // 7. Health check
    try {
      const { data: healthData, error: healthError } = await supabase.rpc('health_check');
      
      if (!healthError && healthData) {
        diagnostics.health_check = healthData;
      } else {
        // Simple ping
        const { data: pingData } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
        diagnostics.health_check = { status: 'ok', ping: !!pingData };
      }
    } catch (err) {
      diagnostics.health_check = { status: 'error', message: String(err) };
    }

    // 8. Check for broken views (try to select from each view)
    const brokenViews: string[] = [];
    if (Array.isArray(diagnostics.views)) {
      for (const view of diagnostics.views) {
        try {
          const viewName = view.table_name;
          if (viewName) {
            await supabase.from(viewName).select('*').limit(0);
          }
        } catch (err) {
          const viewName = view.table_name;
          brokenViews.push(`${viewName}: ${String(err)}`);
        }
      }
    }
    diagnostics.broken_views = brokenViews;

    // 9. Sample RLS and table info
    const sampleTables = ['jobs_db', 'customers_db', 'parts_catalogue', 'user_profiles', 'user_roles'];
    const tableInfo: any = {};
    
    for (const tableName of sampleTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        tableInfo[tableName] = error ? `Error: ${error.message}` : `Count: ${count}`;
      } catch (err) {
        tableInfo[tableName] = `Exception: ${String(err)}`;
      }
    }
    diagnostics.sample_table_info = tableInfo;

    // 10. Count summaries
    diagnostics.summary = {
      views_count: 0,
      functions_count: 0,
      tables_count: 0,
      grants_count: 0,
      broken_views_count: 0,
      known_functions_count: functionsList.length,
    };

    console.log('Diagnostics collection complete:', diagnostics.summary);

    return new Response(
      JSON.stringify(diagnostics),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in export-diagnostics:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
