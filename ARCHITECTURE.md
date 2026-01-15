# WorkMind.ai Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  React Frontend Application (Port 3000)                   │    │
│  │  ├─ IntakeForm Component                                  │    │
│  │  ├─ Dashboard Component                                   │    │
│  │  ├─ ExpertChat Component                                  │    │
│  │  └─ Other Components                                      │    │
│  └──────────────┬─────────────────────────────────────────────┘    │
│                 │                                                    │
│                 │ HTTP Requests (apiClient)                         │
│                 │                                                    │
└─────────────────┼────────────────────────────────────────────────────┘
                  │
                  │ CORS Enabled
                  │ http://localhost:5000/api/*
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NODE.JS/EXPRESS BACKEND                          │
│                       (Port 5000)                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Express Server (server/src/server.ts)                    │      │
│  └────────────────────────┬─────────────────────────────────┘      │
│                           │                                        │
│         ┌─────────────────┼──────────────────┐                    │
│         │                 │                  │                    │
│    ┌────▼────┐    ┌──────▼──────┐    ┌─────▼─────┐              │
│    │ Routes  │    │ Controllers │    │ Middleware│              │
│    │         │    │             │    │           │              │
│    │ intake  │    │  intakeForm │    │ CORS      │              │
│    │Forms.ts │───►│Controller.ts├───►│ Error     │              │
│    │         │    │             │    │ Handling  │              │
│    │workspace│    │             │    │           │              │
│    │agents   │    │  (CRUD ops) │    │ Logging   │              │
│    │threads  │    │             │    │           │              │
│    └─────────┘    └─────────────┘    └───────────┘              │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ Prisma ORM
                               │ SQL Queries
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NEON POSTGRESQL DATABASE (Cloud)                       │
│                      https://neon.tech                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  Tables (Prisma Models):                                 │      │
│  │  ├─ User (system users)                                  │      │
│  │  ├─ Workspace (user workspaces)                          │      │
│  │  ├─ IntakeForm ⭐ PRIMARY                                │      │
│  │  │  └─ companyName, contactEmail, department, industry  │      │
│  │  │     goals, challenges, timeline, budget, status      │      │
│  │  ├─ WorkspaceIntake (settings)                           │      │
│  │  ├─ Agent (AI agents)                                    │      │
│  │  ├─ Thread (chat threads)                                │      │
│  │  ├─ Message (chat messages)                              │      │
│  │  └─ RepositoryItem (knowledge items)                     │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Intake Form Creation

```
1. USER FILLS FORM
   Frontend (React)
   └─ IntakeFormExample.tsx
   └─ Form validation
   └─ Collects: companyName, email, department, goals, challenges, etc.

2. SUBMIT FORM
   └─ apiClient.intakeForms.create(formData)
   └─ HTTP POST to http://localhost:5000/api/intake-forms

3. BACKEND RECEIVES
   └─ Express server receives request
   └─ Routes to: server/src/routes/intakeForms.ts
   └─ Calls: intakeFormController.createIntakeForm()

4. VALIDATE & CREATE
   └─ Validate required fields
   └─ Create record with Prisma
   └─ Insert into database

5. DATABASE STORES
   └─ Neon PostgreSQL
   └─ IntakeForm table
   └─ Returns generated ID, timestamps

6. RESPONSE SENT BACK
   └─ 201 Created status
   └─ Returns full form object
   └─ Frontend displays success

7. OPTIONAL: SUBMIT
   └─ User clicks "Submit"
   └─ POST to /api/intake-forms/:id/submit
   └─ Status changes from "draft" to "submitted"
   └─ Database updated
```

## File Structure

```
workmind.ai/
│
├── 🎨 FRONTEND
│   ├── app/
│   │   ├── api/                (Next.js API - can be replaced with backend)
│   │   ├── agents/
│   │   ├── onboarding/
│   │   └── repository/
│   ├── components/
│   │   ├── IntakeFormExample.tsx ⭐ (React component using API)
│   │   ├── Dashboard.tsx
│   │   ├── ExpertChat.tsx
│   │   └── ...
│   ├── services/
│   │   └── apiClient.ts ⭐ (Frontend API client)
│   ├── index.html
│   ├── index.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── 🔧 BACKEND (NEW!)
│   └── server/
│       ├── src/
│       │   ├── server.ts ⭐ (Express app entry)
│       │   ├── controllers/
│       │   │   └── intakeFormController.ts ⭐ (CRUD operations)
│       │   ├── routes/
│       │   │   ├── intakeForms.ts ⭐ (Intake form endpoints)
│       │   │   ├── workspaces.ts
│       │   │   ├── agents.ts
│       │   │   └── threads.ts
│       │   └── middleware/
│       ├── package.json ⭐ (Backend dependencies)
│       ├── tsconfig.json
│       ├── .env.local ⭐ (Backend config)
│       └── README.md ⭐ (Backend docs)
│
├── 🗄️ DATABASE
│   └── prisma/
│       └── schema.prisma ⭐ (All database models)
│
├── 📚 DOCUMENTATION (NEW!)
│   ├── COMPLETE_GUIDE.md ⭐ (Full setup guide)
│   ├── BACKEND_SETUP.md (Quick start)
│   ├── SETUP_SUMMARY.md (Overview)
│   └── INSTALLATION_COMPLETE.txt (Status)
│
└── ⚙️ CONFIG
    ├── package.json ⭐ (Updated with dev:all script)
    ├── tsconfig.json
    ├── vite.config.ts
    └── prisma.json
```

## API Endpoint Structure

```
BASE_URL: http://localhost:5000/api

/intake-forms
├── POST   /               Create new form
├── GET    /               List forms (query: workspaceId)
├── GET    /:id            Get single form
├── PUT    /:id            Update form
├── DELETE /:id            Delete form
└── POST   /:id/submit     Change status to "submitted"

/workspaces
├── POST   /               Create workspace
├── GET    /               List workspaces (query: userId)
└── GET    /:id            Get workspace details

/agents
├── POST   /               Create agent
├── GET    /               List agents (query: workspaceId)
└── GET    /:id            Get agent details

/threads
├── POST   /               Create thread
├── GET    /:id            Get thread with messages
└── POST   /:id/messages   Add message to thread
```

## Technology Stack

```
FRONTEND:
├── React 19.2.3
├── Vite 6.2.0
├── TypeScript 5.8
├── Tailwind CSS 4.1
└── React Router 7.12

BACKEND:
├── Node.js 24.5.0
├── Express 4.18.2
├── TypeScript 5.3.2
├── Prisma ORM 7.2.0
└── PostgreSQL (Neon)

DATABASE:
├── Neon PostgreSQL (Cloud)
├── Prisma Migrations
└── 8 Data Models

DEVOPS:
├── npm/yarn
├── concurrently (run both servers)
└── Environment variables (.env)

DEPLOYMENT:
├── Frontend: Vercel / Netlify
└── Backend: Railway / Render / Heroku
```

## Development Workflow

```
START DEVELOPMENT
│
├─ Set Neon database URL in server/.env.local
├─ Run: npm run prisma:push (creates tables)
│
├─ Run: npm run dev:all
│   ├─ Frontend: http://localhost:3000
│   └─ Backend: http://localhost:5000
│
├─ Build Forms in React
│   ├─ Import IntakeFormExample component
│   └─ Or use apiClient.intakeForms methods
│
├─ Test API Endpoints
│   ├─ Browser: http://localhost:5000/health
│   └─ Curl/Postman: POST /api/intake-forms
│
├─ Check Database
│   ├─ Neon Dashboard
│   └─ View created records
│
└─ Deploy When Ready
    ├─ Build: npm run build
    └─ Deploy frontend & backend separately
```

## Environment Configuration

```
Frontend (.env):
├─ VITE_API_URL=http://localhost:5000/api
└─ Other frontend env vars

Backend (server/.env.local):
├─ DATABASE_URL=postgresql://...neon...
├─ PORT=5000
├─ FRONTEND_URL=http://localhost:3000
└─ Optional: OPENAI_API_KEY, GEMINI_API_KEY

Root (package.json):
└─ Scripts: dev, dev:server, dev:all
```

## Summary

✅ Complete full-stack setup ready to use
✅ Frontend & backend can run concurrently
✅ Database automatically created with Prisma
✅ API endpoints for intake form management
✅ Example React component provided
✅ API client ready for frontend integration
✅ Comprehensive documentation included
