import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FiUpload, FiTool, FiCheckCircle, FiPrinter, FiFileText, FiPlus } from 'react-icons/fi';
import ReceiptModal from '../components/ReceiptModal';
import JobReportModal from '../components/JobReportModal';

export default function ServiceCaseDetail() {
    const { id } = useParams();
    const { role } = useAuth();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showJobReport, setShowJobReport] = useState(false);
    const [partRequests, setPartRequests] = useState([]);

    const fetchCaseData = async () => {
        try {
            const docRef = doc(db, 'cases', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCaseData({ id: docSnap.id, ...docSnap.data() });
                setDiagnosis(docSnap.data().diagnosis || '');
                setNewStatus(docSnap.data().jobStatus || 'Open');

                const partReqsQuery = query(collection(db, 'partRequests'), where('caseId', '==', id));
                const partSnap = await getDocs(partReqsQuery);
                setPartRequests(partSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else {
                toast.error('Case not found');
                navigate('/cases/search');
            }
        } catch (error) {
            toast.error('Error fetching case: ' + error.message);
        }
    };

    useEffect(() => {
        fetchCaseData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'cases', id), {
                diagnosis,
                jobStatus: newStatus,
                updatedAt: new Date().toISOString(),
            });
            toast.success('Case updated successfully');
            fetchCaseData();
        } catch (error) {
            toast.error('Update failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        setUploading(true);

        try {
            const uploadPromises = files.map(async (file) => {
                const storageRef = ref(storage, `cases/${id}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                return getDownloadURL(storageRef);
            });

            const urls = await Promise.all(uploadPromises);
            const existingPhotos = caseData.photos || [];
            await updateDoc(doc(db, 'cases', id), {
                photos: [...existingPhotos, ...urls],
            });

            toast.success(`${files.length} file(s) uploaded successfully`);
            fetchCaseData();
        } catch (error) {
            toast.error('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const raisePartRequest = () => {
        navigate(`/part-requests/new?caseId=${id}`);
    };

    const handleCloseCase = async () => {
        if (window.confirm('Are you sure you want to close this case?')) {
            setLoading(true);
            try {
                await updateDoc(doc(db, 'cases', id), {
                    jobStatus: 'Closed',
                    closedDate: new Date().toISOString(),
                });
                toast.success('Case closed successfully');
                fetchCaseData();
            } catch (error) {
                toast.error('Failed to close case: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
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

    if (!caseData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Case Details
                    </h2>
                    <p className="text-gray-400 mt-1 font-mono">Job ID: {caseData.jobId}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowReceipt(true)} className="btn-secondary flex items-center gap-2">
                        <FiPrinter /> Receipt
                    </button>
                    <button onClick={() => setShowJobReport(true)} className="btn-secondary flex items-center gap-2">
                        <FiFileText /> Job Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            Case Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-gray-400 text-sm">Job ID</p><p className="font-mono text-sm">{caseData.jobId}</p></div>
                            <div><p className="text-gray-400 text-sm">Register Date</p><p className="text-sm">{new Date(caseData.caseRegisterDate).toLocaleString()}</p></div>
                            <div><p className="text-gray-400 text-sm">Customer Name</p><p className="font-medium">{caseData.customerName}</p></div>
                            <div><p className="text-gray-400 text-sm">Mobile Number</p><p>{caseData.mobileNumber}</p></div>
                            <div><p className="text-gray-400 text-sm">Device Model</p><p>{caseData.deviceModel || 'N/A'}</p></div>
                            <div><p className="text-gray-400 text-sm">IMEI</p><p className="font-mono text-xs">{caseData.imei1 || 'N/A'}</p></div>
                            <div><p className="text-gray-400 text-sm">Warranty</p><p className={caseData.warranty?.includes('In') ? 'text-green-400' : 'text-red-400'}>{caseData.warranty || 'Unknown'}</p></div>
                            <div><p className="text-gray-400 text-sm">Issue Type</p><p>{caseData.issueType || 'N/A'}</p></div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                            Diagnosis & Status
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-2">Diagnosis / Technician Notes</label>
                                <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows="4" className="input-field" placeholder="Enter diagnosis, repair notes, parts needed..." />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Job Status</label>
                                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field">
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Pending Approval">Pending Approval</option>
                                    <option value="Part Dispatched">Part Dispatched</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <button onClick={handleUpdate} disabled={loading} className="btn-primary flex items-center gap-2">
                                    <FiCheckCircle /> {loading ? 'Updating...' : 'Update Case'}
                                </button>
                                {(role === 'service' || role === 'admin') && caseData.jobStatus !== 'Closed' && (
                                    <button onClick={raisePartRequest} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                                        <FiTool /> Raise Part Request
                                    </button>
                                )}
                                {(role === 'service' || role === 'admin') && caseData.jobStatus !== 'Closed' && (
                                    <button onClick={handleCloseCase} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                                        <FiCheckCircle /> Close Case
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                            Upload Files
                        </h3>
                        <div>
                            <label className="block w-full">
                                <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition">
                                    <FiUpload className="mx-auto text-3xl text-gray-400 mb-2" />
                                    <p className="text-gray-400">Click or drag files to upload</p>
                                    <p className="text-xs text-gray-500 mt-1">Images, Videos, PDFs</p>
                                </div>
                                <input type="file" multiple accept="image/*,video/*,application/pdf" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                            </label>
                            {uploading && <p className="text-blue-400 mt-2 text-center">Uploading...</p>}
                        </div>
                        {caseData.photos && caseData.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {caseData.photos.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block bg-dark-700 rounded-lg overflow-hidden hover:opacity-80 transition">
                                        <img src={url} alt={`Attachment ${idx}`} className="object-cover h-24 w-full" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3">📍 Address</h3>
                        <p className="text-gray-300 text-sm">
                            {caseData.addressLocality && `${caseData.addressLocality}, `}
                            {caseData.addressCity && `${caseData.addressCity}`}
                            {caseData.addressPin && <br />}
                            {caseData.addressPin && `PIN: ${caseData.addressPin}`}
                            {!caseData.addressLocality && !caseData.addressCity && 'No address provided'}
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3">🔧 Part Requests</h3>
                        {partRequests.length === 0 ? (
                            <p className="text-gray-400 text-sm">No part requests raised yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {partRequests.map((pr) => (
                                    <div key={pr.id} className="border border-gray-700 rounded-lg p-3">
                                        <p className="font-semibold text-sm">{pr.partName}</p>
                                        <p className="text-xs text-gray-400">Qty: {pr.quantity}</p>
                                        <p className={`text-xs mt-1 ${pr.status === 'Approved' ? 'text-green-400' : pr.status === 'Dispatched' ? 'text-blue-400' : 'text-yellow-400'}`}>
                                            Status: {pr.status}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(role === 'service' || role === 'admin') && caseData.jobStatus !== 'Closed' && (
                            <button onClick={raisePartRequest} className="w-full mt-3 btn-secondary text-sm flex items-center justify-center gap-1">
                                <FiPlus size={14} /> Raise Part Request
                            </button>
                        )}
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3">📊 Current Status</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Status</span>
                            <span className={getStatusBadge(caseData.jobStatus)}>{caseData.jobStatus}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-gray-400 text-xs">Last Updated</p>
                            <p className="text-xs">{caseData.updatedAt ? new Date(caseData.updatedAt).toLocaleString() : new Date(caseData.caseRegisterDate).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} caseData={caseData} />
            <JobReportModal isOpen={showJobReport} onClose={() => setShowJobReport(false)} caseData={caseData} />
        </div>
    );
}