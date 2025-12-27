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
    },
    {
      title: 'Total Stok',
      value: stats.totalStock,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Transaksi Hari Ini',
      value: stats.todayTransactions,
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Pendapatan Hari Ini',
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Selamat datang di sistem POS Kantin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className="text-gray-700" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Welcome Card */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Selamat Datang! 👋</h2>
          <p className="text-blue-100">
            Kelola toko kantin Anda dengan mudah menggunakan sistem POS modern ini.
            Pantau stok, transaksi, dan laporan keuangan dalam satu dashboard.
          </p>
        </div>
      </div>
    </Layout>
  );
}