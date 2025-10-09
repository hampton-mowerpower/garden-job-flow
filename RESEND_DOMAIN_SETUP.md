# Resend Domain Verification Required

## Current Issue
You cannot send emails to customers because Resend requires domain verification. Currently, you can only send test emails to yourself (fonzren@gmail.com).

## Steps to Fix

### 1. Verify Your Domain in Resend

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `hamptonmowerpower.com.au`
4. Resend will provide DNS records (TXT, MX, CNAME)

### 2. Update Your Domain's DNS Records

Add the DNS records provided by Resend to your domain registrar (where you manage hamptonmowerpower.com.au):

**Required Records:**
- **SPF (TXT)**: Allows Resend to send on your behalf
- **DKIM (TXT)**: Verifies email authenticity
- **MX Record**: For bounce handling (optional but recommended)

**Example (your exact values will be in Resend dashboard):**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT  
Name: resend._domainkey
Value: [provided by Resend - long DKIM key]

Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10
```

### 3. Wait for Verification

- DNS propagation can take 1-72 hours (usually within 15 minutes)
- Resend will automatically verify once DNS is updated
- You'll receive a confirmation email when verified

### 4. Update the Edge Function

Once verified, update `supabase/functions/send-email-with-attachment/index.ts` line 162:

**Change from:**
```typescript
from: 'Hampton Mowerpower <onboarding@resend.dev>',
```

**Change to:**
```typescript
from: 'Hampton Mowerpower <noreply@hamptonmowerpower.com.au>',
```

### 5. Alternative: Use a Subdomain

If you don't want to verify the main domain, you can use a subdomain:
- Domain: `mail.hamptonmowerpower.com.au`
- Email: `noreply@mail.hamptonmowerpower.com.au`

## Testing During Setup

While waiting for verification, you can test by:
1. Sending emails to `fonzren@gmail.com` (your Resend account email)
2. Using Resend's test email feature in their dashboard

## Troubleshooting

**DNS Not Updating?**
- Check your domain registrar's DNS management panel
- Some registrars have a 24-hour TTL (time to live)
- Use https://dnschecker.org to verify DNS propagation

**Still Getting 403 Error?**
- Ensure domain shows "Verified" in Resend dashboard
- Check that the `from` address uses your verified domain
- Clear browser cache and test again

**Need Help?**
- Resend Support: https://resend.com/support
- DNS Checker: https://dnschecker.org
- SPF Record Checker: https://mxtoolbox.com/spf.aspx

---

**Important:** You must complete domain verification before emails will work for customer addresses. This is a Resend security requirement.
