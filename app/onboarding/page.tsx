'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function Onboarding() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    country: '',
    company_size: '1-10',
    department_name: 'Sales',
    top_problems: '',
    top_goals: '',
    current_tools: '',
    output_types: '',
    extra_notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: session?.user?.email }) // Assuming email is ID for simplicity in demo
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to save onboarding data');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-10 border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">Configure Your Workmind</h1>
          <p className="text-gray-500">We need to map your business DNA to train your first expert agent.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Company Name</label>
              <input required name="company_name" onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" placeholder="Acme Inc." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Industry / Sector</label>
              <input required name="industry" onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" placeholder="SaaS, Retail, etc." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Country</label>
              <input required name="country" onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-teal outline-none" placeholder="United States" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Company Size</label>
              <select name="company_size" onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-teal outline-none">
                <option>1-10</option>
                <option>11-50</option>
                <option>51-200</option>
                <option>200+</option>
              </select>
            </div>
          </div>

          <div className="bg-brand-bg p-6 rounded-lg border border-brand-teal/20">
            <h3 className="font-bold text-brand-navy mb-4">First Agent Setup</h3>
            <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Which department do you need help with first?</label>
            <select name="department_name" onChange={handleChange} className="w-full p-3 border rounded-lg mb-4">
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
              <option value="Procurement">Procurement</option>
              <option value="IT">IT</option>
              <option value="Social Media">Social Media</option>
            </select>
            
            <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Top 3 Problems to Solve</label>
            <textarea required name="top_problems" onChange={handleChange} className="w-full p-3 border rounded-lg h-24" placeholder="e.g. Slow lead qualification, inconsistent messaging..." />
          </div>

          <div className="grid grid-cols-1 gap-6">
             <div>
              <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Current Tool Stack</label>
              <input name="current_tools" onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="HubSpot, Slack, Xero..." />
            </div>
             <div>
              <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Desired Output Types</label>
              <input name="output_types" onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="SOPs, Emails, Reports..." />
            </div>
             <div>
              <label className="block text-sm font-semibold text-brand-deepBlue mb-2">Goals</label>
              <textarea name="top_goals" onChange={handleChange} className="w-full p-3 border rounded-lg h-20" placeholder="Increase velocity, reduce risk..." />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-brand-navy text-white font-bold py-4 rounded-lg hover:bg-brand-deepBlue transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : 'Initialize Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}