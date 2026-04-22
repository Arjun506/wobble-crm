import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX, FiAlertCircle, FiChevronLeft, FiChevronRight, FiSearch, FiUpload, FiTool } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function CaseRegister() {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState('register'); // 'register' or 'update'
    const [searchQuery, setSearchQuery] = useState('');
    const [existingCase, setExistingCase] = useState(null);
    const [formData, setFormData] = useState({
        customerName: '', mobileNumber: '', alternateNumber: '', email: '',
        addressPin: '', addressLocality: '', addressCity: '',
        deviceModel: '', deviceVariant: '', deviceColor: '',
        imei1: '', imei2: '', purchaseDate: '', issueType: '', subIssueType: '',
        diagnosis: '', jobNotes: '',
    });
    const [photos, setPhotos] = useState([]);
    const [photoFiles, setPhotoFiles] = useState([]);

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

    const uploadPhoto = async (file) => {
        const storageRef = ref(storage, `cases/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    };

    const sendNotification = async (type, data) => {
        // Placeholder for WhatsApp/Email notification
        // In production, integrate with WhatsApp API or email service
        console.log(`Sending ${type} notification:`, data);
        // Simulate API call
        try {
            // Here you would call your notification service
            // await fetch('/api/send-notification', { method: 'POST', body: JSON.stringify({ type, data }) });
            toast.success('Notification sent (simulated)');
        } catch (error) {
            console.error('Notification failed:', error);
        }
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

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        setLoading(true);
        try {
            const urls = await Promise.all(files.map(uploadPhoto));
            setPhotos([...photos, ...urls]);
            toast.success('Photos uploaded');
        } catch (error) {
            toast.error('Error uploading photos');
        } finally {
            setLoading(false);
        }
    };

    const searchCase = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'cases'));
            const cases = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const found = cases.find(c => c.jobId === searchQuery || c.mobileNumber === searchQuery || c.imei1 === searchQuery);
            if (found) {
                setExistingCase(found);
                setFormData({
                    customerName: found.customerName || '',
                    mobileNumber: found.mobileNumber || '',
                    alternateNumber: found.alternateNumber || '',
                    email: found.email || '',
                    addressPin: found.addressPin || '',
                    addressLocality: found.addressLocality || '',
                    addressCity: found.addressCity || '',
                    deviceModel: found.deviceModel || '',
                    deviceVariant: found.deviceVariant || '',
                    deviceColor: found.deviceColor || '',
                    imei1: found.imei1 || '',
                    imei2: found.imei2 || '',
                    purchaseDate: found.purchaseDate || '',
                    issueType: found.issueType || '',
                    subIssueType: found.subIssueType || '',
                    diagnosis: found.diagnosis || '',
                    jobNotes: found.jobNotes?.join('\n') || '',
                });
                setPhotos(found.photos || []);
                toast.success('Case found and loaded');
            } else {
                toast.error('Case not found');
            }
        } catch (error) {
            toast.error('Error searching case');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
            return;
        }
        if (!formData.customerName || !formData.mobileNumber) {
            toast.error('Customer Name and Mobile Number required');
            return;
        }
        setLoading(true);
        try {
            if (mode === 'register') {
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
                    diagnosis: formData.diagnosis,
                    photos,
                    jobNotes: formData.jobNotes ? [formData.jobNotes] : [],
                    partRequests: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                const docRef = await addDoc(collection(db, 'cases'), caseData);
                toast.success(`Case registered! Job ID: ${jobId}`);
                sendNotification('Case Registration', { jobId, customerName: formData.customerName, mobileNumber: formData.mobileNumber });
                navigate(`/case/${docRef.id}`);
            } else if (mode === 'update' && existingCase) {
                const updateData = {
                    ...formData,
                    diagnosis: formData.diagnosis,
                    photos,
                    jobNotes: [...(existingCase.jobNotes || []), formData.jobNotes].filter(n => n),
                    updatedAt: new Date().toISOString(),
                };
                await updateDoc(doc(db, 'cases', existingCase.id), updateData);
                toast.success('Case updated successfully');
                navigate(`/case/${existingCase.id}`);
            }
        } catch (error) {
            toast.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {mode === 'register' ? 'Register New Case' : 'Update Case'}
                </h2>
                <p className="text-slate-400">Fill customer & device details</p>
            </div>

            {role === 'service' && (
                <div className="mb-6 flex gap-4">
                    <button onClick={() => setMode('register')} className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`}>Register New Case</button>
                    <button onClick={() => setMode('update')} className={`btn ${mode === 'update' ? 'btn-primary' : 'btn-secondary'}`}>Update Existing Case</button>
                </div>
            )}

            {mode === 'update' && role === 'service' && (
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Search Case</h3>
                    <div className="flex gap-4">
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter Job ID, Mobile, or IMEI"
                            className="input-field flex-1"
                        />
                        <button onClick={searchCase} disabled={loading} className="btn-primary">
                            <FiSearch /> Search
                        </button>
                    </div>
                    {existingCase && (
                        <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                            <p><strong>Job ID:</strong> {existingCase.jobId}</p>
                            <p><strong>Customer:</strong> {existingCase.customerName}</p>
                            <p><strong>Status:</strong> {existingCase.jobStatus}</p>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
                {/* Step Indicator */}
                <div className="mb-6 flex justify-center">
                    <div className="flex items-center gap-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                {s}
                            </div>
                        ))}
                    </div>
                </div>

                {step === 1 && (
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Customer Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Full Name *" className="input-field" required />
                            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="Mobile Number *" className="input-field" required />
                            <input name="alternateNumber" value={formData.alternateNumber} onChange={handleChange} placeholder="Alternate Number" className="input-field" />
                            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input-field" />
                            <input name="addressPin" value={formData.addressPin} onChange={handleChange} placeholder="PIN Code" className="input-field" />
                            <input name="addressLocality" value={formData.addressLocality} onChange={handleChange} placeholder="Locality" className="input-field" />
                            <div className="md:col-span-2"><input name="addressCity" value={formData.addressCity} onChange={handleChange} placeholder="City" className="input-field" /></div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Device Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="deviceModel" value={formData.deviceModel} onChange={handleChange} placeholder="Model" className="input-field" />
                            <input name="deviceVariant" value={formData.deviceVariant} onChange={handleChange} placeholder="Variant (RAM/Storage)" className="input-field" />
                            <input name="deviceColor" value={formData.deviceColor} onChange={handleChange} placeholder="Color" className="input-field" />
                            <input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} className="input-field" />
                            <input name="imei1" value={formData.imei1} onChange={handleChange} placeholder="IMEI 1" className="input-field" />
                            <input name="imei2" value={formData.imei2} onChange={handleChange} placeholder="IMEI 2" className="input-field" />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Issue Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <select name="issueType" value={formData.issueType} onChange={handleChange} className="input-field">
                                <option value="">Select Issue Type</option>
                                {issueTypes.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <input name="subIssueType" value={formData.subIssueType} onChange={handleChange} placeholder="Sub Issue Type" className="input-field" />
                        </div>

                        {role === 'service' && (
                            <>
                                <h3 className="text-lg font-semibold text-blue-400 mb-4">Service Details</h3>
                                <div className="mb-4">
                                    <textarea
                                        name="diagnosis"
                                        value={formData.diagnosis}
                                        onChange={handleChange}
                                        placeholder="Diagnosis details"
                                        className="input-field h-24"
                                    />
                                </div>
                                <div className="mb-4">
                                    <textarea
                                        name="jobNotes"
                                        value={formData.jobNotes}
                                        onChange={handleChange}
                                        placeholder="Job notes"
                                        className="input-field h-24"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Upload Photos</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="input-field"
                                    />
                                    {photos.length > 0 && (
                                        <div className="mt-2 flex gap-2 flex-wrap">
                                            {photos.map((url, i) => (
                                                <img key={i} src={url} alt="Uploaded" className="w-16 h-16 object-cover rounded" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="flex gap-4 pt-4 justify-between">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary">
                            <FiChevronLeft /> Previous
                        </button>
                    )}
                    <div className="flex gap-4 ml-auto">
                        {step < 3 && (
                            <button type="submit" className="btn-primary">
                                Next <FiChevronRight />
                            </button>
                        )}
                        {step === 3 && (
                            <button type="submit" disabled={loading} className="btn-primary">
                                <FiSave /> {loading ? 'Processing...' : mode === 'register' ? 'Register Case' : 'Update Case'}
                            </button>
                        )}
                        <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
                            <FiX /> Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}