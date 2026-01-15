# Frontend-Backend Integration Guide

## Overview
The frontend (React/Vite on port 3000) is now fully integrated with the backend API (Express on port 5000) to handle intake form submissions and data retrieval.

## How It Works

### 1. **Intake Form Submission** (IntakeForm.tsx)
When a user completes the 6-step form and clicks "Deploy Workmind OS":

```
User fills form → Step 1-6 validation → Click Submit Button
     ↓
handleSubmit() is called
     ↓
Form data is mapped to IntakeForm schema
     ↓
apiClient.intakeForms.create(data) sends POST to backend
     ↓
Backend stores in Neon PostgreSQL database
     ↓
Success! Redirect to Dashboard
```

**Key Code:**
- Location: [components/IntakeForm.tsx](components/IntakeForm.tsx#L162)
- Function: `handleSubmit()`
- Loading state: Shows "Submitting..." with spinner

### 2. **Dashboard Data Display** (Dashboard.tsx)
When dashboard loads, it fetches all submitted intake forms:

```
Dashboard mounts
     ↓
useEffect triggers fetchIntakeForms()
     ↓
apiClient.intakeForms.getAll(workspaceId) sends GET request
     ↓
Backend returns all forms from database
     ↓
Forms displayed in grid with company info, industry, status, goals
```

**Key Code:**
- Location: [components/Dashboard.tsx](components/Dashboard.tsx#L33)
- Function: `fetchIntakeForms()`
- State: `intakeForms`, `loading`, `refreshing`

### 3. **API Client** (services/apiClient.ts)
Centralized API communication layer:

```typescript
export const apiClient = {
  intakeForms: {
    create: POST /api/intake-forms
    getAll: GET /api/intake-forms?workspaceId=X
    getById: GET /api/intake-forms/:id
    update: PUT /api/intake-forms/:id
    delete: DELETE /api/intake-forms/:id
  }
  // Other endpoints available for workspaces, agents, threads
}
```

## Data Flow

### Submit → Backend → Database
```
FormData (Step 1-6)
     ↓ [mapped to]
IntakeFormData {
  workspaceId: "workspace-{timestamp}",
  companyName: "from Step 1",
  contactEmail: "from Step 1",
  department: "from Step 2",
  industry: "from Step 1",
  companySize: "from Step 1",
  timeline: "from Step 3",
  mainGoals: [from Step 3],
  challenges: [from Step 3],
  budget: "from Step 5",
  ...
}
     ↓ [POST to]
http://localhost:5000/api/intake-forms
     ↓ [stored in]
Neon PostgreSQL (IntakeForm table)
```

### Database → Backend → Dashboard Display
```
Neon PostgreSQL (IntakeForm table)
     ↓ [queried by]
GET /api/intake-forms?workspaceId=X
     ↓ [returned as]
[
  {
    id: "uuid",
    companyName: "Acme Inc",
    industry: "Tech",
    department: "Sales",
    status: "submitted",
    createdAt: "2024-01-15T10:30:00Z",
    ...
  },
  ...
]
     ↓ [displayed as]
Dashboard Grid Cards showing company info, status, goals
```

## Features Implemented

✅ **IntakeForm Component:**
- Multi-step form validation
- Backend API submission on completion
- Loading spinner during submission
- Error handling with user feedback
- Auto-redirect to dashboard on success

✅ **Dashboard Component:**
- Fetches intake forms on mount
- Displays forms in grid layout
- Shows company name, email, industry, size, timeline
- Shows main goals as tags
- Status badge (submitted/pending)
- Refresh button to reload data
- Loading states for better UX

✅ **API Client:**
- Base URL: `http://localhost:5000/api`
- All CRUD operations for intake forms
- Error handling with descriptive messages
- JSON request/response handling

✅ **Database:**
- Neon PostgreSQL integration
- Prisma ORM v6
- IntakeForm table with all required fields
- Supports 8 models (User, Workspace, IntakeForm, etc.)

## Environment Configuration

**Backend (.env.local in /server):**
```
DATABASE_URL=postgresql://neondb_owner:npg_zhBMFLHWq78f@ep-broad-cherry-ahruev80-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=5000
NODE_ENV=development
```

**Frontend (.env if needed):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

### Terminal 1 - Backend
```bash
cd server
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### Terminal 2 - Frontend
```bash
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

Or run both concurrently:
```bash
npm run dev:all
```

## Testing the Integration

### 1. Test Backend API
```bash
# Check health
curl http://localhost:5000/health

# Create test intake form
curl -X POST http://localhost:5000/api/intake-forms \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "test-ws",
    "companyName": "Test Corp",
    "contactEmail": "test@example.com",
    "industry": "Tech"
  }'

# Get all forms
curl http://localhost:5000/api/intake-forms?workspaceId=test-ws
```

### 2. Test Frontend
1. Go to http://localhost:3000
2. Complete intake form (all 6 steps)
3. Click "Deploy Workmind OS"
4. Wait for success message
5. Dashboard should show submitted form
6. Click "Refresh" to reload data

### 3. Check Database
```bash
# In Neon console or with psql
SELECT * FROM "IntakeForm" LIMIT 10;
```

## Component Integration Points

### IntakeForm.tsx
- **Imports:** apiClient from services/apiClient
- **State:** isSubmitting (for loading state)
- **Event Handler:** handleSubmit() calls apiClient.intakeForms.create()
- **Navigation:** navigate('/dashboard') after success
- **Error Handling:** try/catch with user alert

### Dashboard.tsx
- **Imports:** apiClient, useState, useEffect
- **State:** intakeForms[], loading, refreshing
- **Effect:** fetchIntakeForms() on component mount
- **Display:** Maps intakeForms to grid cards
- **Refresh:** Button calls fetchIntakeForms with refreshing state

### API Response Format
```typescript
// Single Form
{
  id: string,
  workspaceId: string,
  companyName: string,
  contactEmail: string,
  department: string,
  industry: string,
  companySize: string,
  currentState: string,
  mainGoals: string[],
  challenges: string[],
  resources: string,
  timeline: string,
  budget: string,
  status: "pending" | "submitted",
  createdAt: string,
  updatedAt: string
}

// Array of Forms
{ success: true, data: [Form, Form, ...] }
```

## Next Steps

### For Chat Feature
The architecture is ready for chat functionality:
- Thread model: Creates conversation threads
- Message model: Stores individual messages
- Backend endpoint: `/api/threads` for thread management
- Frontend component: ExpertChat component ready to integrate

### For Additional Features
- Workspace management: /api/workspaces
- Agent configuration: /api/agents
- Repository management: /api/repository

## Troubleshooting

**Issue:** "Failed to fetch intake forms"
- Check backend is running: `curl http://localhost:5000/health`
- Check CORS is enabled in backend
- Check database connection: `npm run prisma:status`

**Issue:** Form submission fails
- Check backend logs for error details
- Verify all required fields are mapped
- Check network tab in browser DevTools

**Issue:** Empty dashboard
- Make sure you submitted at least one form
- Click "Refresh" button to reload
- Check backend database: `SELECT COUNT(*) FROM "IntakeForm"`

## Files Modified

- [components/IntakeForm.tsx](components/IntakeForm.tsx) - Added API submission
- [components/Dashboard.tsx](components/Dashboard.tsx) - Added data fetching & display
- [services/apiClient.ts](services/apiClient.ts) - API client methods
- [server/src/routes/intakeForms.ts](server/src/routes/intakeForms.ts) - Backend endpoints
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema
