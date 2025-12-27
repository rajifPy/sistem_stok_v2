'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { formatCurrency, generateBarcodeId } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, Save, X, Download, Printer, QrCode, Package } from 'lucide-react';
import type { Product } from '@/lib/db';
import QRCodeLib from 'qrcode';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'generate'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [form, setForm] = useState({
    barcode_id: '',
    nama_produk: '',
    kategori: 'Makanan',
    stok: 0,
    harga_modal: 0,
    harga_jual: 0,
  });

  const qrCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'generate' && selectedProducts.length > 0) {
      generateQRCodes();
    }
  }, [activeTab, selectedProducts]);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const generateQRCodes = () => {
    selectedProducts.forEach(async (productId) => {
      const product = products.find(p => p.id === productId);
      if (product && qrCanvasRefs.current[productId]) {
        await generateQRCode(product.barcode_id, qrCanvasRefs.current[productId]!);
      }
    });
  };

  const generateQRCode = async (text: string, canvas: HTMLCanvasElement) => {
    try {
      // Generate QR Code with high quality settings
      await QRCodeLib.toCanvas(canvas, text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H', // High error correction
      });

      // Add text label below QR code
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const canvasSize = 300;
        const newHeight = canvasSize + 60;
        
        // Create temporary canvas to copy existing QR
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasSize;
        tempCanvas.height = canvasSize;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        // Resize main canvas
        canvas.height = newHeight;
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, newHeight);
        
        // Draw QR code back
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Draw text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvasSize / 2, canvasSize + 35);
      }
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

  const downloadQRCode = (productId: string) => {
    const canvas = qrCanvasRefs.current[productId];
    const product = products.find(p => p.id === productId);
    if (!canvas || !product) return;

    const link = document.createElement('a');
    link.download = `${product.barcode_id}_QR.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const printQRCodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = selectedProducts.map(productId => {
      const product = products.find(p => p.id === productId);
      const canvas = qrCanvasRefs.current[productId];
      if (!product || !canvas) return '';

      const dataUrl = canvas.toDataURL();
      return `
        <div style="page-break-after: always; text-align: center; padding: 20px;">
          <img src="${dataUrl}" style="width: 200px; height: 200px;" />
          <h3>${product.nama_produk}</h3>
          <p style="font-family: monospace; font-size: 14px;">${product.barcode_id}</p>
          <p style="font-size: 18px; font-weight: bold;">${formatCurrency(product.harga_jual)}</p>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Codes</title>
          <style>
            body { font-family: Arial, sans-serif; }
            @media print {
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/products?id=${editId}` : '/api/products';
    const method = editId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setActiveTab('list');
    setEditId(null);
    resetForm();
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setForm(product);
    setEditId(product.id);
    setActiveTab('add');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const resetForm = () => {
    setForm({
      barcode_id: generateBarcodeId(),
      nama_produk: '',
      kategori: 'Makanan',
      stok: 0,
      harga_modal: 0,
      harga_jual: 0,
    });
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filtered = products.filter(
    (p) =>
      p.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Produk</h1>
          <p className="text-gray-600">Tambah, edit, dan kelola produk kantin</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                resetForm();
                setActiveTab('add');
              }}
              className={`flex-1 sm:flex-none px-6 py-4 font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'add'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50'
              }`}
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Tambah</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 sm:flex-none px-6 py-4 font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'list'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50'
              }`}
            >
              <Package size={20} />
              <span className="hidden sm:inline">Daftar</span>
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 sm:flex-none px-6 py-4 font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'generate'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50'
              }`}
            >
              <QrCode size={20} />
              <span className="hidden sm:inline">QR Code</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editId ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Barcode ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.barcode_id}
                    onChange={(e) => setForm({ ...form, barcode_id: e.target.value.toUpperCase() })}
                    placeholder="BRK001"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                    <option value="Alat Tulis">Alat Tulis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama_produk}
                  onChange={(e) => setForm({ ...form, nama_produk: e.target.value })}
                  placeholder="Aqua 600ml"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stok Awal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.stok}
                    onChange={(e) => setForm({ ...form, stok: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Harga Modal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.harga_modal}
                    onChange={(e) => setForm({ ...form, harga_modal: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.harga_jual}
                    onChange={(e) => setForm({ ...form, harga_jual: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-semibold transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('list');
                    setEditId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Product List */}
        {activeTab === 'list' && (
          <div className="animate-fade-in space-y-4">
            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk atau barcode..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(filtered.map(p => p.id));
                            } else {
                              setSelectedProducts([]);
                            }
                          }}
                          checked={selectedProducts.length === filtered.length && filtered.length > 0}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Barcode</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stok</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="text-gray-400 mb-2">
                            <Package size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Tidak ada produk</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">{product.barcode_id}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.nama_produk}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full">
                              {product.kategori}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 text-xs font-bold rounded-full ${
                                product.stok === 0
                                  ? 'bg-red-50 text-red-700'
                                  : product.stok < 10
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-green-50 text-green-700'
                              }`}
                            >
                              {product.stok}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(product.harga_jual)}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-blue-900 font-semibold">
                  {selectedProducts.length} produk dipilih
                </span>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <QrCode size={18} />
                  Generate QR Code
                </button>
              </div>
            )}
          </div>
        )}

        {/* Generate QR Code */}
        {activeTab === 'generate' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Generate QR Code</h2>
                  <p className="text-gray-600 mt-1">{selectedProducts.length} produk dipilih</p>
                </div>
                {selectedProducts.length > 0 && (
                  <button
                    onClick={printQRCodes}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:shadow-lg text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={20} />
                    Print Semua
                  </button>
                )}
              </div>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Produk Dipilih</h3>
                  <p className="text-gray-600 mb-6">Pilih produk dari tab "Daftar" untuk generate QR code</p>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Pilih Produk
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedProducts.map(productId => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;

                    return (
                      <div key={productId} className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 inline-block">
                          <canvas
                            ref={el => {
                              qrCanvasRefs.current[productId] = el;
                            }}
                            className="mx-auto"
                          />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg text-gray-900">{product.nama_produk}</h3>
                          <div className="flex items-center justify-center gap-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                              {product.kategori}
                            </span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              product.stok === 0
                                ? 'bg-red-50 text-red-700'
                                : product.stok < 10
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-green-50 text-green-700'
                            }`}>
                              Stok: {product.stok}
                            </span>
                          </div>
                          <p className="text-sm font-mono text-gray-600 bg-gray-50 py-2 px-3 rounded-lg">
                            {product.barcode_id}
                          </p>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(product.harga_jual)}</p>
                        </div>
                        <button
                          onClick={() => downloadQRCode(productId)}
                          className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Download size={18} />
                          Download QR Code
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
