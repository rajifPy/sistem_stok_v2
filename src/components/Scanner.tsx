'use client';

import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X } from 'lucide-react';

interface ScannerProps {
  onScan: (barcode: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    scannerRef.current = new BrowserMultiFormatReader();
    return () => stopScan();
  }, []);

  const startScan = async () => {
    if (!scannerRef.current || !videoRef.current) return;

    try {
      setScanning(true);
      await scannerRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, err) => {
          if (result) {
            onScan(result.getText());
            stopScan();
          }
        }
      );
    } catch (error) {
      console.error('Scan error:', error);
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.reset();
    }
    setScanning(false);
  };

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