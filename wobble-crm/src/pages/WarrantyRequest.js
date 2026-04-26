import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiSave } from 'react-icons/fi';

export default function WarrantyRequest() {
  const navigate = useNavigate();
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

  const requestWarranty = async () => {
    if (!device) return;
    if (!reason) return toast.error('Please provide reason');
    setLoading(true);
    try {
      await addDoc(collection(db, 'warrantyRequests'), {
        imei: device.imei,
        customerName: device.customerName,
        mobileNumber: device.mobileNumber,
        requestDate: new Date().toISOString(),
        status: 'Pending',
        extendedYears: 1,
        reason: reason,
      });
      toast.success('Warranty extension request sent to admin');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><h2 className="text-3xl font-bold">Extended Warranty Request</h2><p className="text-gray-500">Request +1 year warranty for device</p></div>
      <div className="card mb-6"><div className="flex gap-4"><input type="text" placeholder="Enter IMEI" value={imei} onChange={e => setImei(e.target.value)} className="input-field flex-1" /><button onClick={searchDevice} className="btn-primary">Search</button></div></div>
      {device && (
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">Device Details</h3>
          <p><strong>IMEI:</strong> {device.imei}</p>
          <p><strong>Customer:</strong> {device.customerName}</p>
          <p><strong>Purchase Date:</strong> {new Date(device.purchaseDate).toLocaleDateString()}</p>
          <p><strong>Current Warranty Expiry:</strong> {device.warrantyExpiry ? new Date(device.warrantyExpiry).toLocaleDateString() : 'N/A'}</p>
          <textarea placeholder="Reason for extension" rows={3} className="input-field" value={reason} onChange={e => setReason(e.target.value)} />
          <button onClick={requestWarranty} disabled={loading} className="btn-primary w-full">Submit Request</button>
        </div>
      )}
    </div>
  );
}