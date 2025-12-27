'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { formatCurrency, generateBarcodeId } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, Save, X, Download, Printer } from 'lucide-react';
import type { Product } from '@/lib/db';

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

  const qrCanvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

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
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product && qrCanvasRefs.current[productId]) {
        generateQRCode(product.barcode_id, qrCanvasRefs.current[productId]!);
      }
    });
  };

  const generateQRCode = (text: string, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // Simple QR-like pattern (for demo - in production use a real QR library)
    const qrSize = 25;
    const cellSize = size / qrSize;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Generate pattern based on text
    ctx.fillStyle = '#000000';
    for (let i = 0; i < qrSize; i++) {
      for (let j = 0; j < qrSize; j++) {
        const charCode = text.charCodeAt((i * qrSize + j) % text.length);
        if ((i + j + charCode) % 2 === 0) {
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }

    // Finder patterns (corners)
    const drawFinderPattern = (x: number, y: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(qrSize - 7, 0);
    drawFinderPattern(0, qrSize - 7);
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
      <div className="p-8">
        {/* Header with tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex items-center border-b">
            <button
              onClick={() => {
                resetForm();
                setActiveTab('add');
              }}
              className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'add'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
            >
              <Plus size={20} />
              Tambah
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'list'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
            >
              📄 Lihat Data
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'generate'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
            >
              🏷️ Generate Barcode
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editId ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Barcode ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.barcode_id}
                    onChange={(e) => setForm({ ...form, barcode_id: e.target.value.toUpperCase() })}
                    placeholder="BRK001"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stok Awal <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, stok: Math.max(0, form.stok - 1) })}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={form.stok}
                      onChange={(e) => setForm({ ...form, stok: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, stok: form.stok + 1 })}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                    >
                      +
                    </button>
                  </div>
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Harga Modal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, harga_modal: Math.max(0, form.harga_modal - 100) })}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={form.harga_modal}
                      onChange={(e) => setForm({ ...form, harga_modal: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, harga_modal: form.harga_modal + 100 })}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, harga_jual: Math.max(0, form.harga_jual - 100) })}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={form.harga_jual}
                      onChange={(e) => setForm({ ...form, harga_jual: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, harga_jual: form.harga_jual + 100 })}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Snack">Snack</option>
                  <option value="Alat Tulis">Alat Tulis</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('list');
                    setEditId(null);
                  }}
                  className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  💾 Simpan Produk
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Product List */}
        {activeTab === 'list' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk atau barcode..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="min-w-full">
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Barcode</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stok</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Harga</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">{product.barcode_id}</td>
                      <td className="px-6 py-4 text-sm font-medium">{product.nama_produk}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {product.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${
                            product.stok === 0
                              ? 'bg-red-100 text-red-800'
                              : product.stok < 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {product.stok}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(product.harga_jual)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedProducts.length > 0 && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <span className="text-blue-900 font-semibold">
                  {selectedProducts.length} produk dipilih
                </span>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Generate QR Code
                </button>
              </div>
            )}
          </div>
        )}

        {/* Generate Barcode */}
        {activeTab === 'generate' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Generate QR Code</h2>
                  <p className="text-gray-600 mt-1">{selectedProducts.length} produk dipilih</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={printQRCodes}
                    disabled={selectedProducts.length === 0}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Printer size={20} />
                    Print Semua
                  </button>
                </div>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏷️</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Produk Dipilih</h3>
                  <p className="text-gray-600 mb-4">Pilih produk dari tab "Lihat Data" untuk generate QR code</p>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Pilih Produk
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedProducts.map(productId => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;

                    return (
                      <div key={productId} className="bg-gray-50 rounded-xl p-6 text-center">
                        <canvas
                          ref={el => qrCanvasRefs.current[productId] = el}
                          className="mx-auto mb-4 border-4 border-white shadow-lg rounded-lg"
                        />
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{product.nama_produk}</h3>
                        <p className="text-sm font-mono text-gray-600 mb-2">{product.barcode_id}</p>
                        <p className="text-xl font-bold text-blue-600 mb-4">{formatCurrency(product.harga_jual)}</p>
                        <button
                          onClick={() => downloadQRCode(productId)}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={18} />
                          Download
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
