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
        customerName: '',
        mobileNumber: '',
        alternateNumber: '',
        email: '',
        addressPin: '',
        addressLocality: '',
        addressCity: '',
        deviceModel: '',
        deviceVariant: '',
        deviceColor: '',
        imei1: '',
        imei2: '',
        purchaseDate: '',
        issueType: '',
        subIssueType: '',
    });

    const issueTypes = [
        'Display Issue', 'Battery Issue', 'Charging Port', 'Camera Problem',
        'Speaker Issue', 'Microphone Problem', 'Water Damage', 'Software Problem',
        'Network Issue', 'Physical Damage', 'Motherboard Issue', 'Other'
    ];

    const generateJobId = () => {
        const prefix = 'WOB';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}${timestamp}${random}`;
    };

    const calculateWarranty = (purchaseDate) => {
        if (!purchaseDate) return 'Unknown';
        const purchase = new Date(purchaseDate);
        const now = new Date();
        const diffMonths = (now - purchase) / (1000 * 60 * 60 * 24 * 30);
        return diffMonths <= 12 ? 'In Warranty ✅' : 'Out of Warranty ⚠️';
    };

    const checkDuplicateOpenCase = async (mobileNumber, imei1) => {
        const casesRef = collection(db, 'cases');
        const snapshot = await getDocs(casesRef);
        const allCases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const existingByMobile = allCases.find(c =>
            c.mobileNumber === mobileNumber && c.jobStatus !== 'Closed'
        );

        if (existingByMobile) {
            return { id: existingByMobile.id, data: () => existingByMobile };
        }

        if (imei1) {
            const existingByImei = allCases.find(c =>
                c.imei1 === imei1 && c.jobStatus !== 'Closed'
            );
            if (existingByImei) {
                return { id: existingByImei.id, data: () => existingByImei };
            }
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.customerName || !formData.mobileNumber) {
            toast.error('Customer Name and Mobile Number are required');
            return;
        }

        setLoading(true);

        try {
            const existingCase = await checkDuplicateOpenCase(formData.mobileNumber, formData.imei1);

            if (existingCase) {
                const existingData = existingCase.data();
                toast.custom((t) => (
                    <div className="bg-yellow-500 text-white p-4 rounded-lg shadow-lg max-w-md">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle size={24} />
                            <div>
                                <p className="font-bold">Open case already exists!</p>
                                <p className="text-sm">Job ID: {existingData.jobId}</p>
                                <p className="text-sm">Status: {existingData.jobStatus}</p>
                            </div>
                        </div>
                    </div>
                ), { duration: 5000 });

                navigate(`/case/${existingCase.id}`);
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Register New Case
                </h2>
                <p className="text-gray-400 mt-1">Fill in the customer and device details below</p>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Customer Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Customer Name *</label>
                            <input name="customerName" value={formData.customerName} onChange={handleChange} className="input-field" required placeholder="Enter full name" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Mobile Number *</label>
                            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="input-field" required placeholder="10 digit mobile number" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Alternate Number</label>
                            <input name="alternateNumber" value={formData.alternateNumber} onChange={handleChange} className="input-field" placeholder="Optional" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="customer@example.com" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">PIN Code</label>
                            <input name="addressPin" value={formData.addressPin} onChange={handleChange} className="input-field" placeholder="6 digit PIN" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Locality</label>
                            <input name="addressLocality" value={formData.addressLocality} onChange={handleChange} className="input-field" placeholder="Area / Street" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-300 mb-2">City</label>
                            <input name="addressCity" value={formData.addressCity} onChange={handleChange} className="input-field" placeholder="City name" />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Device Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Device Model</label>
                            <input name="deviceModel" value={formData.deviceModel} onChange={handleChange} className="input-field" placeholder="e.g., iPhone 13, Samsung S23" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Variant</label>
                            <input name="deviceVariant" value={formData.deviceVariant} onChange={handleChange} className="input-field" placeholder="e.g., 128GB, 8GB RAM" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Color</label>
                            <input name="deviceColor" value={formData.deviceColor} onChange={handleChange} className="input-field" placeholder="e.g., Black, Blue" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Purchase Date</label>
                            <input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">IMEI 1</label>
                            <input name="imei1" value={formData.imei1} onChange={handleChange} className="input-field" placeholder="15 digit number" />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">IMEI 2</label>
                            <input name="imei2" value={formData.imei2} onChange={handleChange} className="input-field" placeholder="15 digit number" />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Issue Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Issue Type</label>
                            <select name="issueType" value={formData.issueType} onChange={handleChange} className="input-field">
                                <option value="">Select Issue Type</option>
                                {issueTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Sub Issue Type</label>
                            <input name="subIssueType" value={formData.subIssueType} onChange={handleChange} className="input-field" placeholder="e.g., Screen crack, Battery drain" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                        <FiSave /> {loading ? 'Processing...' : 'Register Case'}
                    </button>
                    <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center gap-2">
                        <FiX /> Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}