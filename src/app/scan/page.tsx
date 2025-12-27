'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Scanner from '@/components/Scanner';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleScan = async (barcode: string) => {
    try {
      const res = await fetch('/api/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode_id: barcode }),
      });

      const data = await res.json();

      if (data.found) {
        setResult(data.product);
        setError('');
      } else {
        setError('Produk tidak ditemukan');
        setResult(null);
      }
    } catch (err) {
      setError('Gagal memproses scan');
      setResult(null);
    }
  };

  const handleTransaction = () => {
    if (result) {
      router.push(`/transactions?barcode=${result.barcode_id}`);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Barcode</h1>
          <p className="text-gray-600">Scan barcode produk untuk transaksi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner */}
          <div>
            <Scanner onScan={handleScan} />
          </div>

          {/* Result */}
          <div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="text-red-600" size={24} />
                  <h3 className="text-lg font-bold text-red-900">Scan Gagal</h3>
                </div>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle size={24} />
                    <h3 className="text-xl font-bold">Produk Ditemukan!</h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Barcode ID</p>
                    <p className="text-2xl font-mono font-bold text-blue-600">{result.barcode_id}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Nama Produk</p>
                    <p className="text-xl font-bold text-gray-900">{result.nama_produk}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Kategori</p>
                      <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                        {result.kategori}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stok</p>
                      <span
                        className={`inline-block mt-1 px-3 py-1 text-sm font-bold rounded-full ${
                          result.stok === 0
                            ? 'bg-red-100 text-red-800'
                            : result.stok < 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {result.stok === 0 ? 'HABIS' : `${result.stok} unit`}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Harga Jual</p>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(result.harga_jual)}</p>
                  </div>

                  <button
                    onClick={handleTransaction}
                    disabled={result.stok === 0}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:cursor-not-allowed"
                  >
                    {result.stok === 0 ? 'Stok Habis' : 'Buat Transaksi'}
                  </button>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📦</span>
                </div>
                <p className="text-gray-500">Scan barcode untuk melihat detail produk</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}