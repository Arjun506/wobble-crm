import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SearchCase() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!searchTerm.trim()) { toast.error('Enter search term'); return; }
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'cases'));
            const allCases = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = allCases.filter(c =>
                c.jobId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.mobileNumber?.includes(searchTerm) ||
                c.imei1?.includes(searchTerm) ||
                c.alternateNumber?.includes(searchTerm)
            );
            setResults(filtered);
            if (filtered.length === 0) toast('No cases found', { icon: '🔍' });
        } catch (error) { toast.error('Search failed'); }
        finally { setLoading(false); }
    };

    const getStatusBadge = (status) => {
        const map = { 'Open': 'badge-green', 'Closed': 'badge-gray', 'In Progress': 'badge-yellow', 'Pending Approval': 'badge-orange', 'Part Dispatched': 'badge-blue' };
        return map[status] || 'badge-gray';
    };

    return (
        <div>
            <div className="mb-6"><h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Search Cases</h2><p className="text-slate-400">By Mobile / IMEI / Job ID / Alternate Number</p></div>
            <div className="card mb-6"><div className="flex gap-4"><input type="text" placeholder="Enter search term" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} className="input-field flex-1" /><button onClick={handleSearch} className="btn-primary"><FiSearch /> Search</button></div></div>
            {results.length > 0 && (<div className="card animate-fadeIn"><h3 className="text-xl font-semibold mb-4">Found {results.length} case(s)</h3><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Job ID</th><th>Customer</th><th>Mobile</th><th>Status</th><th>Device</th><th></th></tr></thead><tbody>{results.map(c => (<tr key={c.id}><td className="font-mono text-sm">{c.jobId}</td><td>{c.customerName}</td><td>{c.mobileNumber}</td><td><span className={getStatusBadge(c.jobStatus)}>{c.jobStatus}</span></td><td>{c.deviceModel || 'N/A'}</td><td><button onClick={() => navigate(`/case/${c.id}`)} className="text-blue-400"><FiEye /> View</button></td></tr>))}</tbody></table></div></div>)}
        </div>
    );
}