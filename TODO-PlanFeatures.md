# Add Features Editing to Admin Plans Page

## Plan Steps
- [x] 1. Update prisma/schema.prisma: Add `features String? @db.Text` to Plan model
- [x] 2. Update src/app/api/admin/plans/route.ts: Include `features` in select
- [x] 3. Update src/app/api/admin/plans/[id]/route.ts: Handle `features` in PUT
- [x] 4. Update src/components/admin/admin-plans.tsx: Frontend integration (load/parse/save/display features)
- [ ] 5. Run migration: `npx prisma migrate dev --name add_plan_features`
- [ ] 6. Run `npx prisma generate`
- [ ] 7. Test edit/save/reload features in admin plans page
- [ ] 8. Mark complete

**Instructions**: Follow steps sequentially, update this file after each completed step by editing checkmarks and notes.

