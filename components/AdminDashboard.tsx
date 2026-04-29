import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Users, CreditCard, Activity, ArrowLeft, Search, Plus, TrendingUp, AlertCircle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
    const { userProfile } = useApp();
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [assignModal, setAssignModal] = useState<{ show: boolean; userId: string; email: string }>({ show: false, userId: '', email: '' });
    const [creditAmount, setCreditAmount] = useState('100');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchAdminData = async () => {
        if (userProfile?.role !== 'admin') return;
        setLoading(true);
        try {
            const headers = { 'x-user-role': 'admin' };
            const [usersRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/users`, { headers }),
                fetch(`${API_URL}/api/admin/dashboard-stats`, { headers })
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (err) {
            console.error("Admin fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, [userProfile]);

    const handleAssignCredits = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/assign-credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
                body: JSON.stringify({
                    userId: assignModal.userId,
                    email: assignModal.email,
                    amount: creditAmount
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        Workmind Admin
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500">Platform Cost: <span className="text-red-600 font-bold">${stats?.totalPlatformCostUSD?.toFixed(2) || '0.00'}</span></span>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <p className="text-2xl font-black text-gray-900">{stats?.recentLogs?.length || 0}+</p>
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
                                    <th className="px-6 py-3 text-center">Cost to Us</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((u) => (
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
                                            <span className="text-sm font-medium text-gray-600">${u.totalCostUSD?.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
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
                </div>

                {/* Billing Model Info */}
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
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
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Input Tokens</p>
                                            <p className="text-lg font-black">1 <span className="text-xs font-normal text-gray-400">Credit / 500 Tokens</span></p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Output Tokens</p>
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
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Scenario: User sends 1,200 tokens & AI replies with 450 tokens</p>
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
                    <h2 className="font-bold text-gray-900 mb-4">Recent Platform Usage</h2>
                    <div className="space-y-4">
                        {stats?.recentLogs?.map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                        <Activity className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{log.user?.email || 'Unknown User'}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-gray-900">-{log.creditsUsed?.toFixed(2)} <span className="text-[8px] uppercase text-gray-400">Credits</span></p>
                                    <p className="text-[9px] text-red-500 font-medium">${log.costUSD?.toFixed(4)} cost</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Assign Modal */}
            {assignModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fadeIn">
                        <h3 className="text-xl font-black text-gray-900 mb-2">Assign Credits</h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Add credits to <span className="text-indigo-600 font-bold">{assignModal.email}</span></p>

                        <div className="space-y-4">
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
                                    Assign Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
