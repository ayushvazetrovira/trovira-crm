# Bulk Team Member Excel Import

## Steps:
- [✅] 1. Install xlsx: `npm i xlsx @types/xlsx` ✅
- [✅] 2. Edit src/components/crm/crm-team.tsx: Remove role dropdown, created excel-upload-dialog.tsx, added button+state+logic ✅ (fixed minor TS)
- [✅] 3. Edit src/app/api/crm/team/route.ts: Handle POST bulk array (fixed TS types)
- [✅] 4. Test: Upload Excel → bulk create Team Member 1..N, no dups, validation

**✅ Feature complete!**

Test:
1. Create Excel: Row1: name|Email|password
2. Rows: Mt|test1@test.com|pass123 → Team Member 1|test1@test.com|pass123
3. Empty name|test2@test.com|pass → Team Member 2
4. Invalid email → error badge, skipped
5. Upload → success toast, members in list (role team_agent)

Single Add: No role dropdown anymore (fixed agent).

Delete TODO when verified.

**Status:** ✅ Done
