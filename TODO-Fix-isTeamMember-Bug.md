# Fixing isTeamMember ReferenceError

## Steps:
- [x] 1. Edit src/components/crm/crm-panel.tsx: Add `const { isTeamMember } = useAppStore();` inside SidebarContent function (after props destructuring).
- [x] 2. Test CRM panel - error should be gone, Team menu conditional works.
- [x] 3. Complete task.

Status: Starting edits...

