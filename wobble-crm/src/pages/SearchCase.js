import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { useAuth } from '../contexts/AuthContext';
import { FiSearch, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SearchCase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Enter search term');
      return;
    }
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'cases'));
      const allCases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allCases.filter(c => 
        c.jobId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobileNumber?.includes(searchTerm) ||
        c.imei1?.includes(searchTerm) ||
        c.alternateNumber?.includes(searchTerm)
      );
      setResults(filtered);
      if (filtered.length === 0) toast('No cases found', { icon: '🔍' });
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Open': 'badge-green',
      'Closed': 'badge-gray',
      'In Progress': 'badge-yellow',
      'Pending Approval': 'badge-orange',
      'Part Dispatch Pending': 'badge-indigo',
      'Part Dispatched': 'badge-blue',
      'Part Received': 'badge-purple',
      'Repair Done': 'badge-teal',
      'Mobile Handover to Customer': 'badge-pink',
=======
import { FiSearch, FiEye, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SearchCase() {
    const [activeTab, setActiveTab] = useState('cases');
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!searchTerm.trim()) { toast.error('Enter search term'); return; }
        setLoading(true);
        try {
            const col = activeTab === 'cases' ? 'cases' : 'activations';
            const snapshot = await getDocs(collection(db, col));
            const allData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = allData.filter(item => {
                if (activeTab === 'cases') {
                    return item.jobId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.mobileNumber?.includes(searchTerm) ||
                           item.imei1?.includes(searchTerm) ||
                           item.alternateNumber?.includes(searchTerm);
                } else {
                    return item.imei?.includes(searchTerm) ||
                           item.mobileNumber?.includes(searchTerm) ||
                           item.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
                }
            });
            setResults(filtered);
            if (filtered.length === 0) toast('No results found', { icon: '🔍' });
        } catch (error) { toast.error('Search failed'); }
        finally { setLoading(false); }
>>>>>>> e409aaa74fa91e2e2150a69928ec806d823dab1c
    };
    return map[status] || 'badge-gray';
  };

  const handleViewCase = (caseId) => {
    navigate(`/case/${caseId}`);
  };

<<<<<<< HEAD
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Search Cases</h2>
        <p className="text-gray-500 mt-1">Search by Mobile / IMEI / Job ID / Alternate Number</p>
      </div>
      <div className="card mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter search term"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-field flex-1"
          />
          <button onClick={handleSearch} disabled={loading} className="btn-primary">
            {loading ? 'Searching...' : <><FiSearch /> Search</>}
          </button>
=======
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Search</h2>
                <p className="text-slate-400">Search cases and mobile activations</p>
            </div>

            <div className="flex gap-2 border-b mb-6">
                <button onClick={() => setActiveTab('cases')} className={`px-6 py-3 ${activeTab === 'cases' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Case Search</button>
                <button onClick={() => setActiveTab('activations')} className={`px-6 py-3 ${activeTab === 'activations' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Activation Search</button>
            </div>

            <div className="card mb-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder={activeTab === 'cases' ? "Enter Job ID, Mobile, IMEI, Alternate Number" : "Enter IMEI, Mobile, Customer Name"}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                        className="input-field flex-1"
                    />
                    <button onClick={handleSearch} className="btn-primary">
                        <FiSearch /> Search
                    </button>
                </div>
            </div>

            {results.length > 0 && (
                <div className="card animate-fadeIn">
                    <h3 className="text-xl font-semibold mb-4">Found {results.length} result(s)</h3>
                    <div className="overflow-x-auto">
                        {activeTab === 'cases' ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Job ID</th>
                                        <th>Customer</th>
                                        <th>Mobile</th>
                                        <th>Status</th>
                                        <th>Device</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map(c => (
                                        <tr key={c.id}>
                                            <td className="font-mono text-sm">{c.jobId}</td>
                                            <td>{c.customerName}</td>
                                            <td>{c.mobileNumber}</td>
                                            <td><span className={getStatusBadge(c.jobStatus)}>{c.jobStatus}</span></td>
                                            <td>{c.deviceModel || 'N/A'}</td>
                                            <td><button onClick={() => navigate(`/case/${c.id}`)} className="text-blue-400"><FiEye /> View</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>IMEI</th>
                                        <th>Customer</th>
                                        <th>Mobile</th>
                                        <th>Warranty</th>
                                        <th>Activation Date</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map(a => (
                                        <tr key={a.id}>
                                            <td className="font-mono text-sm">{a.imei}</td>
                                            <td>{a.customerName}</td>
                                            <td>{a.mobileNumber}</td>
                                            <td>{a.warrantyType}</td>
                                            <td>{new Date(a.activationDate).toLocaleDateString()}</td>
                                            <td><FiCheckCircle className="text-green-400" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
>>>>>>> e409aaa74fa91e2e2150a69928ec806d823dab1c
        </div>
      </div>
      {loading && <div className="flex justify-center py-8"><div className="loading-spinner"></div></div>}
      {!loading && results.length > 0 && (
        <div className="card animate-fadeIn">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Found {results.length} case(s)</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Device</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map(c => (
                  <tr key={c.id}>
                    <td className="font-mono text-sm">{c.jobId}</td>
                    <td>{c.customerName}</td>
                    <td>{c.mobileNumber}</td>
                    <td><span className={getStatusBadge(c.jobStatus)}>{c.jobStatus}</span></td>
                    <td>{c.deviceModel || 'N/A'}</td>
                    <td><button onClick={() => handleViewCase(c.id)} className="text-blue-600 hover:text-blue-800"><FiEye /> View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && searchTerm && results.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500">No cases found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}

