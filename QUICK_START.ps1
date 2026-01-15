#!/usr/bin/env pwsh
# QUICK START GUIDE - Frontend Backend Integration
# ===============================================

Write-Host "🚀 WorkMind.ai - Frontend Backend Integration Setup" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project directory verified" -ForegroundColor Green
Write-Host ""

# Display current status
Write-Host "📊 Current Setup Status:" -ForegroundColor Yellow
Write-Host "├─ Frontend: React 19 + Vite 6" -ForegroundColor White
Write-Host "├─ Backend: Express.js + Node.js" -ForegroundColor White
Write-Host "├─ Database: Neon PostgreSQL" -ForegroundColor White
Write-Host "├─ ORM: Prisma v6" -ForegroundColor White
Write-Host "└─ API Port: 5000 | Frontend Port: 3000" -ForegroundColor White
Write-Host ""

# Check if .env files exist
Write-Host "📝 Checking Configuration Files:" -ForegroundColor Yellow

if (Test-Path "server/.env.local") {
    Write-Host "✅ server/.env.local found" -ForegroundColor Green
} else {
    Write-Host "⚠️  server/.env.local not found - will use defaults" -ForegroundColor Yellow
}

if (Test-Path ".env.local") {
    Write-Host "✅ .env.local found in frontend" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found in frontend (optional)" -ForegroundColor Yellow
}

Write-Host ""

# Display component status
Write-Host "🧩 Integrated Components:" -ForegroundColor Cyan
Write-Host "├─ ✅ IntakeForm.tsx - Form submission with API call" -ForegroundColor Green
Write-Host "├─ ✅ Dashboard.tsx - Data fetching and display" -ForegroundColor Green
Write-Host "├─ ✅ apiClient.ts - Frontend API client" -ForegroundColor Green
Write-Host "├─ ✅ intakeForms.ts (backend) - API routes" -ForegroundColor Green
Write-Host "└─ ✅ Prisma Schema - Database models" -ForegroundColor Green
Write-Host ""

# Display how to run
Write-Host "🎯 How to Run:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Run Both Servers Together" -ForegroundColor Yellow
Write-Host "  Command: npm run dev:all" -ForegroundColor White
Write-Host "  This will start both frontend (3000) and backend (5000) concurrently" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Run Servers Separately (in different terminals)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1 - Backend:" -ForegroundColor White
Write-Host "    cd server" -ForegroundColor Gray
Write-Host "    npm install" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host "    # Backend will run on http://localhost:5000" -ForegroundColor Gray
Write-Host ""

Write-Host "  Terminal 2 - Frontend:" -ForegroundColor White
Write-Host "    npm install" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host "    # Frontend will run on http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# Display test flow
Write-Host "🧪 Testing the Integration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1: Start both servers (choose option above)" -ForegroundColor White
Write-Host "Step 2: Open http://localhost:3000 in browser" -ForegroundColor White
Write-Host "Step 3: Complete the intake form (all 6 steps)" -ForegroundColor White
Write-Host "Step 4: Click 'Deploy Workmind OS' button" -ForegroundColor White
Write-Host "Step 5: You should see 'Intake form submitted successfully!'" -ForegroundColor White
Write-Host "Step 6: Dashboard loads and shows your submitted form" -ForegroundColor White
Write-Host "Step 7: Click 'Refresh' button to reload data from API" -ForegroundColor White
Write-Host ""

# Display API endpoints
Write-Host "🔌 Available API Endpoints:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Intake Forms:" -ForegroundColor Yellow
Write-Host "  POST   /api/intake-forms              - Create new form" -ForegroundColor White
Write-Host "  GET    /api/intake-forms              - Get all forms" -ForegroundColor White
Write-Host "  GET    /api/intake-forms/:id          - Get form by ID" -ForegroundColor White
Write-Host "  PUT    /api/intake-forms/:id          - Update form" -ForegroundColor White
Write-Host "  DELETE /api/intake-forms/:id          - Delete form" -ForegroundColor White
Write-Host "  POST   /api/intake-forms/:id/submit   - Submit form" -ForegroundColor White
Write-Host ""

Write-Host "Example curl commands:" -ForegroundColor Gray
Write-Host "  curl http://localhost:5000/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:5000/api/intake-forms?workspaceId=test" -ForegroundColor Gray
Write-Host ""

# Display troubleshooting
Write-Host "❓ Troubleshooting:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Problem: 'Failed to fetch intake forms'" -ForegroundColor Yellow
Write-Host "  Solution: Ensure backend is running on port 5000" -ForegroundColor White
Write-Host "  Check: curl http://localhost:5000/health" -ForegroundColor Gray
Write-Host ""

Write-Host "Problem: Form submission fails" -ForegroundColor Yellow
Write-Host "  Solution: Check browser console for error message" -ForegroundColor White
Write-Host "  Check: Backend logs for details" -ForegroundColor Gray
Write-Host ""

Write-Host "Problem: 'Cannot connect to database'" -ForegroundColor Yellow
Write-Host "  Solution: Verify DATABASE_URL in server/.env.local" -ForegroundColor White
Write-Host "  Check: npm run prisma:status (in server directory)" -ForegroundColor Gray
Write-Host ""

# Display file locations
Write-Host "📁 Key Files:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend Components:" -ForegroundColor Yellow
Write-Host "  components/IntakeForm.tsx          (Form with API submission)" -ForegroundColor Gray
Write-Host "  components/Dashboard.tsx           (Data display & refresh)" -ForegroundColor Gray
Write-Host "  services/apiClient.ts              (API client library)" -ForegroundColor Gray
Write-Host ""

Write-Host "Backend Files:" -ForegroundColor Yellow
Write-Host "  server/src/server.ts               (Express app setup)" -ForegroundColor Gray
Write-Host "  server/src/routes/intakeForms.ts   (API routes)" -ForegroundColor Gray
Write-Host "  server/src/controllers/intakeFormController.ts  (Route handlers)" -ForegroundColor Gray
Write-Host "  server/.env.local                  (Database connection)" -ForegroundColor Gray
Write-Host ""

Write-Host "Database:" -ForegroundColor Yellow
Write-Host "  prisma/schema.prisma               (Database schema)" -ForegroundColor Gray
Write-Host "  prisma/migrations/                 (Migration history)" -ForegroundColor Gray
Write-Host ""

# Display next steps
Write-Host "🎓 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start both servers using one of the options above" -ForegroundColor White
Write-Host "2. Test the intake form submission flow" -ForegroundColor White
Write-Host "3. Verify data appears in dashboard" -ForegroundColor White
Write-Host "4. Check database in Neon console" -ForegroundColor White
Write-Host ""

Write-Host "For more details, see: FRONTEND_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

# Offer to start servers
Write-Host "Ready to start? (Y/n)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y' -or $response -eq '') {
    Write-Host ""
    Write-Host "🚀 Starting both servers..." -ForegroundColor Green
    Write-Host ""
    npm run dev:all
} else {
    Write-Host ""
    Write-Host "Run 'npm run dev:all' when ready to start" -ForegroundColor Yellow
    Write-Host ""
}
