# PostgREST 504 Emergency Fallback System

## Overview

This system provides automatic fallback to Edge Functions when PostgREST experiences schema cache issues (504 errors).

## How It Works

### 1. Health Monitoring
- **Function**: `api_health_check()` - Lightweight DB ping via REST
- **Frequency**: Every 30 seconds
- **Detection**: 2+ failures within 5 seconds triggers fallback mode

### 2. Automatic Fallback
When PostgREST fails:
- **Mode switches**: REST → Edge Functions
- **Yellow banner appears**: "Fallback mode: using Edge Functions"
- **Data continues flowing**: No downtime for users

### 3. Automatic Recovery
When PostgREST recovers:
- Health check succeeds
- Mode switches back: Edge → REST
- Banner disappears automatically

## Architecture

### REST Mode (Normal)
```
Client → PostgREST → Database
         ↓ 504 error
         Fallback triggered
```

### Edge Mode (Fallback)
```
Client → Edge Function → Database (via service role)
         ↓ Direct SQL
         Bypasses PostgREST
```

## Edge Functions

### `ef_read_jobs_list`
- **Endpoint**: `POST /functions/v1/ef_read_jobs_list`
- **Body**: `{ limit: 50, offset: 0 }`
- **Returns**: Array of job listings with customer info

### `ef_read_job_detail`
- **Endpoint**: `POST /functions/v1/ef_read_job_detail`
- **Body**: `{ id: "<uuid>" }`
- **Returns**: Complete job detail with customer data

## Security

✅ **Safe**: Service role key ONLY used server-side in Edge Functions
✅ **Never exposed**: Client bundle contains only anon key
✅ **Parameterized**: All queries use $1, $2 placeholders (no SQL injection)
✅ **Validated**: Input validation before execution

## Admin Controls

Navigate to: **Admin → Diagnostics → System Health**

### Health Status Chip
- 🟢 **Green "REST Healthy"**: Normal operation
- 🟡 **Yellow "Fallback Mode"**: Using Edge Functions

### Manual Actions
- **Run Health Check**: Force immediate health probe
- **View Logs**: See recent health check results

## Fixing PostgREST

### Option 1: Restart PostgREST (Supabase Dashboard)
1. Go to: https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/settings/database
2. Scroll to "Connection pooler" or "PostgREST"
3. Click "Restart service"

### Option 2: Schema Cache Reload (SQL)
```sql
NOTIFY pgrst, 'reload schema';
```

### Option 3: Wait for Auto-Recovery
- Supabase auto-restarts PostgREST periodically
- Fallback keeps app running until restart completes

## Disabling Fallback (After Recovery)

Once PostgREST is confirmed healthy:

1. The system will automatically switch back to REST mode
2. No manual intervention needed
3. Banner disappears automatically

To force REST mode (not recommended unless testing):
```typescript
import { useHealthStore } from '@/lib/health';
useHealthStore.getState().setApiMode('rest');
```

## Preventing Future Issues

### Safe Schema Practices

✅ **DO**:
- Use `CREATE OR REPLACE` (not `DROP`)
- Fully qualify tables: `public.jobs_db`
- Alias duplicate columns: `j.id AS job_id`
- Set `SECURITY DEFINER` + `SET search_path = public`

❌ **DON'T**:
- Use `DROP VIEW` in production migrations
- Expose multiple `id` columns without aliasing
- Create functions without `SET search_path`
- Use string concatenation in queries

## Monitoring

### Client-Side Logs
```javascript
// Health check results
console.log('✅ API recovered, switching back to REST mode');
console.warn('⚠️ Multiple API failures, switching to Edge Function fallback');
```

### Edge Function Logs
View at: https://supabase.com/dashboard/project/kyiuojjaownbvouffqbm/functions

## Performance

### REST Mode (Normal)
- Latency: ~50-100ms
- Cached by PostgREST
- Optimal performance

### Edge Mode (Fallback)
- Latency: ~200-400ms
- No caching (direct SQL)
- Slightly slower, but reliable

## Troubleshooting

### Yellow banner won't go away
- Check PostgREST status in Supabase dashboard
- Run manual health check in Admin
- Check browser console for errors

### Jobs not loading in fallback mode
- Check Edge Function logs for errors
- Verify service role key is set
- Test Edge Function directly via curl

### Health check keeps failing
- PostgREST may need restart
- Check database connectivity
- View SQL logs in Supabase

## Testing

### Simulate Fallback
```typescript
import { useHealthStore } from '@/lib/health';
useHealthStore.getState().setApiMode('edge-fallback');
```

### Force Health Check
```typescript
import { manualHealthCheck } from '@/lib/health';
await manualHealthCheck();
```

## Support

For issues contact: system admin or check Supabase status page
