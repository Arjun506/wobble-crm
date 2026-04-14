import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
    FiUser, FiPhone, FiMail, FiMapPin, FiPhoneCall,
    FiCpu, FiAlertCircle, FiTool, FiEdit2, FiSave, FiX,
    FiClock, FiPrinter, FiFileText, FiCheckCircle, FiCalendar,
    FiHash, FiBox, FiStar, FiTrendingUp, FiMessageSquare
} from 'react-icons/fi';

export default function CaseDetails() {
    const { id } = useParams();
    const { role } = useAuth();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [jobNotes, setJobNotes] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [showJobReport, setShowJobReport] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [newNote, setNewNote] = useState('');

    const fetchCaseData = async () => {
        try {
            const docRef = doc(db, 'cases', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setCaseData(data);
                setEditData(data);
                setJobNotes(data.jobNotes || '');
            } else {
                toast.error('Case not found');
                navigate('/cases/search');
            }
        } catch (error) {
            toast.error('Error fetching case');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCaseData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleEdit = () => {
        setIsEditing(true);
    };

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
            toast.success('Customer details updated successfully');
            setIsEditing(false);
            await fetchCaseData();
        } catch (error) {
            toast.error('Update failed: ' + error.message);
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
            authorName: caseData.createdBy || 'Call Center Agent'
        }];

        try {
            await updateDoc(doc(db, 'cases', id), {
                jobNotes: updatedNotes
            });
            toast.success('Note added successfully');
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
            'Open': 'bg-green-500/20 text-green-400 border border-green-500/30',
            'Closed': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
            'In Progress': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            'Pending Approval': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
            'Part Dispatched': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        };
        return badges[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    };

    const calculateDaysOld = () => {
        if (!caseData?.caseRegisterDate) return 0;
        const registered = new Date(caseData.caseRegisterDate);
        const now = new Date();
        const diffTime = Math.abs(now - registered);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="card text-center py-12">
                <p className="text-gray-400">Case not found</p>
                <button onClick={() => navigate('/cases/search')} className="btn-primary mt-4">
                    Back to Search
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Case Details
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(caseData.jobStatus)}`}>
                            {caseData.jobStatus}
                        </span>
                        <span className="bg-dark-700 px-3 py-1 rounded-full text-xs font-mono">
                            {caseData.jobId}
                        </span>
                    </div>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <FiCalendar size={14} />
                        Registered on: {new Date(caseData.caseRegisterDate).toLocaleString()}
                        <span className="text-yellow-400 ml-2">
                            ({calculateDaysOld()} days old)
                        </span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowReceipt(true)} className="btn-secondary flex items-center gap-2 text-sm">
                        <FiPrinter /> Receipt
                    </button>
                    <button onClick={() => setShowJobReport(true)} className="btn-secondary flex items-center gap-2 text-sm">
                        <FiFileText /> Job Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Information Card */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <FiUser className="text-blue-400" /> Customer Information
                            </h3>
                            {!isEditing && role !== 'warehouse' && (
                                <button onClick={handleEdit} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm">
                                    <FiEdit2 size={14} /> Edit Details
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Customer Name *</label>
                                        <input name="customerName" value={editData.customerName || ''} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Mobile Number *</label>
                                        <input name="mobileNumber" value={editData.mobileNumber || ''} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Alternate Number</label>
                                        <input name="alternateNumber" value={editData.alternateNumber || ''} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Email</label>
                                        <input name="email" value={editData.email || ''} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Locality/Area</label>
                                        <input name="addressLocality" value={editData.addressLocality || ''} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">City</label>
                                        <input name="addressCity" value={editData.addressCity || ''} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">PIN Code</label>
                                        <input name="addressPin" value={editData.addressPin || ''} onChange={handleInputChange} className="input-field" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleSaveEdit} className="btn-primary flex items-center gap-2 text-sm">
                                        <FiSave /> Save Changes
                                    </button>
                                    <button onClick={handleCancelEdit} className="btn-secondary flex items-center gap-2 text-sm">
                                        <FiX /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-3 bg-dark-700/30 rounded-xl">
                                    <FiUser className="text-blue-400 mt-1" size={18} />
                                    <div>
                                        <p className="text-gray-400 text-xs">Full Name</p>
                                        <p className="font-semibold">{caseData.customerName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-dark-700/30 rounded-xl">
                                    <FiPhone className="text-green-400 mt-1" size={18} />
                                    <div>
                                        <p className="text-gray-400 text-xs">Mobile Number</p>
                                        <p className="font-semibold">{caseData.mobileNumber}</p>
                                    </div>
                                </div>
                                {caseData.alternateNumber && (
                                    <div className="flex items-start gap-3 p-3 bg-dark-700/30 rounded-xl">
                                        <FiPhoneCall className="text-yellow-400 mt-1" size={18} />
                                        <div>
                                            <p className="text-gray-400 text-xs">Alternate Number</p>
                                            <p>{caseData.alternateNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {caseData.email && (
                                    <div className="flex items-start gap-3 p-3 bg-dark-700/30 rounded-xl">
                                        <FiMail className="text-purple-400 mt-1" size={18} />
                                        <div>
                                            <p className="text-gray-400 text-xs">Email</p>
                                            <p className="text-sm">{caseData.email}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="md:col-span-2 flex items-start gap-3 p-3 bg-dark-700/30 rounded-xl">
                                    <FiMapPin className="text-red-400 mt-1" size={18} />
                                    <div>
                                        <p className="text-gray-400 text-xs">Address</p>
                                        <p>
                                            {caseData.addressLocality && `${caseData.addressLocality}, `}
                                            {caseData.addressCity && `${caseData.addressCity}`}
                                            {caseData.addressPin && ` - ${caseData.addressPin}`}
                                            {!caseData.addressLocality && !caseData.addressCity && 'No address provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Device & Issue Details Card */}
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FiCpu className="text-purple-400" /> Device & Issue Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-xs flex items-center gap-1"><FiBox size={12} /> Device Model</p>
                                <p className="font-medium">{caseData.deviceModel || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-xs">Variant (RAM/Storage)</p>
                                <p>{caseData.deviceVariant || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-xs">Color</p>
                                <p>{caseData.deviceColor || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-xs">Purchase Date</p>
                                <p>{caseData.purchaseDate ? new Date(caseData.purchaseDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="md:col-span-2 p-3 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-xs flex items-center gap-1"><FiHash size={12} /> IMEI Numbers</p>
                                <p className="font-mono text-sm">{caseData.imei1 || 'N/A'}</p>
                                {caseData.imei2 && <p className="font-mono text-sm mt-1">{caseData.imei2}</p>}
                            </div>
                            <div className="p-3 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-xs flex items-center gap-1"><FiStar size={12} /> Warranty Status</p>
                                <p className={caseData.warranty?.includes('In') ? 'text-green-400 font-semibold' : 'text-red-400'}>
                                    {caseData.warranty || 'Unknown'}
                                </p>
                            </div>
                            <div className="p-3 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-xs flex items-center gap-1"><FiAlertCircle size={12} /> Issue Type</p>
                                <p className="font-medium">{caseData.issueType || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-2 p-3 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-xs">Sub Issue / Customer Complaint</p>
                                <p>{caseData.subIssueType || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis & Service Notes Card (for Call Center View) */}
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FiTool className="text-orange-400" /> Service Information
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-dark-700/30 rounded-xl">
                                <p className="text-gray-400 text-sm mb-2">Technician Diagnosis / Repair Notes</p>
                                <p className="text-gray-300">
                                    {caseData.diagnosis || 'No diagnosis added yet. Service center will update once inspection is done.'}
                                </p>
                            </div>
                            {caseData.closedDate && (
                                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                    <p className="text-green-400 text-sm mb-1 flex items-center gap-2">
                                        <FiCheckCircle /> Case Closed
                                    </p>
                                    <p className="text-gray-300 text-sm">Closed on: {new Date(caseData.closedDate).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    {/* Quick Stats Card */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <FiTrendingUp className="text-green-400" /> Quick Stats
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2">
                                <span className="text-gray-400 text-sm">Case Age</span>
                                <span className="font-semibold">{calculateDaysOld()} days</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="text-gray-400 text-sm">Last Updated</span>
                                <span className="text-sm">{caseData.updatedAt ? new Date(caseData.updatedAt).toLocaleDateString() : new Date(caseData.caseRegisterDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="text-gray-400 text-sm">Warranty</span>
                                <span className={caseData.warranty?.includes('In') ? 'text-green-400' : 'text-red-400'}>
                                    {caseData.warranty || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Job Notes Card - Call Center Feature */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <FiMessageSquare className="text-blue-400" /> Job Notes / Call Log
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {caseData.jobNotes && caseData.jobNotes.length > 0 ? (
                                caseData.jobNotes.map((note, idx) => (
                                    <div key={note.id || idx} className="p-3 bg-dark-700/30 rounded-xl">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs text-blue-400">{note.author || 'Agent'}</span>
                                            <span className="text-xs text-gray-500">{new Date(note.date).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-300">{note.text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-4">No notes added yet</p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowNotesModal(true)}
                            className="w-full mt-3 btn-secondary text-sm flex items-center justify-center gap-2"
                        >
                            <FiMessageSquare size={14} /> Add Note / Call Log
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3">Actions</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate(`/service/case/${id}`)}
                                className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                            >
                                <FiTool /> View Full Service Details
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                            >
                                <FiPrinter /> Print Case Summary
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-2xl max-w-md w-full border border-gray-700">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Add Job Note</h3>
                                <button onClick={() => setShowNotesModal(false)} className="text-gray-400 hover:text-white">
                                    <FiX size={24} />
                                </button>
                            </div>
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows="4"
                                className="input-field mb-4"
                                placeholder="Enter call log, customer feedback, follow-up notes..."
                            />
                            <div className="flex gap-3">
                                <button onClick={handleAddNote} className="flex-1 btn-primary">
                                    Add Note
                                </button>
                                <button onClick={() => setShowNotesModal(false)} className="flex-1 btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showReceipt && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Receipt</h2>
                                <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600">
                                    <FiX size={24} />
                                </button>
                            </div>
                            <div className="border-t border-b border-gray-200 py-4 my-4">
                                <div className="space-y-2 text-gray-800">
                                    <p><span className="font-semibold">Job ID:</span> {caseData.jobId}</p>
                                    <p><span className="font-semibold">Date:</span> {new Date().toLocaleString()}</p>
                                    <p><span className="font-semibold">Customer:</span> {caseData.customerName}</p>
                                    <p><span className="font-semibold">Mobile:</span> {caseData.mobileNumber}</p>
                                    <p><span className="font-semibold">Device:</span> {caseData.deviceModel || 'N/A'}</p>
                                    <p><span className="font-semibold">Issue:</span> {caseData.issueType || 'N/A'}</p>
                                    <p><span className="font-semibold">Status:</span> {caseData.jobStatus}</p>
                                </div>
                            </div>
                            <div className="text-center text-sm text-gray-500">
                                <p>Thank you for choosing Wobble One Service</p>
                            </div>
                        </div>
                        <div className="p-4 flex gap-3 border-t">
                            <button onClick={() => window.print()} className="flex-1 bg-blue-600 text-white py-2 rounded-xl">Print</button>
                            <button onClick={() => setShowReceipt(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showJobReport && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Job Report</h2>
                                <button onClick={() => setShowJobReport(false)} className="text-gray-400 hover:text-gray-600">
                                    <FiX size={24} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="border-b pb-3">
                                    <h3 className="font-semibold text-gray-700 mb-2">Case Information</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p><span className="font-medium">Job ID:</span> {caseData.jobId}</p>
                                        <p><span className="font-medium">Date:</span> {new Date(caseData.caseRegisterDate).toLocaleDateString()}</p>
                                        <p><span className="font-medium">Status:</span> {caseData.jobStatus}</p>
                                    </div>
                                </div>
                                <div className="border-b pb-3">
                                    <h3 className="font-semibold text-gray-700 mb-2">Customer Details</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p><span className="font-medium">Name:</span> {caseData.customerName}</p>
                                        <p><span className="font-medium">Mobile:</span> {caseData.mobileNumber}</p>
                                        <p><span className="font-medium">Alternate:</span> {caseData.alternateNumber || 'N/A'}</p>
                                        <p><span className="font-medium">Email:</span> {caseData.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="border-b pb-3">
                                    <h3 className="font-semibold text-gray-700 mb-2">Device Details</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p><span className="font-medium">Model:</span> {caseData.deviceModel || 'N/A'}</p>
                                        <p><span className="font-medium">IMEI:</span> {caseData.imei1 || 'N/A'}</p>
                                        <p><span className="font-medium">Warranty:</span> {caseData.warranty || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Issue & Diagnosis</h3>
                                    <div className="text-sm">
                                        <p><span className="font-medium">Issue:</span> {caseData.issueType || 'N/A'}</p>
                                        <p className="mt-1"><span className="font-medium">Diagnosis:</span> {caseData.diagnosis || 'Pending'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 flex gap-3 border-t">
                            <button onClick={() => window.print()} className="flex-1 bg-blue-600 text-white py-2 rounded-xl">Print</button>
                            <button onClick={() => setShowJobReport(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}