import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseRegister from './pages/CaseRegister';
import SearchCase from './pages/SearchCase';
import CaseDetails from './pages/CaseDetails';
import ServiceCaseDetail from './pages/ServiceCaseDetail';
import PartRequestForm from './pages/PartRequestForm';
import PartRequestApproval from './pages/PartRequestApproval';
import WarehouseDispatch from './pages/WarehouseDispatch';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/cases/search" element={<ProtectedRoute><Layout><SearchCase /></Layout></ProtectedRoute>} />
          <Route path="/case/:id" element={<ProtectedRoute><Layout><CaseDetails /></Layout></ProtectedRoute>} />
          <Route path="/cases/register" element={<ProtectedRoute allowedRoles={['callcenter','service','admin']}><Layout><CaseRegister /></Layout></ProtectedRoute>} />
          <Route path="/service/case/:id" element={<ProtectedRoute allowedRoles={['service','admin']}><Layout><ServiceCaseDetail /></Layout></ProtectedRoute>} />
          <Route path="/part-requests/new" element={<ProtectedRoute allowedRoles={['service','admin']}><Layout><PartRequestForm /></Layout></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['admin']}><Layout><PartRequestApproval /></Layout></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/warehouse/dispatch" element={<ProtectedRoute allowedRoles={['warehouse','admin']}><Layout><WarehouseDispatch /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;