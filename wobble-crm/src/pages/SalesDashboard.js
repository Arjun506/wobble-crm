import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiPackage, FiCheckCircle, FiClock, FiTrendingUp, FiBox } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SalesDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, warrantyActive: 0 });
  const [recentActivations, setRecentActivations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivations();
  }, []);

  const fetchStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'devices'));
      const allDevices = snapshot.docs.map(d => d.data());
      setStats({
        total: allDevices.length,
        active: allDevices.filter(d => d.isActive === true).length,
        warrantyActive: allDevices.filter(d => d.warrantyStatus === 'In Warranty').length,
      });
    } catch (error) {
      toast.error('Failed to load stats');
    }
  };

  const fetchRecentActivations = async () => {
    try {
      const q = query(collection(db, 'devices'), orderBy('activationDate', 'desc'), limit(5));
      const snapshot = await getDocs(q);
      setRecentActivations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Devices', value: stats.total, color: 'blue', icon: <FiBox /> },
    { label: 'Active Devices', value: stats.active, color: 'green', icon: <FiCheckCircle /> },
    { label: 'In Warranty', value: stats.warrantyActive, color: 'yellow', icon: <FiClock /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Sales Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage device activations and warranty</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className={`bg-gradient-to-br from-${card.color}-600 to-${card.color}-700 rounded-2xl p-5`}>
            <div className="flex justify-between items-start">
              <div><p className="text-gray-700 text-sm">{card.label}</p><p className="text-3xl font-bold text-gray-800">{card.value}</p></div>
              <div className="text-gray-500 text-2xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><FiTrendingUp /> Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/sales/activate" className="bg-teal-600 p-4 rounded-xl text-white text-center hover:scale-105 transition"><div className="text-2xl">📱</div><span>Activate Device</span></Link>
            <Link to="/sales/bulk-upload" className="bg-indigo-600 p-4 rounded-xl text-white text-center hover:scale-105 transition"><div className="text-2xl">📂</div><span>Bulk Upload</span></Link>
            <Link to="/sales/search" className="bg-purple-600 p-4 rounded-xl text-white text-center hover:scale-105 transition"><div className="text-2xl">🔍</div><span>Advanced Search</span></Link>
          </div>
        </div>
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Recent Activations</h3>
          {loading ? <div className="loading-spinner mx-auto"></div> : recentActivations.length === 0 ? <p className="text-gray-500">No activations yet</p> : (
            <div className="space-y-2">
              {recentActivations.map(device => (
                <div key={device.id} className="p-3 bg-gray-100 rounded-xl flex justify-between items-center">
                  <div><p className="font-mono text-sm">{device.imei}</p><p className="text-xs text-gray-500">{device.customerName}</p></div>
                  <span className={`badge ${device.warrantyStatus === 'In Warranty' ? 'badge-green' : 'badge-red'}`}>{device.warrantyStatus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}