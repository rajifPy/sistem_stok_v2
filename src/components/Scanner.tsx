// src/components/Scanner.tsx - FIXED Multi-Scan with Persistent Cart
'use client';

import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, X, ShoppingCart, Trash2, CheckCircle, Plus, Minus, AlertCircle } from 'lucide-react';
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
  onScan?: (barcode: string) => void;
  multiScan?: boolean;
  onCheckout?: (products: ScannedProduct[]) => void;
}

export default function Scanner({ onScan, multiScan = true, onCheckout }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [lastScanned, setLastScanned] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scannerRef.current = new BrowserMultiFormatReader();
    
    // Load saved cart from sessionStorage
    const savedCart = sessionStorage.getItem('scannerCart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        setScannedProducts(cart);
      } catch (err) {
        console.error('Error loading cart:', err);
      }
    }
    
    return () => {
      stopScan();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  // Save cart to sessionStorage whenever it changes
  useEffect(() => {
    if (scannedProducts.length > 0) {
      sessionStorage.setItem('scannerCart', JSON.stringify(scannedProducts));
    } else {
      sessionStorage.removeItem('scannerCart');
    }
  }, [scannedProducts]);

  const fetchProduct = async (barcode: string) => {
    try {
      const res = await fetch('/api/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode_id: barcode }),
      });

      const data = await res.json();

      if (data.found && data.product) {
        return data.product;
      }
      return null;
    } catch (err) {
      console.error('Error fetching product:', err);
      return null;
    }
  };

  const addProductToCart = async (barcode: string) => {
    // Prevent duplicate scans within 1.5 seconds
    if (barcode === lastScanned) {
      return;
    }
    setLastScanned(barcode);
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => setLastScanned(''), 1500);

    const product = await fetchProduct(barcode);

    if (!product) {
      setError(`❌ Produk ${barcode} tidak ditemukan`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (product.stok === 0) {
      setError(`❌ ${product.nama_produk} stok habis`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setScannedProducts((prev) => {
      const existing = prev.find((p) => p.barcode_id === barcode);
      
      if (existing) {
        if (existing.quantity >= product.stok) {
          setError(`❌ Stok ${product.nama_produk} tidak cukup (Max: ${product.stok})`);
          setTimeout(() => setError(''), 3000);
          return prev;
        }
        
        setSuccess(`✓ ${product.nama_produk} qty +1 (Total: ${existing.quantity + 1})`);
        setTimeout(() => setSuccess(''), 2000);
        
        return prev.map((p) =>
          p.barcode_id === barcode
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      setSuccess(`✓ ${product.nama_produk} ditambahkan (${formatCurrency(product.harga_jual)})`);
      setTimeout(() => setSuccess(''), 2000);
      
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const startScan = async () => {
    if (!scannerRef.current || !videoRef.current) return;

    try {
      setScanning(true);
      setCameraReady(false);
      setError('');
      
      await scannerRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const barcode = result.getText();
            
            if (!cameraReady) {
              setCameraReady(true);
              setSuccess('✓ Kamera aktif! Arahkan ke barcode');
              setTimeout(() => setSuccess(''), 2000);
            }
            
            if (multiScan) {
              await addProductToCart(barcode);
            } else {
              onScan?.(barcode);
              stopScan();
            }
          }
          
          if (err && !err.message?.includes('NotFoundException')) {
            console.warn('Scan error:', err);
          }
        }
      );
      
      setCameraReady(true);
    } catch (error: any) {
      console.error('Camera error:', error);
      
      let errorMessage = '❌ Gagal mengakses kamera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Izin kamera ditolak. Klik ikon kamera di address bar untuk mengizinkan.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut.';
      } else {
        errorMessage += 'Coba refresh halaman atau gunakan browser lain.';
      }
      
      setError(errorMessage);
      setScanning(false);
      setCameraReady(false);
    }
  };

  const stopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.reset();
    }
    setScanning(false);
    setCameraReady(false);
  };

  const updateQuantity = (barcode_id: string, delta: number) => {
    setScannedProducts((prev) =>
      prev
        .map((item) => {
          if (item.barcode_id === barcode_id) {
            const newQty = item.quantity + delta;
            
            if (newQty > item.stok) {
              setError(`❌ Stok ${item.nama_produk} tidak cukup`);
              setTimeout(() => setError(''), 3000);
              return item;
            }
            
            if (newQty <= 0) return null;
            
            setError('');
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as ScannedProduct[]
    );
  };

  const removeProduct = (barcode_id: string) => {
    setScannedProducts((prev) => prev.filter((p) => p.barcode_id !== barcode_id));
    setError('');
  };

  const clearCart = () => {
    if (confirm('Kosongkan semua produk dari keranjang?')) {
      setScannedProducts([]);
      sessionStorage.removeItem('scannerCart');
      setError('');
      setSuccess('');
    }
  };

  const handleCheckout = () => {
    if (scannedProducts.length === 0) {
      setError('❌ Keranjang kosong! Scan produk terlebih dahulu.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    stopScan();
    
    // Pass products to parent component
    if (onCheckout) {
      onCheckout([...scannedProducts]);
    }
  };

  const total = scannedProducts.reduce(
    (sum, item) => sum + item.harga_jual * item.quantity,
    0
  );

  const totalItems = scannedProducts.reduce((sum, item) => sum + item.quantity, 0);

  if (!multiScan) {
    // Single-scan mode (simplified version)
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Camera size={24} />
            Scanner Barcode
          </h3>
        </div>

        <div className="relative bg-black aspect-video">
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <Camera size={64} className="mx-auto mb-4 opacity-50" />
                <p>Klik tombol untuk mulai scan</p>
              </div>
            </div>
          )}
          <video ref={videoRef} className={`w-full h-full ${!scanning && 'hidden'}`} />
          
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 border-4 border-green-500 rounded-lg"></div>
            </div>
          )}
        </div>

        <div className="p-6">
          {!scanning ? (
            <button
              onClick={startScan}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Mulai Scan
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <X size={20} />
              Stop Scan
            </button>
          )}
        </div>
      </div>
    );
  }

  // Multi-scan mode with cart
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={24} />
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Multi-Scan Mode</h3>
              {cameraReady && (
                <p className="text-xs sm:text-sm text-blue-100">
                  🟢 Kamera aktif - Siap scan
                </p>
              )}
            </div>
          </div>
          {scannedProducts.length > 0 && (
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{scannedProducts.length}</div>
                <div className="text-xs">Produk</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-semibold">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-4 sm:mx-6 mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <span className="text-sm text-green-800 font-semibold">{success}</span>
        </div>
      )}

      {/* Camera View */}
      <div className="relative bg-black aspect-video">
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center p-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera size={40} className="opacity-50" />
              </div>
              <p className="text-base sm:text-lg font-semibold mb-2">Siap untuk scan?</p>
              <p className="text-xs sm:text-sm text-gray-300">
                {scannedProducts.length === 0 
                  ? 'Klik "Mulai Scan" untuk scan produk'
                  : `${scannedProducts.length} produk di keranjang`
                }
              </p>
            </div>
          </div>
        )}
        <video ref={videoRef} className={`w-full h-full ${!scanning && 'hidden'}`} />
        
        {scanning && cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-48 h-32 sm:w-64 sm:h-40 border-4 border-green-500 rounded-lg mb-4 shadow-lg"></div>
            <div className="bg-green-500 text-white px-4 sm:px-6 py-2 rounded-full font-semibold animate-pulse shadow-lg">
              📸 Sedang Scan...
            </div>
          </div>
        )}
      </div>

      {/* Scanned Products List */}
      {scannedProducts.length > 0 && (
        <div className="p-4 sm:p-6 border-t-2 border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
              <ShoppingCart size={20} />
              Keranjang ({scannedProducts.length})
            </h4>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-semibold"
            >
              Kosongkan
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {scannedProducts.map((product, index) => (
              <div
                key={product.barcode_id}
                className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded flex-shrink-0">
                        #{index + 1}
                      </span>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {product.nama_produk}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        {product.kategori}
                      </span>
                      <span>•</span>
                      <span className="font-semibold">{formatCurrency(product.harga_jual)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeProduct(product.barcode_id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors ml-2 flex-shrink-0"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(product.barcode_id, -1)}
                      className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center font-bold transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="text-center min-w-[40px]">
                      <div className="font-bold text-lg">{product.quantity}</div>
                    </div>
                    <button
                      onClick={() => updateQuantity(product.barcode_id, 1)}
                      disabled={product.quantity >= product.stok}
                      className="w-8 h-8 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center font-bold transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600 text-sm sm:text-base">
                      {formatCurrency(product.harga_jual * product.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                <span>Total Items:</span>
                <span className="font-bold">{totalItems} pcs</span>
              </div>
              <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-gray-900">TOTAL:</span>
                <span className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 sm:p-6 border-t border-gray-200 space-y-3">
        {!scanning ? (
          <>
            <button
              onClick={startScan}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Camera size={20} />
              {scannedProducts.length === 0 ? 'Mulai Scan' : 'Scan Produk Lain'}
            </button>
            
            {scannedProducts.length > 0 && (
              <button
                onClick={handleCheckout}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <CheckCircle size={20} />
                Checkout ({scannedProducts.length} Produk)
              </button>
            )}
          </>
        ) : (
          <button
            onClick={stopScan}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <X size={20} />
            Stop Scan
          </button>
        )}
      </div>

      {/* Instructions */}
      {scannedProducts.length === 0 && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-xs sm:text-sm">💡 Cara Pakai:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>1. Klik "Mulai Scan" untuk aktifkan kamera</li>
              <li>2. Arahkan kamera ke barcode produk</li>
              <li>3. Scan beberapa produk sekaligus</li>
              <li>4. Edit jumlah jika perlu</li>
              <li>5. Klik "Checkout" untuk lanjut transaksi</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
