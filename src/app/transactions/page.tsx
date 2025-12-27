// src/app/transactions/page.tsx - Fixed Type Error
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { printReceipt } from '@/components/PrintReceipt';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Search, AlertCircle, Printer } from 'lucide-react';
import type { Transaction } from '@/lib/db';

function TransactionContent() {
  const searchParams = useSearchParams();
  const barcodeParam = searchParams.get('barcode');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
    if (barcodeParam) {
      setBarcode(barcodeParam);
      handleAddToCart(barcodeParam);
    }
  }, [barcodeParam]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleAddToCart = async (barcodeId: string) => {
    if (!barcodeId.trim()) {
      setError('Masukkan barcode terlebih dahulu');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode_id: barcodeId }),
      });

      const data = await res.json();

      if (data.found && data.product) {
        if (data.product.stok === 0) {
          setError(`Produk "${data.product.nama_produk}" stok habis`);
          setLoading(false);
          return;
        }

        const existing = cart.find((item) => item.barcode_id === barcodeId);
        
        if (existing) {
          if (existing.quantity >= data.product.stok) {
            setError(`Stok ${data.product.nama_produk} tidak cukup. Tersedia: ${data.product.stok}`);
            setLoading(false);
            return;
          }
          
          setCart(
            cart.map((item) =>
              item.barcode_id === barcodeId 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            )
          );
          setSuccess(`✓ ${data.product.nama_produk} qty +1`);
        } else {
          setCart([...cart, { ...data.product, quantity: 1 }]);
          setSuccess(`✓ ${data.product.nama_produk} ditambahkan`);
        }
        
        setBarcode('');
        setError('');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(`Produk dengan barcode "${barcodeId}" tidak ditemukan`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Terjadi kesalahan saat mencari produk');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (barcode_id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.barcode_id === barcode_id) {
            const newQty = item.quantity + delta;
            
            if (newQty > item.stok) {
              setError(`Stok ${item.nama_produk} tidak cukup. Tersedia: ${item.stok}`);
              return item;
            }
            
            setError('');
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const removeFromCart = (barcode_id: string) => {
    setCart(cart.filter((item) => item.barcode_id !== barcode_id));
    setError('');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const completedTransactions = [];

      // Process all transactions
      for (const item of cart) {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode_id: item.barcode_id,
            jumlah: item.quantity,
          }),
        });

        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        completedTransactions.push(data);
      }

      setSuccess('Transaksi berhasil! 🎉');
      
      // Check auto print settings
      const printSettings = localStorage.getItem('printSettings');
      const autoPrint = printSettings ? JSON.parse(printSettings).autoPrint : true;

      // Auto print jika diaktifkan - COMBINED RECEIPT
      if (autoPrint && completedTransactions.length > 0) {
        setPrinting(true);
        
        // Buat combined receipt untuk multiple items
        const combinedReceipt = {
          transaksi_id: completedTransactions[0].transaksi_id,
          items: completedTransactions.map(trans => ({
            nama_produk: trans.nama_produk,
            jumlah: trans.jumlah,
            harga_satuan: trans.harga_satuan,
            total_harga: trans.total_harga,
          })),
          total_harga: completedTransactions.reduce((sum, trans) => sum + trans.total_harga, 0),
          created_at: completedTransactions[0].created_at,
        };

        // Print combined receipt - FIXED: Remove truthiness check
        setTimeout(() => {
          printReceipt(combinedReceipt);
          console.log('✅ Struk berhasil dicetak');
          setPrinting(false);
        }, 500);
      }

      // Simpan transaksi terakhir untuk tombol print ulang
      if (completedTransactions.length > 0) {
        // Save as combined receipt
        const combinedReceipt = {
          transaksi_id: completedTransactions[0].transaksi_id,
          items: completedTransactions.map(trans => ({
            nama_produk: trans.nama_produk,
            jumlah: trans.jumlah,
            harga_satuan: trans.harga_satuan,
            total_harga: trans.total_harga,
          })),
          total_harga: completedTransactions.reduce((sum, trans) => sum + trans.total_harga, 0),
          created_at: completedTransactions[0].created_at,
        };
        setLastTransaction(combinedReceipt);
      }

      setCart([]);
      fetchTransactions();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Terjadi kesalahan saat checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleReprintLast = () => {
    if (lastTransaction) {
      printReceipt(lastTransaction);
    }
  };

  const handlePrintTransaction = (trans: Transaction) => {
    printReceipt(trans);
  };

  const total = cart.reduce((sum, item) => sum + item.harga_jual * item.quantity, 0);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaksi</h1>
          <p className="text-gray-600">Buat transaksi baru atau lihat riwayat</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-green-900 font-bold text-lg">{success}</p>
                <p className="text-green-700 text-sm">
                  {lastTransaction && 'items' in lastTransaction 
                    ? `${lastTransaction.items.length} produk • Total: ${formatCurrency(lastTransaction.total_harga)}`
                    : 'Struk telah dicetak'
                  }
                </p>
              </div>
            </div>
            {lastTransaction && (
              <button
                onClick={handleReprintLast}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg"
              >
                <Printer size={18} />
                Print Ulang
              </button>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div className="flex-1">
              <span className="text-red-800 font-semibold">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cart */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={24} />
                Keranjang ({cart.length})
              </h3>
            </div>

            <div className="p-6">
              {/* Barcode Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Scan atau Input Barcode
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && barcode) {
                          handleAddToCart(barcode);
                        }
                      }}
                      placeholder="BRK001"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => handleAddToCart(barcode)}
                    disabled={loading || !barcode.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus size={20} />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  💡 Tip: Scan atau ketik barcode, lalu tekan Enter. Bisa tambah banyak produk sebelum checkout!
                </p>
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-900 font-semibold">
                      {cart.length} produk • {cart.reduce((sum, item) => sum + item.quantity, 0)} item
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Kosongkan keranjang?')) {
                          setCart([]);
                          setError('');
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-semibold">Keranjang kosong</p>
                    <p className="text-sm mt-1">Scan barcode untuk menambah produk</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div 
                      key={item.barcode_id} 
                      className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                              #{index + 1}
                            </span>
                            <p className="font-semibold text-gray-900">{item.nama_produk}</p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.harga_jual)} • Stok: {item.stok}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.barcode_id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.barcode_id, -1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.barcode_id, 1)}
                            disabled={item.quantity >= item.stok}
                            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(item.harga_jual * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout */}
              {cart.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Jumlah Produk:</span>
                      <span className="font-semibold">{cart.length} jenis</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Item:</span>
                      <span className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)} pcs</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">Total Bayar:</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={loading || printing}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : printing ? (
                      <>
                        <Printer className="animate-pulse" size={20} />
                        Mencetak...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Checkout & Print
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <h3 className="text-xl font-bold">Transaksi Terbaru</h3>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((trans) => (
                    <div key={trans.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{trans.nama_produk}</p>
                          <p className="text-xs text-gray-500 font-mono">{trans.transaksi_id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-blue-600">{formatCurrency(trans.total_harga)}</p>
                          <button
                            onClick={() => handlePrintTransaction(trans)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Print Struk"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {trans.jumlah}x • {formatCurrency(trans.harga_satuan)}
                        </span>
                        <span className="text-xs text-gray-500">{formatDateTime(trans.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Memuat...</p>
          </div>
        </div>
      </Layout>
    }>
      <TransactionContent />
    </Suspense>
  );
}
