import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CallCenterActivationSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Enter search term');
      return;
    }
    setLoading(true);
    try {
      // Search cases by mobile/imei/jobId
      const casesSnap = await getDocs(collection(db, 'cases'));
      const allCases = casesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filteredCases = allCases.filter(c =>
        c.mobileNumber?.includes(searchTerm) ||
        c.imei1?.includes(searchTerm) ||
        c.jobId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setCases(filteredCases);

      // Search devices by imei/mobile
      const devicesSnap = await getDocs(collection(db, 'devices'));
      const allDevices = devicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filteredDevices = allDevices.filter(d =>
        d.imei?.includes(searchTerm) ||
        d.mobileNumber?.includes(searchTerm)
      );
      setDevices(filteredDevices);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6"><h2 className="text-3xl font-bold">Unified Search</h2><p className="text-gray-500">Search cases and device activations</p></div>
      <div className="card mb-6"><div className="flex gap-4"><input type="text" placeholder="Mobile / IMEI / Job ID" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field flex-1" /><button onClick={handleSearch} className="btn-primary"><FiSearch /> Search</button></div></div>
      {loading && <div className="loading-spinner mx-auto"></div>}
      {!loading && (cases.length > 0 || devices.length > 0) && (
        <div className="space-y-6">
          {cases.length > 0 && <div className="card"><h3 className="text-xl font-semibold mb-3">Cases ({cases.length})</h3><table className="data-table"><thead><tr><th>Job ID</th><th>Customer</th><th>Mobile</th><th>Status</th></tr></thead><tbody>{cases.map(c => <tr key={c.id}><td>{c.jobId}</td><td>{c.customerName}</td><td>{c.mobileNumber}</td><td>{c.jobStatus}</td></tr>)}</tbody></table></div>}
          {devices.length > 0 && <div className="card"><h3 className="text-xl font-semibold mb-3">Device Activations ({devices.length})</h3><table className="data-table"><thead><tr><th>IMEI</th><th>Customer</th><th>Mobile</th><th>Purchase Date</th><th>Warranty</th></tr></thead><tbody>{devices.map(d => <tr key={d.id}><td>{d.imei}</td><td>{d.customerName}</td><td>{d.mobileNumber}</td><td>{new Date(d.purchaseDate).toLocaleDateString()}</td><td>{d.warrantyStatus}</td></tr>)}</tbody></table></div>}
        </div>
      )}
    </div>
  );
}