import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SearchCase() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            toast.error('Please enter a search term');
            return;
        }

        setLoading(true);
        try {
            const casesRef = collection(db, 'cases');
            const mobileQuery = query(casesRef, where('mobileNumber', '==', searchTerm));
            const imeiQuery = query(casesRef, where('imei1', '==', searchTerm));
            const jobIdQuery = query(casesRef, where('jobId', '==', searchTerm));

            const [mobileSnap, imeiSnap, jobIdSnap] = await Promise.all([
                getDocs(mobileQuery),
                getDocs(imeiQuery),
                getDocs(jobIdQuery),
            ]);

            const results = [];
            mobileSnap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
            imeiSnap.forEach(doc => {
                if (!results.find(r => r.id === doc.id)) results.push({ id: doc.id, ...doc.data() });
            });
            jobIdSnap.forEach(doc => {
                if (!results.find(r => r.id === doc.id)) results.push({ id: doc.id, ...doc.data() });
            });

            setSearchResults(results);
            if (results.length === 0) {
                toast('No cases found', { icon: '🔍' });
            } else {
                toast.success(`Found ${results.length} case(s)`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleViewCase = (caseId) => {
        navigate(`/case/${caseId}`);
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
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Search Cases
                </h2>
                <p className="text-gray-400 mt-1">Search by Mobile Number, IMEI, or Job ID</p>
            </div>

            <div className="card mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Enter Mobile Number / IMEI / Job ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="input-field pl-10"
                        />
                    </div>
                    <button onClick={handleSearch} disabled={loading} className="btn-primary">
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {searchResults.length > 0 && (
                <div className="card animate-fadeIn">
                    <h3 className="text-xl font-semibold mb-4">Found {searchResults.length} case(s)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-white/10">
                                <tr>
                                    <th className="text-left py-3 px-4">Job ID</th>
                                    <th className="text-left py-3 px-4">Customer</th>
                                    <th className="text-left py-3 px-4">Mobile</th>
                                    <th className="text-left py-3 px-4">Status</th>
                                    <th className="text-left py-3 px-4">Device</th>
                                    <th className="text-left py-3 px-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map((caseItem) => (
                                    <tr key={caseItem.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="py-3 px-4 font-mono text-sm">{caseItem.jobId}</td>
                                        <td className="py-3 px-4">{caseItem.customerName}</td>
                                        <td className="py-3 px-4">{caseItem.mobileNumber}</td>
                                        <td className="py-3 px-4">
                                            <span className={getStatusBadge(caseItem.jobStatus)}>
                                                {caseItem.jobStatus}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm">{caseItem.deviceModel || 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleViewCase(caseItem.id)}
                                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                            >
                                                <FiEye size={16} /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {searchTerm && searchResults.length === 0 && !loading && (
                <div className="card text-center py-12 animate-fadeIn">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-gray-400">No cases found for "{searchTerm}"</p>
                    <button onClick={() => navigate('/cases/register')} className="btn-primary mt-4">
                        Register New Case
                    </button>
                </div>
            )}
        </div>
    );
}