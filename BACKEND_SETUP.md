# WorkMind.ai - Quick Start Guide

## Project Structure

```
workmind.ai/
├── app/                          # Frontend (Next.js/React)
│   ├── api/                      # Next.js API routes
│   ├── agents/
│   ├── onboarding/
│   └── repository/
├── components/                   # React components
├── server/                       # Node.js/Express backend (NEW)
│   ├── src/
│   │   ├── server.ts            # Express app
│   │   ├── controllers/         # API logic
│   │   │   └── intakeFormController.ts
│   │   └── routes/              # API routes
│   │       ├── intakeForms.ts
│   │       ├── workspaces.ts
│   │       ├── agents.ts
│   │       └── threads.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.local               # Backend environment variables
│   └── README.md
├── prisma/                       # Database schema
│   └── schema.prisma            # Updated with all models
├── package.json                  # Root scripts for concurrent dev
└── ...
```

## Initial Setup (First Time)

### 1. Clone/Extract Project
```bash
cd workmind.ai
```

### 2. Set Up Neon Database

1. Sign up at https://neon.tech (free tier available)
2. Create a new PostgreSQL project
3. Copy your connection string from the Neon dashboard

### 3. Configure Backend

```bash
cd server
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Neon connection string
# DATABASE_URL=postgresql://user:pass@ep-xxxxx.neon.tech/dbname?sslmode=require
```

### 4. Set Up Database Tables

```bash
cd server
npm run prisma:push
```

This creates all tables in your Neon database based on `prisma/schema.prisma`

### 5. Install Root Dependencies

```bash
cd ..
npm install
```

## Running the Application

### Option 1: Run Both Frontend & Backend Concurrently (RECOMMENDED)
```bash
npm run dev:all
```

This starts:
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:5000 (Express server)

### Option 2: Run Separately
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run dev:server
```

### Option 3: Backend Only
```bash
cd server
npm run dev
```

## API Endpoints Reference

### Intake Forms (Primary Feature)
```
POST   /api/intake-forms              Create new form
GET    /api/intake-forms?workspaceId  Get all forms
GET    /api/intake-forms/:id          Get single form
PUT    /api/intake-forms/:id          Update form
DELETE /api/intake-forms/:id          Delete form
POST   /api/intake-forms/:id/submit   Submit form
```

### Example: Create Intake Form
```bash
curl -X POST http://localhost:5000/api/intake-forms \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace-123",
    "companyName": "Acme Corp",
    "contactEmail": "contact@acme.com",
    "department": "Sales",
    "industry": "Technology",
    "companySize": "50-100",
    "mainGoals": ["Increase revenue"],
    "challenges": ["Competition"],
    "timeline": "6 months",
    "budget": "$50,000"
  }'
```

## Frontend Integration

Update your React components to call the backend API:

```typescript
// Example: Create intake form from frontend
async function submitIntakeForm(formData: any) {
  const response = await fetch('http://localhost:5000/api/intake-forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      workspaceId: currentWorkspaceId
    })
  });
  const result = await response.json();
  return result;
}
```

## Database Schema Overview

| Model | Purpose |
|-------|---------|
| User | System users |
| Workspace | User workspaces |
| IntakeForm | **Primary - Intake form submissions** |
| WorkspaceIntake | Workspace intake settings |
| Agent | AI agents |
| Thread | Chat threads |
| Message | Chat messages |
| RepositoryItem | Knowledge items |

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Or use a different port in server/.env.local
PORT=5001
```

### Database Connection Error
- Verify DATABASE_URL in `server/.env.local`
- Ensure you have internet connection (Neon is cloud-based)
- Check that SSL mode is set: `?sslmode=require`

### Prisma Client Errors
```bash
cd server
npm run prisma:generate
```

### CORS Errors
- Ensure backend is running on http://localhost:5000
- Check FRONTEND_URL in server/.env.local matches your frontend URL

## Environment Variables

### Root (Frontend)
Created automatically by Vite from `.env` files

### Server (Backend) - `server/.env.local`
```
DATABASE_URL=                # Neon PostgreSQL connection string
PORT=5000                    # Backend port
NODE_ENV=development         # Environment
FRONTEND_URL=http://localhost:3000  # For CORS
```

## Build & Deployment

### Development
```bash
npm run dev:all              # Run everything locally
```

### Production Build
```bash
npm run build                # Build frontend
cd server && npm run build   # Build backend
```

### Deploy Frontend
- Vercel (recommended)
- Netlify
- Any static host

### Deploy Backend
- Railway
- Render
- Heroku
- AWS Lambda

## Key Features Implemented

✅ Express.js backend server
✅ Prisma ORM with PostgreSQL (Neon)
✅ Intake form API endpoints (CRUD)
✅ Database models for workspaces, agents, threads
✅ CORS configuration for frontend
✅ TypeScript support
✅ Concurrent dev script
✅ Environment configuration
✅ API documentation

## Next Steps

1. **Connect Frontend to Backend**
   - Update React components to use `/api` endpoints
   - Replace any mock data with real API calls

2. **Authentication**
   - Add JWT or session-based auth middleware
   - Integrate with existing auth system

3. **Validation**
   - Add input validation middleware
   - Implement error handling

4. **Logging**
   - Set up structured logging
   - Add monitoring/alerting

5. **Testing**
   - Add unit tests for controllers
   - Add integration tests for API

## Support

For issues:
1. Check server logs: `npm run dev:server`
2. Check frontend console: `npm run dev`
3. Verify database connection: Check Neon dashboard
4. See `server/README.md` for detailed setup

---

**Last Updated**: January 15, 2026
