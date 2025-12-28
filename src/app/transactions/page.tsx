// src/app/transactions/page.tsx - WITH DISCOUNT SYSTEM
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { printReceipt } from '@/components/PrintReceipt';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Search, AlertCircle, Printer, Keyboard, Tag, Percent, DollarSign, X } from 'lucide-react';
import type { Transaction } from '@/lib/db';

interface CartItem {
  barcode_id: string;
  nama_produk: string;
  harga_jual: number;
  stok: number;
  kategori: string;
  quantity: number;
  discount: {
    type: 'percent' | 'nominal';
    value: number;
  };
  discountedPrice: number;
}

interface GlobalDiscount {
  type: 'percent' | 'nominal';
  value: number;
  code?: string;
}

function TransactionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  
  // Discount states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountTarget, setDiscountTarget] = useState<string | 'global' | null>(null);
  const [discountType, setDiscountType] = useState<'percent' | 'nominal'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | null>(null);
  const [promoCode, setPromoCode] = useState('');

  // Promo codes database
  const promoCodes: Record<string, { type: 'percent' | 'nominal'; value: number; description: string }> = {
    'DISKON10': { type: 'percent', value: 10, description: 'Diskon 10%' },
    'DISKON20': { type: 'percent', value: 20, description: 'Diskon 20%' },
    'HEMAT5K': { type: 'nominal', value: 5000, description: 'Potongan Rp 5.000' },
    'HEMAT10K': { type: 'nominal', value: 10000, description: 'Potongan Rp 10.000' },
  };

  useEffect(() => {
    fetchTransactions();
    
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
              discount: { type: 'percent', value: 0 },
              discountedPrice: product.harga_jual,
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

  const calculateDiscountedPrice = (price: number, discount: { type: 'percent' | 'nominal'; value: number }) => {
    if (discount.value === 0) return price;
    
    if (discount.type === 'percent') {
      return price - (price * discount.value / 100);
    } else {
      return Math.max(0, price - discount.value);
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
          setCart([...cart, {
            barcode_id: data.product.barcode_id,
            nama_produk: data.product.nama_produk,
            harga_jual: data.product.harga_jual,
            stok: data.product.stok,
            kategori: data.product.kategori,
            quantity: 1,
            discount: { type: 'percent', value: 0 },
            discountedPrice: data.product.harga_jual,
          }]);
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      handleAddToCart(barcode.trim().toUpperCase());
    }
  };

  const updateQuantity = (barcode_id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.barcode_id === barcode_id) {
            const newQty = item.quantity + delta;
            
            if (newQty > item.stok) {
              setError(`Stok ${item.nama_produk} tidak cukup (Max: ${item.stok})`);
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

  const openDiscountModal = (barcode_id: string | 'global') => {
    setDiscountTarget(barcode_id);
    
    if (barcode_id === 'global') {
      if (globalDiscount) {
        setDiscountType(globalDiscount.type);
        setDiscountValue(globalDiscount.value);
      } else {
        setDiscountType('percent');
        setDiscountValue(0);
      }
    } else {
      const item = cart.find(i => i.barcode_id === barcode_id);
      if (item) {
        setDiscountType(item.discount.type);
        setDiscountValue(item.discount.value);
      }
    }
    
    setShowDiscountModal(true);
  };

  const applyDiscount = () => {
    if (discountValue < 0) {
      setError('Nilai diskon tidak valid');
      return;
    }

    if (discountType === 'percent' && discountValue > 100) {
      setError('Diskon maksimal 100%');
      return;
    }

    if (discountTarget === 'global') {
      setGlobalDiscount({
        type: discountType,
        value: discountValue,
        code: promoCode || undefined,
      });
      setSuccess(`✓ Diskon ${discountType === 'percent' ? discountValue + '%' : formatCurrency(discountValue)} diterapkan!`);
    } else if (discountTarget) {
      setCart(cart.map(item => {
        if (item.barcode_id === discountTarget) {
          const discountedPrice = calculateDiscountedPrice(item.harga_jual, { type: discountType, value: discountValue });
          return {
            ...item,
            discount: { type: discountType, value: discountValue },
            discountedPrice,
          };
        }
        return item;
      }));
      setSuccess(`✓ Diskon untuk produk diterapkan!`);
    }

    setTimeout(() => setSuccess(''), 2000);
    closeDiscountModal();
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase();
    const promo = promoCodes[code];
    
    if (!promo) {
      setError('Kode promo tidak valid!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setDiscountType(promo.type);
    setDiscountValue(promo.value);
    setSuccess(`✓ Kode promo "${code}" diterapkan: ${promo.description}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const closeDiscountModal = () => {
    setShowDiscountModal(false);
    setDiscountTarget(null);
    setDiscountType('percent');
    setDiscountValue(0);
    setPromoCode('');
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalItemDiscount = 0;

    cart.forEach(item => {
      const itemTotal = item.harga_jual * item.quantity;
      const itemDiscountedTotal = item.discountedPrice * item.quantity;
      subtotal += itemTotal;
      totalItemDiscount += (itemTotal - itemDiscountedTotal);
    });

    let afterItemDiscount = subtotal - totalItemDiscount;
    let globalDiscountAmount = 0;

    if (globalDiscount && globalDiscount.value > 0) {
      if (globalDiscount.type === 'percent') {
        globalDiscountAmount = afterItemDiscount * globalDiscount.value / 100;
      } else {
        globalDiscountAmount = Math.min(globalDiscount.value, afterItemDiscount);
      }
    }

    const grandTotal = afterItemDiscount - globalDiscountAmount;

    return {
      subtotal,
      totalItemDiscount,
      afterItemDiscount,
      globalDiscountAmount,
      totalDiscount: totalItemDiscount + globalDiscountAmount,
      grandTotal: Math.max(0, grandTotal),
    };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const completedTransactions = [];

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

      const totals = calculateTotals();

      setSuccess('Transaksi berhasil! 🎉');
      
      const printSettings = localStorage.getItem('printSettings');
      const autoPrint = printSettings ? JSON.parse(printSettings).autoPrint : true;

      if (autoPrint && completedTransactions.length > 0) {
        setPrinting(true);
        
        const combinedReceipt = {
          transaksi_id: completedTransactions[0].transaksi_id,
          items: cart.map(item => ({
            nama_produk: item.nama_produk,
            jumlah: item.quantity,
            harga_satuan: item.harga_jual,
            discount: item.discount.value > 0 ? item.discount : undefined,
            discounted_price: item.discountedPrice,
            total_harga: item.discountedPrice * item.quantity,
          })),
          subtotal: totals.subtotal,
          total_item_discount: totals.totalItemDiscount,
          global_discount: globalDiscount,
          global_discount_amount: totals.globalDiscountAmount,
          total_discount: totals.totalDiscount,
          total_harga: totals.grandTotal,
          created_at: completedTransactions[0].created_at,
        };

        setTimeout(() => {
          printReceipt(combinedReceipt);
          setPrinting(false);
        }, 500);

        setLastTransaction(combinedReceipt);
      }

      setCart([]);
      setGlobalDiscount(null);
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

  const totals = calculateTotals();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Transaksi</h1>
            <p className="text-sm sm:text-base text-gray-600">Input manual atau scan produk untuk transaksi</p>
          </div>
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
              {/* Manual Barcode Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Keyboard size={16} />
                  Input Barcode Manual
                </label>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                      placeholder="Ketik barcode... (BRK001)"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !barcode.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus size={20} />
                    )}
                  </button>
                </form>
              </div>

              {/* Cart Items */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-semibold mb-2">Keranjang kosong</p>
                    <p className="text-sm">Input barcode di atas atau scan produk</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
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
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{formatCurrency(item.harga_jual)}</span>
                            {item.discount.value > 0 && (
                              <>
                                <span>→</span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(item.discountedPrice)}
                                </span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                                  -{item.discount.type === 'percent' ? `${item.discount.value}%` : formatCurrency(item.discount.value)}
                                </span>
                              </>
                            )}
                          </div>
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
                          <button
                            onClick={() => openDiscountModal(item.barcode_id)}
                            className="ml-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg flex items-center gap-1.5 text-sm font-semibold transition-colors"
                            title="Atur Diskon"
                          >
                            <Tag size={16} />
                            Diskon
                          </button>
                        </div>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(item.discountedPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout */}
              {cart.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {/* Summary */}
                  <div className="mb-4 space-y-2 bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal ({totalItems} item):</span>
                      <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    
                    {totals.totalItemDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Diskon Item:</span>
                        <span className="font-semibold">-{formatCurrency(totals.totalItemDiscount)}</span>
                      </div>
                    )}

                    {globalDiscount && globalDiscount.value > 0 && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>
                          Diskon Total {globalDiscount.code && `(${globalDiscount.code})`}:
                        </span>
                        <span className="font-semibold">-{formatCurrency(totals.globalDiscountAmount)}</span>
                      </div>
                    )}

                    {totals.totalDiscount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-green-600 pt-2 border-t border-gray-200">
                        <span>Total Hemat:</span>
                        <span>-{formatCurrency(totals.totalDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                      <span className="text-lg font-semibold text-gray-900">TOTAL BAYAR:</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>

                  {/* Discount Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => openDiscountModal('global')}
                      className="px-4 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Percent size={18} />
                      Diskon Total
                    </button>
                    <button
                      onClick={() => setGlobalDiscount(null)}
                      disabled={!globalDiscount}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      Hapus Diskon
                    </button>
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
            <div className="p-6 max-h-[700px] overflow-y-auto">
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

        {/* Discount Modal */}
        {showDiscountModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Tag size={24} />
                    {discountTarget === 'global' ? 'Diskon Total Transaksi' : 'Diskon Item'}
                  </h3>
                  <button
                    onClick={closeDiscountModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Promo Code (only for global discount) */}
                {discountTarget === 'global' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kode Promo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="DISKON10"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono uppercase"
                      />
                      <button
                        onClick={applyPromoCode}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
                      >
                        Terapkan
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Contoh: DISKON10, DISKON20, HEMAT5K, HEMAT10K
                    </p>
                  </div>
                )}

                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipe Diskon
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDiscountType('percent')}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        discountType === 'percent'
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Percent size={18} className="inline mr-2" />
                      Persen (%)
                    </button>
                    <button
                      onClick={() => setDiscountType('nominal')}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        discountType === 'nominal'
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <DollarSign size={18} className="inline mr-2" />
                      Nominal (Rp)
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nilai Diskon
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder={discountType === 'percent' ? '0-100' : '0'}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-2xl font-bold"
                    min="0"
                    max={discountType === 'percent' ? 100 : undefined}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {discountType === 'percent' 
                      ? 'Maksimal 100%' 
                      : 'Masukkan nominal dalam Rupiah'
                    }
                  </p>
                </div>

                {/* Quick Preset Buttons */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quick Preset
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {discountType === 'percent' ? (
                      <>
                        <button
                          onClick={() => setDiscountValue(5)}
                          className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors"
                        >
                          5%
                        </button>
                        <button
                          onClick={() => setDiscountValue(10)}
                          className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors"
                        >
                          10%
                        </button>
                        <button
                          onClick={() => setDiscountValue(15)}
                          className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors"
                        >
                          15%
                        </button>
                        <button
                          onClick={() => setDiscountValue(20)}
                          className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors"
                        >
                          20%
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setDiscountValue(1000)}
                          className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors text-xs"
                        >
                          1K
                        </button>
                        <button
                          onClick={() => setDiscountValue(5000)}
                          className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors text-xs"
                        >
                          5K
                        </button>
                        <button
                          onClick={() => setDiscountValue(10000)}
                          className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors text-xs"
                        >
                          10K
                        </button>
                        <button
                          onClick={() => setDiscountValue(20000)}
                          className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-semibold transition-colors text-xs"
                        >
                          20K
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {discountValue > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-900 font-semibold mb-1">Preview Diskon:</p>
                    <p className="text-2xl font-bold text-green-600">
                      {discountType === 'percent' 
                        ? `-${discountValue}%`
                        : `-${formatCurrency(discountValue)}`
                      }
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeDiscountModal}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={applyDiscount}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
