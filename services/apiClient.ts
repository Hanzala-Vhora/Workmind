// services/apiClient.ts
// Frontend API client for backend communication

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  // Intake Forms
  intakeForms: {
    create: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/intake-forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to create intake form: ${response.statusText}`);
      return response.json();
    },

    getAll: async (workspaceId: string) => {
      const response = await fetch(`${API_BASE_URL}/intake-forms?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error(`Failed to fetch intake forms: ${response.statusText}`);
      return response.json();
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/intake-forms/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch intake form: ${response.statusText}`);
      return response.json();
    },

    update: async (id: string, data: any) => {
      const response = await fetch(`${API_BASE_URL}/intake-forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to update intake form: ${response.statusText}`);
      return response.json();
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/intake-forms/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete intake form: ${response.statusText}`);
      return response.json();
    },

    submit: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/intake-forms/${id}/submit`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Failed to submit intake form: ${response.statusText}`);
      return response.json();
    },
  },

  // Workspaces
  workspaces: {
    create: async (name: string, userId: string) => {
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId }),
      });
      if (!response.ok) throw new Error(`Failed to create workspace: ${response.statusText}`);
      return response.json();
    },

    getAll: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/workspaces?userId=${userId}`);
      if (!response.ok) throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
      return response.json();
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch workspace: ${response.statusText}`);
      return response.json();
    },
  },

  // Agents
  agents: {
    create: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to create agent: ${response.statusText}`);
      return response.json();
    },

    getAll: async (workspaceId: string) => {
      const response = await fetch(`${API_BASE_URL}/agents?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error(`Failed to fetch agents: ${response.statusText}`);
      return response.json();
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/agents/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch agent: ${response.statusText}`);
      return response.json();
    },
  },

  // Threads
  threads: {
    create: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to create thread: ${response.statusText}`);
      return response.json();
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/threads/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch thread: ${response.statusText}`);
      return response.json();
    },

    addMessage: async (threadId: string, role: string, content: string) => {
      const response = await fetch(`${API_BASE_URL}/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content }),
      });
      if (!response.ok) throw new Error(`Failed to add message: ${response.statusText}`);
      return response.json();
    },
  },
};

// Usage Example:
/*
// In your React component
import { apiClient } from '@/services/apiClient';

async function handleCreateIntakeForm() {
  try {
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
    console.log('Form created:', form);
  } catch (error) {
    console.error('Error creating form:', error);
  }
}
*/
