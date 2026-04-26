import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { db, storage } from '../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
=======
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc, query, where } from 'firebase/firestore';
>>>>>>> e409aaa74fa91e2e2150a69928ec806d823dab1c
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, FiUsers, FiTool, FiAlertCircle, FiDownload, FiUpload } from 'react-icons/fi';

export default function AdminDashboard() {
<<<<<<< HEAD
  const [cases, setCases] = useState([]);
  const [partRequests, setPartRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [activeTab, setActiveTab] = useState('cases');
  const [editingCase, setEditingCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [warrantyRequests, setWarrantyRequests] = useState([]);
=======
    const [cases, setCases] = useState([]);
    const [partRequests, setPartRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [warrantyRequests, setWarrantyRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('cases');
    const [editingCase, setEditingCase] = useState(null);
    const [loading, setLoading] = useState(true);
>>>>>>> e409aaa74fa91e2e2150a69928ec806d823dab1c

  useEffect(() => {
    fetchAllData();
  }, []);

<<<<<<< HEAD
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const casesSnap = await getDocs(collection(db, 'cases'));
      const partsSnap = await getDocs(collection(db, 'partRequests'));
      const usersSnap = await getDocs(collection(db, 'users'));
      const centersSnap = await getDocs(collection(db, 'serviceCenters'));
      const warrantySnap = await getDocs(collection(db, 'warrantyRequests'));
      setCases(casesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPartRequests(partsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setServiceCenters(centersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setWarrantyRequests(warrantySnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCase = async (caseId, updatedData) => {
    try {
      await updateDoc(doc(db, 'cases', caseId), updatedData);
      toast.success('Case updated');
      fetchAllData();
      setEditingCase(null);
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleDeleteCase = async (caseId) => {
    if (window.confirm('Delete this case permanently?')) {
      try {
        await deleteDoc(doc(db, 'cases', caseId));
        toast.success('Case deleted');
        fetchAllData();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const handleApprovePart = async (partId, caseId) => {
    try {
      await updateDoc(doc(db, 'partRequests', partId), { status: 'Approved', approvedAt: new Date().toISOString() });
      await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Part Approved' });
      toast.success('Part request approved');
      fetchAllData();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleRejectPart = async (partId, caseId) => {
    if (window.confirm('Reject this part request?')) {
      try {
        await updateDoc(doc(db, 'partRequests', partId), { status: 'Rejected', rejectedAt: new Date().toISOString() });
        await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Open' });
        toast.success('Part request rejected');
        fetchAllData();
      } catch (error) {
        toast.error('Rejection failed');
      }
    }
  };

  const handleDeletePartRequest = async (partId) => {
    if (window.confirm('Delete this part request?')) {
      await deleteDoc(doc(db, 'partRequests', partId));
      toast.success('Deleted');
      fetchAllData();
    }
  };

  const handleApproveWarranty = async (reqId, imei, extendedYears) => {
    try {
      // Update device warranty in 'devices' collection
      const devicesSnap = await getDocs(query(collection(db, 'devices'), where('imei', '==', imei)));
      if (!devicesSnap.empty) {
        const deviceDoc = devicesSnap.docs[0];
        const currentExpiry = deviceDoc.data().warrantyExpiry ? new Date(deviceDoc.data().warrantyExpiry) : new Date();
        const newExpiry = new Date(currentExpiry);
        newExpiry.setFullYear(newExpiry.getFullYear() + extendedYears);
        await updateDoc(doc(db, 'devices', deviceDoc.id), {
          extendedWarranty: true,
          warrantyExpiry: newExpiry.toISOString(),
          warrantyStatus: 'In Warranty',
        });
      }
      await updateDoc(doc(db, 'warrantyRequests', reqId), { status: 'Approved', approvedAt: new Date().toISOString() });
      toast.success('Warranty approved');
      fetchAllData();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleRejectWarranty = async (reqId) => {
    await updateDoc(doc(db, 'warrantyRequests', reqId), { status: 'Rejected', rejectedAt: new Date().toISOString() });
    toast.success('Warranty request rejected');
    fetchAllData();
  };

  const handleBulkUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      let success = 0;
      for (const row of rows) {
        await addDoc(collection(db, 'devices'), {
          imei: row.imei,
          customerName: row.customerName,
          mobileNumber: row.mobileNumber,
          purchaseDate: row.purchaseDate,
          purchasePlatform: row.purchasePlatform || 'Online',
          dealerName: row.dealerName || '',
          isActive: true,
          activationDate: new Date().toISOString(),
          warrantyStatus: 'In Warranty',
          warrantyExpiry: new Date(new Date(row.purchaseDate).setFullYear(new Date(row.purchaseDate).getFullYear() + 1)).toISOString(),
        });
        success++;
      }
      toast.success(`${success} devices activated`);
      fetchAllData();
=======
    const fetchAll = async () => {
        setLoading(true);
        try {
            const casesSnap = await getDocs(collection(db, 'cases'));
            const partsSnap = await getDocs(collection(db, 'partRequests'));
            const usersSnap = await getDocs(collection(db, 'users'));
            const warrantySnap = await getDocs(collection(db, 'warrantyRequests'));
            setCases(casesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setPartRequests(partsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setWarrantyRequests(warrantySnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) { toast.error('Failed'); } finally { setLoading(false); }
>>>>>>> e409aaa74fa91e2e2150a69928ec806d823dab1c
    };
    reader.readAsArrayBuffer(file);
  };

<<<<<<< HEAD
  const handleExport = (type) => {
    let exportData = [];
    let filename = '';
    if (type === 'cases') {
      exportData = cases.map(c => ({ 'Job ID': c.jobId, 'Customer': c.customerName, 'Mobile': c.mobileNumber, 'Status': c.jobStatus }));
      filename = 'cases_report';
    } else if (type === 'open') {
      exportData = cases.filter(c => c.jobStatus === 'Open').map(c => ({ 'Job ID': c.jobId, 'Customer': c.customerName, 'Mobile': c.mobileNumber }));
      filename = 'open_cases';
    } else if (type === 'pending') {
      exportData = cases.filter(c => c.jobStatus === 'Pending Approval').map(c => ({ 'Job ID': c.jobId, 'Customer': c.customerName }));
      filename = 'pending_approval';
    } else if (type === 'closed') {
      exportData = cases.filter(c => c.jobStatus === 'Closed').map(c => ({ 'Job ID': c.jobId, 'Customer': c.customerName, 'Closed Date': c.closedDate }));
      filename = 'closed_cases';
    } else if (type === 'partRequests') {
      exportData = partRequests.map(p => ({ 'Job ID': p.jobId, 'Part': p.partName, 'Quantity': p.quantity, 'Status': p.status }));
      filename = 'part_requests';
    }
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success('Exported');
  };

  const stats = [
    { label: 'Total Cases', value: cases.length, icon: <FiAlertCircle />, color: 'blue' },
    { label: 'Open Cases', value: cases.filter(c => c.jobStatus === 'Open').length, icon: <FiAlertCircle />, color: 'green' },
    { label: 'Pending Approvals', value: partRequests.filter(p => p.status === 'Pending Approval').length, icon: <FiTool />, color: 'yellow' },
    { label: 'Total Users', value: users.length, icon: <FiUsers />, color: 'purple' },
  ];
=======
    const exportCases = () => { 
        const ws = XLSX.utils.json_to_sheet(cases.map(c => ({ 'Job ID': c.jobId, 'Customer': c.customerName, 'Mobile': c.mobileNumber, 'Status': c.jobStatus, 'Date': new Date(c.caseRegisterDate).toLocaleString() }))); 
        const wb = XLSX.utils.book_new(); 
        XLSX.utils.book_append_sheet(wb, ws, 'Cases'); 
        XLSX.writeFile(wb, `cases_${new Date().toISOString().slice(0, 10)}.xlsx`); 
        toast.success('Exported'); 
    };

    const closeOldCases = async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const oldCases = cases.filter(c => c.jobStatus === 'Open' && new Date(c.caseRegisterDate) < sevenDaysAgo);
        for (const c of oldCases) {
            await updateDoc(doc(db, 'cases', c.id), { jobStatus: 'Closed', closedAt: new Date().toISOString() });
        }
        toast.success(`Closed ${oldCases.length} old cases`);
        fetchAll();
    };

    const handleUpdateCase = async (id, data) => { 
        await updateDoc(doc(db, 'cases', id), data); 
        toast.success('Updated'); 
        fetchAll(); 
        setEditingCase(null); 
    };
    
    const handleDeleteCase = async (id) => { 
        if (window.confirm('Delete?')) { 
            await deleteDoc(doc(db, 'cases', id)); 
            toast.success('Deleted'); 
            fetchAll(); 
        } 
    };
    
    const handleApprovePart = async (partId, caseId) => { 
        await updateDoc(doc(db, 'partRequests', partId), { status: 'Approved', approvedAt: new Date().toISOString() }); 
        await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Part Approved' }); 
        toast.success('Approved'); 
        fetchAll(); 
    };
    
    const handleRejectPart = async (partId, caseId) => { 
        await updateDoc(doc(db, 'partRequests', partId), { status: 'Rejected', rejectedAt: new Date().toISOString() }); 
        await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Open' }); 
        toast.success('Rejected'); 
        fetchAll(); 
    };

    const handleApproveWarranty = async (reqId, imei) => {
        await updateDoc(doc(db, 'warrantyRequests', reqId), { status: 'Approved', approvedAt: new Date().toISOString() });
        const q = query(collection(db, 'activations'), where('imei', '==', imei));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await updateDoc(doc(db, 'activations', snap.docs[0].id), { warrantyType: 'Extended', warrantyEndDate: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() });
        }
        toast.success('Warranty extended');
        fetchAll();
    };

    const handleRejectWarranty = async (reqId) => {
        await updateDoc(doc(db, 'warrantyRequests', reqId), { status: 'Rejected', rejectedAt: new Date().toISOString() });
        toast.success('Warranty request rejected');
        fetchAll();
    };

    const handleBulkUpload = async (file) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            try {
                for (const row of jsonData) {
                    await addDoc(collection(db, 'activations'), {
                        imei: row.IMEI,
                        customerName: row.Name,
                        mobileNumber: row.Mobile,
                        email: row.Email,
                        purchaseDate: row.PurchaseDate,
                        warrantyType: '1 Year',
                        activationDate: new Date().toISOString(),
                        warrantyEndDate: new Date(new Date(row.PurchaseDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    });
                }
                toast.success('Bulk upload completed');
                fetchAll();
            } catch (error) {
                toast.error('Upload failed');
            }
        };
        reader.readAsArrayBuffer(file);
    };
>>>>>>> e409aaa74fa91e2e2150a69928ec806d823dab1c

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin Dashboard</h2>
        <p className="text-gray-500 mt-1">Full control – edit, delete, approve, export</p>
      </div>

<<<<<<< HEAD
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br from-${stat.color}-600 to-${stat.color}-700 rounded-2xl p-5 shadow-lg`}>
            <div className="flex justify-between items-start">
              <div><p className="text-gray-700 text-sm">{stat.label}</p><p className="text-3xl font-bold text-gray-800">{stat.value}</p></div>
              <div className="text-gray-500 text-2xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => handleExport('cases')} className="btn-primary text-sm"><FiDownload /> All Cases</button>
        <button onClick={() => handleExport('open')} className="btn-secondary text-sm"><FiDownload /> Open</button>
        <button onClick={() => handleExport('pending')} className="btn-warning text-sm"><FiDownload /> Pending</button>
        <button onClick={() => handleExport('closed')} className="btn-secondary text-sm"><FiDownload /> Closed</button>
        <button onClick={() => handleExport('partRequests')} className="btn-primary text-sm"><FiDownload /> Part Requests</button>
        <label className="btn-secondary text-sm cursor-pointer"><FiUpload /> Bulk Upload Device<input type="file" accept=".xlsx,.xls" onChange={e => handleBulkUpload(e.target.files[0])} className="hidden" /></label>
      </div>

      <div className="flex gap-2 border-b border-white/10 mb-6">
        {['cases', 'partRequests', 'users', 'warrantyRequests', 'serviceCenters'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-600'}`}>
            {tab === 'cases' ? '📋 Cases' : tab === 'partRequests' ? '🔧 Part Requests' : tab === 'users' ? '👥 Users' : tab === 'warrantyRequests' ? '🛡️ Warranty' : '🏢 Centers'}
          </button>
        ))}
      </div>

      {activeTab === 'cases' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm"><thead><tr><th>Job ID</th><th>Customer</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {cases.map(c => (
              <tr key={c.id}><td>{c.jobId}</td><td>{c.customerName}</td><td>{c.mobileNumber}</td><td><span className={`badge ${c.jobStatus === 'Open' ? 'badge-green' : 'badge-yellow'}`}>{c.jobStatus}</span></td>
              <td><button onClick={() => setEditingCase(c)} className="text-blue-600 mr-2"><FiEdit2 /></button><button onClick={() => handleDeleteCase(c.id)} className="text-red-400"><FiTrash2 /></button></td></tr>
            ))}
          </tbody></table>
=======
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                <p className="text-slate-400">Full control: edit, delete, approve, export</p>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className={`bg-gradient-to-br from-${s.color}-600 to-${s.color}-700 rounded-2xl p-5`}>
                        <div>
                            <p className="text-white/80 text-sm">{s.label}</p>
                            <p className="text-3xl font-bold text-white">{s.value}</p>
                        </div>
                        <div className="text-white/70 text-2xl">{s.icon}</div>
                    </div>
                ))}
            </div>
            <button onClick={exportCases} className="btn-primary mb-4 flex items-center gap-2">
                <FiDownload /> Export All Cases
            </button>
            <button onClick={closeOldCases} className="btn-secondary mb-4 flex items-center gap-2">
                <FiXCircle /> Close Old Cases (7+ days)
            </button>
            <div className="flex gap-2 border-b mb-6">
                <button onClick={() => setActiveTab('cases')} className={`px-6 py-3 ${activeTab === 'cases' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Cases</button>
                <button onClick={() => setActiveTab('parts')} className={`px-6 py-3 ${activeTab === 'parts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Part Requests</button>
                <button onClick={() => setActiveTab('warranty')} className={`px-6 py-3 ${activeTab === 'warranty' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Warranty Requests</button>
                <button onClick={() => setActiveTab('users')} className={`px-6 py-3 ${activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Users</button>
                <button onClick={() => setActiveTab('bulk')} className={`px-6 py-3 ${activeTab === 'bulk' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Bulk Upload</button>
            </div>
            {activeTab === 'cases' && (
                <div className="card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Customer</th>
                                <th>Mobile</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases.map(c => (
                                <tr key={c.id}>
                                    <td>{c.jobId}</td>
                                    <td>{c.customerName}</td>
                                    <td>{c.mobileNumber}</td>
                                    <td>{c.jobStatus}</td>
                                    <td>
                                        <button onClick={() => setEditingCase(c)} className="text-blue-400 mr-2">
                                            <FiEdit2 />
                                        </button>
                                        <button onClick={() => handleDeleteCase(c.id)} className="text-red-400">
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'parts' && (
                <div className="card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Part</th>
                                <th>Qty</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partRequests.map(p => (
                                <tr key={p.id}>
                                    <td>{p.jobId}</td>
                                    <td>{p.partName}</td>
                                    <td>{p.quantity}</td>
                                    <td>{p.status}</td>
                                    <td>
                                        {p.status === 'Pending Approval' && (
                                            <>
                                                <button onClick={() => handleApprovePart(p.id, p.caseId)} className="text-green-400 mr-2">
                                                    <FiCheckCircle />
                                                </button>
                                                <button onClick={() => handleRejectPart(p.id, p.caseId)} className="text-red-400">
                                                    <FiXCircle />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'warranty' && (
                <div className="card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th>IMEI</th>
                                <th>Customer</th>
                                <th>Mobile</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warrantyRequests.map(w => (
                                <tr key={w.id}>
                                    <td>{w.imei}</td>
                                    <td>{w.customerName}</td>
                                    <td>{w.mobileNumber}</td>
                                    <td>{w.status}</td>
                                    <td>
                                        {w.status === 'Pending Approval' && (
                                            <>
                                                <button onClick={() => handleApproveWarranty(w.id, w.imei)} className="text-green-400 mr-2">
                                                    <FiCheckCircle />
                                                </button>
                                                <button onClick={() => handleRejectWarranty(w.id)} className="text-red-400">
                                                    <FiXCircle />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'users' && (
                <div className="card">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    <td>{u.name || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'bulk' && (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Bulk Upload Mobile Activations</h3>
                    <p className="text-slate-400 mb-4">Upload Excel file with columns: IMEI, Name, Mobile, Email, PurchaseDate</p>
                    <input type="file" accept=".xlsx,.xls" onChange={(e) => handleBulkUpload(e.target.files[0])} className="input-field" />
                </div>
            )}
            {editingCase && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Edit Case</h3>
                        <input defaultValue={editingCase.customerName} id="editName" className="input-field mb-2" placeholder="Name" />
                        <input defaultValue={editingCase.mobileNumber} id="editMobile" className="input-field mb-2" placeholder="Mobile" />
                        <select defaultValue={editingCase.jobStatus} id="editStatus" className="input-field mb-4">
                            <option>Open</option>
                            <option>In Progress</option>
                            <option>Closed</option>
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => handleUpdateCase(editingCase.id, { 
                                customerName: document.getElementById('editName').value, 
                                mobileNumber: document.getElementById('editMobile').value, 
                                jobStatus: document.getElementById('editStatus').value 
                            })} className="btn-primary">Save</button>
                            <button onClick={() => setEditingCase(null)} className="btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
>>>>>>> e409aaa74fa91e2e2150a69928ec806d823dab1c
        </div>
      )}

      {activeTab === 'partRequests' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm"><thead><tr><th>Job ID</th><th>Part</th><th>Qty</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {partRequests.map(p => (
              <tr key={p.id}><td>{p.jobId}</td><td>{p.partName}</td><td>{p.quantity}</td><td><span className={`badge ${p.status === 'Pending Approval' ? 'badge-yellow' : p.status === 'Approved' ? 'badge-green' : 'badge-red'}`}>{p.status}</span></td>
              <td>
                {p.status === 'Pending Approval' && <><button onClick={() => handleApprovePart(p.id, p.caseId)} className="text-green-600 mr-2"><FiCheckCircle /></button><button onClick={() => handleRejectPart(p.id, p.caseId)} className="text-red-400 mr-2"><FiXCircle /></button></>}
                <button onClick={() => handleDeletePartRequest(p.id)} className="text-red-400"><FiTrash2 /></button>
              </td></tr>
            ))}
          </tbody></table>
        </div>
      )}

      {activeTab === 'warrantyRequests' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm"><thead><tr><th>IMEI</th><th>Customer</th><th>Request Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {warrantyRequests.map(w => (
              <tr key={w.id}><td>{w.imei}</td><td>{w.customerName}</td><td>{new Date(w.requestDate).toLocaleDateString()}</td><td>{w.status}</td>
              <td>{w.status === 'Pending' && <><button onClick={() => handleApproveWarranty(w.id, w.imei, w.extendedYears)} className="text-green-600 mr-2"><FiCheckCircle /></button><button onClick={() => handleRejectWarranty(w.id)} className="text-red-400"><FiXCircle /></button></>}</td></tr>
            ))}
          </tbody></table>
        </div>
      )}

      {editingCase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-2xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">Edit Case</h3>
            <div className="grid grid-cols-2 gap-4">
              <input defaultValue={editingCase.customerName} id="editName" className="input-field" />
              <input defaultValue={editingCase.mobileNumber} id="editMobile" className="input-field" />
              <select defaultValue={editingCase.jobStatus} id="editStatus" className="input-field"><option>Open</option><option>In Progress</option><option>Closed</option></select>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => handleUpdateCase(editingCase.id, { customerName: document.getElementById('editName').value, mobileNumber: document.getElementById('editMobile').value, jobStatus: document.getElementById('editStatus').value })} className="btn-primary">Save</button><button onClick={() => setEditingCase(null)} className="btn-secondary">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}