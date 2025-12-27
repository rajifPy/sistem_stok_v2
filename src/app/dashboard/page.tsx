'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatCurrency } from '@/lib/utils';
import { Package, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';

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
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Stok',
      value: stats.totalStock,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Transaksi Hari Ini',
      value: stats.todayTransactions,
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Pendapatan Hari Ini',
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Memuat data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Selamat datang di sistem POS Kantin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${card.bg}`}>
                    <Icon className={card.textColor} size={20} />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent break-words`}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Welcome Card */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Selamat Datang! 👋</h2>
          <p className="text-sm sm:text-base text-blue-100">
            Kelola toko kantin Anda dengan mudah menggunakan sistem POS modern ini.
            Pantau stok, transaksi, dan laporan keuangan dalam satu dashboard.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <a
            href="/products"
            className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-blue-600 transition-colors">
              <Package className="text-blue-600 group-hover:text-white transition-colors" size={20} />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">Kelola Produk</p>
          </a>

          <a
            href="/scan"
            className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-green-600 transition-colors">
              <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">📷</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">Scan Barcode</p>
          </a>

          <a
            href="/transactions"
            className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-purple-600 transition-colors">
              <ShoppingCart className="text-purple-600 group-hover:text-white transition-colors" size={20} />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">Transaksi</p>
          </a>

          <a
            href="/reports"
            className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-orange-600 transition-colors">
              <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">📊</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">Laporan</p>
          </a>
        </div>
      </div>
    </Layout>
  );
}
