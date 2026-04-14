import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
    const { user, role, logout } = useAuth();

    const getRoleBadge = () => {
        const badges = {
            callcenter: 'bg-blue-600',
            service: 'bg-green-600',
            warehouse: 'bg-yellow-600',
            admin: 'bg-purple-600',
        };
        return badges[role] || 'bg-gray-600';
    };

    const getRoleName = () => {
        const names = {
            callcenter: '📞 Call Center',
            service: '🔧 Service Center',
            warehouse: '📦 Warehouse',
            admin: '👑 Admin',
        };
        return names[role] || role;
    };

    return (
        <header className="bg-dark-800/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Mobile Repair Logo */}
                    <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6" />
                            </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Wobble One
                        </h1>
                        <p className="text-xs text-gray-500">Service CRM</p>
                    </div>
                    {role && (
                        <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge()}`}>
                            {getRoleName()}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-white">{user?.name || user?.email?.split('@')[0]}</p>
                        <p className="text-xs text-gray-400 capitalize">{role}</p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all duration-200 border border-red-500/30 hover:border-red-500"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}