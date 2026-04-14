import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';

export default function CaseRegister() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '', mobileNumber: '', alternateNumber: '', email: '',
        addressPin: '', addressLocality: '', addressCity: '',
        deviceModel: '', deviceVariant: '', deviceColor: '',
        imei1: '', imei2: '', purchaseDate: '', issueType: '', subIssueType: '',
    });

    const issueTypes = ['Display Issue', 'Battery Issue', 'Charging Port', 'Camera Problem', 'Speaker Issue', 'Microphone Problem', 'Water Damage', 'Software Problem', 'Network Issue', 'Physical Damage', 'Motherboard Issue', 'Other'];

    const generateJobId = () => {
        const prefix = 'WOB';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}${timestamp}${random}`;
    };

    const calculateWarranty = (purchaseDate) => {
        if (!purchaseDate) return 'Unknown';
        const diffMonths = (new Date() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24 * 30);
        return diffMonths <= 12 ? 'In Warranty ✅' : 'Out of Warranty ⚠️';
    };

    const checkDuplicateOpenCase = async (mobileNumber, imei1, alternateNumber) => {
        const snapshot = await getDocs(collection(db, 'cases'));
        const allCases = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const openCases = allCases.filter(c => c.jobStatus !== 'Closed');
        return openCases.find(c =>
            c.mobileNumber === mobileNumber ||
            c.imei1 === imei1 ||
            (alternateNumber && c.alternateNumber === alternateNumber)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customerName || !formData.mobileNumber) {
            toast.error('Customer Name and Mobile Number required');
            return;
        }
        setLoading(true);
        try {
            const existing = await checkDuplicateOpenCase(formData.mobileNumber, formData.imei1, formData.alternateNumber);
            if (existing) {
                toast.custom((t) => (
                    <div className="bg-orange-500 text-white p-4 rounded-xl shadow-xl max-w-md">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle size={24} />
                            <div>
                                <p className="font-bold">Open case already exists!</p>
                                <p>Job ID: {existing.jobId}</p>
                                <p>Status: {existing.jobStatus}</p>
                                <p>Customer: {existing.customerName}</p>
                                <button onClick={() => navigate(`/case/${existing.id}`)} className="mt-2 bg-white text-orange-600 px-3 py-1 rounded-lg text-sm">View Case</button>
                            </div>
                        </div>
                    </div>
                ), { duration: 8000 });
                return;
            }
            const jobId = generateJobId();
            const caseData = {
                ...formData,
                jobId,
                warranty: calculateWarranty(formData.purchaseDate),
                caseRegisterDate: new Date().toISOString(),
                jobStatus: 'Open',
                diagnosis: '',
                createdAt: new Date().toISOString(),
                previousIssues: [],
                photos: [],
                jobNotes: [],
                partRequests: [],
                updatedAt: new Date().toISOString(),
            };
            const docRef = await addDoc(collection(db, 'cases'), caseData);
            toast.success(`Case registered! Job ID: ${jobId}`);
            navigate(`/case/${docRef.id}`);
        } catch (error) {
            toast.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6"><h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Register New Case</h2><p className="text-slate-400">Fill customer & device details</p></div>
            <form onSubmit={handleSubmit} className="card">
                <div className="mb-6"><h3 className="text-lg font-semibold text-blue-400 mb-4">Customer Details</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Full Name *" className="input-field" required />
                    <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="Mobile Number *" className="input-field" required />
                    <input name="alternateNumber" value={formData.alternateNumber} onChange={handleChange} placeholder="Alternate Number" className="input-field" />
                    <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input-field" />
                    <input name="addressPin" value={formData.addressPin} onChange={handleChange} placeholder="PIN Code" className="input-field" />
                    <input name="addressLocality" value={formData.addressLocality} onChange={handleChange} placeholder="Locality" className="input-field" />
                    <div className="md:col-span-2"><input name="addressCity" value={formData.addressCity} onChange={handleChange} placeholder="City" className="input-field" /></div>
                </div></div>
                <div className="mb-6"><h3 className="text-lg font-semibold text-blue-400 mb-4">Device Details</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="deviceModel" value={formData.deviceModel} onChange={handleChange} placeholder="Model" className="input-field" />
                    <input name="deviceVariant" value={formData.deviceVariant} onChange={handleChange} placeholder="Variant (RAM/Storage)" className="input-field" />
                    <input name="deviceColor" value={formData.deviceColor} onChange={handleChange} placeholder="Color" className="input-field" />
                    <input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} className="input-field" />
                    <input name="imei1" value={formData.imei1} onChange={handleChange} placeholder="IMEI 1" className="input-field" />
                    <input name="imei2" value={formData.imei2} onChange={handleChange} placeholder="IMEI 2" className="input-field" />
                </div></div>
                <div className="mb-6"><h3 className="text-lg font-semibold text-blue-400 mb-4">Issue Details</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select name="issueType" value={formData.issueType} onChange={handleChange} className="input-field"><option value="">Select Issue Type</option>{issueTypes.map(t => <option key={t}>{t}</option>)}</select>
                    <input name="subIssueType" value={formData.subIssueType} onChange={handleChange} placeholder="Sub Issue Type" className="input-field" />
                </div></div>
                <div className="flex gap-4 pt-4"><button type="submit" disabled={loading} className="btn-primary"><FiSave /> {loading ? 'Processing...' : 'Register Case'}</button><button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary"><FiX /> Cancel</button></div>
            </form>
        </div>
    );
}