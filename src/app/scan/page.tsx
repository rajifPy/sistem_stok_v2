// src/app/scan/page.tsx - Updated with Multi-Scan
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Scanner from '@/components/Scanner';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, XCircle, Keyboard, Camera, ArrowRight, ShoppingCart } from 'lucide-react';

interface ScannedProduct {
  barcode_id: string;
  nama_produk: string;
  harga_jual: number;
  stok: number;
  kategori: string;
  quantity: number;
}

export default function ScanPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [loading, setLoading] = useState(false);

  const handleSingleScan = async (barcode: string) => {
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
      handleSingleScan(manualBarcode.trim().toUpperCase());
    }
  };

  const handleTransaction = () => {
    if (result) {
      router.push(`/transactions?barcode=${result.barcode_id}`);
    }
  };

  const handleMultiScanCheckout = async (products: ScannedProduct[]) => {
    // Navigate to transaction page with all scanned products
    const barcodes = products.map(p => `${p.barcode_id}:${p.quantity}`).join(',');
    router.push(`/transactions?multi=${encodeURIComponent(barcodes)}`);
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Scan Barcode</h1>
          <p className="text-sm sm:text-base text-gray-600">Scan barcode produk untuk transaksi</p>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => {
                setScanMode('camera');
                setError('');
                setResult(null);
              }}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                scanMode === 'camera'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera size={20} className="sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base">Multi-Scan Camera</span>
            </button>
            <button
              onClick={() => {
                setScanMode('manual');
                setError('');
                setResult(null);
              }}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 sm:gap-3 ${
                scanMode === 'manual'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Keyboard size={20} className="sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base">Input Manual</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Input Area */}
          <div>
            {scanMode === 'camera' ? (
              <Scanner 
                multiScan={true}
                onCheckout={handleMultiScanCheckout}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <Keyboard size={24} />
                    Input Manual
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-base sm:text-lg"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!manualBarcode.trim() || loading}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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

                  <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💡 Tips:</h4>
                    <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                      <li>• Ketik kode barcode secara lengkap</li>
                      <li>• Tekan Enter atau klik "Cari Produk"</li>
                      <li>• Bisa gunakan barcode scanner keyboard</li>
                      <li>• Untuk scan banyak produk, gunakan mode Camera</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          <div>
            {error && scanMode === 'manual' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="text-red-600 flex-shrink-0" size={24} />
                  <h3 className="text-base sm:text-lg font-bold text-red-900">Scan Gagal</h3>
                </div>
                <p className="text-sm sm:text-base text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError('');
                    setManualBarcode('');
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {result && scanMode === 'manual' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-6 text-white">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={24} className="flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold">Produk Ditemukan!</h3>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Barcode ID</p>
                    <p className="text-xl sm:text-2xl font-mono font-bold text-blue-600 break-all">{result.barcode_id}</p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Nama Produk</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{result.nama_produk}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Kategori</p>
                      <span className="inline-block mt-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm font-semibold rounded-full">
                        {result.kategori}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Stok</p>
                      <span
                        className={`inline-block mt-1 px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-full ${
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
                    <p className="text-xs sm:text-sm text-gray-600">Harga Jual</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{formatCurrency(result.harga_jual)}</p>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <button
                      onClick={handleTransaction}
                      disabled={result.stok === 0}
                      className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {result.stok === 0 ? 'Stok Habis' : 'Buat Transaksi'}
                    </button>

                    <button
                      onClick={() => {
                        setResult(null);
                        setManualBarcode('');
                      }}
                      className="w-full px-4 sm:px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors text-sm sm:text-base"
                    >
                      Scan Produk Lain
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!result && !error && scanMode === 'manual' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl sm:text-4xl">📦</span>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-500">
                  Ketik barcode untuk melihat detail produk
                </p>
              </div>
            )}

            {scanMode === 'camera' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="text-blue-600" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Scan Mode Aktif</h3>
                  <p className="text-gray-600 mb-6">
                    Scan beberapa produk sekaligus lalu checkout untuk proses transaksi
                  </p>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-left">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-xl">✨</span>
                      Keunggulan Multi-Scan:
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 flex-shrink-0">✓</span>
                        <span>Scan beberapa produk tanpa henti</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 flex-shrink-0">✓</span>
                        <span>Edit jumlah sebelum checkout</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 flex-shrink-0">✓</span>
                        <span>Lihat total langsung</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 flex-shrink-0">✓</span>
                        <span>Proses transaksi lebih cepat</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
