# WorkMind.ai Backend Setup

## Overview
Node.js/Express backend with PostgreSQL (Neon) database integration for the WorkMind.ai project.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Neon PostgreSQL account (https://neon.tech)

## Setup Instructions

### 1. Database Setup (Neon)

1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy your database connection string:
   ```
   postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
   ```

### 2. Backend Configuration

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file in the `server` directory:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your Neon database URL:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

### 3. Database Migration

Run Prisma migrations to create tables in Neon:

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Or use migrations (for version control)
npm run prisma:migrate
```

### 4. Running Frontend & Backend Together

From the root directory, run both concurrently:

```bash
npm run dev:all
```

This will:
- Start frontend on `http://localhost:3000`
- Start backend on `http://localhost:5000`

### 5. Running Separately

**Backend only:**
```bash
cd server
npm run dev
```

**Frontend only:**
```bash
npm run dev
```

## API Endpoints

### Intake Forms
- `POST /api/intake-forms` - Create new intake form
- `GET /api/intake-forms?workspaceId=xxx` - Get all forms for workspace
- `GET /api/intake-forms/:id` - Get specific intake form
- `PUT /api/intake-forms/:id` - Update intake form
- `DELETE /api/intake-forms/:id` - Delete intake form
- `POST /api/intake-forms/:id/submit` - Submit intake form

### Workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces?userId=xxx` - Get user's workspaces
- `GET /api/workspaces/:id` - Get workspace details

### Agents
- `POST /api/agents` - Create agent
- `GET /api/agents?workspaceId=xxx` - Get workspace agents
- `GET /api/agents/:id` - Get agent details

### Threads
- `POST /api/threads` - Create thread
- `GET /api/threads/:id` - Get thread with messages
- `POST /api/threads/:id/messages` - Add message to thread

## Frontend Integration

The frontend should call the backend API at `http://localhost:5000/api`:

```typescript
// Example: Create intake form
const response = await fetch('http://localhost:5000/api/intake-forms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspaceId: 'workspace-123',
    companyName: 'Acme Corp',
    contactEmail: 'contact@acme.com',
    department: 'Sales',
    industry: 'Technology',
    companySize: '50-100',
    mainGoals: ['Increase revenue', 'Improve efficiency'],
    challenges: ['Market competition', 'Talent shortage'],
    timeline: '6 months',
    budget: '$50,000'
  })
});
```

## Database Models

See `prisma/schema.prisma` for complete schema:

- **User** - System users
- **Workspace** - User workspaces
- **IntakeForm** - Intake forms (PRIMARY)
- **WorkspaceIntake** - Workspace intake settings
- **Agent** - AI agents per workspace
- **Thread** - Chat threads
- **Message** - Thread messages
- **RepositoryItem** - Knowledge repository items

## Troubleshooting

### Connection Refused on localhost:5000
- Ensure backend is running: `npm run dev` in server directory
- Check PORT environment variable

### Database Connection Error
- Verify DATABASE_URL in `.env.local`
- Ensure Neon account is active and database exists
- Check SSL connection: `?sslmode=require` should be in URL

### Prisma Errors
- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`
- Regenerate: `npm run prisma:generate`

### CORS Issues
- Verify FRONTEND_URL in backend .env matches frontend URL
- Check that CORS middleware is properly configured in server.ts

## Development Notes

- Backend uses ES modules (type: "module")
- All TypeScript files compile to dist/
- Prisma Client auto-generates on npm install
- Database changes tracked with migrations

## Next Steps

1. Update frontend to call backend API endpoints
2. Implement authentication middleware
3. Add validation middleware for requests
4. Set up error logging/monitoring
5. Deploy to production (Vercel, Railway, Render, etc.)
