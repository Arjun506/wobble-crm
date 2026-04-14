import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FiPackage, FiTruck } from 'react-icons/fi';

export default function WarehouseDispatch() {
    const [requests, setRequests] = useState([]);
    const [dispatchQuantities, setDispatchQuantities] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const q = query(collection(db, 'partRequests'), where('status', '==', 'Approved'));
            const snapshot = await getDocs(q);
            const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(requestsData);

            const initialQuantities = {};
            requestsData.forEach(req => {
                initialQuantities[req.id] = req.quantity;
            });
            setDispatchQuantities(initialQuantities);
        } catch (error) {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDispatch = async (requestId, caseId, requestedQuantity) => {
        const dispatchQty = dispatchQuantities[requestId];
        if (!dispatchQty || dispatchQty <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        if (dispatchQty > requestedQuantity) {
            toast.error('Dispatch quantity cannot exceed requested quantity');
            return;
        }

        try {
            await updateDoc(doc(db, 'partRequests', requestId), {
                status: 'Dispatched',
                dispatchedQuantity: dispatchQty,
                dispatchDate: new Date().toISOString(),
            });
            await updateDoc(doc(db, 'cases', caseId), {
                jobStatus: 'Part Dispatched',
            });
            toast.success('Part dispatched successfully');
            fetchRequests();
        } catch (error) {
            toast.error('Dispatch failed: ' + error.message);
        }
    };

    const updateQuantity = (requestId, value) => {
        setDispatchQuantities(prev => ({ ...prev, [requestId]: parseInt(value) || 0 }));
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
                    Warehouse Dispatch
                </h2>
                <p className="text-gray-400 mt-1">Dispatch approved parts to service centers</p>
            </div>

            {requests.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-400">No approved part requests waiting for dispatch.</p>
                    <p className="text-sm text-gray-500 mt-2">New requests will appear here once approved</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="card hover:shadow-lg transition">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="badge-blue flex items-center gap-1">
                                            <FiPackage size={12} /> Approved
                                        </span>
                                        <span className="font-mono text-sm bg-dark-700 px-2 py-1 rounded">
                                            {request.jobId}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold">{request.partName}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-sm">
                                        <div>
                                            <p className="text-gray-400 text-xs">Requested</p>
                                            <p>{request.quantity} pcs</p>
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
                                            <p className="text-gray-400 text-xs">Approved On</p>
                                            <p>{request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-28">
                                        <label className="text-gray-400 text-xs block mb-1">Qty to Dispatch</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={request.quantity}
                                            value={dispatchQuantities[request.id] || ''}
                                            onChange={(e) => updateQuantity(request.id, e.target.value)}
                                            className="input-field text-center"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleDispatch(request.id, request.caseId, request.quantity)}
                                        className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold flex items-center gap-2 transition mt-5"
                                    >
                                        <FiTruck /> Dispatch
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