import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { FiDownload, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';

export default function Reports() {
    const [cases, setCases] = useState([]);
    const [partRequests, setPartRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('cases');

    const fetchData = async () => {
        setLoading(true);
        try {
            const casesSnap = await getDocs(collection(db, 'cases'));
            const partSnap = await getDocs(collection(db, 'partRequests'));
            setCases(casesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setPartRequests(partSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            toast.success('Data loaded successfully');
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportToExcel = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
        toast.success(`${filename} exported successfully`);
    };

    const casesForExport = cases.map(c => ({
        'Job ID': c.jobId,
        'Customer Name': c.customerName,
        'Mobile Number': c.mobileNumber,
        'Device Model': c.deviceModel || 'N/A',
        'IMEI': c.imei1 || 'N/A',
        'Issue Type': c.issueType || 'N/A',
        'Job Status': c.jobStatus,
        'Warranty': c.warranty || 'Unknown',
        'Register Date': new Date(c.caseRegisterDate).toLocaleString(),
        'Diagnosis': c.diagnosis || 'Pending',
    }));

    const partsForExport = partRequests.map(p => ({
        'Job ID': p.jobId,
        'Customer Name': p.customerName,
        'Part Name': p.partName,
        'Quantity': p.quantity,
        'Variant': p.variant || 'N/A',
        'Status': p.status,
        'Request Date': new Date(p.requestDate).toLocaleString(),
        'Approved Date': p.approvedAt ? new Date(p.approvedAt).toLocaleString() : 'Pending',
        'Dispatch Date': p.dispatchDate ? new Date(p.dispatchDate).toLocaleString() : 'Not Dispatched',
    }));

    const getStatusCount = (status) => {
        return cases.filter(c => c.jobStatus === status).length;
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Reports & Analytics
                </h2>
                <p className="text-gray-400 mt-1">Export data and view statistics</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card text-center">
                    <p className="text-2xl font-bold text-blue-400">{cases.length}</p>
                    <p className="text-gray-400 text-sm">Total Cases</p>
                </div>
                <div className="card text-center">
                    <p className="text-2xl font-bold text-green-400">{getStatusCount('Open')}</p>
                    <p className="text-gray-400 text-sm">Open Cases</p>
                </div>
                <div className="card text-center">
                    <p className="text-2xl font-bold text-yellow-400">{getStatusCount('In Progress')}</p>
                    <p className="text-gray-400 text-sm">In Progress</p>
                </div>
                <div className="card text-center">
                    <p className="text-2xl font-bold text-purple-400">{partRequests.filter(p => p.status === 'Pending Approval').length}</p>
                    <p className="text-gray-400 text-sm">Pending Approvals</p>
                </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-6 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('cases')}
                    className={`px-6 py-3 font-semibold transition-all ${activeTab === 'cases' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
                >
                    <FiBarChart2 className="inline mr-2" /> Cases Report
                </button>
                <button
                    onClick={() => setActiveTab('parts')}
                    className={`px-6 py-3 font-semibold transition-all ${activeTab === 'parts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
                >
                    <FiBarChart2 className="inline mr-2" /> Part Requests Report
                </button>
            </div>

            {/* Cases Report Tab */}
            {activeTab === 'cases' && (
                <div className="card">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                        <h3 className="text-xl font-semibold">Cases Report</h3>
                        <div className="flex gap-3">
                            <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
                                <FiRefreshCw /> Refresh
                            </button>
                            <button onClick={() => exportToExcel(casesForExport, 'cases_report')} className="btn-primary flex items-center gap-2">
                                <FiDownload /> Export to Excel
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : cases.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>No cases found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-700">
                                    <tr>
                                        <th className="text-left py-3 px-3">Job ID</th>
                                        <th className="text-left py-3 px-3">Customer</th>
                                        <th className="text-left py-3 px-3">Mobile</th>
                                        <th className="text-left py-3 px-3">Device</th>
                                        <th className="text-left py-3 px-3">Status</th>
                                        <th className="text-left py-3 px-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cases.slice(0, 50).map((caseItem) => (
                                        <tr key={caseItem.id} className="border-b border-gray-700/50 hover:bg-white/5">
                                            <td className="py-2 px-3 font-mono">{caseItem.jobId}</td>
                                            <td className="py-2 px-3">{caseItem.customerName}</td>
                                            <td className="py-2 px-3">{caseItem.mobileNumber}</td>
                                            <td className="py-2 px-3">{caseItem.deviceModel || 'N/A'}</td>
                                            <td className="py-2 px-3">
                                                <span className={`badge ${caseItem.jobStatus === 'Open' ? 'badge-green' :
                                                    caseItem.jobStatus === 'Closed' ? 'badge-gray' : 'badge-yellow'
                                                    }`}>
                                                    {caseItem.jobStatus}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-xs">{new Date(caseItem.caseRegisterDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {cases.length > 50 && (
                                <p className="text-center text-gray-500 text-sm mt-4">Showing first 50 of {cases.length} cases</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Part Requests Report Tab */}
            {activeTab === 'parts' && (
                <div className="card">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                        <h3 className="text-xl font-semibold">Part Requests Report</h3>
                        <div className="flex gap-3">
                            <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
                                <FiRefreshCw /> Refresh
                            </button>
                            <button onClick={() => exportToExcel(partsForExport, 'part_requests_report')} className="btn-primary flex items-center gap-2">
                                <FiDownload /> Export to Excel
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : partRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>No part requests found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-700">
                                    <tr>
                                        <th className="text-left py-3 px-3">Job ID</th>
                                        <th className="text-left py-3 px-3">Part Name</th>
                                        <th className="text-left py-3 px-3">Qty</th>
                                        <th className="text-left py-3 px-3">Status</th>
                                        <th className="text-left py-3 px-3">Request Date</th>
                                        <th className="text-left py-3 px-3">Dispatch Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {partRequests.slice(0, 50).map((request) => (
                                        <tr key={request.id} className="border-b border-gray-700/50 hover:bg-white/5">
                                            <td className="py-2 px-3 font-mono">{request.jobId}</td>
                                            <td className="py-2 px-3">{request.partName}</td>
                                            <td className="py-2 px-3">{request.quantity}</td>
                                            <td className="py-2 px-3">
                                                <span className={`badge ${request.status === 'Approved' ? 'badge-green' :
                                                    request.status === 'Dispatched' ? 'badge-blue' :
                                                        request.status === 'Rejected' ? 'badge-red' : 'badge-yellow'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-xs">{new Date(request.requestDate).toLocaleDateString()}</td>
                                            <td className="py-2 px-3 text-xs">{request.dispatchDate ? new Date(request.dispatchDate).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {partRequests.length > 50 && (
                                <p className="text-center text-gray-500 text-sm mt-4">Showing first 50 of {partRequests.length} requests</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}