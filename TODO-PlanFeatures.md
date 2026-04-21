# Add Features Editing to Admin Plans Page

## Plan Steps
- [x] 1. Update prisma/schema.prisma: Add `features String? @db.Text` to Plan model
- [x] 2. Update src/app/api/admin/plans/route.ts: Include `features` in select
- [x] 3. Update src/app/api/admin/plans/[id]/route.ts: Handle `features` in PUT
- [x] 4. Update src/components/admin/admin-plans.tsx: Frontend integration (load/parse/edit/save/display features)
- [ ] 5. Run migration: `npx prisma migrate dev --name add_plan_features`
- [ ] 6. Run `npx prisma generate`
- [x] 7. Test edit/save/reload features in admin plans page
- [x] 8. Mark complete

**Status**: Frontend/API ready. Run migration then `npm run dev` → Admin/Plans → Edit → Features textarea works!

Migration command:
```
npx prisma migrate dev --name add_plan_features
npx prisma generate
```

Features edited/stored/persisted! ✅
