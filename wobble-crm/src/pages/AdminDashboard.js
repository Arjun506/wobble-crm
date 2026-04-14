import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, FiUsers, FiTool, FiAlertCircle, FiDownload } from 'react-icons/fi';

export default function AdminDashboard() {
    const [cases, setCases] = useState([]);
    const [partRequests, setPartRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('cases');
    const [editingCase, setEditingCase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const casesSnap = await getDocs(collection(db, 'cases'));
            const partsSnap = await getDocs(collection(db, 'partRequests'));
            const usersSnap = await getDocs(collection(db, 'users'));
            setCases(casesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setPartRequests(partsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) { toast.error('Failed'); } finally { setLoading(false); }
    };

    const handleUpdateCase = async (id, data) => { await updateDoc(doc(db, 'cases', id), data); toast.success('Updated'); fetchAll(); setEditingCase(null); };
    const handleDeleteCase = async (id) => { if (window.confirm('Delete?')) { await deleteDoc(doc(db, 'cases', id)); toast.success('Deleted'); fetchAll(); } };
    const handleApprovePart = async (partId, caseId) => { await updateDoc(doc(db, 'partRequests', partId), { status: 'Approved', approvedAt: new Date().toISOString() }); await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Part Approved' }); toast.success('Approved'); fetchAll(); };
    const handleRejectPart = async (partId, caseId) => { await updateDoc(doc(db, 'partRequests', partId), { status: 'Rejected', rejectedAt: new Date().toISOString() }); await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Open' }); toast.success('Rejected'); fetchAll(); };

    const exportCases = () => { const ws = XLSX.utils.json_to_sheet(cases.map(c => ({ 'Job ID': c.jobId, 'Customer': c.customerName, 'Mobile': c.mobileNumber, 'Status': c.jobStatus, 'Date': new Date(c.caseRegisterDate).toLocaleString() }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Cases'); XLSX.writeFile(wb, `cases_${new Date().toISOString().slice(0, 10)}.xlsx`); toast.success('Exported'); };

    const stats = [
        { label: 'Total Cases', value: cases.length, icon: <FiAlertCircle />, color: 'blue' },
        { label: 'Open', value: cases.filter(c => c.jobStatus === 'Open').length, icon: <FiAlertCircle />, color: 'green' },
        { label: 'Pending Approvals', value: partRequests.filter(p => p.status === 'Pending Approval').length, icon: <FiTool />, color: 'yellow' },
        { label: 'Users', value: users.length, icon: <FiUsers />, color: 'purple' },
    ];

    return (
        <div>
            <div className="mb-6"><h2 className="text-3xl font-bold">Admin Dashboard</h2><p className="text-slate-400">Full control: edit, delete, approve, export</p></div>
            <div className="grid grid-cols-4 gap-4 mb-8">{stats.map((s, i) => (<div key={i} className={`bg-gradient-to-br from-${s.color}-600 to-${s.color}-700 rounded-2xl p-5`}><div><p className="text-white/80 text-sm">{s.label}</p><p className="text-3xl font-bold text-white">{s.value}</p></div><div className="text-white/70 text-2xl">{s.icon}</div></div>))}</div>
            <button onClick={exportCases} className="btn-primary mb-4 flex items-center gap-2"><FiDownload /> Export All Cases</button>
            <div className="flex gap-2 border-b mb-6"><button onClick={() => setActiveTab('cases')} className={`px-6 py-3 ${activeTab === 'cases' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Cases</button><button onClick={() => setActiveTab('parts')} className={`px-6 py-3 ${activeTab === 'parts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Part Requests</button><button onClick={() => setActiveTab('users')} className={`px-6 py-3 ${activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Users</button></div>
            {activeTab === 'cases' && <div className="card overflow-x-auto"><table className="w-full"><thead><tr><th>Job ID</th><th>Customer</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead><tbody>{cases.map(c => (<tr key={c.id}><td>{c.jobId}</td><td>{c.customerName}</td><td>{c.mobileNumber}</td><td>{c.jobStatus}</td><td><button onClick={() => setEditingCase(c)} className="text-blue-400 mr-2"><FiEdit2 /></button><button onClick={() => handleDeleteCase(c.id)} className="text-red-400"><FiTrash2 /></button></td></tr>))}</tbody></table></div>}
            {activeTab === 'parts' && <div className="card overflow-x-auto"><table className="w-full"><thead><tr><th>Job ID</th><th>Part</th><th>Qty</th><th>Status</th><th>Actions</th></tr></thead><tbody>{partRequests.map(p => (<tr key={p.id}><td>{p.jobId}</td><td>{p.partName}</td><td>{p.quantity}</td><td>{p.status}</td><td>{p.status === 'Pending Approval' && <><button onClick={() => handleApprovePart(p.id, p.caseId)} className="text-green-400 mr-2"><FiCheckCircle /></button><button onClick={() => handleRejectPart(p.id, p.caseId)} className="text-red-400"><FiXCircle /></button></>}</td></tr>))}</tbody></table></div>}
            {activeTab === 'users' && <div className="card"><table className="w-full"><thead><tr><th>Email</th><th>Role</th><th>Name</th></tr></thead><tbody>{users.map(u => (<tr key={u.id}><td>{u.email}</td><td>{u.role}</td><td>{u.name || '-'}</td></tr>))}</tbody></table></div>}
            {editingCase && (<div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4"><div className="bg-slate-800 rounded-2xl max-w-md w-full p-6"><h3 className="text-xl font-bold mb-4">Edit Case</h3><input defaultValue={editingCase.customerName} id="editName" className="input-field mb-2" placeholder="Name" /><input defaultValue={editingCase.mobileNumber} id="editMobile" className="input-field mb-2" placeholder="Mobile" /><select defaultValue={editingCase.jobStatus} id="editStatus" className="input-field mb-4"><option>Open</option><option>In Progress</option><option>Closed</option></select><div className="flex gap-3"><button onClick={() => handleUpdateCase(editingCase.id, { customerName: document.getElementById('editName').value, mobileNumber: document.getElementById('editMobile').value, jobStatus: document.getElementById('editStatus').value })} className="btn-primary">Save</button><button onClick={() => setEditingCase(null)} className="btn-secondary">Cancel</button></div></div></div>)}
        </div>
    );
}