import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FiTool, FiPlus, FiUpload, FiCheckCircle, FiPackage, FiCamera } from 'react-icons/fi';

export default function ServiceCaseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [partRequests, setPartRequests] = useState([]);
    const [showPartForm, setShowPartForm] = useState(false);
    const [partForm, setPartForm] = useState({ partName: '', quantity: 1, variant: '', issueDescription: '' });
    const [showPartReceived, setShowPartReceived] = useState(null);
    const [damagedFile, setDamagedFile] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const docRef = doc(db, 'cases', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCaseData({ id: docSnap.id, ...docSnap.data() });
                setDiagnosis(docSnap.data().diagnosis || '');
                setNewStatus(docSnap.data().jobStatus || 'Open');
                const partSnap = await getDocs(query(collection(db, 'partRequests'), where('caseId', '==', id)));
                setPartRequests(partSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                navigate('/cases/search');
            }
        } catch (error) {
            toast.error('Error fetching case');
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'cases', id), {
                diagnosis,
                jobStatus: newStatus,
                updatedAt: new Date().toISOString(),
            });
            toast.success('Case updated');
            fetchData();
        } catch (error) {
            toast.error('Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRaisePartRequest = async () => {
        if (!partForm.partName) {
            toast.error('Part name required');
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, 'partRequests'), {
                caseId: id,
                jobId: caseData.jobId,
                imei: caseData.imei1,
                customerName: caseData.customerName,
                ...partForm,
                quantity: parseInt(partForm.quantity),
                requestDate: new Date().toISOString(),
                status: 'Pending Approval',
            });
            await updateDoc(doc(db, 'cases', id), { jobStatus: 'Pending Approval' });
            toast.success('Part request raised');
            setShowPartForm(false);
            setPartForm({ partName: '', quantity: 1, variant: '', issueDescription: '' });
            fetchData();
        } catch (error) {
            toast.error('Failed to raise request');
        } finally {
            setLoading(false);
        }
    };

    const handlePartReceived = async (requestId, partName) => {
        if (!damagedFile) {
            toast.error('Please upload photo of received part');
            return;
        }
        setUploading(true);
        try {
            const storageRef = ref(storage, `part_received/${requestId}_${Date.now()}`);
            await uploadBytes(storageRef, damagedFile);
            const url = await getDownloadURL(storageRef);
            await updateDoc(doc(db, 'partRequests', requestId), {
                status: 'Part Received',
                receivedImage: url,
                receivedAt: new Date().toISOString(),
            });
            await updateDoc(doc(db, 'cases', id), { jobStatus: 'Part Received' });
            toast.success(`Part ${partName} marked as received`);
            setShowPartReceived(null);
            setDamagedFile(null);
            fetchData();
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleCloseCase = async () => {
        if (window.confirm('Close this case? Ensure repair completed.')) {
            setLoading(true);
            try {
                await updateDoc(doc(db, 'cases', id), {
                    jobStatus: 'Closed',
                    closedDate: new Date().toISOString(),
                });
                toast.success('Case closed');
                fetchData();
            } catch (error) {
                toast.error('Failed to close case');
            } finally {
                setLoading(false);
            }
        }
    };

    if (!caseData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Service Center View</h2>
                <p className="text-slate-400 mt-1">Job ID: {caseData.jobId}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4">Diagnosis & Status</h3>
                        <textarea
                            rows="4"
                            className="input-field"
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Enter diagnosis, repair notes..."
                        />
                        <select
                            className="input-field mt-4"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                        >
                            <option>Open</option>
                            <option>In Progress</option>
                            <option>Pending Approval</option>
                            <option>Part Dispatched</option>
                            <option>Part Received</option>
                            <option>Closed</option>
                        </select>
                        <button onClick={handleUpdate} disabled={loading} className="btn-primary mt-4 w-full">
                            {loading ? 'Updating...' : 'Update Case'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <FiTool /> Part Requests
                        </h3>
                        {partRequests.map((pr) => (
                            <div key={pr.id} className="border border-slate-700 rounded-lg p-3 mb-2">
                                <p className="font-semibold">{pr.partName}</p>
                                <p className="text-xs text-slate-400">Qty: {pr.quantity} | Status: {pr.status}</p>
                                {pr.poNumber && <p className="text-xs text-green-400">PO: {pr.poNumber} | ₹{pr.unitPrice}/pc</p>}
                                {pr.status === 'Dispatched' && pr.status !== 'Part Received' && (
                                    <button
                                        onClick={() => setShowPartReceived(pr)}
                                        className="mt-2 btn-secondary text-xs w-full flex items-center justify-center gap-1"
                                    >
                                        <FiCamera /> Mark as Received & Upload Photo
                                    </button>
                                )}
                                {pr.status === 'Part Received' && (
                                    <p className="text-green-400 text-xs mt-1 flex items-center gap-1"><FiCheckCircle /> Received</p>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={() => setShowPartForm(true)}
                            className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                        >
                            <FiPlus /> Raise Part Request
                        </button>
                    </div>

                    <div className="card">
                        <button onClick={handleCloseCase} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl">
                            Close Case
                        </button>
                    </div>
                </div>
            </div>

            {/* Raise Part Request Modal */}
            {showPartForm && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Raise Part Request</h3>
                        <input
                            placeholder="Part Name"
                            className="input-field mb-3"
                            value={partForm.partName}
                            onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Quantity"
                            className="input-field mb-3"
                            value={partForm.quantity}
                            onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })}
                        />
                        <input
                            placeholder="Variant"
                            className="input-field mb-3"
                            value={partForm.variant}
                            onChange={(e) => setPartForm({ ...partForm, variant: e.target.value })}
                        />
                        <textarea
                            placeholder="Issue Description"
                            className="input-field mb-3"
                            rows="3"
                            value={partForm.issueDescription}
                            onChange={(e) => setPartForm({ ...partForm, issueDescription: e.target.value })}
                        />
                        <div className="flex gap-3">
                            <button onClick={handleRaisePartRequest} className="btn-primary flex-1">Submit</button>
                            <button onClick={() => setShowPartForm(false)} className="btn-secondary flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Part Received Modal with Photo Upload */}
            {showPartReceived && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Part Received: {showPartReceived.partName}</h3>
                        <div className="mb-4">
                            <label className="block text-slate-300 mb-2">Upload Photo of Received Part</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setDamagedFile(e.target.files[0])}
                                className="text-sm text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
                            />
                        </div>
                        <button
                            onClick={() => handlePartReceived(showPartReceived.id, showPartReceived.partName)}
                            disabled={uploading}
                            className="btn-primary w-full mb-2"
                        >
                            {uploading ? 'Uploading...' : 'Confirm Received'}
                        </button>
                        <button onClick={() => setShowPartReceived(null)} className="btn-secondary w-full">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}