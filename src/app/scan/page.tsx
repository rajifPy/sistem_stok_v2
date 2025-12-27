'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Scanner from '@/components/Scanner';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, Keyboard, Camera, ArrowRight } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [loading, setLoading] = useState(false);

  const handleScan = async (barcode: string) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim().toUpperCase());
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

        {/* Mode Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setScanMode('manual');
                setError('');
                setResult(null);
              }}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 ${
                scanMode === 'manual'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Keyboard size={24} />
              Input Manual
            </button>
            <button
              onClick={() => {
                setScanMode('camera');
                setError('');
                setResult(null);
              }}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 ${
                scanMode === 'camera'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera size={24} />
              Scan Camera
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Area */}
          <div>
            {scanMode === 'manual' ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Keyboard size={24} />
                    Input Barcode Manual
                  </h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Masukkan Kode Barcode
                      </label>
                      <input
                        type="text"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value.toUpperCase())}
                        placeholder="Ketik barcode... (contoh: BRK001)"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!manualBarcode.trim() || loading}
                      className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Mencari...
                        </>
                      ) : (
                        <>
                          Cari Produk
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Tips:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Ketik kode barcode secara lengkap</li>
                      <li>• Tekan Enter atau klik "Cari Produk"</li>
                      <li>• Bisa gunakan barcode scanner keyboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <Scanner onScan={handleScan} />
            )}
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
                <button
                  onClick={() => {
                    setError('');
                    setManualBarcode('');
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Coba Lagi
                </button>
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

                  <button
                    onClick={() => {
                      setResult(null);
                      setManualBarcode('');
                    }}
                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Scan Produk Lain
                  </button>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📦</span>
                </div>
                <p className="text-gray-500 text-lg">
                  {scanMode === 'manual' 
                    ? 'Ketik barcode untuk melihat detail produk'
                    : 'Scan barcode untuk melihat detail produk'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
