// src/components/Scanner.tsx - Enhanced Multi-Product Scanner
'use client';

import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, X, ShoppingCart, Trash2, CheckCircle, Plus, Minus } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    scannerRef.current = new BrowserMultiFormatReader();
    return () => stopScan();
  }, []);

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
    // Prevent duplicate scans within 1 second
    if (barcode === lastScanned) {
      return;
    }
    setLastScanned(barcode);
    setTimeout(() => setLastScanned(''), 1000);

    const product = await fetchProduct(barcode);

    if (!product) {
      setError(`Produk ${barcode} tidak ditemukan`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (product.stok === 0) {
      setError(`${product.nama_produk} stok habis`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setScannedProducts((prev) => {
      const existing = prev.find((p) => p.barcode_id === barcode);
      
      if (existing) {
        if (existing.quantity >= product.stok) {
          setError(`Stok ${product.nama_produk} tidak cukup (Max: ${product.stok})`);
          setTimeout(() => setError(''), 3000);
          return prev;
        }
        
        setSuccess(`✓ ${product.nama_produk} qty +1`);
        setTimeout(() => setSuccess(''), 2000);
        
        return prev.map((p) =>
          p.barcode_id === barcode
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      setSuccess(`✓ ${product.nama_produk} ditambahkan`);
      setTimeout(() => setSuccess(''), 2000);
      
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const startScan = async () => {
    if (!scannerRef.current || !videoRef.current) return;

    try {
      setScanning(true);
      setError('');
      
      await scannerRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const barcode = result.getText();
            
            if (multiScan) {
              await addProductToCart(barcode);
              // Continue scanning for multi-scan mode
            } else {
              onScan?.(barcode);
              stopScan();
            }
          }
        }
      );
    } catch (error) {
      console.error('Scan error:', error);
      setError('Gagal memulai kamera');
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.reset();
    }
    setScanning(false);
  };

  const updateQuantity = (barcode_id: string, delta: number) => {
    setScannedProducts((prev) =>
      prev
        .map((item) => {
          if (item.barcode_id === barcode_id) {
            const newQty = item.quantity + delta;
            
            if (newQty > item.stok) {
              setError(`Stok ${item.nama_produk} tidak cukup`);
              setTimeout(() => setError(''), 3000);
              return item;
            }
            
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as ScannedProduct[]
    );
  };

  const removeProduct = (barcode_id: string) => {
    setScannedProducts((prev) => prev.filter((p) => p.barcode_id !== barcode_id));
  };

  const handleCheckout = () => {
    if (scannedProducts.length === 0) return;
    
    stopScan();
    onCheckout?.(scannedProducts);
  };

  const total = scannedProducts.reduce(
    (sum, item) => sum + item.harga_jual * item.quantity,
    0
  );

  const totalItems = scannedProducts.reduce((sum, item) => sum + item.quantity, 0);

  if (!multiScan) {
    // Original single-scan mode
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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={24} />
            <div>
              <h3 className="text-xl font-bold">Multi-Scan Mode</h3>
              <p className="text-sm text-blue-100">Scan beberapa produk sekaligus</p>
            </div>
          </div>
          {scannedProducts.length > 0 && (
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{scannedProducts.length}</div>
                <div className="text-xs">Produk</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-fade-in">
          <X className="text-red-600 flex-shrink-0" size={20} />
          <span className="text-red-800 text-sm font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <span className="text-green-800 text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* Camera View */}
      <div className="relative bg-black aspect-video">
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center p-4">
              <Camera size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">Siap untuk scan?</p>
              <p className="text-sm text-gray-300">
                {scannedProducts.length === 0 
                  ? 'Klik "Mulai Scan" untuk scan produk pertama'
                  : 'Scan produk lain atau checkout'
                }
              </p>
            </div>
          </div>
        )}
        <video ref={videoRef} className={`w-full h-full ${!scanning && 'hidden'}`} />
        
        {scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-64 h-40 border-4 border-green-500 rounded-lg mb-4"></div>
            <div className="bg-green-500 text-white px-6 py-2 rounded-full font-semibold animate-pulse">
              📸 Sedang Scan...
            </div>
          </div>
        )}
      </div>

      {/* Scanned Products List */}
      {scannedProducts.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={20} />
              Produk Terscann ({scannedProducts.length})
            </h4>
            <button
              onClick={() => setScannedProducts([])}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Kosongkan
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {scannedProducts.map((product, index) => (
              <div
                key={product.barcode_id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                        #{index + 1}
                      </span>
                      <p className="font-semibold text-gray-900">{product.nama_produk}</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(product.harga_jual)} • Stok: {product.stok}
                    </p>
                  </div>
                  <button
                    onClick={() => removeProduct(product.barcode_id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(product.barcode_id, -1)}
                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold text-lg w-8 text-center">{product.quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.barcode_id, 1)}
                      disabled={product.quantity >= product.stok}
                      className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
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

          {/* Total Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
              <span>Total Items:</span>
              <span className="font-semibold">{totalItems} pcs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Bayar:</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-6 border-t border-gray-200 space-y-3">
        {!scanning ? (
          <>
            <button
              onClick={startScan}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              {scannedProducts.length === 0 ? 'Mulai Scan' : 'Scan Produk Lain'}
            </button>
            
            {scannedProducts.length > 0 && (
              <button
                onClick={handleCheckout}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Checkout ({scannedProducts.length} Produk)
              </button>
            )}
          </>
        ) : (
          <button
            onClick={stopScan}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <X size={20} />
            Stop Scan
          </button>
        )}
      </div>

      {/* Instructions */}
      {scannedProducts.length === 0 && (
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 Cara Pakai:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>1. Klik "Mulai Scan" untuk aktifkan kamera</li>
              <li>2. Arahkan kamera ke barcode produk</li>
              <li>3. Scan beberapa produk sekaligus</li>
              <li>4. Edit jumlah jika perlu</li>
              <li>5. Klik "Checkout" untuk proses transaksi</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
