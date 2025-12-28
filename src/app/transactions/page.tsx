// src/app/transactions/page.tsx - Fixed Multiple Products
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { printReceipt } from '@/components/PrintReceipt';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Search, AlertCircle, Printer, ArrowLeft } from 'lucide-react';
import type { Transaction } from '@/lib/db';

interface CartItem {
  barcode_id: string;
  nama_produk: string;
  harga_jual: number;
  stok: number;
  kategori: string;
  quantity: number;
}

function TransactionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
    
    // Handle multiple products from multi-scan
    const multiParam = searchParams.get('multi');
    if (multiParam) {
      loadMultiProducts(multiParam);
    }
  }, []);

  const loadMultiProducts = async (multiParam: string) => {
    setLoading(true);
    const items = multiParam.split(',');
    const tempCart: CartItem[] = [];

    for (const item of items) {
      const [barcode_id, quantity] = item.split(':');
      const qty = parseInt(quantity) || 1;

      try {
        const res = await fetch('/api/barcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode_id }),
        });

        const data = await res.json();

        if (data.found && data.product) {
          const product = data.product;
          
          // Check if already in temp cart
          const existingIndex = tempCart.findIndex(
            (p) => p.barcode_id === barcode_id
          );

          if (existingIndex !== -1) {
            tempCart[existingIndex].quantity += qty;
          } else {
            tempCart.push({
              barcode_id: product.barcode_id,
              nama_produk: product.nama_produk,
              harga_jual: product.harga_jual,
              stok: product.stok,
              kategori: product.kategori,
              quantity: qty,
            });
          }
        }
      } catch (err) {
        console.error(`Error loading product ${barcode_id}:`, err);
      }
    }

    setCart(tempCart);
    setLoading(false);
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
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
        .filter(Boolean) as CartItem[]
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

      // Process each item in cart
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

      // Auto print combined receipt
      if (autoPrint && completedTransactions.length > 0) {
        setPrinting(true);
        
        // Create combined receipt
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

        setTimeout(() => {
          printReceipt(combinedReceipt);
          console.log('✅ Struk berhasil dicetak');
          setPrinting(false);
        }, 500);

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
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-gray-600">Review dan selesaikan transaksi</p>
          </div>
          <button
            onClick={() => router.push('/scan')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Kembali
          </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cart */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={24} />
                Keranjang Belanja
              </h3>
              {cart.length > 0 && (
                <p className="text-sm text-blue-100 mt-1">
                  {cart.length} produk • {totalItems} item
                </p>
              )}
            </div>

            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-semibold mb-2">Keranjang kosong</p>
                  <button
                    onClick={() => router.push('/scan')}
                    className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold"
                  >
                    Mulai Scan
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                    {cart.map((item, index) => (
                      <div 
                        key={item.barcode_id} 
                        className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
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
                    ))}
                  </div>

                  {/* Checkout */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Jumlah Produk:</span>
                        <span className="font-semibold">{cart.length} jenis</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Total Item:</span>
                        <span className="font-semibold">{totalItems} pcs</span>
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
                </>
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
