import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiPackage, FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp, FiUsers, FiTool } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user, role } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        inProgress: 0,
        closed: 0,
        pendingApproval: 0,
    });
    const [recentCases, setRecentCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchRecentCases();
    }, []);

    const fetchStats = async () => {
        try {
            const casesRef = collection(db, 'cases');
            const snapshot = await getDocs(casesRef);
            const allCases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setStats({
                total: allCases.length,
                open: allCases.filter(c => c.jobStatus === 'Open').length,
                inProgress: allCases.filter(c => c.jobStatus === 'In Progress').length,
                closed: allCases.filter(c => c.jobStatus === 'Closed').length,
                pendingApproval: allCases.filter(c => c.jobStatus === 'Pending Approval').length,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error('Failed to load statistics');
        }
    };

    const fetchRecentCases = async () => {
        try {
            const casesRef = collection(db, 'cases');
            const q = query(casesRef, orderBy('caseRegisterDate', 'desc'), limit(5));
            const snapshot = await getDocs(q);
            setRecentCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching recent cases:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Cases', value: stats.total, color: 'from-blue-500 to-blue-600', icon: <FiPackage size={24} /> },
        { label: 'Open Cases', value: stats.open, color: 'from-green-500 to-green-600', icon: <FiAlertCircle size={24} /> },
        { label: 'In Progress', value: stats.inProgress, color: 'from-yellow-500 to-yellow-600', icon: <FiClock size={24} /> },
        { label: 'Pending Approval', value: stats.pendingApproval, color: 'from-orange-500 to-orange-600', icon: <FiTool size={24} /> },
        { label: 'Closed Cases', value: stats.closed, color: 'from-gray-500 to-gray-600', icon: <FiCheckCircle size={24} /> },
    ];

    const quickActions = {
        callcenter: [
            { name: 'Register New Case', path: '/cases/register', icon: '📝', color: 'bg-blue-600' },
            { name: 'Search Cases', path: '/cases/search', icon: '🔍', color: 'bg-indigo-600' },
        ],
        service: [
            { name: 'Register Case', path: '/cases/register', icon: '📝', color: 'bg-blue-600' },
            { name: 'Raise Part Request', path: '/part-requests/new', icon: '🔧', color: 'bg-orange-600' },
            { name: 'Search Cases', path: '/cases/search', icon: '🔍', color: 'bg-indigo-600' },
        ],
        warehouse: [
            { name: 'Dispatch Parts', path: '/warehouse/dispatch', icon: '📦', color: 'bg-green-600' },
            { name: 'View Requests', path: '/warehouse/dispatch', icon: '👀', color: 'bg-teal-600' },
        ],
        admin: [
            { name: 'Register Case', path: '/cases/register', icon: '📝', color: 'bg-blue-600' },
            { name: 'Approve Requests', path: '/admin/approvals', icon: '✅', color: 'bg-purple-600' },
            { name: 'View Reports', path: '/reports', icon: '📊', color: 'bg-green-600' },
            { name: 'Admin Panel', path: '/admin/dashboard', icon: '👑', color: 'bg-red-600' },
        ],
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Open': 'badge-green',
            'Closed': 'badge-gray',
            'In Progress': 'badge-yellow',
            'Pending Approval': 'badge-orange',
            'Part Dispatched': 'badge-blue',
        };
        return badges[status] || 'badge-gray';
    };

    return (
        <div>
            {/* Welcome Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Welcome back, {user?.name || user?.email?.split('@')[0]}!
                </h2>
                <p className="text-gray-400 mt-1">Here's what's happening with your service center today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {statCards.map((card) => (
                    <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white/80 text-sm">{card.label}</p>
                                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                            </div>
                            <div className="text-white/70">{card.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="card lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FiTrendingUp className="text-blue-400" /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {quickActions[role]?.map((action) => (
                            <Link
                                key={action.name}
                                to={action.path}
                                className={`${action.color} hover:opacity-90 p-4 rounded-xl text-white font-semibold transition-all text-center group`}
                            >
                                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{action.icon}</div>
                                <span className="text-sm">{action.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FiUsers className="text-green-400" /> Role Info
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                            <span className="text-gray-300">Your Role</span>
                            <span className="font-semibold capitalize text-blue-400">{role}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                            <span className="text-gray-300">Logged in as</span>
                            <span className="font-mono text-sm text-gray-300">{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Cases */}
            <div className="card">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiClock className="text-yellow-400" /> Recent Cases
                </h3>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : recentCases.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <p>No cases found. Create your first case!</p>
                        <Link to="/cases/register" className="btn-primary inline-block mt-4">Register Case →</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-white/10">
                                <tr>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Job ID</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Mobile</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCases.map((caseItem) => (
                                    <tr key={caseItem.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="py-3 px-4 font-mono text-sm">{caseItem.jobId}</td>
                                        <td className="py-3 px-4">{caseItem.customerName}</td>
                                        <td className="py-3 px-4">{caseItem.mobileNumber}</td>
                                        <td className="py-3 px-4">
                                            <span className={getStatusBadge(caseItem.jobStatus)}>
                                                {caseItem.jobStatus}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm">{new Date(caseItem.caseRegisterDate).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">
                                            <Link to={`/service/case/${caseItem.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                                                View →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}