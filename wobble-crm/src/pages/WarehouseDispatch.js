import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { FiTruck, FiUpload } from 'react-icons/fi';

export default function WarehouseDispatch() {
  const [requests, setRequests] = useState([]);
  const [dispatchQuantities, setDispatchQuantities] = useState({});
  const [dispatchFiles, setDispatchFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, 'partRequests'), where('status', '==', 'Approved'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(data);
      const qtyMap = {};
      data.forEach(req => { qtyMap[req.id] = req.quantity; });
      setDispatchQuantities(qtyMap);
    } catch (error) {
      toast.error('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id, value) => {
    setDispatchQuantities(prev => ({ ...prev, [id]: parseInt(value) || 0 }));
  };

  const handleFileChange = (id, file) => {
    setDispatchFiles(prev => ({ ...prev, [id]: file }));
  };

  const handleDispatch = async (requestId, caseId, requestedQty) => {
    const dispatchQty = dispatchQuantities[requestId];
    const receiptFile = dispatchFiles[requestId];

    if (!dispatchQty || dispatchQty <= 0) {
      toast.error('Enter valid quantity');
      return;
    }
    if (dispatchQty > requestedQty) {
      toast.error('Cannot dispatch more than requested');
      return;
    }
    if (!receiptFile) {
      toast.error('Please upload dispatch receipt');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `dispatch_receipts/${requestId}_${Date.now()}`);
      await uploadBytes(storageRef, receiptFile);
      const receiptUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'partRequests', requestId), {
        status: 'Dispatched',
        dispatchedQuantity: dispatchQty,
        dispatchDate: new Date().toISOString(),
        dispatchReceipt: receiptUrl,
      });
      await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Part Dispatched' });
      toast.success('Part dispatched successfully');
      fetchRequests();
      setDispatchFiles({});
    } catch (error) {
      toast.error('Dispatch failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Warehouse Dispatch</h2>
        <p className="text-slate-400 mt-1">Dispatch approved parts with receipt upload</p>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-12"><div className="text-6xl mb-4">📦</div><p className="text-slate-400">No approved part requests waiting for dispatch.</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="card">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2"><span className="badge-blue">Approved</span><span className="font-mono text-sm">{req.jobId}</span></div>
                  <h3 className="text-lg font-semibold">{req.partName}</h3>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                    <div><p className="text-slate-400 text-xs">Requested Qty</p><p>{req.quantity}</p></div>
                    <div><p className="text-slate-400 text-xs">Customer</p><p>{req.customerName}</p></div>
                    <div><p className="text-slate-400 text-xs">PO Number</p><p>{req.poNumber || 'N/A'}</p></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-24"><input type="number" min="1" max={req.quantity} value={dispatchQuantities[req.id] || ''} onChange={(e) => updateQuantity(req.id, e.target.value)} className="input-field text-center" placeholder="Qty" /></div>
                  <div>
                    <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-xl text-sm flex items-center gap-2">
                      <FiUpload /> Receipt
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(req.id, e.target.files[0])} className="hidden" />
                    </label>
                    {dispatchFiles[req.id] && <p className="text-xs text-green-400 mt-1">File selected</p>}
                  </div>
                  <button onClick={() => handleDispatch(req.id, req.caseId, req.quantity)} disabled={uploading} className="btn-primary flex items-center gap-2"><FiTruck /> Dispatch</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}