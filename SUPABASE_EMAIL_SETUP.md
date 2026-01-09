# Supabase Email Verification Setup Guide

## ⚠️ IMPORTANT: Email Verification Not Working?

Follow these steps to fix email verification in Supabase:

---

## Step 1: Enable Email Confirmations

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Click on **Email** provider
5. Make sure these settings are configured:

```
✅ Enable Email provider: ON
✅ Confirm email: ON (CRITICAL - emails won't send if OFF)
✅ Secure email change: ON (recommended)
```

6. Click **Save**

---

## Step 2: Configure URL Settings

1. Go to **Authentication** → **URL Configuration**
2. Set these URLs:

```
Site URL: https://toolglid.com

Additional Redirect URLs:
https://toolglid.com
https://toolglid.com/
http://localhost:3000
http://localhost:3000/
```

3. Click **Save**

---

## Step 3: Check Email Templates

1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup**
3. Verify the template looks like this:

**Subject:**
```
Confirm your signup
```

**Message Body:**
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

4. Make sure `{{ .ConfirmationURL }}` is present in the template
5. Click **Save**

---

## Step 4: Configure SMTP (Optional but Recommended)

If emails still don't send, set up custom SMTP:

### Option A: Gmail SMTP (Free)

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Enable Custom SMTP**
3. Configure:

```
Sender email: your-email@gmail.com
Sender name: ToolGlid
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [Gmail App Password]
```

4. **Create Gmail App Password:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification if not enabled
   - Go to "App passwords"
   - Generate password for "Mail"
   - Copy and paste into Supabase

### Option B: SendGrid (Professional - Recommended)

1. Create account at https://sendgrid.com (free tier: 100 emails/day)
2. Get API key from SendGrid dashboard
3. Configure in Supabase:

```
Sender email: noreply@toolglid.com
Sender name: ToolGlid
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
```

---

## Step 5: Test Email Sending

1. **Delete existing test user** from Supabase:
   - Go to **Authentication** → **Users**
   - Find your test email
   - Click "..." → **Delete User**

2. **Try signup again** on toolglid.com:
   - Use a fresh email (or the one you just deleted)
   - Fill in the signup form
   - Click "Create Account"

3. **Check for email:**
   - Check inbox
   - Check spam/junk folder
   - Check promotions tab (Gmail)
   - Wait 5-10 minutes

4. **Check Supabase Logs:**
   - Go to **Logs** → **Authentication logs**
   - Look for signup events
   - Check for email sending errors

---

## Step 6: Verify Database Trigger

Check if the database trigger is working:

1. Go to **Database** → **Functions**
2. Look for `handle_new_user` function
3. If it doesn't exist, run this SQL:

```sql
-- Function to create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Troubleshooting Checklist

- [ ] "Confirm email" is **ENABLED** in Email provider settings
- [ ] Site URL is set to `https://toolglid.com`
- [ ] Redirect URLs include toolglid.com
- [ ] Email template contains `{{ .ConfirmationURL }}`
- [ ] SMTP is configured (if using custom email)
- [ ] Test user was deleted before retrying
- [ ] Checked spam folder
- [ ] Waited at least 5-10 minutes for email
- [ ] Checked Supabase auth logs for errors
- [ ] Database trigger `handle_new_user` exists

---

## Common Issues & Solutions

### Issue: "Email already registered" but user can't login
**Solution:** User exists but email not confirmed. Delete user and have them sign up again.

### Issue: No email received after 10+ minutes
**Solution:** 
1. Check if "Confirm email" is ON in Email provider settings
2. Set up custom SMTP (Gmail or SendGrid)
3. Check Supabase logs for email errors

### Issue: Email goes to spam
**Solution:** 
1. Use custom SMTP with verified domain
2. Add SPF and DKIM records to your domain
3. Use professional email service (SendGrid)

### Issue: "Rate limit exceeded"
**Solution:** Wait 1 hour before trying again, or use different email

---

## Need Help?

If emails still don't work after following all steps:

1. Check Supabase Logs (Dashboard → Logs → Authentication)
2. Contact Supabase support
3. Use SendGrid custom SMTP (most reliable)

---

**Last Updated:** January 10, 2026
