import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiPlusCircle, FiTool, FiCheckCircle, FiPackage, FiBarChart2, FiUsers, FiLogOut, FiMenu, FiX, FiSettings } from 'react-icons/fi';

export default function Layout({ children }) {
    const { role, user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();

    const getMenuItems = () => {
        const common = [
            { name: 'Dashboard', path: '/dashboard', icon: <FiHome size={20} /> },
            { name: 'Search Cases', path: '/cases/search', icon: <FiSearch size={20} /> },
        ];
        const roleMap = {
            callcenter: [{ name: 'Register Case', path: '/cases/register', icon: <FiPlusCircle size={20} /> }],
            service: [
                { name: 'Register Case', path: '/cases/register', icon: <FiPlusCircle size={20} /> },
                { name: 'Raise Part Request', path: '/part-requests/new', icon: <FiTool size={20} /> },
            ],
            warehouse: [{ name: 'Dispatch Parts', path: '/warehouse/dispatch', icon: <FiPackage size={20} /> }],
            admin: [
                { name: 'Register Case', path: '/cases/register', icon: <FiPlusCircle size={20} /> },
                { name: 'Approve Requests', path: '/admin/approvals', icon: <FiCheckCircle size={20} /> },
                { name: 'Reports', path: '/reports', icon: <FiBarChart2 size={20} /> },
                { name: 'Admin Panel', path: '/admin/dashboard', icon: <FiUsers size={20} /> },
            ],
        };
        return [...common, ...(roleMap[role] || [])];
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Mobile top bar */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex justify-between items-center lg:hidden">
                <button onClick={toggleSidebar} className="p-2 rounded-lg bg-slate-800 text-white"><FiMenu size={20} /></button>
                <div className="text-white font-bold">Wobble One</div>
                <div className="relative">
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="p-2 rounded-lg bg-slate-800 text-white"><FiSettings size={20} /></button>
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-white/10 py-2">
                            <div className="px-4 py-2 border-b border-white/10"><p className="text-sm text-white">{user?.email?.split('@')[0]}</p><p className="text-xs text-slate-400 capitalize">{role}</p></div>
                            <button onClick={logout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2"><FiLogOut /> Logout</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur-sm border-r border-white/10 transition-all duration-300 z-40 ${sidebarOpen ? 'w-72' : 'w-0 lg:w-20'} overflow-hidden`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        {sidebarOpen && <div><h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Wobble One</h1><p className="text-xs text-slate-500">Service CRM</p></div>}
                    </div>
                    {sidebarOpen && <button onClick={toggleSidebar} className="text-slate-400 hover:text-white"><FiX size={20} /></button>}
                </div>
                <nav className="p-4 space-y-2">
                    {getMenuItems().map((item) => (
                        <Link key={item.path} to={item.path} onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10'}`}>
                            {item.icon}{sidebarOpen && <span>{item.name}</span>}
                        </Link>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <div className="relative">
                        <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/10 transition">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">{user?.email?.charAt(0).toUpperCase()}</div>
                            {sidebarOpen && <div className="flex-1 text-left"><p className="text-sm font-medium">{user?.name || user?.email?.split('@')[0]}</p><p className="text-xs text-slate-400 capitalize">{role}</p></div>}
                            {sidebarOpen && <FiSettings className="text-slate-400" />}
                        </button>
                        {showUserMenu && sidebarOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-xl shadow-xl border border-white/10 p-2">
                                <button onClick={logout} className="flex items-center gap-2 w-full p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><FiLogOut /> Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'} pt-16 lg:pt-0`}>
                <div className="p-6 lg:p-8 animate-fadeIn">{children}</div>
            </main>
        </div>
    );
}