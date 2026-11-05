PREM X JARVIS — PERSONAL PRIVATE VAULT
======================================

Is package mein:
- Crimson Black responsive website UI
- Login + Signup forms
- 6 digit OTP entry interface
- Resend OTP button
- Forgot password flow
- Supabase Auth integration hooks
- Private notes create / edit / delete
- Supabase vault_notes table ke saath integration

IMPORTANT SETUP
1. Extract ZIP.
2. config.js open karo.
3. SUPABASE_URL mein apna Project URL dalo:
   https://YOUR_PROJECT_REF.supabase.co
4. SUPABASE_ANON_KEY mein Supabase ka anon/publicable key dalo.
   Dashboard > Project Settings > API (or API Keys).
5. service_role / secret key kabhi browser mein mat dalna.
6. index.html ko local preview ke liye browser mein kholo, ya static hosting par deploy karo.

OTP IMPORTANT NOTE
Supabase dashboard mein Email OTP length 6 set karna sirf code length set karta hai.
Numeric signup OTP tabhi milega jab Supabase ka Confirm signup email template {{ .Token }} bheje.
Tumhare dashboard par template edit karne ke liye custom SMTP setup prompt aa raha tha.
Isliye live OTP flow ko abhi verified mat samajhna. SMTP/template configuration aur real email test baaki hai.
Agar default template confirmation link bhejta hai, to 6-box OTP UI ke saath woh match nahi karega.

DATABASE
Existing public.vault_notes table aur RLS policies expected:
- id uuid
- user_id uuid references auth.users(id)
- title text
- content text
- created_at timestamptz
- updated_at timestamptz

RLS must stay ON. Policies must restrict every row to auth.uid() = user_id.
This app uses the anon/publishable key only; access is protected by Supabase Auth + RLS.

NOT INCLUDED YET
- File/photo upload storage bucket and storage policies
- Production custom SMTP
- Password reset redirect configuration verification
- Real device/email end-to-end testing
- Deployment/domain setup

Never store highly sensitive identity documents, passwords, banking details, or other secrets in this early version.
