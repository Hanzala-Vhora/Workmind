# 🧪 Complete Testing Guide

## Pre-Test Checklist

Before testing, verify everything is set up:

```
├─ ✅ Backend dependencies installed (npm install in server/)
├─ ✅ Frontend dependencies installed (npm install in root)
├─ ✅ Neon database connection configured (.env.local)
├─ ✅ Prisma migrations complete (8 tables in database)
├─ ✅ API endpoints ready (Express server configured)
└─ ✅ Frontend components integrated (IntakeForm + Dashboard)
```

---

## Test 1: Backend Health Check

**Objective:** Verify backend server is running and accessible

### Steps:
```bash
# Terminal: cd server
npm run dev

# Should see:
# ✅ Listening on port 5000
# ✅ Database connection successful
```

### Verify with curl:
```bash
curl http://localhost:5000/health

# Expected response:
# { "status": "ok" }
```

### Expected Result:
- ✅ Server running on port 5000
- ✅ No errors in console
- ✅ Health endpoint responds

---

## Test 2: Database Connection

**Objective:** Verify Prisma can communicate with Neon database

### Steps:
```bash
# In server/ directory
npm run prisma:status

# Should show:
# ✅ Database connected
# ✅ 8 tables found
```

### Check tables exist:
```bash
# Or use Neon console to verify:
# SELECT COUNT(*) FROM "IntakeForm";
# SELECT COUNT(*) FROM "User";
# SELECT COUNT(*) FROM "Workspace";
```

### Expected Result:
- ✅ Prisma connected to Neon
- ✅ All 8 tables exist
- ✅ No migration pending

---

## Test 3: API Endpoint Testing

**Objective:** Test backend API endpoints before frontend

### Test 3a: Create Intake Form via API

```bash
curl -X POST http://localhost:5000/api/intake-forms \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "test-workspace-1",
    "companyName": "Test Company",
    "contactEmail": "test@example.com",
    "department": "Sales",
    "industry": "Technology",
    "companySize": "50-100",
    "currentState": "Growing",
    "mainGoals": ["Increase Revenue", "Improve Efficiency"],
    "challenges": ["Manual Processes"],
    "resources": "5 team members",
    "timeline": "1-3 months",
    "budget": "50000"
  }'

# Expected response:
# {
#   "id": "uuid-string",
#   "workspaceId": "test-workspace-1",
#   "companyName": "Test Company",
#   "status": "submitted",
#   "createdAt": "2024-01-15T10:30:00.000Z",
#   ...
# }
```

**Expected Result:**
- ✅ HTTP 200 OK response
- ✅ Record created with UUID
- ✅ Status shows "submitted"

### Test 3b: Get All Forms

```bash
curl http://localhost:5000/api/intake-forms?workspaceId=test-workspace-1

# Expected response:
# [
#   {
#     "id": "uuid-string",
#     "companyName": "Test Company",
#     "status": "submitted",
#     ...
#   }
# ]
```

**Expected Result:**
- ✅ HTTP 200 OK response
- ✅ Returns array of forms
- ✅ Includes form we just created

### Test 3c: Get Form by ID

```bash
# Use the ID from previous response
curl http://localhost:5000/api/intake-forms/{id-from-above}

# Expected response:
# {
#   "id": "uuid-string",
#   "companyName": "Test Company",
#   ...
# }
```

**Expected Result:**
- ✅ HTTP 200 OK response
- ✅ Returns single form object
- ✅ All fields present

---

## Test 4: Frontend Server

**Objective:** Start frontend and verify it runs

### Steps:
```bash
# Terminal: root directory
npm run dev

# Should see:
# VITE v6.2.0  ready in 123 ms
# ➜  Local:   http://localhost:3000/
```

### Expected Result:
- ✅ Frontend accessible at http://localhost:3000
- ✅ No console errors
- ✅ Landing page loads

---

## Test 5: Frontend to Backend Communication

**Objective:** Verify frontend can call backend API

### Steps:

1. **Open Developer Console** (F12 in browser)
2. **Go to** http://localhost:3000
3. **Navigate to** Intake Form page
4. **Open Network Tab** in DevTools
5. **Fill out first step** of intake form
6. **Proceed to next steps**

### Watch for API calls:
- No errors in console
- Form validation works

---

## Test 6: Complete Form Submission (MAIN TEST)

**Objective:** Test complete form submission workflow

### Steps:

#### Step 1: Fill Basic Information (Step 1)
```
Business Name:        "Acme Corp"
Email:                "contact@acmecorp.com"
Industry:             "Technology"
Company Size:         "50-100 employees"
```
- Click "Next" or "Continue"

#### Step 2: Select Departments (Step 2)
```
Select:   "Sales", "Marketing", "Operations"
```
- Click "Next"

#### Step 3: Business Operations (Step 3)
```
Main Offer:           "SaaS Platform"
Revenue Streams:      "Subscription"
Broken Workflows:     "Manual reporting"
Team Structure:       "3 people"
Sales Cycle:          "1-3 months"
Revenue Target:       "100000-500000"
```
- Click "Next"

#### Step 4: Agent Selection (Step 4)
```
Select agents for selected departments
```
- Click "Next"

#### Step 5: Training Data (Step 5)
```
Documentation or training material (optional)
```
- Click "Next"

#### Step 6: Final Confirmation (Step 6)
```
Review all information
```

### Observe:
1. **Open DevTools Network Tab** (F12)
2. **Click "Deploy Workmind OS" button**
3. **Watch for:**
   - Loading spinner appears: "Submitting..."
   - POST request to `http://localhost:5000/api/intake-forms`
   - Request status: **200 OK**
   - Response shows created form with UUID

### Expected Behavior:

✅ **During Submission:**
- Button shows spinner
- Button text changes to "Submitting..."
- Button is disabled
- No page navigation yet

✅ **After Success:**
- Alert appears: "✅ Intake form submitted successfully!"
- Browser redirects to `/dashboard`
- No errors in console

✅ **In Network Tab:**
- Request: POST /api/intake-forms
- Status: 200 OK
- Response: JSON with form data and ID
- Headers show: Content-Type: application/json

---

## Test 7: Dashboard Display

**Objective:** Verify submitted form appears on dashboard

### Steps:

After successful submission, you should see:

1. **Dashboard Loads Automatically**
   - URL changes to `/dashboard`
   - Sidebar shows on left (hidden on mobile)
   - Department cards appear below

2. **"Submitted Intake Forms" Section Appears**
   - Shows grid of form cards
   - Each card displays:
     - Company name: "Acme Corp" ✅
     - Email: "contact@acmecorp.com" ✅
     - Green "submitted" badge ✅
     - Department: "Sales" or first selected
     - Industry: "Technology"
     - Size: "50-100"
     - Timeline: "1-3 months"
     - Goals displayed as tags

3. **Refresh Button Works**
   - Click "Refresh" button
   - Spinner appears on button
   - Data reloads from database
   - Spinner disappears
   - Same form still visible

### Expected Layout:

```
┌─────────────────────────────────────────────┐
│ WORKMIND.AI  [Sidebar]                      │
├─────────────────────────────────────────────┤
│                                             │
│  Active Workspaces: 1                       │
│  Intake Forms: 1                            │
│  Est. Time Saved: 0h                        │
│  System Status: Online 🟢                   │
│                                             │
│  Submitted Intake Forms          [Refresh]  │
│  ┌──────────────────────────────────────┐  │
│  │ Acme Corp                [submitted] │  │
│  │ contact@acmecorp.com                │  │
│  │                                      │  │
│  │ Department: Sales                    │  │
│  │ Industry: Technology                 │  │
│  │ Size: 50-100 employees              │  │
│  │ Timeline: 1-3 months                │  │
│  │                                      │  │
│  │ Goals: [Increase Revenue] [Improve] │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  Department Expert Cards Below...           │
│                                             │
└─────────────────────────────────────────────┘
```

### Verify in Network Tab:
- GET request to `/api/intake-forms?workspaceId=...`
- Status: 200 OK
- Response: Array with 1 form object

---

## Test 8: Data Persistence

**Objective:** Verify data persists after page refresh

### Steps:

1. **On Dashboard:** Note the form is displayed
2. **Press F5** to refresh the page
3. **Wait for page to reload**
4. **Observe:**
   - Form still appears in dashboard
   - Same company name and data
   - No error messages

### Expected Result:
- ✅ Form persists after refresh
- ✅ Data retrieved from database
- ✅ No data loss

---

## Test 9: Submit Second Form

**Objective:** Test multiple form submissions

### Steps:

1. **On Dashboard:** Click "+" button or navigate to intake form
2. **Fill out new form** with different company info:
   ```
   Company: "Tech Innovations Inc"
   Email: "info@techinnovations.com"
   Industry: "Software"
   Size: "100-500"
   ```
3. **Submit form**
4. **Observe dashboard:**
   - Two cards appear (both companies)
   - Both showing correct info
   - Both have submitted status

### Expected Result:
- ✅ Multiple forms can be submitted
- ✅ All forms display on dashboard
- ✅ Stats update (Intake Forms: 2)

---

## Test 10: Error Handling

**Objective:** Verify error handling works

### Test 10a: Network Error

**Steps:**
1. **Stop backend server** (Ctrl+C)
2. **On dashboard:** Click "Refresh"
3. **Observe:**
   - Error logged in console
   - Form data should still be visible (cached)
   - No page crash
   - Meaningful error message

### Test 10b: Missing Required Fields

**Steps:**
1. **Go to intake form**
2. **Skip to final step without filling**
3. **Try to submit**
4. **Observe:**
   - Validation error appears
   - Submit button disabled
   - Form data not sent to backend

---

## Test 11: Browser DevTools Inspection

**Objective:** Verify data structure in browser

### Steps:

1. **Open DevTools** (F12)
2. **Go to Application tab** → Storage → LocalStorage
3. **Look for** AppContext data or any stored form data
4. **Go to Network tab**
5. **Submit a form**
6. **Find POST request:**
   - Headers tab: Content-Type: application/json
   - Request payload: Shows all form fields
   - Response: Shows created record with ID

---

## Test 12: Database Verification

**Objective:** Verify data is actually stored in Neon

### Option A: Using Neon Console
1. Go to https://console.neon.tech
2. Select your project
3. Open SQL Editor
4. Run query:
   ```sql
   SELECT COUNT(*) as total_forms FROM "IntakeForm";
   SELECT * FROM "IntakeForm" LIMIT 5;
   ```
5. Verify:
   - Total count matches forms submitted
   - Data shows company names, emails, etc.

### Option B: Using Terminal
```bash
# Connect to Neon database
psql "postgresql://neondb_owner:npg_zhBMFLHWq78f@...neon.tech/neondb"

# Query intake forms
SELECT id, "companyName", "contactEmail", department 
FROM "IntakeForm" 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

### Expected Result:
- ✅ Forms are in database
- ✅ Count matches submitted forms
- ✅ All fields populated correctly

---

## Test 13: Performance Check

**Objective:** Verify dashboard loads quickly

### Steps:

1. **Open DevTools** → Performance tab
2. **Record** (Cmd+Shift+E or Ctrl+Shift+E)
3. **Navigate to dashboard**
4. **Stop recording**
5. **Analyze:**
   - Total load time < 2 seconds
   - No yellow/red warnings
   - Smooth rendering

### Expected Result:
- ✅ Dashboard loads quickly
- ✅ No performance issues
- ✅ Forms render without jank

---

## Test 14: Cross-Browser Testing

**Objective:** Verify works in multiple browsers

### Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on Mac)

### Verify in each:
- Form submission works
- Dashboard displays correctly
- Refresh button functions
- No console errors

---

## Troubleshooting Guide

### Issue: "Failed to fetch intake forms"

**Diagnosis:**
```javascript
// Check in console
console.error('Failed to fetch intake forms:', error);
```

**Solutions:**
1. Check backend is running: `curl http://localhost:5000/health`
2. Check database connection: `npm run prisma:status` (in server/)
3. Check browser console for CORS error
4. Verify API_BASE_URL in apiClient.ts

### Issue: Form submission never completes

**Diagnosis:**
1. Check Network tab in DevTools
2. Look for POST request status

**Solutions:**
- If request is pending: Backend not responding
- If 500 error: Check backend console for error
- If CORS error: Enable CORS in backend
- If 400 error: Form data not properly formatted

### Issue: Dashboard shows no forms

**Diagnosis:**
1. Check Network tab: GET request status
2. Check browser console for errors
3. Check if forms were actually submitted

**Solutions:**
- Verify forms submitted successfully (check database)
- Clear browser cache: Ctrl+Shift+Delete
- Check workspaceId matches query parameter
- Manually test API: `curl http://localhost:5000/api/intake-forms`

### Issue: Page crashes after submission

**Diagnosis:**
1. Check browser console for JavaScript errors
2. Check if navigation to /dashboard failed

**Solutions:**
- Verify React Router is configured
- Check AppContext for errors
- Reload page manually: F5

---

## Success Criteria Checklist

✅ **Backend Functional**
- [ ] Express server running on port 5000
- [ ] Health endpoint responds
- [ ] Database connection successful
- [ ] All 8 tables created

✅ **Frontend Functional**
- [ ] React app running on port 3000
- [ ] Intake form loads
- [ ] All 6 form steps accessible
- [ ] Form validation works

✅ **API Communication**
- [ ] POST /api/intake-forms works
- [ ] GET /api/intake-forms works
- [ ] Response headers correct
- [ ] No CORS errors

✅ **Form Submission**
- [ ] Form submission button triggers API call
- [ ] Loading spinner shows
- [ ] Success message displays
- [ ] Redirect to dashboard occurs

✅ **Dashboard Display**
- [ ] Forms display after submission
- [ ] Company info shows correctly
- [ ] Status badge displays
- [ ] Goals appear as tags

✅ **Data Persistence**
- [ ] Data survives page refresh
- [ ] Forms visible in database
- [ ] Refresh button works
- [ ] Multiple submissions supported

✅ **Error Handling**
- [ ] Network errors handled gracefully
- [ ] Validation errors shown
- [ ] Console shows helpful messages
- [ ] No page crashes

---

## Next Steps After Passing All Tests

Once all tests pass:

1. ✅ Frontend-Backend integration is complete
2. 🔄 Ready to add chat functionality (Thread model ready)
3. 🔄 Ready to add workspace management
4. 🔄 Ready to add agent configuration
5. 🔄 Ready for production deployment

See: INTEGRATION_COMPLETE.md for next features
