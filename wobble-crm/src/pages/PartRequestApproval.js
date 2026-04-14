import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function PartRequestApproval() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const q = query(collection(db, 'partRequests'), where('status', '==', 'Pending Approval'));
            const snapshot = await getDocs(q);
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId, caseId) => {
        try {
            await updateDoc(doc(db, 'partRequests', requestId), {
                status: 'Approved',
                approvedAt: new Date().toISOString(),
                approvedBy: 'Admin',
            });
            await updateDoc(doc(db, 'cases', caseId), {
                jobStatus: 'Part Approved',
            });
            toast.success('Part request approved');
            fetchRequests();
        } catch (error) {
            toast.error('Approval failed: ' + error.message);
        }
    };

    const handleReject = async (requestId, caseId) => {
        const reason = prompt('Enter reason for rejection:');
        if (reason === null) return;

        try {
            await updateDoc(doc(db, 'partRequests', requestId), {
                status: 'Rejected',
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason,
            });
            await updateDoc(doc(db, 'cases', caseId), {
                jobStatus: 'Open',
            });
            toast.success('Part request rejected');
            fetchRequests();
        } catch (error) {
            toast.error('Rejection failed: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Part Request Approvals
                </h2>
                <p className="text-gray-400 mt-1">Review and approve pending part requests</p>
            </div>

            {requests.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-gray-400">No pending part requests to approve.</p>
                    <p className="text-sm text-gray-500 mt-2">All requests have been processed</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="card hover:shadow-lg transition">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="badge-yellow flex items-center gap-1">
                                            <FiClock size={12} /> Pending
                                        </span>
                                        <span className="font-mono text-sm bg-dark-700 px-2 py-1 rounded">
                                            {request.jobId}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold">{request.partName}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                                        <div>
                                            <p className="text-gray-400 text-xs">Quantity</p>
                                            <p className="font-medium">{request.quantity} pcs</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Variant</p>
                                            <p>{request.variant || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Customer</p>
                                            <p>{request.customerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Request Date</p>
                                            <p>{new Date(request.requestDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {request.issueDescription && (
                                        <div className="mt-3 p-3 bg-dark-700 rounded-lg">
                                            <p className="text-gray-400 text-xs mb-1">Reason / Description</p>
                                            <p className="text-sm">{request.issueDescription}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApprove(request.id, request.caseId)}
                                        className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold flex items-center gap-2 transition"
                                    >
                                        <FiCheckCircle size={18} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(request.id, request.caseId)}
                                        className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold flex items-center gap-2 transition"
                                    >
                                        <FiXCircle size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}