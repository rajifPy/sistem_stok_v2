// src/components/Scanner.tsx - IMPROVED VERSION
'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, X, ShoppingCart, Trash2, Plus, Minus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [success, setSuccess] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [lastScan, setLastScan] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<string>('qr-reader');
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setSuccess('');
      setCameraReady(false);

      // Check camera permissions first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera. Gunakan Chrome, Firefox, atau Edge.');
      }

      // Initialize scanner
      const html5QrCode = new Html5Qrcode(videoRef.current);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: 'environment'
        }
      };

      // Try to start camera
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          handleScanSuccess,
          handleScanError
        );
        
        setScanning(true);
        setCameraReady(true);
        setSuccess('✓ Kamera aktif! Arahkan ke barcode/QR code');
        setTimeout(() => setSuccess(''), 3000);
        
      } catch (err: any) {
        console.log('Trying alternative camera...', err);
        
        // Try with any available camera
        try {
          await html5QrCode.start(
            { facingMode: 'user' },
            config,
            handleScanSuccess,
            handleScanError
          );
          
          setScanning(true);
          setCameraReady(true);
          setSuccess('✓ Kamera depan aktif! (Gunakan cermin untuk scan)');
          setTimeout(() => setSuccess(''), 3000);
          
        } catch (fallbackErr: any) {
          throw fallbackErr;
        }
      }

    } catch (err: any) {
      console.error('Scanner error:', err);
      
      let errorMessage = 'Gagal mengakses kamera. ';
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        errorMessage = '🚫 Izin kamera ditolak. Klik ikon kamera/kunci di address bar untuk mengizinkan.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '📷 Kamera tidak ditemukan. Pastikan perangkat memiliki kamera yang berfungsi.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '⚠️ Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain dan coba lagi.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = '⚙️ Kamera tidak mendukung pengaturan yang diminta. Coba browser lain.';
      } else if (err.name === 'SecurityError' || err.message?.includes('https')) {
        errorMessage = '🔒 Akses kamera hanya tersedia di HTTPS. Pastikan menggunakan https:// bukan http://';
      } else if (err.message?.includes('not supported')) {
        errorMessage = '❌ Browser tidak mendukung akses kamera. Gunakan Chrome, Firefox, atau Edge terbaru.';
      } else {
        errorMessage = `❌ Error: ${err.message || 'Unknown error'}. Coba refresh halaman.`;
      }
      
      setError(errorMessage);
      setScanning(false);
      setCameraReady(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
    setCameraReady(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Prevent duplicate scans within 2 seconds
    if (decodedText === lastScan) {
      return;
    }

    setLastScan(decodedText);
    
    // Clear the last scan after 2 seconds
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      setLastScan('');
    }, 2000);

    if (!multiScan) {
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
          const existing = scannedProducts[existingIndex];
          if (existing.quantity >= product.stok) {
            setError(`❌ Stok ${product.nama_produk} tidak cukup. Tersedia: ${product.stok}`);
            setTimeout(() => setError(''), 3000);
            return;
          }

          const updated = [...scannedProducts];
          updated[existingIndex] = {
            ...existing,
            quantity: existing.quantity + 1,
          };
          setScannedProducts(updated);
          setSuccess(`✓ ${product.nama_produk} qty +1 (Total: ${updated[existingIndex].quantity})`);
        } else {
          if (product.stok === 0) {
            setError(`❌ Produk "${product.nama_produk}" stok habis`);
            setTimeout(() => setError(''), 3000);
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
          setSuccess(`✓ ${product.nama_produk} ditambahkan (${formatCurrency(product.harga_jual)})`);
        }

        setError('');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(`❌ Barcode "${decodedText}" tidak ditemukan di database`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('❌ Gagal memproses scan. Coba lagi.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleScanError = (errorMessage: string) => {
    // Ignore routine scan errors - they're normal
    // Only log severe errors
    if (errorMessage.includes('NotFoundException')) {
      // This is normal - no barcode in frame
      return;
    }
    console.warn('Scan error:', errorMessage);
  };

  const updateQuantity = (barcode_id: string, delta: number) => {
    setScannedProducts((products) =>
      products
        .map((p) => {
          if (p.barcode_id === barcode_id) {
            const newQty = p.quantity + delta;
            if (newQty > p.stok) {
              setError(`❌ Stok ${p.nama_produk} tidak cukup. Tersedia: ${p.stok}`);
              setTimeout(() => setError(''), 3000);
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

  const handleRetry = () => {
    setError('');
    setSuccess('');
    startScanning();
  };

  const totalAmount = scannedProducts.reduce(
    (sum, p) => sum + p.harga_jual * p.quantity,
    0
  );

  const totalItems = scannedProducts.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Camera size={24} />
              {multiScan ? 'Multi-Scan Camera' : 'Scan Barcode'}
            </h3>
            {cameraReady && (
              <p className="text-sm text-blue-100 mt-1">
                🟢 Kamera aktif - Siap scan
              </p>
            )}
          </div>
          {multiScan && scannedProducts.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold">{scannedProducts.length}</div>
              <div className="text-xs text-blue-100">produk</div>
            </div>
          )}
        </div>
      </div>

      {/* Scanner Area */}
      <div className="p-4 sm:p-6">
        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-green-800 font-semibold">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-3 animate-fade-in">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800 font-semibold flex-1">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800"
              >
                <X size={16} />
              </button>
            </div>
            {error.includes('izin') && (
              <button
                onClick={handleRetry}
                className="mt-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Coba Lagi
              </button>
            )}
          </div>
        )}

        {!scanning ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Camera className="text-blue-600" size={40} />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              {multiScan ? 'Scan Beberapa Produk' : 'Scan Barcode Produk'}
            </h4>
            <p className="text-gray-600 mb-6 text-sm">
              {multiScan
                ? 'Scan beberapa produk tanpa henti, lalu checkout'
                : 'Arahkan kamera ke barcode atau QR code produk'}
            </p>
            <button
              onClick={startScanning}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 mx-auto text-lg"
            >
              <Camera size={24} />
              Mulai Scan Sekarang
            </button>
            
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 text-left max-w-md mx-auto">
              <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span>💡</span>
                Tips Scan:
              </h5>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Pastikan pencahayaan cukup terang</li>
                <li>• Pegang kamera steady (tidak goyang)</li>
                <li>• Jarak ideal: 10-20cm dari barcode</li>
                <li>• Barcode harus terlihat jelas di kotak hijau</li>
                <li>• Tunggu bunyi beep saat berhasil scan</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 text-center">
              <p className="text-green-800 font-semibold flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                Kamera Aktif - Arahkan ke Barcode
              </p>
            </div>
            
            <div
              id={videoRef.current}
              className="rounded-xl overflow-hidden border-4 border-blue-300 mb-4 shadow-lg"
              style={{ minHeight: '300px' }}
            />
            
            <div className="flex gap-2">
              <button
                onClick={stopScanning}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <X size={20} />
                Stop Scanning
              </button>
              
              {scannedProducts.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Hapus semua produk?')) {
                      setScannedProducts([]);
                    }
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scanned Products List */}
        {multiScan && scannedProducts.length > 0 && (
          <div className="mt-6 border-t-2 border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 text-lg">
                Keranjang ({scannedProducts.length})
              </h4>
              <button
                onClick={() => {
                  if (confirm('Kosongkan keranjang?')) {
                    setScannedProducts([]);
                    setError('');
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 font-semibold"
              >
                Hapus Semua
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {scannedProducts.map((product, index) => (
                <div
                  key={product.barcode_id}
                  className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 p-4 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                          #{index + 1}
                        </span>
                        <p className="font-bold text-gray-900">
                          {product.nama_produk}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {product.kategori}
                        </span>
                        <span>•</span>
                        <span>{formatCurrency(product.harga_jual)}</span>
                        <span>•</span>
                        <span className="text-green-600 font-semibold">Stok: {product.stok}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeProduct(product.barcode_id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(product.barcode_id, -1)}
                        className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center font-bold transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <div className="text-center">
                        <div className="font-bold text-2xl text-gray-900">{product.quantity}</div>
                        <div className="text-xs text-gray-500">qty</div>
                      </div>
                      <button
                        onClick={() => updateQuantity(product.barcode_id, 1)}
                        disabled={product.quantity >= product.stok}
                        className="w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center font-bold transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(product.harga_jual * product.quantity)}
                      </div>
                      <div className="text-xs text-gray-500">subtotal</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Jumlah Produk:</span>
                  <span className="font-bold">{scannedProducts.length} jenis</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Total Item:</span>
                  <span className="font-bold">{totalItems} pcs</span>
                </div>
                <div className="pt-3 border-t-2 border-blue-200 flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-lg"
              >
                <CheckCircle size={24} />
                Checkout Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
