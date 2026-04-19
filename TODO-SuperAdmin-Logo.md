# Super Admin & Logo Changes - TODO

## Plan Steps (Approved)
1. [x] Update src/lib/store.ts: Add customLogo state and setCustomLogo action.
2. [ ] Create src/app/api/admin/logo/route.ts: API for uploading logo.
3. [x] Edit src/components/admin/admin-panel.tsx: 
   - Rename "Admin Panel" to "Super Admin Panel".
   - Dynamic logo src from store.
4. [x] Edit src/components/admin/admin-settings.tsx:
   - Rename "Admin Profile" to "Super Admin Profile", "Administrator" to "Super Administrator".
   - Add Branding section with logo preview/upload.
5. [x] Edit src/components/login.tsx: Dynamic logo src.
6. [x] Edit src/app/layout.tsx: Dynamic favicon icon.
7. [ ] Test: Login as admin, check names, upload logo, verify changes.
8. [ ] Mark complete, optional: update CRM panel logo if needed.

**Progress: 1/8**  
Current step: 3/8
