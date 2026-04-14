import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUserCheck } from 'react-icons/fi';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('callcenter');
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
        const result = await login(email, password);
        if (result.success) navigate('/dashboard');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-md w-full mx-4">
                <div className="text-center mb-8"><div className="text-7xl mb-4">🔄</div><h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Wobble One CRM</h1><p className="text-slate-400 mt-2">Complete Service Management</p></div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                    <div className="grid grid-cols-2 gap-3 mb-6">{Object.keys(demoCredentials).map(role => (<button key={role} onClick={() => handleRoleSelect(role)} className={`px-4 py-3 rounded-xl font-semibold transition ${selectedRole === role ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}><FiUserCheck className="inline mr-2" />{role.toUpperCase()}</button>))}</div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4"><label className="block text-slate-300 mb-2 text-sm">Email</label><div className="relative"><FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" required /></div></div>
                        <div className="mb-6"><label className="block text-slate-300 mb-2 text-sm">Password</label><div className="relative"><FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field pl-10" required /></div></div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">{loading ? 'Logging in...' : 'Login'}</button>
                    </form>
                </div>
                <div className="text-center mt-6 text-xs text-slate-500">Demo credentials pre-filled by role selection</div>
            </div>
        </div>
    );
}