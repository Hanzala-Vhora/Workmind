
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { IntakeForm } from './components/IntakeForm';
import { Dashboard } from './components/Dashboard';
import { ExpertChat } from './components/ExpertChat';
import { DepartmentHub } from './components/DepartmentHub';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { Department } from './types';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut><RedirectToSignIn /></SignedOut>
  </>
);

const AppRoutes: React.FC = () => {
  const { setActiveDepartment, setClientData, clientData } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle URL Invite Links
  useEffect(() => {
    const inviteDept = searchParams.get('invite') as Department | null;

    if (inviteDept) {
      console.log("Joined via invite link for:", inviteDept);

      // If user is not "logged in" (no client data), create dummy data to let them in
      if (!clientData) {
        // Create minimal session
        const guestData: any = {
          business_name: 'Guest Workspace',
          primary_contact: 'Guest User',
          selected_departments: [inviteDept],
          department_configs: {},
          // Add other required fields with defaults to prevent crashes
          stage: 'Growth',
          lead_sources: [],
          tool_stack: [],
          competitors: [],
          markets: [],
          deliverables: [],
          countries_served: [],
          activity_targets: '',
          revenue_streams: '',
          pricing_model: 'One-time',
          price_points: '',
          sales_cycle: '1-3 months',
          revenue_target_90d: '',
          revenue_target_12m: '',
          working_channels: '',
          failing_channels: '',
          sales_mechanism: '',
          crm_tool: '',
          close_rate: '',
          delivery_process: '',
          broken_workflows: '',
          time_wasters: '',
          has_sops: 'No',
          team_structure: '',
          decision_approver: '',
          is_regulated: 'No',
          sensitive_data: 'None',
          brand_tone: 'Professional',
          brand_keywords: '',
          writing_samples: '',
          interaction_style: 'Collaborative',
          output_format: 'Markdown',
          client_facing_needed: 'No',
          deadline: '',
          reference_brands: '',
          hard_constraints: '',
          must_avoid: ''
        };
        setClientData(guestData);
      } else {
        // Ensure this department is in their list so it shows up
        if (!clientData.selected_departments.includes(inviteDept)) {
          const updated = { ...clientData, selected_departments: [...clientData.selected_departments, inviteDept] };
          setClientData(updated);
        }
      }

      setActiveDepartment(inviteDept);
      navigate('/hub');
    }
  }, [searchParams, clientData, setClientData, setActiveDepartment, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/intake" element={<IntakeForm mode="initial" />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/add-expert" element={
        <ProtectedRoute><IntakeForm mode="add" /></ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute><ExpertChat /></ProtectedRoute>
      } />
      <Route path="/hub" element={
        <ProtectedRoute><DepartmentHub /></ProtectedRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
};

export default App;
