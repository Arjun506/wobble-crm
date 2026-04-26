import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiX } from 'react-icons/fi';

export default function BulkUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsArrayBuffer(file);
  };

  const calculateWarranty = (purchaseDate, extended) => {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    let months = 12;
    if (extended) months = 24;
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + months);
    return now <= expiry ? 'In Warranty' : 'Out of Warranty';
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        let success = 0;
        for (const row of rows) {
          const warrantyStatus = calculateWarranty(row.purchaseDate, row.extendedWarranty || false);
          await addDoc(collection(db, 'devices'), {
            imei: row.imei,
            customerName: row.customerName,
            mobileNumber: row.mobileNumber,
            purchaseDate: row.purchaseDate,
            purchasePlatform: row.purchasePlatform || 'Online',
            dealerName: row.dealerName || '',
            extendedWarranty: row.extendedWarranty || false,
            isActive: true,
            activationDate: new Date().toISOString(),
            warrantyStatus,
            warrantyExpiry: new Date(new Date(row.purchaseDate).setMonth(new Date(row.purchaseDate).getMonth() + (row.extendedWarranty ? 24 : 12))).toISOString(),
          });
          success++;
        }
        toast.success(`${success} devices activated`);
        navigate('/sales/dashboard');
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error('Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Bulk Upload Devices</h2>
        <p className="text-gray-500 mt-1">Upload Excel file with columns: imei, customerName, mobileNumber, purchaseDate, purchasePlatform, dealerName, extendedWarranty</p>
      </div>
      <div className="card">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="mb-4" />
          {preview.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Preview (first 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr>{Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
                  <tbody>{preview.map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex gap-4 mt-6 justify-center">
            <button onClick={handleUpload} disabled={loading} className="btn-primary"><FiUpload /> {loading ? 'Uploading...' : 'Upload & Activate'}</button>
            <button onClick={() => navigate('/sales/dashboard')} className="btn-secondary"><FiX /> Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}