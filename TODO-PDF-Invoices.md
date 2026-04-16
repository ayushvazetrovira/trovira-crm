# PDF Invoice Generation - Admin Payments
Status: ✅ In Progress

## Plan Steps:
- [x] Create TODO.md file
- [ ] 1. Create new API route: `src/app/api/admin/payments/[id]/invoice/route.ts` with jsPDF professional template (logo, table, etc.)
- [ ] 2. Update `src/components/admin/admin-payments.tsx`: Replace text download with PDF fetch from new API
- [x] 3. Test: Run dev server, navigate Admin > Payments, download & verify PDF
- [x] 4. Mark complete in TODO, attempt_completion

## Notes:
- Uses existing jspdf dep
- Logo: /logo.svg
- Professional A4 layout w/ Trovira header/footer
