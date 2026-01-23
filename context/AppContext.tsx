
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { IntakeData, Conversation, Department, StoredDocument, HubMessage } from '../types';

interface AppContextType {
  clientData: IntakeData | null;
  setClientData: (data: IntakeData) => void;

  // 1:1 Expert Chat
  conversations: Record<string, Conversation>;
  addMessage: (dept: Department, role: 'user' | 'assistant', content: string, escalation?: any) => void;
  setConversationMessages: (dept: Department, messages: any[]) => void;

  // Context Repository (Files)
  departmentDocuments: Record<string, StoredDocument[]>;
  addDocument: (dept: Department, doc: StoredDocument) => void;
  removeDocument: (dept: Department, docId: string) => void;

  // Department Hub (Collaboration)
  departmentHubs: Record<string, HubMessage[]>;
  addHubMessage: (dept: Department, msg: HubMessage) => void;

  activeDepartment: Department | null;
  setActiveDepartment: (dept: Department | null) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientData, setClientDataState] = useState<IntakeData | null>(null);
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [departmentDocuments, setDepartmentDocuments] = useState<Record<string, StoredDocument[]>>({});
  const [departmentHubs, setDepartmentHubs] = useState<Record<string, HubMessage[]>>({});

  const [activeDepartment, setActiveDepartment] = useState<Department | null>(null);

  const { user } = useUser();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Persist to local storage (only as backup / cache)
  useEffect(() => {
    // We try to load from local storage immediately to avoid flash or if API fails
    const savedData = localStorage.getItem('workmind_client_data');
    if (savedData && !clientData) setClientDataState(JSON.parse(savedData));

    const savedConvos = localStorage.getItem('workmind_conversations');
    if (savedConvos) setConversations(JSON.parse(savedConvos));

    const savedDocs = localStorage.getItem('workmind_documents');
    if (savedDocs) setDepartmentDocuments(JSON.parse(savedDocs));

    const savedHubs = localStorage.getItem('workmind_hubs');
    if (savedHubs) setDepartmentHubs(JSON.parse(savedHubs));

    const savedDept = localStorage.getItem('workmind_active_department');
    if (savedDept) setActiveDepartment(savedDept as Department);
  }, []);

  // Hydrate from API when User is ready
  useEffect(() => {
    if (!user?.id) return;

    const fetchContext = async () => {
      try {
        // 1. Check status
        const statusRes = await fetch(`${API_URL}/api/users/${user.id}/onboarding-status`);
        if (!statusRes.ok) return;

        const status = await statusRes.json();

        // 2. If form completed, fetch full data
        if (status.completed && status.formId) {
          const formRes = await fetch(`${API_URL}/api/intake-forms/${status.formId}`);
          if (formRes.ok) {
            const formData = await formRes.json();

            // Map Backend Data to Frontend Types
            const mappedData: IntakeData = {
              ...formData,

              // CRITICAL: Ensure business_name and department fields exist locally as expected
              business_name: formData.companyName || 'Unknown Business',
              selected_departments: formData.department ? [formData.department as Department] : [],

              // DEFAULTS for fields that might be missing in DB or partial
              department_configs: {},
              lead_sources: [],
              tool_stack: [],
              countries_served: [],
              competitors: [],
              deliverables: [],

              business_model: formData.business_model || '',
              stage: formData.currentState || '',
              hq_location: '',
              founders_roles: '',
              primary_contact: formData.contactEmail || '',

              main_offer: '',
              icp: '',
              buyer_roles: '',
              main_pain: '',
              promise: '',
              key_objections: '',
              usp: '',

              revenue_streams: '',
              pricing_model: '',
              price_points: '',
              sales_cycle: '',
              revenue_target_90d: '',
              revenue_target_12m: '',

              working_channels: '',
              failing_channels: '',
              sales_mechanism: '',
              crm_tool: '',
              close_rate: '',
              activity_targets: '',

              delivery_process: '',
              broken_workflows: '',
              time_wasters: '',
              has_sops: 'No',
              team_structure: '',
              decision_approver: '',

              is_regulated: 'No',
              sensitive_data: '',

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

            setClientDataState(mappedData);
            localStorage.setItem('workmind_client_data', JSON.stringify(mappedData));

            // Restore active dept if missing
            if (!activeDepartment && mappedData.selected_departments?.length > 0) {
              setActiveDepartment(mappedData.selected_departments[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to hydrate client data", err);
      }
    };

    fetchContext();
  }, [user?.id]);

  // Persist active department changes
  useEffect(() => {
    if (activeDepartment) {
      localStorage.setItem('workmind_active_department', activeDepartment);
    }
  }, [activeDepartment]);

  const setClientData = (data: IntakeData) => {
    setClientDataState(data);
    localStorage.setItem('workmind_client_data', JSON.stringify(data));
  };

  const addMessage = (dept: Department, role: 'user' | 'assistant', content: string, escalation?: any) => {
    setConversations(prev => {
      const conv = prev[dept] || { id: crypto.randomUUID(), department: dept, messages: [], lastUpdated: Date.now() };
      const newMessage = {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: Date.now(),
        escalation
      };
      const updated = {
        ...prev,
        [dept]: {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastUpdated: Date.now()
        }
      };
      localStorage.setItem('workmind_conversations', JSON.stringify(updated));
      return updated;
    });
  };

  const setConversationMessages = (dept: Department, messages: any[]) => {
    setConversations(prev => {
      const conv = prev[dept] || { id: crypto.randomUUID(), department: dept, messages: [], lastUpdated: Date.now() };
      const updated = {
        ...prev,
        [dept]: {
          ...conv,
          messages: messages,
          lastUpdated: Date.now()
        }
      };
      localStorage.setItem('workmind_conversations', JSON.stringify(updated));
      return updated;
    });
  };

  const addDocument = (dept: Department, doc: StoredDocument) => {
    setDepartmentDocuments(prev => {
      const currentDocs = prev[dept] || [];
      const updated = {
        ...prev,
        [dept]: [...currentDocs, doc]
      };
      localStorage.setItem('workmind_documents', JSON.stringify(updated));
      return updated;
    });
  };

  const removeDocument = (dept: Department, docId: string) => {
    setDepartmentDocuments(prev => {
      const currentDocs = prev[dept] || [];
      const updated = {
        ...prev,
        [dept]: currentDocs.filter(d => d.id !== docId)
      };
      localStorage.setItem('workmind_documents', JSON.stringify(updated));
      return updated;
    });
  };

  const addHubMessage = (dept: Department, msg: HubMessage) => {
    setDepartmentHubs(prev => {
      const currentMsgs = prev[dept] || [];
      const updated = {
        ...prev,
        [dept]: [...currentMsgs, msg]
      };
      localStorage.setItem('workmind_hubs', JSON.stringify(updated));
      return updated;
    });
  };

  const resetApp = () => {
    localStorage.removeItem('workmind_client_data');
    localStorage.removeItem('workmind_conversations');
    localStorage.removeItem('workmind_documents');
    localStorage.removeItem('workmind_hubs');
    setClientDataState(null);
    setConversations({});
    setDepartmentDocuments({});
    setDepartmentHubs({});
    setActiveDepartment(null);
  }

  return (
    <AppContext.Provider value={{
      clientData,
      setClientData,
      conversations,
      addMessage,
      setConversationMessages,
      departmentDocuments,
      addDocument,
      removeDocument,
      departmentHubs,
      addHubMessage,
      activeDepartment,
      setActiveDepartment,
      resetApp
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
