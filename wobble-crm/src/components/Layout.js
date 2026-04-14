import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const { role } = useAuth();

    const getSidebarItems = () => {
        const commonItems = [
            { name: 'Dashboard', path: '/dashboard', icon: '📊' },
            { name: 'Search Case', path: '/cases/search', icon: '🔍' },
        ];

        const roleItems = {
            callcenter: [
                { name: 'Register Case', path: '/cases/register', icon: '📝' },
            ],
            service: [
                { name: 'Register Case', path: '/cases/register', icon: '📝' },
                { name: 'Part Request', path: '/part-requests/new', icon: '🔧' },
            ],
            warehouse: [
                { name: 'Dispatch Parts', path: '/warehouse/dispatch', icon: '📦' },
            ],
            admin: [
                { name: 'Register Case', path: '/cases/register', icon: '📝' },
                { name: 'Part Approvals', path: '/admin/approvals', icon: '✅' },
                { name: 'Reports', path: '/reports', icon: '📈' },
                { name: 'Admin Dashboard', path: '/admin/dashboard', icon: '👑' },
            ],
        };

        return [...commonItems, ...(roleItems[role] || [])];
    };

    return (
        <div className="min-h-screen bg-dark-900">
            <Header />
            <div className="flex">
                <Sidebar items={getSidebarItems()} />
                <main className="flex-1 p-6 ml-64">
                    {children}
                </main>
            </div>
        </div>
    );
}