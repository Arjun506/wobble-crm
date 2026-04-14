import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Dashboard Route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Case Register Route - Call Center, Service, Admin */}
          <Route path="/cases/register" element={
            <ProtectedRoute allowedRoles={['callcenter', 'service', 'admin']}>
              <Layout><CaseRegister /></Layout>
            </ProtectedRoute>
          } />

          {/* Search Case Route - All Roles */}
          <Route path="/cases/search" element={
            <ProtectedRoute>
              <Layout><SearchCase /></Layout>
            </ProtectedRoute>
          } />

          {/* Case Details Route - All Roles (View Case Details) */}
          <Route path="/case/:id" element={
            <ProtectedRoute>
              <Layout><CaseDetails /></Layout>
            </ProtectedRoute>
          } />

          {/* Service Case Detail Route - Service Center Full Access */}
          <Route path="/service/case/:id" element={
            <ProtectedRoute allowedRoles={['service', 'admin']}>
              <Layout><ServiceCaseDetail /></Layout>
            </ProtectedRoute>
          } />

          {/* Part Request Form Route - Service, Admin */}
          <Route path="/part-requests/new" element={
            <ProtectedRoute allowedRoles={['service', 'admin']}>
              <Layout><PartRequestForm /></Layout>
            </ProtectedRoute>
          } />

          {/* Part Request Approval Route - Admin Only */}
          <Route path="/admin/approvals" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><PartRequestApproval /></Layout>
            </ProtectedRoute>
          } />

          {/* Warehouse Dispatch Route - Warehouse, Admin */}
          <Route path="/warehouse/dispatch" element={
            <ProtectedRoute allowedRoles={['warehouse', 'admin']}>
              <Layout><WarehouseDispatch /></Layout>
            </ProtectedRoute>
          } />

          {/* Reports Route - Admin Only */}
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><Reports /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin Dashboard Route - Admin Only */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;