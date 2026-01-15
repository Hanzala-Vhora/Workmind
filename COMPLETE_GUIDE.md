# 🚀 WorkMind.ai - Complete Backend Setup Guide

## ✅ What Has Been Completed

### Backend Structure Created
```
server/
├── src/
│   ├── server.ts                    # Express server (port 5000)
│   ├── controllers/
│   │   └── intakeFormController.ts # Intake form logic (CREATE, READ, UPDATE, DELETE, SUBMIT)
│   ├── routes/
│   │   ├── intakeForms.ts          # Intake form endpoints
│   │   ├── workspaces.ts           # Workspace endpoints
│   │   ├── agents.ts               # Agent endpoints
│   │   └── threads.ts              # Thread/chat endpoints
│   └── middleware/                  # (ready for auth, validation, etc.)
├── package.json                     # Dependencies installed ✓
├── tsconfig.json                    # TypeScript configuration
├── .env.local                       # Environment variables (NEEDS DATABASE URL)
├── .env.example                     # Reference template
└── README.md                        # Detailed documentation
```

### Database Models (Prisma + PostgreSQL/Neon)
- ✓ User
- ✓ Workspace
- ✓ **IntakeForm** (Primary focus)
- ✓ WorkspaceIntake
- ✓ Agent
- ✓ Thread
- ✓ Message
- ✓ RepositoryItem

### API Endpoints Ready
```
POST   /api/intake-forms              Create form
GET    /api/intake-forms?workspaceId  List forms
GET    /api/intake-forms/:id          Get form by ID
PUT    /api/intake-forms/:id          Update form
DELETE /api/intake-forms/:id          Delete form
POST   /api/intake-forms/:id/submit   Submit form
```

### Frontend Integration
- ✓ Updated `services/apiClient.ts` with all API methods
- ✓ Created `components/IntakeFormExample.tsx` with full example
- ✓ Ready-to-use React component with validation

### Configuration & Scripts
- ✓ Updated root `package.json` with concurrent dev script
- ✓ `npm run dev:all` runs frontend + backend together
- ✓ Dependencies: `concurrently` installed

### Documentation
- ✓ `BACKEND_SETUP.md` - Quick start guide
- ✓ `SETUP_SUMMARY.md` - Overview of all created files
- ✓ `server/README.md` - Detailed backend documentation
- ✓ `components/IntakeFormExample.tsx` - Full working example

---

## 🎯 Next Steps (DO THIS NOW)

### Step 1: Set Up Neon Database (5 minutes)

1. Go to **https://neon.tech**
2. Sign up (free tier available)
3. Create a new PostgreSQL project
4. Copy your connection string:
   ```
   postgresql://user:password@ep-xxxxx.region.neon.tech/dbname?sslmode=require
   ```

### Step 2: Configure Backend Environment (2 minutes)

1. Open `server/.env.local` in VS Code
2. Replace this line:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/workmind_db
   ```
   With your Neon connection string:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxxxx.region.neon.tech/dbname?sslmode=require
   ```
3. Save the file

### Step 3: Create Database Tables (2 minutes)

In VS Code terminal:
```bash
cd server
npm run prisma:push
```

This creates all 8 tables in your Neon database.

### Step 4: Test Everything (5 minutes)

From root directory:
```bash
npm run dev:all
```

You should see:
```
VITE v6.2.0  ready in 123 ms
➜  Local:   http://localhost:3000
Server running on http://localhost:5000
Environment: development
```

### Step 5: Test API Endpoint

Open browser and go to:
```
http://localhost:5000/health
```

You should see:
```json
{"status":"ok","timestamp":"2026-01-15T..."}
```

---

## 📝 API Usage Examples

### Create Intake Form
```bash
curl -X POST http://localhost:5000/api/intake-forms \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "test-workspace",
    "companyName": "Acme Corp",
    "contactEmail": "contact@acme.com",
    "contactPhone": "+1-555-123-4567",
    "department": "Sales",
    "industry": "Technology",
    "companySize": "50-100",
    "currentState": "We are growing rapidly",
    "mainGoals": ["Increase revenue", "Improve efficiency"],
    "challenges": ["Market competition", "Talent shortage"],
    "resources": "5 team members, $100k budget",
    "timeline": "6 months",
    "budget": "$50,000"
  }'
```

### Get All Forms
```bash
curl "http://localhost:5000/api/intake-forms?workspaceId=test-workspace"
```

### Get Single Form
```bash
curl "http://localhost:5000/api/intake-forms/[FORM_ID]"
```

### Submit Form
```bash
curl -X POST "http://localhost:5000/api/intake-forms/[FORM_ID]/submit"
```

---

## 🔗 Frontend Integration

### Option 1: Use Provided API Client (Recommended)

```typescript
import { apiClient } from '@/services/apiClient';

// Create form
const form = await apiClient.intakeForms.create({
  workspaceId: 'workspace-123',
  companyName: 'Acme Corp',
  contactEmail: 'contact@acme.com',
  department: 'Sales',
  industry: 'Technology',
  companySize: '50-100',
  mainGoals: ['Increase revenue'],
  challenges: ['Competition'],
});

// Get all forms
const forms = await apiClient.intakeForms.getAll('workspace-123');

// Submit form
await apiClient.intakeForms.submit(form.id);
```

### Option 2: Use Example Component

1. Import component:
   ```typescript
   import { IntakeFormExample } from '@/components/IntakeFormExample';
   ```

2. Add to your page:
   ```tsx
   export default function Page() {
     return <IntakeFormExample />;
   }
   ```

3. Component handles everything:
   - Form validation
   - API calls
   - Error handling
   - Success messages

---

## 🗄️ Database Schema Reference

### IntakeForm Model
```prisma
model IntakeForm {
  id            String   @id @default(cuid())
  workspaceId   String   // Link to workspace
  companyName   String   // Company name
  contactEmail  String   // Main contact email
  contactPhone  String?  // Optional phone
  department    String   // Department
  industry      String   // Industry type
  companySize   String   // Number of employees
  currentState  String?  // Current situation
  mainGoals     String[] // Array of goals
  challenges    String[] // Array of challenges
  resources     String?  // Available resources
  timeline      String?  // Project timeline
  budget        String?  // Budget info
  status        String   // "draft" or "submitted"
  createdAt     DateTime
  updatedAt     DateTime
}
```

### Other Models
- **User**: System users (id, email, name, role)
- **Workspace**: User workspaces (id, name, userId)
- **Agent**: AI agents (id, name, role, department_name)
- **Thread**: Chat threads (id, title, agentId, workspaceId)
- **Message**: Chat messages (id, role, content, threadId)
- **RepositoryItem**: Knowledge items (id, title, content, type, pinned)

---

## 🔑 Environment Variables

### `server/.env.local` (Required)
```env
# Database connection string from Neon
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/dbname?sslmode=require

# Server settings
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Optional API keys
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

---

## 🛠️ Available Commands

### Root Directory
```bash
npm run dev          # Frontend only (port 3000)
npm run dev:server   # Backend only (port 5000)
npm run dev:all      # Both frontend + backend ⭐
npm run build        # Build frontend
```

### Server Directory
```bash
cd server
npm run dev                    # Start backend dev server
npm run build                  # Build backend to dist/
npm run start                  # Run built backend
npm run prisma:generate       # Generate Prisma client
npm run prisma:push          # Push schema to database
npm run prisma:migrate       # Create migration
```

---

## ✨ Features Implemented

### Backend
✅ Express.js REST API
✅ Prisma ORM with PostgreSQL (Neon)
✅ CORS configured
✅ Environment variables
✅ Error handling
✅ TypeScript support
✅ 6 API route modules

### Frontend Integration
✅ API client with all methods
✅ Example React component
✅ Form validation
✅ Error handling
✅ Success/loading states

### DevOps
✅ Concurrent dev script
✅ TypeScript compilation
✅ Environment configuration
✅ Database migrations ready

---

## 🚀 Deployment Ready

### Frontend (Vercel Recommended)
```bash
npm run build
# Upload dist/ to Vercel
```

### Backend (Railway/Render Recommended)
```bash
cd server
npm run build
npm start
```

Set environment variables on host platform:
- `DATABASE_URL`: Neon connection string
- `NODE_ENV`: production
- `PORT`: 5000
- `FRONTEND_URL`: Your production frontend URL

---

## 🐛 Common Issues & Fixes

### Issue: Port 5000 Already in Use
**Solution:**
```bash
# PowerShell - Kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Or change port in server/.env.local
PORT=5001
```

### Issue: Database Connection Error
**Solution:**
- Verify `DATABASE_URL` in `server/.env.local`
- Ensure Neon account is active
- Check internet connection (Neon is cloud-based)
- Ensure `?sslmode=require` is in connection string

### Issue: CORS Error in Browser
**Solution:**
- Verify backend is running on `http://localhost:5000`
- Check `FRONTEND_URL` in `server/.env.local` matches frontend URL
- Restart both frontend and backend

### Issue: Prisma Client Errors
**Solution:**
```bash
cd server
npm run prisma:generate
# Clear node_modules if needed
rm -r node_modules package-lock.json
npm install
```

---

## 📚 File Locations

**Backend Source:**
- [server/src/server.ts](server/src/server.ts) - Express app
- [server/src/controllers/intakeFormController.ts](server/src/controllers/intakeFormController.ts) - Form logic
- [server/src/routes/intakeForms.ts](server/src/routes/intakeForms.ts) - Form endpoints

**Database:**
- [prisma/schema.prisma](prisma/schema.prisma) - All models

**Frontend Integration:**
- [services/apiClient.ts](services/apiClient.ts) - API methods
- [components/IntakeFormExample.tsx](components/IntakeFormExample.tsx) - Example component

**Documentation:**
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Quick start
- [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - Overview
- [server/README.md](server/README.md) - Detailed guide

---

## ✅ Checklist

- [ ] Set up Neon database account
- [ ] Copy Neon connection string
- [ ] Update `server/.env.local` with DATABASE_URL
- [ ] Run `npm run prisma:push` (creates tables)
- [ ] Run `npm run dev:all` (start both)
- [ ] Test `http://localhost:5000/health`
- [ ] Test API endpoints with curl or Postman
- [ ] Update frontend components to use API
- [ ] Test form submission end-to-end
- [ ] Check data in Neon dashboard

---

## 🎓 Learning Resources

- Express.js: https://expressjs.com
- Prisma: https://www.prisma.io/docs
- Neon PostgreSQL: https://neon.tech/docs
- TypeScript: https://www.typescriptlang.org/docs
- React: https://react.dev

---

## 📞 Support

If you encounter issues:
1. Check the logs in terminal
2. Verify environment variables
3. Test API with curl: `curl http://localhost:5000/health`
4. Check Neon dashboard connection
5. See detailed logs in `server/README.md`

---

**Last Updated:** January 15, 2026  
**Status:** ✅ Ready to Use  
**Node Version:** v24.5.0  
**npm Version:** 11.5.2
