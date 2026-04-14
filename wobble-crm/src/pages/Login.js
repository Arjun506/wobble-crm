import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('callcenter');
    const { login } = useAuth();
    const navigate = useNavigate();

    const demoCredentials = {
        callcenter: { email: 'callcenter@wobble.com', password: 'callcenter123' },
        service: { email: 'service@wobble.com', password: 'service123' },
        warehouse: { email: 'warehouse@wobble.com', password: 'warehouse123' },
        admin: { email: 'admin@wobble.com', password: 'admin123' },
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setEmail(demoCredentials[role].email);
        setPassword(demoCredentials[role].password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
            <div className="max-w-md w-full mx-4">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🔄</div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Wobble One CRM
                    </h1>
                    <p className="text-gray-400 mt-2">Login to continue</p>
                </div>

                <div className="card">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {Object.keys(demoCredentials).map((role) => (
                            <button
                                key={role}
                                onClick={() => handleRoleSelect(role)}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all ${selectedRole === role
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                                    }`}
                            >
                                {role.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full py-3">
                            Login
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6 text-sm text-gray-500">
                    Demo credentials pre-filled based on role selection
                </div>
            </div>
        </div>
    );
}