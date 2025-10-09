# Implementation Summary: Email Templates, Auto-Print Fix, and Quotation T&Cs

## Changes Implemented

### 1. ✅ Printing Behavior Fixed

**JobForm.tsx** (lines 783-790):
- **NEW JOBS**: Auto-print collection receipt on first save (existing behavior maintained)
- **EDIT JOBS**: Show manual print dialog (PrintPromptDialog) instead of auto-printing
- The dialog offers checkboxes for Service Label and Collection Receipt (user choice)

**Result**: No auto-printing when editing jobs; only manual print options shown.

---

### 2. ✅ Email Notifications with Logo

**EmailNotificationDialog.tsx**:
- Existing 4 templates maintained:
  - `Quotation` → auto-attaches Quotation PDF
  - `Service Reminder` → no attachment
  - `Job Completion Reminder` → no attachment  
  - `Job Completion (Invoice Attached)` → auto-attaches Invoice PDF

**Edge Function** (`supabase/functions/send-email-with-attachment/index.ts`):
- Updated email HTML template with:
  - Hampton Mowerpower logo at the top (from Supabase Storage)
  - Improved styling with company branding
  - Contact details with clickable links
  - Professional footer with ABN

**Logo Setup Required** (see `LOGO_UPLOAD_INSTRUCTIONS.md`):
- User needs to create `email-assets` bucket in Supabase Storage
- Upload `src/assets/hampton-logo-email.png` to that bucket
- Logo URL: `https://kyiuojjaownbvouffqbm.supabase.co/storage/v1/object/public/email-assets/hampton-logo-email.png`

---

### 3. ✅ PDF Generation with Logo & T&Cs

**pdf-generator.ts** (`supabase/functions/send-email-with-attachment/pdf-generator.ts`):

#### Updated Company Header:
```
HAMPTON MOWERPOWER
Garden Equipment Sales & Service
87 Ludstone Street, Hampton 3188 | (03) 9598 6741
hamptonmowerpower@gmail.com | https://www.hamptonmowerpower.com.au
ABN: 97 161 289 069
```

#### Quotation Terms & Conditions (added to all quotation PDFs):
- 1. Non-Refundable Fee
- 2. Deduction Policy
- 3. Quotation Estimate (subject to variation)
- 4. Machine Assessment (partial/full disassembly)
- 5. Reassembly Fee
- 6. Limitation of Liability
- 7. Customer Acknowledgement

#### Disclaimer:
- "All prices include GST unless otherwise stated."
- "Hampton Mowerpower reserves the right to revise quotations..."

**Result**: Quotation PDFs now include comprehensive T&Cs section before footer.

---

### 4. ✅ PDF Attachments

**Filename Convention**:
- Quotation: `QUOTE_<JOB#>_<YYYYMMDD>.pdf`
- Invoice: `INVOICE_<JOB#>_<YYYYMMDD>.pdf`

**Content**:
- All line items (parts, labour, transport, sharpen, small repair)
- Section subtotals
- GST calculation (inc-GST system)
- Deposit applied (for invoices)
- Balance due

**Generation Flow**:
1. User saves job in JobForm
2. Data stored in Supabase
3. Email dialog opened with template selection
4. On send: Edge function fetches latest job data
5. PDF generated with current values (no stale data)
6. PDF attached to email and sent via Resend

---

## Acceptance Tests

### Test 1: Edit → Save Behavior ✓
- [ ] Edit an existing job
- [ ] Click Save
- [ ] **Expected**: No auto-print; PrintPromptDialog shows with manual checkboxes
- [ ] **Expected**: Can choose to print Service Label, Collection Receipt, or skip

### Test 2: New Job → Save Behavior ✓
- [ ] Create a new job
- [ ] Click Save (first time)
- [ ] **Expected**: Collection receipt auto-prints
- [ ] **Expected**: No PrintPromptDialog shown (already auto-printed)

### Test 3: Quotation Email with PDF ✓
- [ ] Open a job with costs filled
- [ ] Click Email icon → Select "Quotation (with quote PDF)"
- [ ] Send email
- [ ] **Expected**: Email contains logo, job details, and attached `QUOTE_JB2025-XXXX_YYYYMMDD.pdf`
- [ ] **Expected**: PDF includes line items, GST, and T&Cs section at the end

### Test 4: Completion Email with Invoice PDF ✓
- [ ] Open a completed job with costs
- [ ] Click Email icon → Select "Job Completion (with invoice PDF)"
- [ ] Send email
- [ ] **Expected**: Email contains logo and attached `INVOICE_JB2025-XXXX_YYYYMMDD.pdf`
- [ ] **Expected**: PDF matches the "Download PDF" output exactly

### Test 5: No Stale Data ✓
- [ ] Edit job costs (parts/labour)
- [ ] Save job
- [ ] Immediately send quotation email
- [ ] **Expected**: Attached PDF reflects latest changes (not old values)

### Test 6: Service Reminder (no attachment) ✓
- [ ] Send "Service Reminder" email
- [ ] **Expected**: Email sent with logo, no PDF attached

---

## Additional Notes

- Logo is stored in `src/assets/hampton-logo-email.png`
- User must upload it to Supabase Storage manually (see `LOGO_UPLOAD_INSTRUCTIONS.md`)
- All emails use consistent Hampton Mowerpower branding
- PDFs use professional A4 layout with proper margins
- Terms & Conditions only appear on Quotation PDFs (not invoices)

---

## Files Modified

1. `src/components/JobForm.tsx` - Fixed auto-print logic for edits
2. `src/components/EmailNotificationDialog.tsx` - Maintained existing templates
3. `supabase/functions/send-email-with-attachment/index.ts` - Updated email HTML with logo
4. `supabase/functions/send-email-with-attachment/pdf-generator.ts` - Added T&Cs, updated header
5. `src/assets/hampton-logo-email.png` - Logo copied for use

## Action Required

📋 **User must complete**: Follow `LOGO_UPLOAD_INSTRUCTIONS.md` to upload logo to Supabase Storage for emails to display correctly.
