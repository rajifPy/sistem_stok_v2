// src/app/scan/page.tsx - Camera Only (No Manual Input)
'use client';

import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Scanner from '@/components/Scanner';
import { ShoppingCart, Camera, Zap, Target, TrendingUp } from 'lucide-react';

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

  const handleMultiScanCheckout = (products: ScannedProduct[]) => {
    if (products.length === 0) {
      alert('Keranjang kosong! Scan produk terlebih dahulu.');
      return;
    }

    console.log('Checkout products:', products);

    // Save products to sessionStorage before navigation
    sessionStorage.setItem('checkoutProducts', JSON.stringify(products));
    
    // Build URL with multi parameter
    const barcodes = products.map(p => `${p.barcode_id}:${p.quantity}`).join(',');
    const checkoutUrl = `/transactions?multi=${encodeURIComponent(barcodes)}`;
    
    console.log('Navigating to:', checkoutUrl);
    
    // Navigate to transaction page
    router.push(checkoutUrl);
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
            Scan beberapa produk sekaligus dengan kamera, lalu checkout untuk transaksi
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
          <div className="space-y-4 sm:space-y-6">
            {/* How to Use */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <ShoppingCart className="text-blue-600" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Multi-Scan Mode
                </h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  Scan beberapa produk sekaligus lalu checkout untuk proses transaksi
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 text-left border border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    Cara Menggunakan:
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">1.</span>
                      <span>Klik tombol <strong>"Mulai Scan"</strong> untuk mengaktifkan kamera</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">2.</span>
                      <span>Arahkan kamera ke barcode produk pertama</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">3.</span>
                      <span>Produk akan otomatis ditambahkan ke keranjang</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">4.</span>
                      <span>Lanjutkan scan produk lain tanpa henti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">5.</span>
                      <span>Edit jumlah produk jika diperlukan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">6.</span>
                      <span>Klik <strong>"Checkout"</strong> untuk proses transaksi</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="text-emerald-600" size={24} />
                Keunggulan Multi-Scan:
              </h4>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  <span><strong>Scan Tanpa Henti</strong> - Scan beberapa produk berturut-turut tanpa perlu berhenti</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  <span><strong>Edit Fleksibel</strong> - Ubah jumlah produk sebelum checkout</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  <span><strong>Total Real-time</strong> - Lihat total belanja secara langsung</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  <span><strong>Proses Cepat</strong> - Transaksi lebih cepat dan efisien</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  <span><strong>Auto Save</strong> - Keranjang tersimpan otomatis</span>
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="text-orange-600" size={24} />
                Tips Scan Cepat & Akurat:
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 flex-shrink-0">💡</span>
                  <span>Pastikan pencahayaan <strong>cukup terang</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 flex-shrink-0">💡</span>
                  <span>Jarak ideal: <strong>10-20cm</strong> dari barcode</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 flex-shrink-0">💡</span>
                  <span>Pegang kamera <strong>steady</strong> (tidak goyang)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 flex-shrink-0">💡</span>
                  <span>Barcode harus <strong>terlihat jelas</strong> di kotak scan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 flex-shrink-0">💡</span>
                  <span>Tunggu <strong>notifikasi sukses</strong> sebelum scan berikutnya</span>
                </li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Akses Cepat
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/transactions')}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition-colors text-left flex items-center gap-3"
                >
                  <span className="text-xl">📝</span>
                  <div>
                    <div className="font-bold">Input Manual di Transaksi</div>
                    <div className="text-xs text-blue-600">Ketik barcode langsung</div>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/products')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-colors text-left flex items-center gap-3"
                >
                  <span className="text-xl">📦</span>
                  <div>
                    <div className="font-bold">Kelola Produk</div>
                    <div className="text-xs text-gray-600">Tambah/Edit produk</div>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-colors text-left flex items-center gap-3"
                >
                  <span className="text-xl">📊</span>
                  <div>
                    <div className="font-bold">Dashboard</div>
                    <div className="text-xs text-gray-600">Lihat statistik</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Browser Requirement */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2 text-sm">
                <span>🌐</span>
                Persyaratan Browser:
              </h4>
              <ul className="text-xs text-purple-800 space-y-1">
                <li>✓ Chrome / Edge (Recommended)</li>
                <li>✓ Firefox</li>
                <li>✓ Safari (dengan limitasi)</li>
                <li>✓ Harus menggunakan HTTPS</li>
                <li>✓ Izinkan akses kamera</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
