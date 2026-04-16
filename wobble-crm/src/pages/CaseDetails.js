import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiPhone, FiMail, FiMapPin, FiPhoneCall, FiCpu, FiEdit2, FiSave, FiX, FiClock, FiPrinter, FiFileText, FiCalendar, FiMessageSquare, FiDownload } from 'react-icons/fi';

export default function CaseDetails() {
  const { id } = useParams();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [showJobReport, setShowJobReport] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  const fetchCaseData = useCallback(async () => {
    try {
      const docRef = doc(db, 'cases', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setCaseData(data);
        setEditData(data);
      } else {
        toast.error('Case not found');
        navigate('/cases/search');
      }
    } catch (error) {
      toast.error('Error fetching case');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCaseData();
  }, [fetchCaseData]);

  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(caseData);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'cases', id), {
        customerName: editData.customerName,
        mobileNumber: editData.mobileNumber,
        alternateNumber: editData.alternateNumber,
        email: editData.email,
        addressLocality: editData.addressLocality,
        addressCity: editData.addressCity,
        addressPin: editData.addressPin,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Customer details updated');
      setIsEditing(false);
      await fetchCaseData();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    const existingNotes = caseData.jobNotes || [];
    const updatedNotes = [...existingNotes, {
      id: Date.now(),
      text: newNote,
      date: new Date().toISOString(),
      author: role,
      authorName: user?.email?.split('@')[0] || (role === 'service' ? 'Service Engineer' : 'Call Center Agent')
    }];
    try {
      await updateDoc(doc(db, 'cases', id), { jobNotes: updatedNotes });
      toast.success('Note added');
      setNewNote('');
      setShowNotesModal(false);
      await fetchCaseData();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Open': 'badge-green',
      'Closed': 'badge-gray',
      'In Progress': 'badge-yellow',
      'Pending Approval': 'badge-orange',
      'Part Dispatched': 'badge-blue',
      'Part Received': 'badge-purple',
    };
    return badges[status] || 'badge-gray';
  };

  const calculateDaysOld = () => {
    if (!caseData?.caseRegisterDate) return 0;
    const diff = Math.ceil((new Date() - new Date(caseData.caseRegisterDate)) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Receipt - ${caseData.jobId}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: white; }
          .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #1e293b; }
          .subtitle { color: #64748b; font-size: 14px; }
          .case-id { background: #f1f5f9; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .case-id span { font-size: 20px; font-weight: bold; font-family: monospace; color: #2563eb; }
          .details { margin: 20px 0; }
          .row { display: flex; margin: 10px 0; padding: 8px; border-bottom: 1px solid #e2e8f0; }
          .label { font-weight: bold; width: 150px; color: #475569; }
          .value { color: #1e293b; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #94a3b8; }
        </style>
        </head>
        <body>
          <div class="header"><div class="logo">🔄 Wobble One CRM</div><div class="subtitle">Service Receipt</div></div>
          <div class="case-id"><span>Case ID: ${caseData.jobId}</span></div>
          <div class="details">
            <div class="row"><div class="label">Customer Name:</div><div class="value">${caseData.customerName}</div></div>
            <div class="row"><div class="label">Mobile Number:</div><div class="value">${caseData.mobileNumber}</div></div>
            <div class="row"><div class="label">Alternate:</div><div class="value">${caseData.alternateNumber || 'N/A'}</div></div>
            <div class="row"><div class="label">Device Model:</div><div class="value">${caseData.deviceModel || 'N/A'}</div></div>
            <div class="row"><div class="label">IMEI:</div><div class="value">${caseData.imei1 || 'N/A'}</div></div>
            <div class="row"><div class="label">Issue Type:</div><div class="value">${caseData.issueType || 'N/A'}</div></div>
            <div class="row"><div class="label">Status:</div><div class="value">${caseData.jobStatus}</div></div>
            <div class="row"><div class="label">Register Date:</div><div class="value">${new Date(caseData.caseRegisterDate).toLocaleString()}</div></div>
          </div>
          <div class="footer"><p>Thank you for choosing Wobble One Service</p><p>For support: support@wobbleone.com</p></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintJobReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Job Report - ${caseData.jobId}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: white; }
          .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #1e293b; }
          .subtitle { color: #64748b; }
          .section { margin: 25px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #2563eb; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 15px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .info-card { background: #f8fafc; padding: 12px; border-radius: 10px; }
          .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .value { font-size: 14px; font-weight: 500; color: #1e293b; margin-top: 4px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #94a3b8; }
        </style>
        </head>
        <body>
          <div class="header"><div class="logo">🔄 Wobble One CRM</div><div class="subtitle">Job Report</div></div>
          <div class="section"><div class="section-title">Case Information</div><div class="grid"><div class="info-card"><div class="label">Job ID</div><div class="value">${caseData.jobId}</div></div><div class="info-card"><div class="label">Status</div><div class="value">${caseData.jobStatus}</div></div><div class="info-card"><div class="label">Register Date</div><div class="value">${new Date(caseData.caseRegisterDate).toLocaleString()}</div></div><div class="info-card"><div class="label">Case Age</div><div class="value">${calculateDaysOld()} days</div></div></div></div>
          <div class="section"><div class="section-title">Customer Details</div><div class="grid"><div class="info-card"><div class="label">Name</div><div class="value">${caseData.customerName}</div></div><div class="info-card"><div class="label">Mobile</div><div class="value">${caseData.mobileNumber}</div></div><div class="info-card"><div class="label">Email</div><div class="value">${caseData.email || 'N/A'}</div></div><div class="info-card"><div class="label">Address</div><div class="value">${caseData.addressLocality || ''} ${caseData.addressCity || ''}</div></div></div></div>
          <div class="section"><div class="section-title">Device & Issue</div><div class="grid"><div class="info-card"><div class="label">Device Model</div><div class="value">${caseData.deviceModel || 'N/A'}</div></div><div class="info-card"><div class="label">IMEI</div><div class="value">${caseData.imei1 || 'N/A'}</div></div><div class="info-card"><div class="label">Warranty</div><div class="value">${caseData.warranty || 'Unknown'}</div></div><div class="info-card"><div class="label">Issue Type</div><div class="value">${caseData.issueType || 'N/A'}</div></div></div></div>
          <div class="footer"><p>System generated report - Wobble One CRM</p></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  if (!caseData) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-white">Case Details</h2>
              <span className={`badge ${getStatusBadge(caseData.jobStatus)}`}>{caseData.jobStatus}</span>
            </div>
            <div className="mt-3">
              <p className="text-slate-400 text-sm">Case ID:</p>
              <p className="text-2xl font-bold font-mono bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{caseData.jobId}</p>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1"><FiCalendar size={14} /> Registered: {new Date(caseData.caseRegisterDate).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><FiClock size={14} /> {calculateDaysOld()} days old</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowReceipt(true)} className="btn-secondary flex items-center gap-2 text-sm"><FiPrinter /> Receipt</button>
            <button onClick={() => setShowJobReport(true)} className="btn-secondary flex items-center gap-2 text-sm"><FiFileText /> Job Report</button>
            {role === 'admin' && (
              <button onClick={() => navigate('/reports')} className="btn-primary flex items-center gap-2 text-sm"><FiDownload /> Export</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2"><FiUser className="text-blue-500" /> Customer Information</h3>
              {!isEditing && (role === 'admin' || role === 'callcenter') && (
                <button onClick={handleEdit} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 text-sm"><FiEdit2 size={14} /> Edit</button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="customerName" value={editData.customerName || ''} onChange={handleInputChange} placeholder="Full Name" className="input-field" />
                  <input name="mobileNumber" value={editData.mobileNumber || ''} onChange={handleInputChange} placeholder="Mobile" className="input-field" />
                  <input name="alternateNumber" value={editData.alternateNumber || ''} onChange={handleInputChange} placeholder="Alternate" className="input-field" />
                  <input name="email" value={editData.email || ''} onChange={handleInputChange} placeholder="Email" className="input-field" />
                  <input name="addressLocality" value={editData.addressLocality || ''} onChange={handleInputChange} placeholder="Locality" className="input-field" />
                  <input name="addressCity" value={editData.addressCity || ''} onChange={handleInputChange} placeholder="City" className="input-field" />
                  <input name="addressPin" value={editData.addressPin || ''} onChange={handleInputChange} placeholder="PIN" className="input-field" />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveEdit} className="btn-primary flex items-center gap-2"><FiSave /> Save</button>
                  <button onClick={handleCancelEdit} className="btn-secondary flex items-center gap-2"><FiX /> Cancel</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl"><FiUser className="text-blue-500 mt-1" /><div><p className="text-gray-500 dark:text-slate-400 text-xs">Full Name</p><p className="font-semibold text-gray-800 dark:text-white">{caseData.customerName}</p></div></div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl"><FiPhone className="text-green-500 mt-1" /><div><p className="text-gray-500 dark:text-slate-400 text-xs">Mobile</p><p className="text-gray-800 dark:text-white">{caseData.mobileNumber}</p></div></div>
                {caseData.alternateNumber && <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl"><FiPhoneCall className="text-yellow-500 mt-1" /><div><p className="text-gray-500 dark:text-slate-400 text-xs">Alternate</p><p className="text-gray-800 dark:text-white">{caseData.alternateNumber}</p></div></div>}
                {caseData.email && <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl"><FiMail className="text-purple-500 mt-1" /><div><p className="text-gray-500 dark:text-slate-400 text-xs">Email</p><p className="text-gray-800 dark:text-white">{caseData.email}</p></div></div>}
                <div className="md:col-span-2 flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl"><FiMapPin className="text-red-500 mt-1" /><div><p className="text-gray-500 dark:text-slate-400 text-xs">Address</p><p className="text-gray-800 dark:text-white">{caseData.addressLocality ? `${caseData.addressLocality}, ` : ''}{caseData.addressCity || ''}{caseData.addressPin ? ` - ${caseData.addressPin}` : ''}</p></div></div>
              </div>
            )}
          </div>

          {/* Device & Issue Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><FiCpu className="text-purple-500" /> Device & Issue</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-gray-500 dark:text-slate-400 text-xs">Model</p><p className="font-medium text-gray-800 dark:text-white">{caseData.deviceModel || 'N/A'}</p></div>
              <div><p className="text-gray-500 dark:text-slate-400 text-xs">Variant</p><p className="text-gray-800 dark:text-white">{caseData.deviceVariant || 'N/A'}</p></div>
              <div><p className="text-gray-500 dark:text-slate-400 text-xs">Color</p><p className="text-gray-800 dark:text-white">{caseData.deviceColor || 'N/A'}</p></div>
              <div><p className="text-gray-500 dark:text-slate-400 text-xs">Purchase Date</p><p className="text-gray-800 dark:text-white">{caseData.purchaseDate ? new Date(caseData.purchaseDate).toLocaleDateString() : 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-gray-500 dark:text-slate-400 text-xs">IMEI</p><p className="font-mono text-sm text-gray-800 dark:text-white">{caseData.imei1 || 'N/A'}</p>{caseData.imei2 && <p className="font-mono text-sm mt-1 text-gray-800 dark:text-white">{caseData.imei2}</p>}</div>
              <div><p className="text-gray-500 dark:text-slate-400 text-xs">Warranty</p><p className={caseData.warranty?.includes('In') ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400'}>{caseData.warranty || 'Unknown'}</p></div>
              <div><p className="text-gray-500 dark:text-slate-400 text-xs">Issue Type</p><p className="text-gray-800 dark:text-white">{caseData.issueType || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-gray-500 dark:text-slate-400 text-xs">Sub Issue</p><p className="text-gray-800 dark:text-white">{caseData.subIssueType || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-gray-500 dark:text-slate-400 text-xs">Diagnosis</p><p className="text-gray-800 dark:text-white">{caseData.diagnosis || 'Pending'}</p></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Service Center Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">🏢 Service Center</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Center ID:</span><span className="font-mono text-gray-800 dark:text-white">{caseData.serviceCenterId || 'SC-WBL-001'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Center Name:</span><span className="text-gray-800 dark:text-white">{caseData.serviceCenterName || 'Wobble One Main Center'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Contact:</span><span className="text-gray-800 dark:text-white">{caseData.serviceCenterContact || '+91 98765 43210'}</span></div>
            </div>
          </div>

          {/* Job Notes Card - Lighter background */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl shadow-lg p-6 border border-amber-200 dark:border-amber-700/30">
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2"><FiMessageSquare className="text-amber-600" /> Job Notes</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {caseData.jobNotes && caseData.jobNotes.length > 0 ? (
                caseData.jobNotes.map((note, idx) => (
                  <div key={note.id || idx} className="p-3 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border border-amber-100 dark:border-amber-800/30">
                    <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400 mb-1">
                      <span className="font-medium">{note.authorName || note.author}</span>
                      <span>{new Date(note.date).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{note.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-slate-400 text-center py-4">No notes added</p>
              )}
            </div>
            <button onClick={() => setShowNotesModal(true)} className="w-full mt-3 btn-secondary text-sm flex items-center justify-center gap-2">
              <FiMessageSquare /> Add Note
            </button>
          </div>

          {/* Actions Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Actions</h3>
            <div className="space-y-2">
              <button onClick={() => navigate(`/service/case/${id}`)} className="w-full btn-primary text-sm">Full Service View</button>
              <button onClick={handlePrintReceipt} className="w-full btn-secondary text-sm flex items-center justify-center gap-2"><FiPrinter /> Print Receipt</button>
              <button onClick={handlePrintJobReport} className="w-full btn-secondary text-sm flex items-center justify-center gap-2"><FiFileText /> Print Job Report</button>
              {role === 'admin' && (
                <button onClick={() => navigate('/reports')} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-sm flex items-center justify-center gap-2"><FiDownload /> Export Data</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white"><div className="flex justify-between"><h2 className="text-xl font-bold">Service Receipt</h2><button onClick={() => setShowReceipt(false)}><FiX size={24} /></button></div></div>
            <div className="p-6"><div className="text-center mb-4"><div className="text-4xl mb-2">🔄</div><p className="font-bold text-gray-800">Wobble One CRM</p><p className="text-xs text-gray-500">Service Receipt</p></div><div className="border-t border-b border-gray-200 py-4 my-4"><div className="space-y-2 text-gray-800"><div className="flex justify-between"><span className="font-semibold">Case ID:</span><span className="font-mono">{caseData.jobId}</span></div><div className="flex justify-between"><span className="font-semibold">Customer:</span><span>{caseData.customerName}</span></div><div className="flex justify-between"><span className="font-semibold">Mobile:</span><span>{caseData.mobileNumber}</span></div><div className="flex justify-between"><span className="font-semibold">Device:</span><span>{caseData.deviceModel || 'N/A'}</span></div><div className="flex justify-between"><span className="font-semibold">Status:</span><span className="text-green-600">{caseData.jobStatus}</span></div></div></div><div className="text-center text-xs text-gray-500">Thank you for choosing Wobble One Service</div></div>
            <div className="p-4 bg-gray-50 flex gap-3"><button onClick={handlePrintReceipt} className="flex-1 bg-blue-600 text-white py-2 rounded-xl">Print</button><button onClick={() => setShowReceipt(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl">Close</button></div>
          </div>
        </div>
      )}

      {/* Job Report Modal */}
      {showJobReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white sticky top-0"><div className="flex justify-between"><h2 className="text-xl font-bold">Job Report</h2><button onClick={() => setShowJobReport(false)}><FiX size={24} /></button></div></div>
            <div className="p-6"><div className="text-center mb-6"><div className="text-4xl">🔄</div><p className="font-bold text-xl text-gray-800">Wobble One CRM</p><p className="text-gray-500">Job Report</p></div><div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs">Job ID</p><p className="font-mono font-bold text-gray-800">{caseData.jobId}</p></div><div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs">Status</p><p className="font-semibold text-green-600">{caseData.jobStatus}</p></div><div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs">Registered Date</p><p className="text-gray-800">{new Date(caseData.caseRegisterDate).toLocaleString()}</p></div><div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 text-xs">Case Age</p><p className="text-gray-800">{calculateDaysOld()} days</p></div></div><div className="mb-6"><h3 className="font-semibold text-gray-800 mb-2">Customer Details</h3><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-gray-500">Name</p><p className="font-medium">{caseData.customerName}</p></div><div><p className="text-gray-500">Mobile</p><p>{caseData.mobileNumber}</p></div><div><p className="text-gray-500">Email</p><p>{caseData.email || 'N/A'}</p></div><div><p className="text-gray-500">Address</p><p>{caseData.addressLocality || ''} {caseData.addressCity || ''}</p></div></div></div><div><h3 className="font-semibold text-gray-800 mb-2">Device & Issue</h3><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-gray-500">Device Model</p><p>{caseData.deviceModel || 'N/A'}</p></div><div><p className="text-gray-500">IMEI</p><p>{caseData.imei1 || 'N/A'}</p></div><div><p className="text-gray-500">Warranty</p><p>{caseData.warranty || 'Unknown'}</p></div><div><p className="text-gray-500">Issue</p><p>{caseData.issueType || 'N/A'}</p></div></div></div></div>
            <div className="p-4 bg-gray-50 flex gap-3 sticky bottom-0"><button onClick={handlePrintJobReport} className="flex-1 bg-blue-600 text-white py-2 rounded-xl">Print Report</button><button onClick={() => setShowJobReport(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl">Close</button></div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add Job Note</h3>
            <textarea rows="4" className="input-field mb-4" placeholder="Enter note..." value={newNote} onChange={e => setNewNote(e.target.value)} />
            <div className="flex gap-3"><button onClick={handleAddNote} className="btn-primary flex-1">Add</button><button onClick={() => setShowNotesModal(false)} className="btn-secondary flex-1">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}