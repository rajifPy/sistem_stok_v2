// src/components/Scanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, ShoppingCart, Trash2, Plus, Minus, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ScannedProduct {
  barcode_id: string;
  nama_produk: string;
  harga_jual: number;
  stok: number;
  kategori: string;
  quantity: number;
}

interface ScannerProps {
  multiScan?: boolean;
  onCheckout?: (products: ScannedProduct[]) => void;
}

export default function Scanner({ multiScan = false, onCheckout }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<string>('qr-reader');

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      const html5QrCode = new Html5Qrcode(videoRef.current);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      try {
        // Try rear camera first
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          handleScanSuccess,
          () => {} // Ignore scan errors
        );
      } catch (err) {
        console.log('Rear camera failed, trying front camera...');
        // Fallback to front camera
        await html5QrCode.start(
          { facingMode: 'user' },
          config,
          handleScanSuccess,
          () => {} // Ignore scan errors
        );
      }

      setScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      
      let errorMessage = 'Gagal mengakses kamera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain dan coba lagi.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Kamera tidak mendukung pengaturan yang diminta.';
      } else if (err.name === 'SecurityError') {
        errorMessage += 'Akses kamera diblokir karena alasan keamanan. Pastikan menggunakan HTTPS.';
      } else {
        errorMessage += 'Coba refresh halaman atau gunakan browser lain.';
      }
      
      setError(errorMessage);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (!multiScan) {
      // Single scan mode - stop after first scan
      await stopScanning();
    }

    // Fetch product details
    try {
      const res = await fetch('/api/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode_id: decodedText }),
      });

      const data = await res.json();

      if (data.found && data.product) {
        const product = data.product;

        // Check if already in cart
        const existingIndex = scannedProducts.findIndex(
          (p) => p.barcode_id === product.barcode_id
        );

        if (existingIndex !== -1) {
          // Update quantity
          const existing = scannedProducts[existingIndex];
          if (existing.quantity >= product.stok) {
            setError(`Stok ${product.nama_produk} tidak cukup. Tersedia: ${product.stok}`);
            return;
          }

          const updated = [...scannedProducts];
          updated[existingIndex] = {
            ...existing,
            quantity: existing.quantity + 1,
          };
          setScannedProducts(updated);
        } else {
          // Add new product
          if (product.stok === 0) {
            setError(`Produk "${product.nama_produk}" stok habis`);
            return;
          }

          setScannedProducts([
            ...scannedProducts,
            {
              barcode_id: product.barcode_id,
              nama_produk: product.nama_produk,
              harga_jual: product.harga_jual,
              stok: product.stok,
              kategori: product.kategori,
              quantity: 1,
            },
          ]);
        }

        setError('');
      } else {
        setError(`Produk dengan barcode "${decodedText}" tidak ditemukan`);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Gagal memproses scan');
    }
  };

  const updateQuantity = (barcode_id: string, delta: number) => {
    setScannedProducts((products) =>
      products
        .map((p) => {
          if (p.barcode_id === barcode_id) {
            const newQty = p.quantity + delta;
            if (newQty > p.stok) {
              setError(`Stok ${p.nama_produk} tidak cukup. Tersedia: ${p.stok}`);
              return p;
            }
            if (newQty <= 0) return null;
            setError('');
            return { ...p, quantity: newQty };
          }
          return p;
        })
        .filter(Boolean) as ScannedProduct[]
    );
  };

  const removeProduct = (barcode_id: string) => {
    setScannedProducts(scannedProducts.filter((p) => p.barcode_id !== barcode_id));
    setError('');
  };

  const handleCheckout = () => {
    if (scannedProducts.length > 0 && onCheckout) {
      onCheckout(scannedProducts);
    }
  };

  const totalAmount = scannedProducts.reduce(
    (sum, p) => sum + p.harga_jual * p.quantity,
    0
  );

  const totalItems = scannedProducts.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white">
        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <Camera size={24} />
          {multiScan ? 'Multi-Scan Camera' : 'Scan Barcode'}
        </h3>
        {multiScan && scannedProducts.length > 0 && (
          <p className="text-sm text-blue-100 mt-1">
            {scannedProducts.length} produk • {totalItems} item • {formatCurrency(totalAmount)}
          </p>
        )}
      </div>

      {/* Scanner Area */}
      <div className="p-4 sm:p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <X className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {!scanning ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="text-blue-600" size={40} />
            </div>
            <p className="text-gray-600 mb-4">
              {multiScan
                ? 'Scan beberapa produk sekaligus'
                : 'Klik tombol untuk mulai scan'}
            </p>
            <button
              onClick={startScanning}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Camera size={20} />
              Mulai Scan
            </button>
            
            {error && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left">
                <h4 className="font-bold text-yellow-900 mb-2">💡 Cara Mengatasi:</h4>
                <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                  <li>Pastikan browser memiliki izin akses kamera</li>
                  <li>Coba refresh halaman (F5 atau Ctrl+R)</li>
                  <li>Tutup aplikasi lain yang menggunakan kamera</li>
                  <li>Coba browser lain (Chrome/Firefox recommended)</li>
                  <li>Pastikan menggunakan HTTPS (bukan HTTP)</li>
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div
              id={videoRef.current}
              className="rounded-xl overflow-hidden border-4 border-blue-200 mb-4"
            />
            <button
              onClick={stopScanning}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <X size={20} />
              Stop Scanning
            </button>
          </div>
        )}

        {/* Scanned Products List */}
        {multiScan && scannedProducts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">Produk Terpindai</h4>
              <button
                onClick={() => {
                  if (confirm('Hapus semua produk?')) {
                    setScannedProducts([]);
                    setError('');
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 font-semibold"
              >
                Hapus Semua
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scannedProducts.map((product, index) => (
                <div
                  key={product.barcode_id}
                  className="bg-gray-50 rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          #{index + 1}
                        </span>
                        <p className="font-semibold text-gray-900">
                          {product.nama_produk}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(product.harga_jual)} • Stok: {product.stok}
                      </p>
                    </div>
                    <button
                      onClick={() => removeProduct(product.barcode_id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(product.barcode_id, -1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-lg w-8 text-center">
                        {product.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.barcode_id, 1)}
                        disabled={product.quantity >= product.stok}
                        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(product.harga_jual * product.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Item:</span>
                  <span className="font-semibold">{totalItems} pcs</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:shadow-lg text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Checkout ({scannedProducts.length} produk)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
