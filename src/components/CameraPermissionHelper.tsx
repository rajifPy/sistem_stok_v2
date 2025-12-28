// src/components/CameraPermissionHelper.tsx
'use client';

import { useState } from 'react';
import { Camera, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function CameraPermissionHelper() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'granted' | 'denied'>('idle');
  const [errorDetail, setErrorDetail] = useState('');

  const checkCameraPermission = async () => {
    setStatus('checking');
    setErrorDetail('');

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorDetail('Browser tidak mendukung akses kamera. Gunakan browser modern seperti Chrome atau Firefox.');
        setStatus('denied');
        return;
      }

      // Try to get camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Permission granted
      setStatus('granted');
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
      
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setStatus('denied');
      
      if (err.name === 'NotAllowedError') {
        setErrorDetail('Izin kamera ditolak. Klik ikon kamera di address bar browser untuk mengizinkan.');
      } else if (err.name === 'NotFoundError') {
        setErrorDetail('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.');
      } else if (err.name === 'NotReadableError') {
        setErrorDetail('Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut dan coba lagi.');
      } else if (err.name === 'SecurityError') {
        setErrorDetail('Akses kamera diblokir. Pastikan menggunakan HTTPS (https://).');
      } else {
        setErrorDetail(`Error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const getInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return [
        'Klik ikon kunci/kamera di address bar (kiri atas)',
        'Pilih "Site settings" atau "Permissions"',
        'Ubah Camera dari "Block" menjadi "Allow"',
        'Refresh halaman dan coba lagi'
      ];
    } else if (userAgent.includes('firefox')) {
      return [
        'Klik ikon kunci/kamera di address bar (kiri atas)',
        'Klik "Clear permissions and restart"',
        'Refresh halaman',
        'Klik "Mulai Scan" dan izinkan akses kamera'
      ];
    } else if (userAgent.includes('safari')) {
      return [
        'Buka Settings → Safari → Camera',
        'Pilih "Ask" atau "Allow"',
        'Refresh halaman dan coba lagi',
        'Atau coba browser Chrome/Firefox'
      ];
    } else {
      return [
        'Buka pengaturan browser',
        'Cari "Camera permissions"',
        'Izinkan akses kamera untuk situs ini',
        'Refresh halaman dan coba lagi'
      ];
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Camera className="text-blue-600" size={24} />
        Test Akses Kamera
      </h3>

      <button
        onClick={checkCameraPermission}
        disabled={status === 'checking'}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
      >
        {status === 'checking' ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Memeriksa...
          </>
        ) : (
          <>
            <Camera size={20} />
            Cek Izin Kamera
          </>
        )}
      </button>

      {status === 'granted' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-green-900">Kamera Berhasil Diakses!</p>
            <p className="text-sm text-green-700 mt-1">
              Kamera berfungsi dengan baik. Silakan klik "Mulai Scan" untuk memulai.
            </p>
          </div>
        </div>
      )}

      {status === 'denied' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Gagal Mengakses Kamera</p>
              <p className="text-sm text-red-700 mt-1">{errorDetail}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-yellow-600" size={20} />
              <p className="font-semibold text-yellow-900">Cara Mengizinkan Kamera:</p>
            </div>
            <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
              {getInstructions().map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900 font-semibold mb-2">ℹ️ Informasi:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Pastikan menggunakan HTTPS (https://)</li>
          <li>• Browser: Chrome, Firefox, atau Edge (recommended)</li>
          <li>• Tutup aplikasi lain yang menggunakan kamera</li>
          <li>• Coba refresh halaman jika masih error</li>
        </ul>
      </div>
    </div>
  );
}
