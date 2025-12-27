// src/components/PrintReceipt.tsx
'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer } from 'lucide-react';

interface PrintReceiptProps {
  transaction: {
    transaksi_id: string;
    nama_produk: string;
    jumlah: number;
    harga_satuan: number;
    total_harga: number;
    created_at: string;
  };
  autoPrint?: boolean;
}

export function generateReceiptHTML(transaction: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Struk - ${transaction.transaksi_id}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 58mm;
            padding: 5mm;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .logo {
            font-size: 24px;
            margin-bottom: 4px;
          }
          .store-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .store-info {
            font-size: 10px;
          }
          .transaction-info {
            margin-bottom: 8px;
            font-size: 11px;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 8px 0;
            margin-bottom: 8px;
          }
          .item {
            margin-bottom: 6px;
          }
          .item-name {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .item-detail {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .total {
            border-top: 1px solid #000;
            padding-top: 8px;
            margin-top: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .total-label {
            font-weight: bold;
            font-size: 14px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px dashed #000;
            font-size: 10px;
          }
          .thank-you {
            font-weight: bold;
            margin-bottom: 4px;
          }
          @media print {
            body {
              width: 58mm;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="logo">🏪</div>
          <div class="store-name">KANTIN SEKOLAH</div>
          <div class="store-info">Jl. Pendidikan No. 123</div>
          <div class="store-info">Telp: 0812-3456-7890</div>
        </div>

        <!-- Transaction Info -->
        <div class="transaction-info">
          <div>No: ${transaction.transaksi_id}</div>
          <div>Tanggal: ${formatDateTime(transaction.created_at)}</div>
          <div>Kasir: Admin</div>
        </div>

        <!-- Items -->
        <div class="items">
          <div class="item">
            <div class="item-name">${transaction.nama_produk}</div>
            <div class="item-detail">
              <span>${transaction.jumlah} x ${formatCurrency(transaction.harga_satuan)}</span>
              <span>${formatCurrency(transaction.total_harga)}</span>
            </div>
          </div>
        </div>

        <!-- Total -->
        <div class="total">
          <div class="total-row">
            <span class="total-label">TOTAL:</span>
            <span class="total-amount">${formatCurrency(transaction.total_harga)}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">TERIMA KASIH</div>
          <div>Selamat Berbelanja Kembali!</div>
          <div style="margin-top: 8px;">www.kantinsekolah.com</div>
        </div>
      </body>
    </html>
  `;
}

export function printReceipt(transaction: any) {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) {
    alert('Popup diblokir! Izinkan popup untuk mencetak struk.');
    return;
  }

  const html = generateReceiptHTML(transaction);
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Auto print setelah load
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Close window setelah print dialog ditutup
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
}

export default function PrintReceipt({ transaction, autoPrint = false }: PrintReceiptProps) {
  const handlePrint = () => {
    printReceipt(transaction);
  };

  // Auto print jika diaktifkan
  if (autoPrint && typeof window !== 'undefined') {
    setTimeout(() => {
      printReceipt(transaction);
    }, 500);
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
      title="Cetak Struk"
    >
      <Printer size={18} />
      <span>Cetak Struk</span>
    </button>
  );
}
