// src/components/EggStockManagement.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

const API_BASE = 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/egg-stock`;

const api = axios.create();
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.headers['Content-Type'] = 'application/json';
  return cfg;
});

// Format ISO date to yyyy-mm-dd
const toInputDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const EggStockManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stocks, setStocks] = useState([]);

  // Fetch stock data
  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.get(ENDPOINT);
      console.log('response, ', res)
      setStocks(res.data.stock || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to fetch stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Calculate total stock
  const totals = useMemo(() => {
    const totalQty = stocks.reduce((sum, stock) => sum + (Number(stock.currentStock) || 0), 0);
    return { totalQty, rows: stocks.length };
  }, [stocks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 md:pl-72 lg:pl-72">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="ml-0 md:ml-72 lg:ml-72 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-white/20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Egg Stock</h1>
            <div className="w-9"></div>
          </div>
        </div>

        <main className="p-6 mb-100 max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Egg Stock</h1>
              <p className="text-emerald-100 text-lg">Current stock of eggs by type</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Stock Records</h3>
              <p className="text-sm text-slate-600">Total Quantity: {totals.totalQty}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Egg Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Updated At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {stocks.map((rec, idx) => (
                    <tr key={rec._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{rec.eggType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{rec.currentStock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{toInputDate(rec.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stocks.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No stock records yet</h3>
                <p className="text-slate-500">Add some stock to get started.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EggStockManagement;
