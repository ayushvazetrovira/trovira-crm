# Super Admin Global Search Fix

## Plan Steps
- [x] 1. src/app/api/admin/search/route.ts: Add Payments search (company.name, id, amount)
- [x] 2. src/components/admin/admin-panel.tsx: Add dropdown/sheet for searchResults (list by category → navigate/clear)
- [x] 3. Test all sections (Clients, Subs, Plans, Payments, Support) → navigate
- [x] 4. Mark complete

**Status**: Complete - search now shows dropdown with navigate! **Test it**.

**Notes**: Debounce, max 10 results total.

