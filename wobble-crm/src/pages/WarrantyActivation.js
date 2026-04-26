import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function WarrantyActivation() {
  const { role } = useAuth();
  const [imei, setImei] = useState('');
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const searchDevice = async () => {
    if (!imei) return toast.error('Enter IMEI');
    setLoading(true);
    try {
      const q = query(collection(db, 'devices'), where('imei', '==', imei));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        toast.error('Device not found');
        setDevice(null);
      } else {
        setDevice({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const activateExtendedWarranty = async () => {
    if (!device) return;
    const purchaseDate = new Date(device.purchaseDate);
    const now = new Date();
    const daysDiff = (now - purchaseDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30 && role !== 'admin') {
      toast.error('Extended warranty can only be activated within 30 days of purchase. Contact admin.');
      return;
    }
    if (!reason && role !== 'admin') {
      toast.error('Please provide a reason');
      return;
    }
    setLoading(true);
    try {
      const newExpiry = new Date(purchaseDate);
      newExpiry.setMonth(newExpiry.getMonth() + 24);
      await updateDoc(doc(db, 'devices', device.id), {
        extendedWarranty: true,
        warrantyStatus: 'In Warranty',
        warrantyExpiry: newExpiry.toISOString(),
        extendedActivatedBy: role,
        extendedActivatedReason: reason,
        extendedActivatedAt: new Date().toISOString(),
      });
      toast.success('Extended warranty activated');
      setDevice(null);
      setImei('');
    } catch (error) {
      toast.error('Activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Warranty Activation</h2>
        <p className="text-gray-500 mt-1">Activate extended warranty for devices (within 30 days)</p>
      </div>
      <div className="card mb-6">
        <div className="flex gap-4">
          <input type="text" placeholder="Enter IMEI" value={imei} onChange={e => setImei(e.target.value)} className="input-field flex-1" />
          <button onClick={searchDevice} className="btn-primary">Search</button>
        </div>
      </div>
      {device && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Device Details</h3>
          <div className="space-y-2">
            <p><strong>IMEI:</strong> {device.imei}</p>
            <p><strong>Customer:</strong> {device.customerName}</p>
            <p><strong>Purchase Date:</strong> {new Date(device.purchaseDate).toLocaleDateString()}</p>
            <p><strong>Current Warranty:</strong> <span className={device.warrantyStatus === 'In Warranty' ? 'text-green-600' : 'text-red-400'}>{device.warrantyStatus}</span></p>
            <p><strong>Extended Warranty Active:</strong> {device.extendedWarranty ? 'Yes' : 'No'}</p>
            {!device.extendedWarranty && (
              <>
                <textarea placeholder="Reason for activation (if >30 days, admin only)" rows={2} className="input-field" value={reason} onChange={e => setReason(e.target.value)} />
                <button onClick={activateExtendedWarranty} disabled={loading} className="btn-primary w-full mt-4">Activate Extended Warranty</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}