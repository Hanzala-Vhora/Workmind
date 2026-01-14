
import React, { createContext, useContext, useState, useEffect } from 'react';
import { IntakeData, Conversation, Department, StoredDocument, HubMessage } from '../types';

interface AppContextType {
  clientData: IntakeData | null;
  setClientData: (data: IntakeData) => void;

  // 1:1 Expert Chat
  conversations: Record<string, Conversation>;
  addMessage: (dept: Department, role: 'user' | 'assistant', content: string, escalation?: any) => void;

  // Context Repository (Files)
  departmentDocuments: Record<string, StoredDocument[]>;
  addDocument: (dept: Department, doc: StoredDocument) => void;

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

  // Persist to local storage
  useEffect(() => {
    const savedData = localStorage.getItem('workmind_client_data');
    if (savedData) setClientDataState(JSON.parse(savedData));

    const savedConvos = localStorage.getItem('workmind_conversations');
    if (savedConvos) setConversations(JSON.parse(savedConvos));

    const savedDocs = localStorage.getItem('workmind_documents');
    if (savedDocs) setDepartmentDocuments(JSON.parse(savedDocs));

    const savedHubs = localStorage.getItem('workmind_hubs');
    if (savedHubs) setDepartmentHubs(JSON.parse(savedHubs));
  }, []);

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
      departmentDocuments,
      addDocument,
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
