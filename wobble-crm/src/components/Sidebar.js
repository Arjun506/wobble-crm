import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ items }) {
    return (
        <aside className="fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 bg-dark-800 border-r border-gray-700 overflow-y-auto">
            <nav className="p-4">
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                : 'text-gray-300 hover:bg-dark-700'
                            }`
                        }
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}