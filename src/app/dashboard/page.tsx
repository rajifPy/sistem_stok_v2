'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatCurrency } from '@/lib/utils';
import { Package, TrendingUp, ShoppingCart, DollarSign, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    todayTransactions: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [prodRes, transRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/transactions'),
      ]);

      const products = await prodRes.json();
      const transactions = await transRes.json();

      const today = new Date().toISOString().split('T')[0];
      const todayTrans = transactions.filter((t: any) =>
        t.created_at.startsWith(today)
      );

      setStats({
        totalProducts: products.length,
        totalStock: products.reduce((sum: number, p: any) => sum + p.stok, 0),
        todayTransactions: todayTrans.length,
        todayRevenue: todayTrans.reduce((sum: number, t: any) => sum + t.total_harga, 0),
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Produk',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Stok',
      value: stats.totalStock,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Transaksi Hari Ini',
      value: stats.todayTransactions,
      icon: ShoppingCart,
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Pendapatan Hari Ini',
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  const quickActions = [
    { href: '/products', icon: Package, label: 'Kelola Produk', color: 'blue' },
    { href: '/scan', icon: '📷', label: 'Scan Barcode', color: 'emerald' },
    { href: '/transactions', icon: ShoppingCart, label: 'Transaksi', color: 'purple' },
    { href: '/reports', icon: '📊', label: 'Laporan', color: 'orange' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Selamat datang di sistem POS Kantin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={card.iconColor} size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-14 h-14 rounded-xl bg-${action.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {typeof action.icon === 'string' ? (
                      <span className="text-2xl">{action.icon}</span>
                    ) : (
                      <action.icon className={`text-${action.color}-600`} size={28} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{action.label}</p>
                    <ArrowRight className="w-4 h-4 mx-auto text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">Selamat Datang! 👋</h2>
              <p className="text-blue-100 mb-6 max-w-2xl">
                Kelola toko kantin Anda dengan mudah menggunakan sistem POS modern ini.
                Pantau stok, transaksi, dan laporan keuangan dalam satu dashboard.
              </p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="/scan" 
                  className="px-6 py-2.5 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Mulai Transaksi
                </a>
                <a 
                  href="/products" 
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-all"
                >
                  Kelola Produk
                </a>
              </div>
            </div>
            <div className="hidden lg:block text-8xl opacity-20">
              🏪
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
