# Dashboard Clients Filter

## Plan Steps
- [x] 1. src/lib/store.ts: Add clientFilter: 'all' | 'active' | 'inactive', setClientFilter
- [x] 2. src/app/api/admin/clients/route.ts: ?status=active → where status 'active', =inactive → ['inactive','suspended']
- [x] 3. src/components/admin/admin-clients.tsx: Use store clientFilter in fetch URL ?status=${clientFilter || ''}
- [ ] 4. src/components/admin/admin-dashboard.tsx: Active onClick setClientFilter('active'), Inactive 'inactive'
- [ ] 5. Test filtering
- [ ] 6. Complete


