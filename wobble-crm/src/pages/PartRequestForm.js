import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FiSave, FiX } from 'react-icons/fi';

export default function PartRequestForm() {
    const [searchParams] = useSearchParams();
    const caseId = searchParams.get('caseId');
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        partName: '',
        quantity: 1,
        variant: '',
        issueDescription: '',
    });

    useEffect(() => {
        if (!caseId) {
            toast.error('No case selected');
            navigate('/cases/search');
            return;
        }
        fetchCaseData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId]);

    const fetchCaseData = async () => {
        try {
            const docRef = doc(db, 'cases', caseId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCaseData(docSnap.data());
            } else {
                toast.error('Case not found');
                navigate('/cases/search');
            }
        } catch (error) {
            toast.error('Error fetching case');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.partName) {
            toast.error('Part name required');
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, 'partRequests'), {
                caseId,
                jobId: caseData.jobId,
                imei: caseData.imei1,
                customerName: caseData.customerName,
                ...formData,
                quantity: parseInt(formData.quantity),
                requestDate: new Date().toISOString(),
                status: 'Pending Approval',
            });
            await updateDoc(doc(db, 'cases', caseId), {
                jobStatus: 'Pending Approval',
                partRequested: true,
            });
            toast.success('Part request submitted');
            navigate(`/service/case/${caseId}`);
        } catch (error) {
            toast.error('Submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (!caseData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Raise Part Request</h2>
                <p className="text-slate-400 mt-1">Request replacement parts for repair</p>
            </div>

            <div className="card mb-6">
                <h3 className="font-semibold mb-3 text-blue-400">Case Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-slate-400">Job ID</p><p className="font-mono">{caseData.jobId}</p></div>
                    <div><p className="text-slate-400">Customer</p><p>{caseData.customerName}</p></div>
                    <div><p className="text-slate-400">Device</p><p>{caseData.deviceModel || 'N/A'}</p></div>
                    <div><p className="text-slate-400">IMEI</p><p className="font-mono text-xs">{caseData.imei1 || 'N/A'}</p></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-300 mb-2">Part Name *</label>
                        <input name="partName" value={formData.partName} onChange={handleChange} className="input-field" required placeholder="e.g., Battery, Display" />
                    </div>
                    <div>
                        <label className="block text-slate-300 mb-2">Quantity *</label>
                        <input name="quantity" type="number" min="1" value={formData.quantity} onChange={handleChange} className="input-field w-32" />
                    </div>
                    <div>
                        <label className="block text-slate-300 mb-2">Variant / Model</label>
                        <input name="variant" value={formData.variant} onChange={handleChange} className="input-field" placeholder="e.g., For iPhone 12" />
                    </div>
                    <div>
                        <label className="block text-slate-300 mb-2">Reason / Description</label>
                        <textarea name="issueDescription" rows="3" value={formData.issueDescription} onChange={handleChange} className="input-field" placeholder="Why is this part needed?" />
                    </div>
                </div>
                <div className="flex gap-4 mt-6">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2"><FiSave /> {loading ? 'Submitting...' : 'Submit'}</button>
                    <button type="button" onClick={() => navigate(`/service/case/${caseId}`)} className="btn-secondary"><FiX /> Cancel</button>
                </div>
            </form>
        </div>
    );
}