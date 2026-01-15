# 🚀 Quick Commands Reference

## Start Application

### Option 1: Both Servers Together (Recommended)
```bash
npm run dev:all
```
✅ Starts frontend on port 3000
✅ Starts backend on port 5000
✅ Both run concurrently

### Option 2: Run Separately
```bash
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: Frontend (in root)
npm install
npm run dev
```

### Option 3: Using PowerShell Script
```bash
.\QUICK_START.ps1
```

---

## Verify Everything Works

### Check Backend Health
```bash
curl http://localhost:5000/health
# Response: { "status": "ok" }
```

### Check API Endpoint
```bash
curl http://localhost:5000/api/intake-forms?workspaceId=test
# Response: [] (empty array)
```

### Check Frontend
```
Open browser: http://localhost:3000
```

---

## Database Operations

### Check Database Connection
```bash
cd server
npm run prisma:status
```

### View Database in Neon Console
```
1. Go to: https://console.neon.tech
2. Select your project
3. Open SQL Editor
4. Run: SELECT * FROM "IntakeForm";
```

### Connect with psql
```bash
psql "postgresql://neondb_owner:npg_zhBMFLHWq78f@...neon.tech/neondb"

# Then query:
SELECT COUNT(*) FROM "IntakeForm";
SELECT * FROM "IntakeForm" LIMIT 5;
```

---

## Testing

### Manual API Test - Create Form
```bash
curl -X POST http://localhost:5000/api/intake-forms \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "test-1",
    "companyName": "Test Company",
    "contactEmail": "test@example.com",
    "department": "Sales",
    "industry": "Tech",
    "companySize": "50-100",
    "timeline": "1-3 months"
  }'
```

### Manual API Test - Get Forms
```bash
curl http://localhost:5000/api/intake-forms?workspaceId=test-1
```

### Browser Testing
1. Go to http://localhost:3000
2. Click "Get Started"
3. Fill all 6 steps of form
4. Click "Deploy Workmind OS"
5. Verify success message
6. See form in dashboard

---

## Build & Deployment

### Build Frontend
```bash
npm run build
# Creates dist/ directory
```

### Build Backend
```bash
cd server
npm run build
# Creates dist/ directory
```

### Deploy Frontend
```bash
# To Vercel (recommended)
npm install -g vercel
vercel

# Or build and deploy manually
npm run build
# Upload dist/ folder to hosting
```

### Deploy Backend
```bash
# To Render.com (example)
# Create account, connect repo, add env var: DATABASE_URL
# Deploy with git push

# Or to Railway
# vercel/railway integration available
```

---

## Development Commands

### Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### Development Mode
```bash
# Frontend (with hot reload)
npm run dev

# Backend (with auto-restart)
cd server && npm run dev
```

### Production Build
```bash
# Frontend
npm run build

# Backend
cd server && npm run build
```

### Lint Code
```bash
# Frontend
npm run lint

# Backend
cd server && npm run lint
```

### Type Check
```bash
# Frontend
npm run type-check

# Backend
cd server && npm run type-check
```

---

## Database Commands

### Prisma Status
```bash
cd server
npm run prisma:status
```

### Push Schema to Database
```bash
cd server
npm run prisma:push
```

### Generate Prisma Client
```bash
cd server
npm run prisma:generate
```

### Reset Database (WARNING: Deletes all data)
```bash
cd server
npm run prisma:reset
```

### Seed Database
```bash
cd server
npm run prisma:seed
```

### Studio (Visual Database Browser)
```bash
cd server
npm run prisma:studio
# Opens http://localhost:5555
```

---

## Code Quality

### Format Code
```bash
# Frontend
npm run format

# Backend
cd server && npm run format
```

### Type Check
```bash
# Frontend
npm run type-check

# Backend
cd server && npm run type-check
```

---

## Troubleshooting Commands

### Clear Node Modules & Reinstall
```bash
# Frontend
rm -r node_modules package-lock.json
npm install

# Backend
cd server
rm -r node_modules package-lock.json
npm install
```

### Kill Process on Port
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Check Ports in Use
```bash
# Windows PowerShell
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :3000
lsof -i :5000
```

### View Logs
```bash
# Backend logs
cd server && npm run dev
# Logs appear in terminal

# Frontend logs
npm run dev
# Logs appear in terminal
```

---

## Environment Setup

### Set Environment Variable (PowerShell)
```bash
$env:DATABASE_URL='postgresql://...'
```

### Set Environment Variable (Bash/Linux)
```bash
export DATABASE_URL='postgresql://...'
```

### Verify Environment Variable
```bash
# PowerShell
echo $env:DATABASE_URL

# Bash
echo $DATABASE_URL
```

---

## Common Workflows

### Complete Flow: Submit Form
```bash
# 1. Ensure both servers running
npm run dev:all

# 2. Go to http://localhost:3000
# 3. Click "Get Started"
# 4. Fill all form steps
# 5. Click "Deploy Workmind OS"
# 6. See success message
# 7. View form in dashboard
```

### Complete Flow: Check Database
```bash
# 1. Servers running
npm run dev:all

# 2. Submit a form via UI

# 3. Check in Neon Console:
https://console.neon.tech

# 4. Or check with curl:
curl http://localhost:5000/api/intake-forms?workspaceId=test
```

### Complete Flow: Add New Feature
```bash
# 1. Create component in components/
# 2. Add method in services/apiClient.ts
# 3. Add route in server/src/routes/
# 4. Add controller in server/src/controllers/
# 5. Add model in prisma/schema.prisma
# 6. Test in browser
```

---

## Useful Links

### Local Services
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Backend Health: http://localhost:5000/health
- Prisma Studio: http://localhost:5555

### Cloud Services
- Neon Console: https://console.neon.tech
- Neon Database: https://neon.tech

### Documentation
- QUICK_START.ps1 - Automated startup
- FRONTEND_INTEGRATION_GUIDE.md - Integration details
- COMPLETE_TESTING_GUIDE.md - Testing procedures
- SYSTEM_DIAGRAM.md - Architecture diagrams

---

## File Locations

### Key Frontend Files
- Components: `components/`
- API Client: `services/apiClient.ts`
- App Entry: `index.tsx`
- Styles: `index.css`

### Key Backend Files
- Server Setup: `server/src/server.ts`
- Routes: `server/src/routes/intakeForms.ts`
- Controllers: `server/src/controllers/intakeFormController.ts`
- Database URL: `server/.env.local`

### Database Files
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`

---

## Quick Reference: npm Scripts

```bash
# Frontend (root directory)
npm run dev              # Start dev server (3000)
npm run build            # Build for production
npm run preview          # Preview production build
npm run type-check       # Check TypeScript
npm run format           # Format code
npm run dev:all          # Start frontend + backend

# Backend (server/ directory)
npm run dev              # Start dev server (5000)
npm run build            # Build for production
npm run start            # Start production
npm run prisma:status    # Check DB connection
npm run prisma:push      # Sync schema to DB
npm run prisma:studio    # Open Prisma Studio
npm run prisma:generate  # Generate Prisma client
npm run type-check       # Check TypeScript
npm run format           # Format code
```

---

## Troubleshooting Quick Fixes

### Frontend Won't Load
```bash
# Clear cache and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Backend Won't Start
```bash
cd server
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Database Connection Failed
```bash
# Verify .env.local exists and has DATABASE_URL
cat server/.env.local

# Test connection
cd server
npm run prisma:status
```

### Port Already in Use
```bash
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

---

## Notes

- ✅ Both servers must run for full functionality
- ✅ Database URL must be in `server/.env.local`
- ✅ Prisma Client is auto-generated on first run
- ✅ Hot reload enabled in dev mode
- ✅ All data persists in Neon PostgreSQL

---

**TL;DR - Start Here:**
```bash
npm run dev:all
# Then go to http://localhost:3000
```
