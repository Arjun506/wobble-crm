import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="loading-spinner"></div></div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}