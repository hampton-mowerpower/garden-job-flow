# Direct API Test Instructions

## Purpose
Test the Supabase REST API directly to diagnose connection issues.

## Prerequisites
1. Open your app in the browser
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Paste and run the tests below

## Test Scripts

Replace the following before running:
- `YOUR_SUPABASE_URL` → https://kyiuojjaownbvouffqbm.supabase.co
- `YOUR_ANON_KEY` → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aXVvamphb3duYnZvdWZmcWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAzNjEsImV4cCI6MjA3NDYzNjM2MX0.tGvHE0nlI9CM7Lf2U1uAvtZtilgvegsRruax4NBSHno

### Test 1: Can we reach the API?
```javascript
fetch('https://kyiuojjaownbvouffqbm.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aXVvamphb3duYnZvdWZmcWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAzNjEsImV4cCI6MjA3NDYzNjM2MX0.tGvHE0nlI9CM7Lf2U1uAvtZtilgvegsRruax4NBSHno'
  }
})
.then(r => r.json())
.then(result => console.log('✓ API reachable:', result))
.catch(err => console.error('✗ API unreachable:', err));
```

### Test 2: Can we read jobs?
```javascript
fetch('https://kyiuojjaownbvouffqbm.supabase.co/rest/v1/jobs_db?select=id,job_number&limit=5', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aXVvamphb3duYnZvdWZmcWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAzNjEsImV4cCI6MjA3NDYzNjM2MX0.tGvHE0nlI9CM7Lf2U1uAvtZtilgvegsRruax4NBSHno',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aXVvamphb3duYnZvdWZmcWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAzNjEsImV4cCI6MjA3NDYzNjM2MX0.tGvHE0nlI9CM7Lf2U1uAvtZtilgvegsRruax4NBSHno'
  }
})
.then(r => r.json())
.then(result => console.log('✓ Jobs query:', result))
.catch(err => console.error('✗ Jobs query failed:', err));
```

### Test 3: Can we read customers?
```javascript
fetch('https://kyiuojjaownbvouffqbm.supabase.co/rest/v1/customers_db?select=id,name&limit=5', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aXVvamphb3duYnZvdWZmcWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAzNjEsImV4cCI6MjA3NDYzNjM2MX0.tGvHE0nlI9CM7Lf2U1uAvtZtilgvegsRruax4NBSHno',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aXVvamphb3duYnZvdWZmcWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAzNjEsImV4cCI6MjA3NDYzNjM2MX0.tGvHE0nlI9CM7Lf2U1uAvtZtilgvegsRruax4NBSHno'
  }
})
.then(r => r.json())
.then(result => console.log('✓ Customers query:', result))
.catch(err => console.error('✗ Customers query failed:', err));
```

## Expected Results

### ✅ All tests pass
- Test 1 returns: API info or empty object
- Test 2 returns: Array of jobs with id and job_number
- Test 3 returns: Array of customers with id and name
- **Action**: Proceed to Phase 4 UI testing

### ❌ Test 1 fails with PGRST002
```
{
  "code": "PGRST002",
  "message": "Could not query the database for the schema cache"
}
```
- **Root Cause**: PostgREST service needs restart
- **Action**: Contact Supabase support to restart PostgREST
- **DO NOT PROCEED** - This is a service-level issue

### ❌ Test 2 or 3 fails with 42501
```
{
  "code": "42501",
  "message": "permission denied for table jobs_db"
}
```
- **Root Cause**: Missing database permissions
- **Action**: Run DATABASE_CLEANUP_FINAL.sql in Supabase SQL Editor
- Wait 30 seconds and re-test

## Documenting Results

After running all 3 tests, document in SYSTEM_TEST_RESULTS.md:

```
## Phase 3: Direct API Tests

Test 1 (API Reachable): [ PASS / FAIL ]
- Result: [paste console output]

Test 2 (Jobs Query): [ PASS / FAIL ]
- Result: [paste console output]

Test 3 (Customers Query): [ PASS / FAIL ]
- Result: [paste console output]

Overall Status: [ READY FOR UI TESTING / BLOCKED - SEE BELOW ]

Blocker Details (if any):
[Describe the exact error and what needs to happen next]
```
