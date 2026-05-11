import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Users, CreditCard, Activity, ArrowLeft, Search, Plus, TrendingUp, AlertCircle, Database, Zap, Cpu, Loader, Heart, MessageSquare, Star, RefreshCw } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { authFetch, getAuthHeaders } from '../lib/auth';

export const AdminDashboard: React.FC = () => {
    const { userProfile } = useApp();
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [assignModal, setAssignModal] = useState<{ show: boolean; userId: string; email: string }>({ show: false, userId: '', email: '' });
    const [creditAmount, setCreditAmount] = useState('100');
    const [creditMode, setCreditMode] = useState<'add' | 'set' | 'reduce'>('add');
    const [permissionsModal, setPermissionsModal] = useState<{ show: boolean; userId: string; email: string; allowedModels: string[] }>({ show: false, userId: '', email: '', allowedModels: [] });
    const [systemSettings, setSystemSettings] = useState<{ defaultProvider: string; defaultModel: string }>({ defaultProvider: '', defaultModel: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPage, setUsersPage] = useState(1);
    const usersPerPage = 10;
    const logsPerPage = 10;
    const [logsData, setLogsData] = useState<{ logs: any[]; total: number; totalPages: number }>({ logs: [], total: 0, totalPages: 0 });
    const [logsLoading, setLogsLoading] = useState(false);
    const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [waitlistTab, setWaitlistTab] = useState<'pending' | 'approved'>('pending');
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [creditRequests, setCreditRequests] = useState<any[]>([]);
    const [creditRequestsLoading, setCreditRequestsLoading] = useState(false);


    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchAdminData = async () => {
        if (userProfile?.role !== 'admin') return;
        setLoading(true);
        try {
            const [usersRes, statsRes] = await Promise.all([
                authFetch(`${API_URL}/api/admin/users`),
                authFetch(`${API_URL}/api/admin/dashboard-stats`)
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (statsRes.ok) setStats(await statsRes.json());

            const settingsRes = await authFetch(`${API_URL}/api/settings/ai-config`);
            if (settingsRes.ok) {
                const data = await settingsRes.json();
                setSystemSettings({ defaultProvider: data.modelProvider, defaultModel: data.model });
            }

            const waitlistRes = await authFetch(`${API_URL}/api/admin/waitlist`);
            if (waitlistRes.ok) {
                setWaitlistEntries(await waitlistRes.json());
            }

            fetchFeedback();
            fetchCreditRequests();
        } catch (err) {
            console.error("Admin fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeedback = async () => {
        setFeedbackLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/admin/feedback`);
            if (res.ok) {
                setFeedbackList(await res.json());
            }
        } catch (err) {
            console.error("Feedback fetch error", err);
        } finally {
            setFeedbackLoading(false);
        }
    };

    const fetchCreditRequests = async () => {
        setCreditRequestsLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/admin/credit-requests`);
            if (res.ok) {
                setCreditRequests(await res.json());
            }
        } catch (err) {
            console.error("Credit requests fetch error", err);
        } finally {
            setCreditRequestsLoading(false);
        }
    };

    const handleApproveCreditRequest = async (requestId: string) => {
        try {
            const res = await authFetch(`${API_URL}/api/admin/credit-requests/${requestId}/approve`, {
                method: 'POST'
            });
            if (res.ok) {
                fetchCreditRequests();
                fetchAdminData(); // Refresh users/stats
            }
        } catch (err) {
            console.error("Approve credit request error", err);
        }
    };

    const handleRejectCreditRequest = async (requestId: string) => {
        try {
            const res = await authFetch(`${API_URL}/api/admin/credit-requests/${requestId}/reject`, {
                method: 'POST'
            });
            if (res.ok) {
                fetchCreditRequests();
            }
        } catch (err) {
            console.error("Reject credit request error", err);
        }
    };


    const fetchUsageLogs = async (page: number) => {
        if (userProfile?.role !== 'admin') return;
        setLogsLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/admin/usage-logs?page=${page}&limit=${logsPerPage}`);
            if (res.ok) {
                const data = await res.json();
                setLogsData(data);
            }
        } catch (err) {
            console.error("Logs fetch error", err);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, [userProfile]);

    useEffect(() => {
        fetchUsageLogs(currentPage);
    }, [currentPage, userProfile]);

    // Reset users page to 1 when searching
    useEffect(() => {
        setUsersPage(1);
    }, [search]);

    const handleAssignCredits = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/assign-credits`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    userId: assignModal.userId,
                    email: assignModal.email,
                    amount: creditAmount,
                    mode: creditMode
                })
            });
            if (res.ok) {
                setAssignModal({ show: false, userId: '', email: '' });
                fetchAdminData();
            }
        } catch (err) {
            console.error("Assign error", err);
        }
    };
    
    const handleUpdatePermissions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/update-user-permissions`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    userId: permissionsModal.userId,
                    allowedModels: permissionsModal.allowedModels
                })
            });
            if (res.ok) {
                setPermissionsModal({ show: false, userId: '', email: '', allowedModels: [] });
                fetchAdminData();
            }
        } catch (err) {
            console.error("Permission update error", err);
        }
    };

    const handleUpdateGlobalSettings = async () => {
        try {
            await fetch(`${API_URL}/api/settings/ai-config`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    modelProvider: systemSettings.defaultProvider,
                    model: systemSettings.defaultModel
                })
            });
            alert("Global settings updated!");
        } catch (err) {
            console.error("Global settings update error", err);
        }
    };

    const handleApproveWaitlist = async (waitlistId: string) => {
        try {
            setApprovingId(waitlistId);
            const response = await authFetch(`${API_URL}/api/admin/waitlist/${waitlistId}/approve`, {
                method: 'POST',
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve user.');
            }

            setWaitlistEntries((prev) => prev.map((entry) => 
                entry.id === waitlistId ? { ...entry, status: 'approved', updatedAt: new Date().toISOString() } : entry
            ));
        } catch (err: any) {
            alert(err.message || 'Failed to approve user.');
        } finally {
            setApprovingId(null);
        }
    };

    const pendingWaitlist = waitlistEntries.filter(e => e.status === 'pending' || !e.status);
    const approvedWaitlist = waitlistEntries.filter(e => e.status === 'approved');

    if (userProfile?.role !== 'admin') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
                <p className="text-gray-600 mt-2">Only administrators can access this panel.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg">Back to Safety</button>
            </div>
        );
    }

    const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search));

    const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
    const paginatedUsers = filteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        TheWorkMind Admin
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { throw new Error('Sentry Test Error from Admin Panel!'); }}
                        className="px-4 py-1.5 bg-red-100 text-red-600 font-bold rounded-lg text-xs hover:bg-red-200 transition-colors"
                    >
                        Test Sentry Error
                    </button>
                    <span className="text-xs font-medium text-gray-500">Platform Cost: <span className="text-red-600 font-bold">${stats?.totalPlatformCostUSD?.toFixed(2) || '0.00'}</span></span>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                {/* Global Settings Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] items-end gap-6">
                    <div>
                        <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-500" /> Global Default Provider</h2>
                        <select 
                            className="w-full bg-gray-50 border-transparent rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={systemSettings.defaultProvider}
                            onChange={(e) => setSystemSettings({ ...systemSettings, defaultProvider: e.target.value })}
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="openai">OpenAI (GPT-4o)</option>
                            <option value="claude">Anthropic Claude</option>
                        </select>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" /> Default Model ID</h2>
                        <input 
                            type="text"
                            placeholder="e.g. gemini-2.0-flash-exp"
                            className="w-full bg-gray-50 border-transparent rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={systemSettings.defaultModel}
                            onChange={(e) => setSystemSettings({ ...systemSettings, defaultModel: e.target.value })}
                        />
                    </div>
                    <div>
                        <button onClick={handleUpdateGlobalSettings} className="w-full md:w-auto h-[46px] px-6 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-md">
                            Save Settings
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2 text-gray-400">
                            <Users className="w-5 h-5" />
                            <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.totalUsers || 0}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2 text-gray-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Credits in Circulation</p>
                        <p className="text-2xl font-black text-indigo-600">{stats?.totalCreditsInCirculation?.toFixed(0) || 0}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2 text-gray-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Total AI Messages</p>
                        <p className="text-2xl font-black text-gray-900">{logsData.total || 0}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2 text-gray-400">
                            <Database className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Total Input</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.totalInputTokens?.toLocaleString() || 0} <span className="text-[10px] font-medium text-gray-400 uppercase">tok</span></p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2 text-gray-400">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Total Output</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.totalOutputTokens?.toLocaleString() || 0} <span className="text-[10px] font-medium text-gray-400 uppercase">tok</span></p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Waitlist Management</h2>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setWaitlistTab('pending')}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${waitlistTab === 'pending' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pending ({pendingWaitlist.length})
                            </button>
                            <button 
                                onClick={() => setWaitlistTab('approved')}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${waitlistTab === 'approved' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Approved ({approvedWaitlist.length})
                            </button>
                        </div>
                    </div>
                    
                    {waitlistTab === 'pending' && (
                        <div className="divide-y divide-gray-100">
                            {pendingWaitlist.length === 0 ? (
                                <div className="p-6 text-sm text-gray-500">No pending waitlist approvals.</div>
                            ) : pendingWaitlist.map((entry) => (
                                <div key={entry.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div>
                                            <p className="font-bold text-lg text-gray-900">{entry.fullName}</p>
                                            <p className="text-sm font-medium text-indigo-600">{entry.designation} @ {entry.companyName}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                            <p><span className="text-gray-400">Email:</span> <span className="font-medium text-gray-700">{entry.email}</span></p>
                                            <p><span className="text-gray-400">Phone:</span> <span className="font-medium text-gray-700">{entry.phone}</span></p>
                                            <p><span className="text-gray-400">Budget:</span> <span className="font-medium text-gray-700">{entry.budget}</span></p>
                                            <p><span className="text-gray-400">Submitted:</span> <span className="font-medium text-gray-700">{new Date(entry.createdAt).toLocaleDateString()}</span></p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleApproveWaitlist(entry.id)}
                                        disabled={approvingId === entry.id}
                                        className="mt-2 md:mt-0 whitespace-nowrap rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {approvingId === entry.id ? 'Approving...' : 'Approve User'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {waitlistTab === 'approved' && (
                        <div className="overflow-x-auto">
                            {approvedWaitlist.length === 0 ? (
                                <div className="p-6 text-sm text-gray-500">No approved waitlist entries yet.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3">Name & Role</th>
                                            <th className="px-6 py-3">Contact Info</th>
                                            <th className="px-6 py-3">Budget</th>
                                            <th className="px-6 py-3 text-right">Approved On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {approvedWaitlist.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">{entry.fullName}</p>
                                                    <p className="text-xs text-gray-500">{entry.designation} at <span className="font-medium text-gray-700">{entry.companyName}</span></p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-gray-900">{entry.email}</p>
                                                    <p className="text-xs text-gray-500">{entry.phone}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md">
                                                        {entry.budget}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm text-gray-500">{new Date(entry.updatedAt).toLocaleDateString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Credit Requests Management */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" /> Credit Requests ({creditRequests.length})
                        </h2>
                        <button 
                            onClick={fetchCreditRequests}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                            <RefreshCw className={`w-4 h-4 ${creditRequestsLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {creditRequests.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p>No pending credit requests.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">User & Date</th>
                                        <th className="px-6 py-3 text-center">Amount Requested</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {creditRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{req.user?.email || 'Unknown User'}</p>
                                                <p className="text-[10px] text-gray-400">{new Date(req.createdAt).toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-600 text-sm font-black rounded-lg border border-amber-100">
                                                    {req.amount} Credits
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRejectCreditRequest(req.id)}
                                                    className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApproveCreditRequest(req.id)}
                                                    className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md shadow-green-100"
                                                >
                                                    Approve & Add
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* User Feedback Management */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500" /> User Feedback ({feedbackList.length})
                        </h2>
                        <button 
                            onClick={fetchFeedback}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                            <RefreshCw className={`w-4 h-4 ${feedbackLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {feedbackList.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p>No feedback received yet.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 whitespace-nowrap">User & Date</th>
                                        <th className="px-6 py-3 text-center">Rating</th>
                                        <th className="px-6 py-3">Most Valuable Features</th>
                                        <th className="px-6 py-3">Improvements & Dream Features</th>
                                        <th className="px-6 py-3">Usage</th>
                                        <th className="px-6 py-3 text-right">Pricing</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {feedbackList.map((f) => (
                                        <tr key={f.id} className="hover:bg-gray-50/50 transition-colors align-top">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{f.email}</p>
                                                <p className="text-[10px] text-gray-400">{new Date(f.createdAt).toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="text-sm font-black text-amber-500">{f.rating}</span>
                                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {f.valuableFeatures?.map((v: string) => (
                                                        <span key={v} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold">{v}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-xs text-gray-700 font-medium mb-2 line-clamp-3" title={f.improvements}>
                                                    <span className="text-gray-400 uppercase text-[9px] font-black mr-1">Impr:</span> {f.improvements || 'None'}
                                                </p>
                                                <p className="text-xs text-indigo-600 font-bold line-clamp-3" title={f.mustHaveFeature}>
                                                    <span className="text-indigo-300 uppercase text-[9px] font-black mr-1">Must:</span> {f.mustHaveFeature || 'None'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Depts: {f.departments?.join(', ') || '-'}</span>
                                                    <span className={`text-[10px] font-black ${f.continueUsing === 'Yes' ? 'text-green-500' : 'text-amber-500'}`}>Continue: {f.continueUsing}</span>
                                                    {f.startTime && <span className="text-[9px] text-gray-400">Start: {f.startTime}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-black text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                                                    {f.pricingRange || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>


                {/* User Management */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="font-bold text-gray-900">User Wallets</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by email or ID..."
                                className="pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all w-full md:w-64"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3 text-center">Credits Left</th>
                                    <th className="px-6 py-3 text-center">Model Access</th>
                                    <th className="px-6 py-3 text-center">Tokens (In/Out)</th>
                                    <th className="px-6 py-3 text-center">Cost to Us</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{u.email}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{u.id}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${u.credits <= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                {u.credits?.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex gap-1 justify-center">
                                                {['gemini', 'openai', 'claude'].map(m => (
                                                    <span key={m} className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${u.allowedModels?.includes(m) ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        {m.charAt(0)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-gray-500 whitespace-nowrap">
                                                <span><span className="font-bold text-gray-700">{u.totalInputTokens?.toLocaleString() || 0}</span> in</span>
                                                <span><span className="font-bold text-gray-700">{u.totalOutputTokens?.toLocaleString() || 0}</span> out</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-medium text-gray-600">${u.totalCostUSD?.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => setPermissionsModal({ show: true, userId: u.id, email: u.email, allowedModels: u.allowedModels || [] })}
                                                className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
                                                title="Manage Permissions"
                                            >
                                                <Database className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setAssignModal({ show: true, userId: u.id, email: u.email })}
                                                className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
                                                title="Assign Credits"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Users Pagination Controls */}
                    {totalUserPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100 bg-gray-50/30">
                            <button
                                onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                                disabled={usersPage === 1}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                            >
                                Previous
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {[...Array(totalUserPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (page === 1 || page === totalUserPages || (page >= usersPage - 1 && page <= usersPage + 1)) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setUsersPage(page)}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${usersPage === page ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (page === usersPage - 2 || page === usersPage + 2) {
                                        return <span key={page} className="text-gray-300 px-1">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => setUsersPage(prev => Math.min(totalUserPages, prev + 1))}
                                disabled={usersPage === totalUserPages}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Billing Model Info */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">System Billing Model</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">How Credits & Costs are Calculated</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> Credit Deduction Rule
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Input Tokens</p>
                                            <p className="text-lg font-black">1 <span className="text-xs font-normal text-gray-400">Credit / 500 Tokens</span></p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Output Tokens</p>
                                            <p className="text-lg font-black">1 <span className="text-xs font-normal text-gray-400">Credit / 300 Tokens</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                                        <Database className="w-4 h-4" /> Internal Platform Cost
                                    </h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        We track the actual API cost to ensure profitability. For Claude 3.5 Sonnet:
                                    </p>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex justify-between text-xs py-1 border-b border-white/5">
                                            <span className="text-gray-500">Input Cost (per 1M)</span>
                                            <span className="font-bold">$3.00</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1 border-b border-white/5">
                                            <span className="text-gray-500">Output Cost (per 1M)</span>
                                            <span className="font-bold">$15.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-purple-400" /> Real Example
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-3 bg-black/40 rounded-xl">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Scenario: User sends 1,200 tokens & AI replies with 450 tokens</p>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span>Input Charge (1200 / 500)</span>
                                                <span className="text-indigo-400">+2.4 Credits</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Output Charge (450 / 300)</span>
                                                <span className="text-indigo-400">+1.5 Credits</span>
                                            </div>
                                            <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-black text-sm">
                                                <span>Total Deduction</span>
                                                <span className="text-white">3.9 Credits</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic">
                                        * At this usage, your actual cost is ~$0.010, while the user consumes ~4 credits.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Usage Logs */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-gray-900">Recent Platform Usage</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">Page {currentPage} of {logsData.totalPages || 1}</span>
                            {logsLoading && <Loader className="w-3 h-3 animate-spin text-indigo-500" />}
                        </div>
                    </div>
                    
                    <div className="space-y-4 min-h-[100px] relative">
                        {logsLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        )}
                        
                        {logsData.logs.map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-indigo-100 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                        <Activity className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{log.user?.email || 'Unknown User'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-gray-400 font-medium">{new Date(log.createdAt).toLocaleString()}</p>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{log.modelId?.split('/').pop() || 'AI'}</p>
                                            {(log.inputTokens > 0 || log.outputTokens > 0) && (
                                                <>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap"><span className="font-bold text-gray-700">{log.inputTokens || 0}</span> in</p>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap"><span className="font-bold text-gray-700">{log.outputTokens || 0}</span> out</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-gray-900">-{log.creditsUsed?.toFixed(2)} <span className="text-[10px] uppercase text-gray-400">Credits</span></p>
                                    <p className="text-[10px] text-red-500 font-bold mt-0.5">${log.costUSD?.toFixed(4)} cost</p>
                                </div>
                            </div>
                        ))}

                        {logsData.logs.length === 0 && !logsLoading && (
                            <div className="text-center py-12">
                                <Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No activity logs found.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {logsData.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-50">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                            >
                                Previous
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {[...Array(logsData.totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (page === 1 || page === logsData.totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} className="text-gray-300 px-1">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(logsData.totalPages, prev + 1))}
                                disabled={currentPage === logsData.totalPages}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Assign Modal */}
            {assignModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fadeIn">
                        <h3 className="text-xl font-black text-gray-900 mb-2">Adjust User Credits</h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Update credits for <span className="text-indigo-600 font-bold">{assignModal.email}</span></p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Action Type</label>
                                <select 
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl py-2 px-3 text-sm font-bold transition-all outline-none"
                                    value={creditMode}
                                    onChange={(e: any) => setCreditMode(e.target.value)}
                                >
                                    <option value="add">Add credits (+)</option>
                                    <option value="reduce">Reduce credits (-)</option>
                                    <option value="set">Set direct amount (=)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Credit Amount</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl py-3 px-4 text-lg font-black transition-all outline-none"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setAssignModal({ show: false, userId: '', email: '' })}
                                    className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignCredits}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                >
                                    Update Credits
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {permissionsModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fadeIn">
                        <h3 className="text-xl font-black text-gray-900 mb-2">Model Access</h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Configure allowed AI providers for <span className="text-indigo-600 font-bold">{permissionsModal.email}</span></p>

                        <div className="space-y-4">
                            {['gemini', 'openai', 'claude'].map(provider => (
                                <label key={provider} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border-2 border-transparent has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                            <Cpu className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <span className="text-sm font-bold capitalize">{provider}</span>
                                    </div>
                                    <input 
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={permissionsModal.allowedModels.includes(provider)}
                                        onChange={(e) => {
                                            const models = e.target.checked 
                                                ? [...permissionsModal.allowedModels, provider]
                                                : permissionsModal.allowedModels.filter(m => m !== provider);
                                            setPermissionsModal({ ...permissionsModal, allowedModels: models });
                                        }}
                                    />
                                </label>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setPermissionsModal({ show: false, userId: '', email: '', allowedModels: [] })}
                                    className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePermissions}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                >
                                    Save Rules
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

