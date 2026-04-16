import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function PartRequestApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [poDetails, setPoDetails] = useState({ poNumber: '', unitPrice: '', quantity: 1 });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, 'partRequests'), where('status', '==', 'Pending Approval'));
      const snapshot = await getDocs(q);
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, caseId) => {
    if (!poDetails.poNumber || !poDetails.unitPrice) {
      toast.error('Enter PO Number and Unit Price');
      return;
    }
    try {
      await updateDoc(doc(db, 'partRequests', id), {
        status: 'Approved',
        approvedAt: new Date().toISOString(),
        poNumber: poDetails.poNumber,
        unitPrice: poDetails.unitPrice,
        totalPrice: poDetails.unitPrice * poDetails.quantity,
      });
      await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Part Approved' });
      toast.success('Part request approved');
      setSelected(null);
      fetchRequests();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleReject = async (id, caseId) => {
    if (!rejectReason) {
      toast.error('Enter rejection reason');
      return;
    }
    try {
      await updateDoc(doc(db, 'partRequests', id), {
        status: 'Rejected',
        rejectionReason: rejectReason,
        rejectedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'cases', caseId), { jobStatus: 'Open' });
      toast.success('Part request rejected');
      setSelected(null);
      fetchRequests();
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="mb-6"><h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Part Request Approvals</h2><p className="text-slate-400 mt-1">Review, approve with PO, or reject part requests</p></div>
      {requests.length === 0 ? (
        <div className="card text-center py-12"><div className="text-6xl mb-4">✅</div><p className="text-slate-400">No pending part requests</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="card">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2"><span className="badge-yellow flex items-center gap-1"><FiClock /> Pending</span><span className="font-mono text-sm bg-slate-800 px-2 py-1 rounded">{req.jobId}</span></div>
                  <h3 className="text-xl font-semibold">{req.partName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-sm">
                    <div><p className="text-slate-400 text-xs">Quantity</p><p>{req.quantity}</p></div>
                    <div><p className="text-slate-400 text-xs">Variant</p><p>{req.variant || 'N/A'}</p></div>
                    <div><p className="text-slate-400 text-xs">Customer</p><p>{req.customerName}</p></div>
                    <div><p className="text-slate-400 text-xs">Request Date</p><p>{new Date(req.requestDate).toLocaleDateString()}</p></div>
                  </div>
                  {req.issueDescription && <div className="mt-2 p-2 bg-slate-800 rounded-lg text-sm"><p className="text-slate-400 text-xs">Reason</p><p>{req.issueDescription}</p></div>}
                </div>
                <div className="flex gap-2"><button onClick={() => setSelected({ id: req.id, caseId: req.caseId, action: 'approve' })} className="btn-success flex items-center gap-2"><FiCheckCircle /> Approve</button><button onClick={() => setSelected({ id: req.id, caseId: req.caseId, action: 'reject' })} className="btn-danger flex items-center gap-2"><FiXCircle /> Reject</button></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && selected.action === 'approve' && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Approve Part Request</h3>
            <input placeholder="PO Number (e.g., PO-2024-001)" className="input-field mb-3" value={poDetails.poNumber} onChange={(e) => setPoDetails({ ...poDetails, poNumber: e.target.value })} />
            <input type="number" placeholder="Unit Price (₹)" className="input-field mb-3" value={poDetails.unitPrice} onChange={(e) => setPoDetails({ ...poDetails, unitPrice: parseFloat(e.target.value) })} />
            <input type="number" placeholder="Quantity" className="input-field mb-3" value={poDetails.quantity} onChange={(e) => setPoDetails({ ...poDetails, quantity: parseInt(e.target.value) })} />
            <div className="text-right text-sm mb-4">Total: ₹{poDetails.unitPrice * poDetails.quantity}</div>
            <div className="flex gap-3"><button onClick={() => handleApprove(selected.id, selected.caseId)} className="btn-primary flex-1">Confirm</button><button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button></div>
          </div>
        </div>
      )}

      {selected && selected.action === 'reject' && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reject Part Request</h3>
            <textarea rows="3" className="input-field mb-4" placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <div className="flex gap-3"><button onClick={() => handleReject(selected.id, selected.caseId)} className="bg-red-600 text-white py-2 rounded-xl flex-1">Confirm Rejection</button><button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}