import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiPackage, FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp, FiUsers, FiTool } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user, role } = useAuth();
    const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, closed: 0, pendingApproval: 0 });
    const [recentCases, setRecentCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [serviceCenterId, setServiceCenterId] = useState(null);

    useEffect(() => {
        fetchUserServiceCenter();
        fetchStats();
        fetchRecentCases();
    }, []);

    const fetchUserServiceCenter = async () => {
        // For demo, assign service center ID based on role or user email
        // In production, you would store serviceCenterId in user document
        if (role === 'callcenter') {
            setServiceCenterId('SC-CALL-001');
        } else if (role === 'service') {
            setServiceCenterId('SC-WBL-001');
        } else if (role === 'admin') {
            setServiceCenterId(null); // Admin sees all
        } else {
            setServiceCenterId(null);
        }
    };

    const fetchStats = async () => {
        try {
            let casesRef = collection(db, 'cases');
            let snapshot;
            if (serviceCenterId && role !== 'admin') {
                // Filter cases by service center ID
                const q = query(casesRef, where('serviceCenterId', '==', serviceCenterId));
                snapshot = await getDocs(q);
            } else {
                snapshot = await getDocs(casesRef);
            }
            const allCases = snapshot.docs.map(d => d.data());
            setStats({
                total: allCases.length,
                open: allCases.filter(c => c.jobStatus === 'Open').length,
                inProgress: allCases.filter(c => c.jobStatus === 'In Progress').length,
                closed: allCases.filter(c => c.jobStatus === 'Closed').length,
                pendingApproval: allCases.filter(c => c.jobStatus === 'Pending Approval').length,
            });
        } catch (error) {
            toast.error('Failed to load stats');
        }
    };

    const fetchRecentCases = async () => {
        try {
            let casesRef = collection(db, 'cases');
            let q;
            if (serviceCenterId && role !== 'admin') {
                q = query(casesRef, where('serviceCenterId', '==', serviceCenterId), orderBy('caseRegisterDate', 'desc'), limit(5));
            } else {
                q = query(casesRef, orderBy('caseRegisterDate', 'desc'), limit(5));
            }
            const snapshot = await getDocs(q);
            setRecentCases(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Cases', value: stats.total, color: 'blue', icon: <FiPackage /> },
        { label: 'Open', value: stats.open, color: 'green', icon: <FiAlertCircle /> },
        { label: 'In Progress', value: stats.inProgress, color: 'yellow', icon: <FiClock /> },
        { label: 'Pending Approval', value: stats.pendingApproval, color: 'orange', icon: <FiTool /> },
        { label: 'Closed', value: stats.closed, color: 'gray', icon: <FiCheckCircle /> },
    ];

    const quickActions = {
        callcenter: [{ name: 'Register Case', path: '/cases/register', icon: '📝', color: 'bg-blue-600' }, { name: 'Search Cases', path: '/cases/search', icon: '🔍', color: 'bg-indigo-600' }],
        service: [{ name: 'Register Case', path: '/cases/register', icon: '📝', color: 'bg-blue-600' }, { name: 'Raise Part Request', path: '/part-requests/new', icon: '🔧', color: 'bg-orange-600' }, { name: 'Search Cases', path: '/cases/search', icon: '🔍', color: 'bg-indigo-600' }],
        warehouse: [{ name: 'Dispatch Parts', path: '/warehouse/dispatch', icon: '📦', color: 'bg-green-600' }],
        admin: [{ name: 'Register Case', path: '/cases/register', icon: '📝', color: 'bg-blue-600' }, { name: 'Approve Requests', path: '/admin/approvals', icon: '✅', color: 'bg-purple-600' }, { name: 'Reports', path: '/reports', icon: '📊', color: 'bg-green-600' }, { name: 'Admin Panel', path: '/admin/dashboard', icon: '👑', color: 'bg-red-600' }],
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Welcome back, {user?.name || user?.email?.split('@')[0]}!
                </h2>
                <p className="text-slate-400 mt-1">
                    {serviceCenterId ? `Service Center: ${serviceCenterId}` : 'Admin Dashboard - All Centers'}
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {statCards.map(card => (
                    <div key={card.label} className={`bg-gradient-to-br from-${card.color}-600 to-${card.color}-700 rounded-2xl p-5`}>
                        <div className="flex justify-between"><div><p className="text-white/80 text-sm">{card.label}</p><p className="text-3xl font-bold text-white">{card.value}</p></div><div className="text-white/70 text-2xl">{card.icon}</div></div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="card lg:col-span-2"><h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><FiTrendingUp /> Quick Actions</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{quickActions[role]?.map(a => (<Link key={a.name} to={a.path} className={`${a.color} p-4 rounded-xl text-white text-center hover:scale-105 transition`}><div className="text-2xl">{a.icon}</div><span className="text-sm">{a.name}</span></Link>))}</div></div>
                <div className="card"><h3 className="text-xl font-semibold mb-4"><FiUsers /> Role Info</h3><div className="space-y-3"><div className="flex justify-between p-3 bg-slate-800/30 rounded-xl"><span className="text-slate-400">Your Role</span><span className="capitalize text-blue-400">{role}</span></div><div className="flex justify-between p-3 bg-slate-800/30 rounded-xl"><span className="text-slate-400">Email</span><span className="text-sm">{user?.email}</span></div>{serviceCenterId && <div className="flex justify-between p-3 bg-slate-800/30 rounded-xl"><span className="text-slate-400">Center ID</span><span className="font-mono text-sm">{serviceCenterId}</span></div>}</div></div>
            </div>
            <div className="card"><h3 className="text-xl font-semibold mb-4">Recent Cases</h3>{loading ? <div className="flex justify-center py-8"><div className="loading-spinner"></div></div> : recentCases.length === 0 ? <div className="text-center py-8"><p>No cases yet</p><Link to="/cases/register" className="btn-primary mt-4 inline-block">Register Case</Link></div> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Job ID</th><th>Customer</th><th>Mobile</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>{recentCases.map(c => (<tr key={c.id}><td className="font-mono text-sm">{c.jobId}</td><td>{c.customerName}</td><td>{c.mobileNumber}</td><td><span className={`badge ${c.jobStatus === 'Open' ? 'badge-green' : 'badge-yellow'}`}>{c.jobStatus}</span></td><td>{new Date(c.caseRegisterDate).toLocaleDateString()}</td><td><Link to={`/case/${c.id}`} className="text-blue-400">View</Link></td></tr>))}</tbody></table></div>}</div>
        </div>
    );
}