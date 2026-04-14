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
    const [formData, setFormData] = useState({
        partName: '',
        quantity: 1,
        variant: '',
        issueDescription: '',
    });
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        if (caseId) {
            fetchCaseData();
        } else {
            toast.error('No case selected');
            navigate('/cases/search');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caseId) {
            toast.error('No case selected');
            return;
        }

        if (!formData.partName || formData.quantity < 1) {
            toast.error('Please enter part name and valid quantity');
            return;
        }

        setLoading(true);
        try {
            const partRequest = {
                caseId,
                jobId: caseData.jobId,
                imei: caseData.imei1,
                customerName: caseData.customerName,
                ...formData,
                quantity: parseInt(formData.quantity),
                requestDate: new Date().toISOString(),
                status: 'Pending Approval',
                createdAt: new Date().toISOString(),
            };

            await addDoc(collection(db, 'partRequests'), partRequest);

            await updateDoc(doc(db, 'cases', caseId), {
                jobStatus: 'Pending Approval',
                partRequested: true,
                partRequestDate: new Date().toISOString(),
            });

            toast.success('Part request submitted for approval');
            navigate(`/service/case/${caseId}`);
        } catch (error) {
            toast.error('Failed to submit: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Raise Part Request
                </h2>
                <p className="text-gray-400 mt-1">Request replacement parts for this repair</p>
            </div>

            <div className="card mb-6">
                <h3 className="font-semibold mb-3 text-blue-400">Case Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-gray-400">Job ID</p>
                        <p className="font-mono">{caseData.jobId}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Customer</p>
                        <p>{caseData.customerName}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Device</p>
                        <p>{caseData.deviceModel || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">IMEI</p>
                        <p className="font-mono text-xs">{caseData.imei1 || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="space-y-5">
                    <div>
                        <label className="block text-gray-300 mb-2">Part Name *</label>
                        <input
                            name="partName"
                            value={formData.partName}
                            onChange={handleChange}
                            className="input-field"
                            required
                            placeholder="e.g., Battery, Display, Charging Port"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">Quantity *</label>
                        <input
                            name="quantity"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="input-field w-32"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">Variant / Model Number</label>
                        <input
                            name="variant"
                            value={formData.variant}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="e.g., For iPhone 12, GH82-12345A"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">Issue Description / Reason</label>
                        <textarea
                            name="issueDescription"
                            value={formData.issueDescription}
                            onChange={handleChange}
                            rows="4"
                            className="input-field"
                            placeholder="Describe why this part is needed for repair..."
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                        <FiSave /> {loading ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                    <button type="button" onClick={() => navigate(`/service/case/${caseId}`)} className="btn-secondary flex items-center gap-2">
                        <FiX /> Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}