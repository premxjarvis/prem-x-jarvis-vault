PREM X JARVIS — ULTIMATE PRIVATE VAULT (Upgrade package)

FILES
- index.html
- style.css
- app.js
- config.js
- setup.sql

INSTALL
1. Back up your current GitHub repository first.
2. Replace index.html, style.css and app.js with these upgraded files.
3. Keep your existing config.js values. The uploaded config.js contained placeholders, so if that is also what is in GitHub, add:
   - Supabase Project URL
   - Supabase anon/publishable key
   Never use service_role or secret keys in browser JavaScript.
4. In Supabase SQL Editor, run setup.sql.
5. Deploy to GitHub Pages and test login, old notes, new items, file uploads and recycle bin.

IMPORTANT
- Existing vault_notes table and old Notes are not deleted. This version adds a separate vault_items table for the new modules.
- Run setup.sql before using the new dashboard modules.
- RLS stays enabled. The Storage bucket is private and files are scoped to each user's UID.
- Password Vault entries are encrypted in the browser using AES-GCM + PBKDF2. The passphrase is not stored. Forgetting it means the saved secret cannot be recovered.
- Auto-lock is a basic screen overlay, not a cryptographic lock.
- Calculator is only a visual calculator utility, not a stealth feature.
- Biometric unlock and full remote device/session manager are displayed as not configured; they require extra WebAuthn/backend setup.
- This is a starter implementation. Test with non-sensitive sample data first. Do not store banking credentials or highly sensitive information until you have independently tested security and recovery.
