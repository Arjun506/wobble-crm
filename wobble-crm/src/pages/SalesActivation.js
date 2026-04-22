import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FiSave, FiSearch } from 'react-icons/fi';

export default function SalesActivation() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        imei: '',
        customerName: '',
        mobileNumber: '',
        email: '',
        purchaseDate: '',
        warrantyType: '1 Year', // 1 Year or Extended
        extendedWarranty: false,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const searchIMEI = async () => {
        if (!formData.imei) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'activations'), where('imei', '==', formData.imei));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setFormData({
                    ...formData,
                    customerName: data.customerName || '',
                    mobileNumber: data.mobileNumber || '',
                    email: data.email || '',
                    purchaseDate: data.purchaseDate || '',
                });
                toast.success('Customer details loaded');
            } else {
                toast.error('IMEI not found in activations');
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
            const activationData = {
                ...formData,
                activationDate: new Date().toISOString(),
                warrantyEndDate: formData.warrantyType === '1 Year' ? new Date(new Date(formData.purchaseDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() : new Date(new Date(formData.purchaseDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            };
            await addDoc(collection(db, 'activations'), activationData);
            toast.success('Mobile activated successfully');
            setFormData({
                imei: '',
                customerName: '',
                mobileNumber: '',
                email: '',
                purchaseDate: '',
                warrantyType: '1 Year',
                extendedWarranty: false,
            });
            setStep(1);
        } catch (error) {
            toast.error('Activation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Mobile Activation</h2>
                <p className="text-slate-400">Activate customer mobile and warranty</p>
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
                </div>

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
                            <button type="button" onClick={searchIMEI} disabled={loading} className="btn-primary">
                                <FiSearch /> Search
                            </button>
                        </div>
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
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Warranty Selection</h3>
                        <div className="space-y-4">
                            <select name="warrantyType" value={formData.warrantyType} onChange={handleChange} className="input-field">
                                <option value="1 Year">1 Year Warranty</option>
                                <option value="Extended">Extended Warranty (2 Years)</option>
                            </select>
                            {formData.warrantyType === 'Extended' && (
                                <div className="p-4 bg-green-500/10 rounded-lg">
                                    <p className="text-green-400">Extended warranty activated! Valid for 2 years from purchase date.</p>
                                </div>
                            )}
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
                            <button type="submit" disabled={loading} className="btn-primary">
                                <FiSave /> {loading ? 'Activating...' : 'Activate Mobile'}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}