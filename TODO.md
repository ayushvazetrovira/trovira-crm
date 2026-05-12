# TODO - Fix login + dashboard errors

## Plan
1. Verify current failing auth path
   - Confirm `/api/auth/login` returns `{ error: "Invalid credentials" }` unless request matches hardcoded credentials.
2. Fix dashboard loading dependency on auth
   - Ensure successful login returns the `user` object with required fields (at least `role`, and for CRM dashboards `companyId` if needed).
3. Fix DB/dashboard API failures
   - If `/api/admin/dashboard` or `/api/crm/dashboard` is failing due to missing DB tables/seed data, add safe fallbacks or ensure seed runs.
4. Add targeted error messages
   - Update frontend fetch handling so dashboard failures show actual backend error payload (not just “Failed to load dashboard”).
5. Re-run dev server
   - Start Next.js, then verify admin login flow and both dashboards.

