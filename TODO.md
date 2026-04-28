# WhatsApp Web Integration TODO

## Approved Plan Steps

### 1. Install Dependencies ✅
- `bun add whatsapp-web.js qrcode-terminal puppeteer`

### 2. Update Prisma Schema ✅
- Add `whatsappSession String?` to `CrmSetting` model
- Run `npx prisma migrate dev --name whatsapp-session`
- `npx prisma generate`

### 3. Create WhatsApp Client Manager ⏳
- `src/lib/whatsapp.ts` - Multi-company client manager
- `src/lib/whatsapp.ts` - Multi-company client manager

### 4. Update CRM Settings
- Edit `src/components/crm/crm-settings.tsx` - Add connect button/QR modal

### 5. New API Routes
- `src/app/api/crm/whatsapp/connect/route.ts` - QR generation
- `src/app/api/crm/whatsapp/websocket/route.ts` - Real-time WS

### 6. Update Inbox API
- Edit `src/app/api/crm/whatsapp/route.ts` - Real client integration

### 7. Update WhatsApp UI
- Edit `src/components/crm/crm-whatsapp.tsx` - WS connection, real-time

### 8. Test
- Setup phone in settings → scan QR
- Send/receive in inbox
- Multi-company isolation

**Next Step: Install dependencies and update schema.**

