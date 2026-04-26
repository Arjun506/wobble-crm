import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';

export default function DeviceActivation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    imei: '',
    customerName: '',
    mobileNumber: '',
    purchaseDate: '',
    purchasePlatform: 'Online',
    dealerName: '',
    extendedWarranty: false,
  });

  const calculateWarranty = (purchaseDate, extended = false) => {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    let months = 12;
    if (extended) months = 24;
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + months);
    return now <= expiry ? 'In Warranty' : 'Out of Warranty';
  };

  const checkExistingIMEI = async (imei) => {
    const q = query(collection(db, 'devices'), where('imei', '==', imei));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imei || !formData.customerName || !formData.mobileNumber || !formData.purchaseDate) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const exists = await checkExistingIMEI(formData.imei);
      if (exists) {
        toast.error('IMEI already registered');
        return;
      }
      const warrantyStatus = calculateWarranty(formData.purchaseDate, formData.extendedWarranty);
      const activationData = {
        ...formData,
        isActive: true,
        activationDate: new Date().toISOString(),
        warrantyStatus,
        warrantyExpiry: new Date(new Date(formData.purchaseDate).setMonth(new Date(formData.purchaseDate).getMonth() + (formData.extendedWarranty ? 24 : 12))).toISOString(),
      };
      await addDoc(collection(db, 'devices'), activationData);
      toast.success(`Device activated! Warranty: ${warrantyStatus}`);
      navigate('/sales/dashboard');
    } catch (error) {
      toast.error('Activation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Activate Device</h2>
        <p className="text-gray-500 mt-1">Register new device with warranty</p>
      </div>
      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-4">
          <div><label className="block text-gray-600 mb-2">IMEI Number *</label><input name="imei" value={formData.imei} onChange={handleChange} className="input-field" required /></div>
          <div><label className="block text-gray-600 mb-2">Customer Name *</label><input name="customerName" value={formData.customerName} onChange={handleChange} className="input-field" required /></div>
          <div><label className="block text-gray-600 mb-2">Mobile Number *</label><input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="input-field" required /></div>
          <div><label className="block text-gray-600 mb-2">Purchase Date *</label><input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="input-field" required /></div>
          <div><label className="block text-gray-600 mb-2">Purchase Platform</label><select name="purchasePlatform" value={formData.purchasePlatform} onChange={handleChange} className="input-field"><option>Online</option><option>Offline Retail</option><option>Distributor</option></select></div>
          <div><label className="block text-gray-600 mb-2">Dealer Name</label><input name="dealerName" value={formData.dealerName} onChange={handleChange} className="input-field" /></div>
          <div className="flex items-center gap-2"><input type="checkbox" name="extendedWarranty" checked={formData.extendedWarranty} onChange={handleChange} className="w-4 h-4" /><label className="text-gray-600">Extended Warranty (+1 year)</label></div>
        </div>
        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={loading} className="btn-primary"><FiSave /> {loading ? 'Activating...' : 'Activate Device'}</button>
          <button type="button" onClick={() => navigate('/sales/dashboard')} className="btn-secondary"><FiX /> Cancel</button>
        </div>
      </form>
    </div>
  );
}