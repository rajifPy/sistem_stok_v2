// src/app/scan/page.tsx - Camera Only (No Manual Input)
'use client';

import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Scanner from '@/components/Scanner';
import { ShoppingCart, Camera, Zap } from 'lucide-react';

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

  const handleMultiScanCheckout = async (products: ScannedProduct[]) => {
    if (products.length === 0) return;
    
    // Navigate to transaction page with all scanned products
    const barcodes = products.map(p => `${p.barcode_id}:${p.quantity}`).join(',');
    router.push(`/transactions?multi=${encodeURIComponent(barcodes)}`);
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Camera size={32} className="text-blue-600" />
            Scan Barcode
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Scan beberapa produk sekaligus lalu checkout untuk transaksi
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Scanner */}
          <div>
            <Scanner 
              multiScan={true}
              onCheckout={handleMultiScanCheckout}
            />
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* How to Use */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="text-blue-600" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Multi-Scan Mode
                </h3>
                <p className="text-gray-600 mb-6">
                  Scan beberapa produk sekaligus lalu checkout untuk proses transaksi
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-left">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    Cara Menggunakan:
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">1.</span>
                      <span>Klik tombol "Mulai Scan" untuk mengaktifkan kamera</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">2.</span>
                      <span>Arahkan kamera ke barcode produk</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">3.</span>
                      <span>Produk akan otomatis ditambahkan ke daftar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">4.</span>
                      <span>Scan produk lainnya tanpa henti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">5.</span>
                      <span>Klik "Checkout" untuk proses transaksi</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="text-emerald-600" size={24} />
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
                  <span>Lihat total belanja secara real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Proses transaksi lebih cepat dan efisien</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Struk otomatis tercetak untuk semua produk</span>
                </li>
              </ul>
            </div>

            {/* Quick Access */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Akses Cepat</h4>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/transactions')}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition-colors text-left flex items-center gap-3"
                >
                  <ShoppingCart size={20} />
                  <span>Input Manual di Transaksi</span>
                </button>
                <button
                  onClick={() => router.push('/products')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-colors text-left flex items-center gap-3"
                >
                  📦
                  <span>Kelola Produk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
