// Example Integration: Using IntakeForm Component with Backend API

import React, { useState } from 'react';
import { apiClient } from '@/services/apiClient';

interface IntakeFormData {
  workspaceId: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  department: string;
  industry: string;
  companySize: string;
  currentState?: string;
  mainGoals: string[];
  challenges: string[];
  resources?: string;
  timeline: string;
  budget?: string;
}

export function IntakeFormExample() {
  const [formData, setFormData] = useState<IntakeFormData>({
    workspaceId: 'workspace-123', // Get from context/auth
    companyName: '',
    contactEmail: '',
    department: '',
    industry: '',
    companySize: '',
    mainGoals: [],
    challenges: [],
    timeline: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayInput = (field: 'mainGoals' | 'challenges', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create the intake form
      const createdForm = await apiClient.intakeForms.create(formData);
      console.log('Form created:', createdForm);
      
      // Auto-submit if checkbox is checked
      const autoSubmit = document.querySelector('input[name="autoSubmit"]') as HTMLInputElement;
      if (autoSubmit?.checked) {
        await apiClient.intakeForms.submit(createdForm.id);
        console.log('Form submitted');
      }

      setSuccess(true);
      setFormData({
        workspaceId: formData.workspaceId,
        companyName: '',
        contactEmail: '',
        department: '',
        industry: '',
        companySize: '',
        mainGoals: [],
        challenges: [],
        timeline: '',
      });

      // Show success message
      alert('Intake form created successfully!');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create intake form');
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Intake Form</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Intake form created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Company Name *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Acme Corporation"
          />
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Contact Email *</label>
          <input
            type="email"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="contact@acme.com"
          />
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Contact Phone</label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium mb-1">Department *</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Department</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
            <option value="HR">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="IT">Information Technology</option>
          </select>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium mb-1">Industry *</label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Technology, Healthcare, Finance, etc."
          />
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-sm font-medium mb-1">Company Size *</label>
          <select
            name="companySize"
            value={formData.companySize}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-100">51-100 employees</option>
            <option value="101-500">101-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>

        {/* Main Goals (CSV) */}
        <div>
          <label className="block text-sm font-medium mb-1">Main Goals (comma-separated) *</label>
          <input
            type="text"
            value={formData.mainGoals.join(', ')}
            onChange={(e) => handleArrayInput('mainGoals', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Increase revenue, Improve efficiency, Expand market"
          />
        </div>

        {/* Challenges (CSV) */}
        <div>
          <label className="block text-sm font-medium mb-1">Challenges (comma-separated) *</label>
          <input
            type="text"
            value={formData.challenges.join(', ')}
            onChange={(e) => handleArrayInput('challenges', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Market competition, Talent shortage, Budget constraints"
          />
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-sm font-medium mb-1">Timeline *</label>
          <select
            name="timeline"
            value={formData.timeline}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Timeline</option>
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
            <option value="1 year">1 year</option>
            <option value="2 years">2 years</option>
            <option value="Ongoing">Ongoing</option>
          </select>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium mb-1">Budget</label>
          <input
            type="text"
            name="budget"
            value={formData.budget || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="$50,000"
          />
        </div>

        {/* Resources */}
        <div>
          <label className="block text-sm font-medium mb-1">Resources</label>
          <textarea
            name="resources"
            value={formData.resources || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, resources: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe available resources..."
            rows={3}
          />
        </div>

        {/* Current State */}
        <div>
          <label className="block text-sm font-medium mb-1">Current State</label>
          <textarea
            name="currentState"
            value={formData.currentState || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, currentState: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe current situation..."
            rows={3}
          />
        </div>

        {/* Auto-submit Checkbox */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="autoSubmit"
              defaultChecked={false}
              className="mr-2"
            />
            <span className="text-sm">Auto-submit after creation</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-md font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Intake Form'}
        </button>
      </form>

      {/* Debug Info (Remove in production) */}
      <div className="mt-6 p-4 bg-gray-100 rounded text-xs text-gray-600">
        <p>Backend URL: http://localhost:5000/api</p>
        <p>Workspace ID: {formData.workspaceId}</p>
        <p>Form Status: {success ? '✓ Created' : 'Pending'}</p>
      </div>
    </div>
  );
}

/**
 * HOW TO USE THIS COMPONENT:
 * 
 * 1. Import in your page:
 *    import { IntakeFormExample } from '@/components/IntakeFormExample';
 * 
 * 2. Add to your JSX:
 *    <IntakeFormExample />
 * 
 * 3. Ensure backend is running:
 *    npm run dev:all
 * 
 * 4. Test the form in browser at http://localhost:3000
 * 
 * 5. Check backend console for API calls
 * 
 * 6. Verify data in Neon database
 */
