'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle } from 'lucide-react';
import type { Transaction } from '@/lib/db';

function TransactionContent() {
  const searchParams = useSearchParams();
  const barcodeParam = searchParams.get('barcode');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTransactions();
    if (barcodeParam) {
      handleAddToCart(barcodeParam);
    }
  }, [barcodeParam]);

  const fetchTransactions = async () => {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    setTransactions(data);
  };

  const handleAddToCart = async (barcodeId: string) => {
    try {
      const res = await fetch('/api/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode_id: barcodeId }),
      });

      const data = await res.json();

      if (data.found) {
        const existing = cart.find((item) => item.barcode_id === barcodeId);
        if (existing) {
          setCart(
            cart.map((item) =>
              item.barcode_id === barcodeId ? { ...item, quantity: item.quantity + 1 } : item
            )
          );
        } else {
          setCart([...cart, { ...data.product, quantity: 1 }]);
        }
        setBarcode('');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateQuantity = (barcode_id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.barcode_id === barcode_id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const removeFromCart = (barcode_id: string) => {
    setCart(cart.filter((item) => item.barcode_id !== barcode_id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      for (const item of cart) {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode_id: item.barcode_id,
            jumlah: item.quantity,
          }),
        });
      }

      setSuccess('Transaksi berhasil!');
      setCart([]);
      fetchTransactions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.harga_jual * item.quantity, 0);

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaksi</h1>
          <p className="text-gray-600">Buat transaksi baru atau lihat riwayat</p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle className="text-green-600" size={24} />
            <span className="text-green-800 font-semibold">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cart */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={24} />
                Keranjang ({cart.length})
              </h3>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && barcode) {
                      handleAddToCart(barcode);
                    }
                  }}
                  placeholder="Scan atau ketik barcode..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Keranjang kosong</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.barcode_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.nama_produk}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(item.harga_jual)}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.barcode_id)}
                          className="text-red-600 hover:bg-red-100 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.barcode_id, -1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.barcode_id, 1)}
                          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center"
                        >
                          <Plus size={16} />
                        </button>
                        <span className="ml-auto font-bold text-gray-900">
                          {formatCurrency(item.harga_jual * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Checkout
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <h3 className="text-xl font-bold">Transaksi Terbaru</h3>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Belum ada transaksi</div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((trans) => (
                    <div key={trans.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{trans.nama_produk}</p>
                          <p className="text-xs text-gray-500">{trans.transaksi_id}</p>
                        </div>
                        <p className="font-bold text-blue-600">{formatCurrency(trans.total_harga)}</p>
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
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    }>
      <TransactionContent />
    </Suspense>
  );
}