import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FiSave, FiSearch, FiMapPin, FiSend, FiFileText, FiCheckCircle } from 'react-icons/fi';
import WarrantyReceiptModal from '../components/WarrantyReceiptModal';

export default function CallCenterWarranty() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        imei: '',
        customerName: '',
        mobileNumber: '',
        email: '',
        purchaseDate: '',
        serviceCenter: '',
    });
    const [activationData, setActivationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [deviceData, setDeviceData] = useState(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const searchIMEI = async () => {
        if (!formData.imei) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'devices'), where('imei', '==', formData.imei));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                const deviceId = snapshot.docs[0].id;
                setActivationData(data);
                setDeviceData({ id: deviceId, ...data });
                setFormData({
                    ...formData,
                    customerName: data.customerName || '',
                    mobileNumber: data.mobileNumber || '',
                    email: data.email || '',
                    purchaseDate: data.purchaseDate || '',
                });
                toast.success('Device details loaded');
            } else {
                toast.error('IMEI not found in devices');
            }
        } catch (error) {
            toast.error('Error searching IMEI');
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
        setLoading(true);
        try {
            const requestData = {
                ...formData,
                type: 'warranty_extension',
                status: 'Pending Approval',
                requestedAt: new Date().toISOString(),
                extendedWarrantyEnd: new Date(new Date(formData.purchaseDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            };
            await addDoc(collection(db, 'warrantyRequests'), requestData);
            toast.success('Warranty extension request submitted for approval');
            setFormData({
                imei: '',
                customerName: '',
                mobileNumber: '',
                email: '',
                purchaseDate: '',
                serviceCenter: '',
            });
            setActivationData(null);
            setDeviceData(null);
            setStep(1);
        } catch (error) {
            toast.error('Request failed');
        } finally {
            setLoading(false);
        }
    };

    const sendServiceCenterDetails = () => {
        toast.success('Service center details sent to customer');
    };

    const handleGenerateReceipt = () => {
        if (deviceData) {
            setShowReceipt(true);
        } else {
            toast.error('No device data available');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Extended Warranty Activation</h2>
                <p className="text-slate-400">Activate 1+1 year extended warranty for customers</p>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="mb-6 flex justify-center">
                    <div className="flex items-center gap-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                                {s}
                            </div>
                        ))}
                    </div>
                </div> {/* Closed steps indicator */}

                {step === 1 && (
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Enter IMEI</h3>
                        <div className="flex gap-4">
                            <input
                                name="imei"
                                value={formData.imei}
                                onChange={handleChange}
                                placeholder="Enter IMEI Number"
                                className="input-field flex-1"
                                required
                            />
                            <button type="button" onClick={searchIMEI} disabled={loading} className="btn-primary flex items-center gap-2">
                                <FiSearch /> Search
                            </button>
                        </div>
                        {activationData && (
                            <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                                <p><strong>Current Warranty:</strong> {activationData.warrantyStatus || 'N/A'}</p>
                                <p><strong>Activation Date:</strong> {activationData.activationDate ? new Date(activationData.activationDate).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>End Date:</strong> {activationData.warrantyExpiry ? new Date(activationData.warrantyExpiry).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Customer Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Full Name" className="input-field" required />
                            <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="Mobile Number" className="input-field" required />
                            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input-field" />
                            <input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} className="input-field" required />
                        </div>
                        <div className="mt-4">
                            <button type="button" onClick={sendServiceCenterDetails} className="btn-secondary flex items-center gap-2">
                                <FiMapPin /> Share Service Center Details
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Warranty Extension</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-green-500/10 rounded-lg">
                                <p className="text-green-400 font-semibold">Extended Warranty: 1+1 Year (Total 2 Years)</p>
                                <p>Start Date: {new Date(formData.purchaseDate).toLocaleDateString()}</p>
                                <p>End Date: {new Date(new Date(formData.purchaseDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                            </div>
                            <select name="serviceCenter" value={formData.serviceCenter} onChange={handleChange} className="input-field" required>
                                <option value="">Select Service Center</option>
                                <option value="Center 1">Service Center 1</option>
                                <option value="Center 2">Service Center 2</option>
                                <option value="Center 3">Service Center 3</option>
                            </select>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => toast.success('Message sent to customer')} className="btn-secondary flex items-center gap-2">
                                    <FiSend /> Send Update to Customer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 pt-4 justify-between">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary">
                            Previous
                        </button>
                    )}
                    <div className="flex gap-4 ml-auto">
                        {step < 3 && (
                            <button type="submit" className="btn-primary">
                                Next
                            </button>
                        )}
                        {step === 3 && (
                            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                <FiSave /> {loading ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* Warranty Receipt Section */}
            {deviceData && deviceData.warrantyStatus === 'In Warranty' && (
                <div className="card mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                        <FiCheckCircle className="text-green-600 text-xl" />
                        <h3 className="text-lg font-bold text-green-800">Warranty Receipt Available</h3>
                    </div>
                    <p className="text-sm text-green-700 mb-4">
                        This device has an active warranty. You can generate and share the branded warranty certificate with the customer.
                    </p>
                    <button
                        onClick={handleGenerateReceipt}
                        className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <FiFileText /> Generate & Share Warranty Receipt
                    </button>
                </div>
            )}

            <WarrantyReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                deviceData={deviceData}
            />
        </div>
    );
}
