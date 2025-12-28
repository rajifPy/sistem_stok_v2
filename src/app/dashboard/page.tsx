'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Package, TrendingUp, ShoppingCart, DollarSign, ArrowRight, ArrowUp, ArrowDown, Calendar, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Product {
  id: string;
  nama_produk: string;
  stok: number;
  harga_jual: number;
  kategori: string;
}

interface Transaction {
  id: string;
  nama_produk: string;
  jumlah: number;
  total_harga: number;
  keuntungan: number;
  created_at: string;
}

interface Stats {
  totalProducts: number;
  totalStock: number;
  todayTransactions: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  weeklyRevenue: number;
  totalProfit: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalStock: 0,
    todayTransactions: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    weeklyRevenue: 0,
    totalProfit: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, transRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/transactions'),
      ]);

      const productsData = await prodRes.json();
      const transactionsData = await transRes.json();

      setProducts(productsData);
      setTransactions(transactionsData);

      calculateStats(productsData, transactionsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsData: Product[], transactionsData: Transaction[]) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const todayTrans = transactionsData.filter((t) => t.created_at.startsWith(today));
    const yesterdayTrans = transactionsData.filter((t) => t.created_at.startsWith(yesterday));
    const weekTrans = transactionsData.filter((t) => t.created_at >= weekAgo);

    const todayRevenue = todayTrans.reduce((sum, t) => sum + t.total_harga, 0);
    const yesterdayRevenue = yesterdayTrans.reduce((sum, t) => sum + t.total_harga, 0);
    const weeklyRevenue = weekTrans.reduce((sum, t) => sum + t.total_harga, 0);
    const totalProfit = todayTrans.reduce((sum, t) => sum + t.keuntungan, 0);

    setStats({
      totalProducts: productsData.length,
      totalStock: productsData.reduce((sum, p) => sum + p.stok, 0),
      todayTransactions: todayTrans.length,
      todayRevenue,
      yesterdayRevenue,
      weeklyRevenue,
      totalProfit,
    });
  };

  // Data untuk chart penjualan per hari (7 hari terakhir)
  const getSalesChartData = () => {
    const days = selectedPeriod === 'week' ? 7 : 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const dayTrans = transactions.filter(t => t.created_at.startsWith(dateStr));
      
      data.push({
        date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        revenue: dayTrans.reduce((sum, t) => sum + t.total_harga, 0),
        profit: dayTrans.reduce((sum, t) => sum + t.keuntungan, 0),
        transactions: dayTrans.length,
      });
    }
    
    return data;
  };

  // Data untuk kategori pie chart
  const getCategoryData = () => {
    const categoryRevenue: Record<string, number> = {};
    
    transactions.forEach(t => {
      const product = products.find(p => p.nama_produk === t.nama_produk);
      if (product) {
        categoryRevenue[product.kategori] = (categoryRevenue[product.kategori] || 0) + t.total_harga;
      }
    });

    return Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / stats.todayRevenue) * 100).toFixed(1),
    }));
  };

  // Top 5 produk terlaris
  const getTopProducts = () => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    transactions.forEach(t => {
      if (!productSales[t.nama_produk]) {
        productSales[t.nama_produk] = { name: t.nama_produk, quantity: 0, revenue: 0 };
      }
      productSales[t.nama_produk].quantity += t.jumlah;
      productSales[t.nama_produk].revenue += t.total_harga;
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Produk stok rendah
  const getLowStockProducts = () => {
    return products
      .filter(p => p.stok < 10 && p.stok > 0)
      .sort((a, b) => a.stok - b.stok)
      .slice(0, 5);
  };

  const revenueChange = stats.yesterdayRevenue > 0
    ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100
    : 0;

  const salesChartData = getSalesChartData();
  const categoryData = getCategoryData();
  const topProducts = getTopProducts();
  const lowStockProducts = getLowStockProducts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

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
      change: revenueChange,
    },
    {
      title: 'Pendapatan Hari Ini',
      value: formatCurrency(stats.todayRevenue),
      subValue: `Profit: ${formatCurrency(stats.totalProfit)}`,
      icon: DollarSign,
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      change: revenueChange,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Analytics</h1>
          <p className="text-gray-600">Selamat datang di sistem POS Kantin - Real-time Insights</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-center gap-2 text-gray-700 font-semibold"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={card.iconColor} size={24} />
                </div>
                {card.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    card.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    {Math.abs(card.change).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              {card.subValue && (
                <p className="text-sm text-gray-500">{card.subValue}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue & Profit Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pendapatan & Profit</h3>
              <p className="text-sm text-gray-600">Trend penjualan {selectedPeriod === 'week' ? '7 hari' : '30 hari'} terakhir</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedPeriod === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedPeriod === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                30 Hari
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Pendapatan"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
                name="Profit"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Penjualan per Kategori</h3>
          <p className="text-sm text-gray-600 mb-6">Distribusi revenue hari ini</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Top 5 Produk Terlaris</h3>
          <p className="text-sm text-gray-600 mb-6">Berdasarkan jumlah terjual</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis dataKey="name" type="category" width={100} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return formatCurrency(value);
                  return `${value} pcs`;
                }}
              />
              <Legend />
              <Bar dataKey="quantity" fill="#3b82f6" name="Terjual (pcs)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Timeline Transaksi</h3>
          <p className="text-sm text-gray-600 mb-6">Jumlah transaksi per hari</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="transactions"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Transaksi"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row - Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">⚠️ Stok Rendah</h3>
              <p className="text-sm text-gray-600">Produk perlu restock</p>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
              {lowStockProducts.length}
            </span>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p className="font-semibold">Semua stok aman! 🎉</p>
              </div>
            ) : (
              lowStockProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.nama_produk}</p>
                      <p className="text-sm text-gray-600">{product.kategori}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{product.stok}</p>
                    <p className="text-xs text-gray-500">tersisa</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-bold mb-6">💰 Ringkasan Finansial</h3>
          
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Pendapatan Hari Ini</span>
                <Calendar size={18} className="text-blue-200" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Profit Hari Ini</span>
                <TrendingUp size={18} className="text-green-300" />
              </div>
              <p className="text-3xl font-bold text-green-300">{formatCurrency(stats.totalProfit)}</p>
              <p className="text-sm text-blue-200 mt-1">
                Margin: {stats.todayRevenue > 0 ? ((stats.totalProfit / stats.todayRevenue) * 100).toFixed(1) : 0}%
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Pendapatan Minggu Ini</span>
                <Calendar size={18} className="text-blue-200" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stats.weeklyRevenue)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-blue-200 mb-1">Kemarin</p>
                <p className="text-lg font-bold">{formatCurrency(stats.yesterdayRevenue)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-blue-200 mb-1">Perubahan</p>
                <p className={`text-lg font-bold ${revenueChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🚀 Aksi Cepat</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/products', icon: '📦', label: 'Kelola Produk', color: 'blue' },
            { href: '/scan', icon: '📷', label: 'Scan Barcode', color: 'emerald' },
            { href: '/transactions', icon: '🛒', label: 'Transaksi', color: 'purple' },
            { href: '/reports', icon: '📊', label: 'Laporan', color: 'orange' },
          ].map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`w-14 h-14 rounded-xl bg-${action.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{action.icon}</span>
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
    </div>
  );
}
