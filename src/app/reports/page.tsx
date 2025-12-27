'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { FileText, Download, Calendar, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import type { Transaction } from '@/lib/db';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterByDate();
  }, [dateRange, transactions]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
      setFiltered(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = () => {
    if (!dateRange.start && !dateRange.end) {
      setFiltered(transactions);
      return;
    }

    const filtered = transactions.filter(t => {
      const transDate = new Date(t.created_at).toISOString().split('T')[0];
      
      if (dateRange.start && dateRange.end) {
        return transDate >= dateRange.start && transDate <= dateRange.end;
      } else if (dateRange.start) {
        return transDate >= dateRange.start;
      } else if (dateRange.end) {
        return transDate <= dateRange.end;
      }
      return true;
    });

    setFiltered(filtered);
  };

  const calculateStats = () => {
    const totalRevenue = filtered.reduce((sum, t) => sum + t.total_harga, 0);
    const totalProfit = filtered.reduce((sum, t) => sum + t.keuntungan, 0);
    const totalItems = filtered.reduce((sum, t) => sum + t.jumlah, 0);

    return {
      totalTransactions: filtered.length,
      totalRevenue,
      totalProfit,
      totalItems,
    };
  };

  const exportToExcel = () => {
    const stats = calculateStats();
    
    // Create CSV content
    let csv = 'LAPORAN TRANSAKSI\n\n';
    
    // Add summary
    csv += 'RINGKASAN\n';
    csv += `Total Transaksi,${stats.totalTransactions}\n`;
    csv += `Total Item Terjual,${stats.totalItems}\n`;
    csv += `Total Pendapatan,${stats.totalRevenue}\n`;
    csv += `Total Keuntungan,${stats.totalProfit}\n`;
    csv += `Periode,${dateRange.start || 'Awal'} s/d ${dateRange.end || 'Sekarang'}\n\n`;
    
    // Add transaction details
    csv += 'DETAIL TRANSAKSI\n';
    csv += 'ID Transaksi,Produk,Barcode,Jumlah,Harga Satuan,Total Harga,Keuntungan,Tanggal\n';
    
    filtered.forEach(t => {
      csv += `${t.transaksi_id},${t.nama_produk},${t.barcode_id},${t.jumlah},${t.harga_satuan},${t.total_harga},${t.keuntungan},${formatDateTime(t.created_at)}\n`;
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_transaksi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const stats = calculateStats();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Transaksi</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1 {
              color: #2563eb;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .summary {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .summary-item {
              background: white;
              padding: 15px;
              border-radius: 6px;
            }
            .summary-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #2563eb;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-size: 12px;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 11px;
            }
            tr:hover {
              background: #f9fafb;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body { padding: 20px; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 LAPORAN TRANSAKSI</h1>
            <p style="color: #6b7280;">Periode: ${dateRange.start || 'Awal'} s/d ${dateRange.end || 'Sekarang'}</p>
            <p style="color: #6b7280;">Dicetak: ${formatDateTime(new Date().toISOString())}</p>
          </div>

          <div class="summary">
            <h3 style="margin-top: 0; color: #1f2937;">Ringkasan</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Transaksi</div>
                <div class="summary-value">${stats.totalTransactions}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Item Terjual</div>
                <div class="summary-value">${stats.totalItems}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Pendapatan</div>
                <div class="summary-value">${formatCurrency(stats.totalRevenue)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Keuntungan</div>
                <div class="summary-value" style="color: #059669;">${formatCurrency(stats.totalProfit)}</div>
              </div>
            </div>
          </div>

          <h3>Detail Transaksi</h3>
          <table>
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Produk</th>
                <th>Barcode</th>
                <th>Jumlah</th>
                <th>Harga Satuan</th>
                <th>Total</th>
                <th>Keuntungan</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(t => `
                <tr>
                  <td>${t.transaksi_id}</td>
                  <td>${t.nama_produk}</td>
                  <td style="font-family: monospace;">${t.barcode_id}</td>
                  <td>${t.jumlah}</td>
                  <td>${formatCurrency(t.harga_satuan)}</td>
                  <td><strong>${formatCurrency(t.total_harga)}</strong></td>
                  <td style="color: #059669;">${formatCurrency(t.keuntungan)}</td>
                  <td>${formatDateTime(t.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Sistem POS Kantin Sekolah © ${new Date().getFullYear()}</p>
            <p>Laporan ini digenerate secara otomatis oleh sistem</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const stats = calculateStats();

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Transaksi</h1>
          <p className="text-gray-600">Lihat dan export laporan transaksi</p>
        </div>

        {/* Date Filter & Export */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setDateRange({ start: '', end: '' })}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
              >
                Reset Filter
              </button>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={exportToPDF}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <ShoppingCart className="text-purple-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Item Terjual</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-50">
                <DollarSign className="text-orange-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Pendapatan</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalRevenue)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Keuntungan</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalProfit)}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Detail Transaksi</h2>
            <p className="text-sm text-gray-600 mt-1">
              Menampilkan {filtered.length} dari {transactions.length} transaksi
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID Transaksi</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Keuntungan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-2">📊</div>
                      Tidak ada transaksi
                    </td>
                  </tr>
                ) : (
                  filtered.map((trans) => (
                    <tr key={trans.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-blue-600">{trans.transaksi_id}</td>
                      <td className="px-6 py-4 text-sm font-medium">{trans.nama_produk}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{trans.barcode_id}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{trans.jumlah}</td>
                      <td className="px-6 py-4 text-sm">{formatCurrency(trans.harga_satuan)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(trans.total_harga)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(trans.keuntungan)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(trans.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}