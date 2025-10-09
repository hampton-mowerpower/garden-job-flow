# Logo Upload Instructions for Email Notifications

## Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `email-assets`
3. Make it **public** (so email clients can load the image)

## Step 2: Upload the Logo

1. Navigate to the `email-assets` bucket
2. Upload the file `src/assets/hampton-logo-email.png`
3. The file will be accessible at:
   ```
   https://kyiuojjaownbvouffqbm.supabase.co/storage/v1/object/public/email-assets/hampton-logo-email.png
   ```

## Step 3: Set Storage Policies (if needed)

If the image doesn't load in emails, add this policy in Supabase Storage → Policies:

```sql
-- Allow public read access to email assets
CREATE POLICY "Public read access to email-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');
```

## Verification

After uploading, you can test the URL directly in your browser. It should display the logo image.

---

**Note:** The email notification function at `supabase/functions/send-email-with-attachment/index.ts` is already configured to use this URL for the logo.
