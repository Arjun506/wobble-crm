import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

export default function Reports() {
    const [cases, setCases] = useState([]);
    const [partRequests, setPartRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('cases');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const casesSnap = await getDocs(collection(db, 'cases'));
            const partsSnap = await getDocs(collection(db, 'partRequests'));
            setCases(casesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setPartRequests(partsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
        toast.success(`${filename} exported`);
    };

    const casesForExport = cases.map(c => ({
        'Job ID': c.jobId,
        'Customer': c.customerName,
        'Mobile': c.mobileNumber,
        'Device': c.deviceModel || 'N/A',
        'IMEI': c.imei1 || 'N/A',
        'Issue': c.issueType || 'N/A',
        'Status': c.jobStatus,
        'Warranty': c.warranty || 'Unknown',
        'Register Date': new Date(c.caseRegisterDate).toLocaleString(),
    }));

    const partsForExport = partRequests.map(p => ({
        'Job ID': p.jobId,
        'Customer': p.customerName,
        'Part Name': p.partName,
        'Quantity': p.quantity,
        'Status': p.status,
        'Request Date': new Date(p.requestDate).toLocaleString(),
        'PO Number': p.poNumber || 'N/A',
        'Dispatch Date': p.dispatchDate ? new Date(p.dispatchDate).toLocaleString() : 'Not Dispatched',
    }));

    const getStatusCount = (status) => cases.filter(c => c.jobStatus === status).length;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Reports & Analytics</h2>
                <p className="text-gray-500 mt-1">Export data and view statistics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card text-center"><p className="text-2xl font-bold text-blue-600">{cases.length}</p><p className="text-gray-500 text-sm">Total Cases</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-green-600">{getStatusCount('Open')}</p><p className="text-gray-500 text-sm">Open Cases</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-yellow-600">{getStatusCount('In Progress')}</p><p className="text-gray-500 text-sm">In Progress</p></div>
                <div className="card text-center"><p className="text-2xl font-bold text-purple-600">{partRequests.filter(p => p.status === 'Pending Approval').length}</p><p className="text-gray-500 text-sm">Pending Approvals</p></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab('cases')} className={`pb-2 px-1 font-semibold ${activeTab === 'cases' ? 'text-blue-600 border-b-2 border-blue-400' : 'text-gray-500'}`}>Cases</button>
                <button onClick={() => setActiveTab('parts')} className={`pb-2 px-1 font-semibold ${activeTab === 'parts' ? 'text-blue-600 border-b-2 border-blue-400' : 'text-gray-500'}`}>Part Requests</button>
            </div>

            {/* Cases Table */}
            {activeTab === 'cases' && (
                <div className="card">
                    <div className="flex justify-between mb-4"><h3 className="text-xl font-semibold">Case List</h3><button onClick={fetchData} className="btn-secondary text-sm flex items-center gap-1"><FiRefreshCw /> Refresh</button></div>
                    {loading ? <div className="flex justify-center py-8"><div className="loading-spinner"></div></div> :
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead><tr>{['Job ID', 'Customer', 'Mobile', 'Status', 'Date'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                                <tbody>
                                    {cases.slice(0, 50).map(c => (
                                        <tr key={c.id}>
                                            <td className="font-mono text-sm">{c.jobId}</td>
                                            <td>{c.customerName}</td>
                                            <td>{c.mobileNumber}</td>
                                            <td><span className={`badge ${c.jobStatus === 'Open' ? 'badge-green' : 'badge-yellow'}`}>{c.jobStatus}</span></td>
                                            <td>{new Date(c.caseRegisterDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {cases.length > 50 && <p className="text-center text-gray-500 text-sm mt-4">Showing first 50 of {cases.length}</p>}
                        </div>
                    }
                    <button onClick={() => exportToExcel(casesForExport, 'cases_report')} className="btn-primary mt-4 flex items-center gap-2 justify-center"><FiDownload /> Export to Excel</button>
                </div>
            )}

            {/* Part Requests Table */}
            {activeTab === 'parts' && (
                <div className="card">
                    <div className="flex justify-between mb-4"><h3 className="text-xl font-semibold">Part Request List</h3><button onClick={fetchData} className="btn-secondary text-sm"><FiRefreshCw /> Refresh</button></div>
                    {loading ? <div className="flex justify-center py-8"><div className="loading-spinner"></div></div> :
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead><tr>{['Job ID', 'Part Name', 'Qty', 'Status', 'Request Date'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                                <tbody>
                                    {partRequests.slice(0, 50).map(p => (
                                        <tr key={p.id}>
                                            <td className="font-mono text-sm">{p.jobId}</td>
                                            <td>{p.partName}</td>
                                            <td>{p.quantity}</td>
                                            <td><span className={`badge ${p.status === 'Approved' ? 'badge-green' : p.status === 'Pending Approval' ? 'badge-yellow' : 'badge-red'}`}>{p.status}</span></td>
                                            <td>{new Date(p.requestDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    }
                    <button onClick={() => exportToExcel(partsForExport, 'part_requests_report')} className="btn-primary mt-4 flex items-center gap-2 justify-center"><FiDownload /> Export to Excel</button>
                </div>
            )}
        </div>
    );
}