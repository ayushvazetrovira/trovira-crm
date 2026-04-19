# Team Member Login Implementation

## Steps:
- [x] 1. Update store.ts UserRole add 'team_*' or use string.
- [x] 2. Edit /api/crm/team/route.ts POST: set role body.role (team_agent default).
- [x] 3. Edit /api/auth/login/route.ts: if role.startsWith('team_') add isTeamMember: true.
- [x] 4. Edit crm-team.tsx: Select roles → team_agent, team_manager, team_admin.
- [x] 5. Edit crm-panel.tsx: hide team section if isTeamMember.
- [x] 6. Test: client add member, team login with creds, hide team.
- [x] Complete
