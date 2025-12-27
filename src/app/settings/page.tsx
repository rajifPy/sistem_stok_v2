// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Settings as SettingsIcon, Printer, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoPrint: true,
    printerName: 'Default',
    showLogo: true,
    storeName: 'KANTIN SEKOLAH',
    storeAddress: 'Jl. Pendidikan No. 123',
    storePhone: '0812-3456-7890',
    storeWebsite: 'www.kantinsekolah.com',
    paperWidth: '58mm', // 58mm atau 80mm
    showKasir: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings dari localStorage
    const savedSettings = localStorage.getItem('printSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('printSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testPrint = () => {
    const testTransaction = {
      transaksi_id: 'TRX00000',
      nama_produk: 'Test Print',
      jumlah: 1,
      harga_satuan: 5000,
      total_harga: 5000,
      created_at: new Date().toISOString(),
    };

    // Import print function
    import('@/components/PrintReceipt').then(({ printReceipt }) => {
      printReceipt(testTransaction);
    });
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <SettingsIcon size={32} className="text-blue-600" />
            Pengaturan Printer
          </h1>
          <p className="text-gray-600">Konfigurasi printer untuk cetak struk otomatis</p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <Check className="text-green-600" size={24} />
            <span className="text-green-800 font-semibold">Pengaturan berhasil disimpan!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Auto Print Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Printer className="text-blue-600" size={24} />
              Pengaturan Cetak Otomatis
            </h2>

            <div className="space-y-6">
              {/* Auto Print Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h3 className="font-semibold text-gray-900">Cetak Otomatis</h3>
                  <p className="text-sm text-gray-600">Cetak struk secara otomatis setelah transaksi berhasil</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoPrint}
                    onChange={(e) => setSettings({ ...settings, autoPrint: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Paper Width */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lebar Kertas Printer
                </label>
                <select
                  value={settings.paperWidth}
                  onChange={(e) => setSettings({ ...settings, paperWidth: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="58mm">58mm (Thermal Kecil)</option>
                  <option value="80mm">80mm (Thermal Standar)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Store Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informasi Toko</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Toko
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  value={settings.storeAddress}
                  onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="text"
                  value={settings.storeWebsite}
                  onChange={(e) => setSettings({ ...settings, storeWebsite: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Display Options */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Tampilkan Logo</label>
                  <input
                    type="checkbox"
                    checked={settings.showLogo}
                    onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Tampilkan Nama Kasir</label>
                  <input
                    type="checkbox"
                    checked={settings.showKasir}
                    onChange={(e) => setSettings({ ...settings, showKasir: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Simpan Pengaturan
            </button>
            <button
              onClick={testPrint}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              Test Print
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Tips Penggunaan Printer
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Pastikan printer thermal sudah terhubung dan siap</li>
              <li>• Gunakan ukuran kertas yang sesuai (58mm atau 80mm)</li>
              <li>• Test print terlebih dahulu sebelum menggunakan fitur auto print</li>
              <li>• Struk akan otomatis tercetak setelah transaksi berhasil</li>
              <li>• Anda juga bisa cetak ulang dari halaman riwayat transaksi</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}