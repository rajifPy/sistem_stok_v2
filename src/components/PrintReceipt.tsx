// src/components/PrintReceipt.tsx - Enhanced for Multiple Products
'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils';

interface ReceiptItem {
  nama_produk: string;
  jumlah: number;
  harga_satuan: number;
  total_harga: number;
}

interface PrintReceiptTransaction {
  transaksi_id: string;
  items?: ReceiptItem[];
  // Single item fallback (for backward compatibility)
  nama_produk?: string;
  jumlah?: number;
  harga_satuan?: number;
  total_harga: number;
  created_at: string;
}

export function generateReceiptHTML(transaction: PrintReceiptTransaction): string {
  // Get print settings from localStorage
  const printSettings = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('printSettings') || '{}')
    : {};

  const {
    storeName = 'KANTIN SEKOLAH',
    storeAddress = 'Jl. Pendidikan No. 123',
    storePhone = '0812-3456-7890',
    storeWebsite = 'www.kantinsekolah.com',
    paperWidth = '58mm',
    showLogo = true,
    showKasir = true,
  } = printSettings;

  // Determine if this is a multi-item or single-item transaction
  const items: ReceiptItem[] = transaction.items || (transaction.nama_produk ? [{
    nama_produk: transaction.nama_produk,
    jumlah: transaction.jumlah!,
    harga_satuan: transaction.harga_satuan!,
    total_harga: transaction.total_harga,
  }] : []);

  const totalItems = items.reduce((sum, item) => sum + item.jumlah, 0);
  const currentUser = typeof window !== 'undefined' 
    ? sessionStorage.getItem('username') || 'Admin'
    : 'Admin';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Struk - ${transaction.transaksi_id}</title>
        <style>
          @page {
            size: ${paperWidth} auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: ${paperWidth === '58mm' ? '11px' : '12px'};
            width: ${paperWidth};
            padding: ${paperWidth === '58mm' ? '4mm' : '5mm'};
            line-height: 1.4;
            color: #000;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .logo {
            font-size: ${paperWidth === '58mm' ? '20px' : '24px'};
            margin-bottom: 4px;
          }
          .store-name {
            font-size: ${paperWidth === '58mm' ? '14px' : '16px'};
            font-weight: bold;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .store-info {
            font-size: ${paperWidth === '58mm' ? '9px' : '10px'};
            line-height: 1.3;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .divider-solid {
            border-top: 1px solid #000;
            margin: 6px 0;
          }
          .transaction-info {
            margin-bottom: 6px;
            font-size: ${paperWidth === '58mm' ? '10px' : '11px'};
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .info-label {
            font-weight: normal;
          }
          .info-value {
            font-weight: bold;
          }
          .items {
            margin: 8px 0;
          }
          .item {
            margin-bottom: 8px;
            page-break-inside: avoid;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .item-number {
            display: inline-block;
            background: #000;
            color: #fff;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
            font-weight: bold;
            margin-right: 4px;
          }
          .item-name {
            font-weight: bold;
            flex: 1;
          }
          .item-detail {
            display: flex;
            justify-content: space-between;
            font-size: ${paperWidth === '58mm' ? '10px' : '11px'};
            padding-left: ${paperWidth === '58mm' ? '20px' : '24px'};
          }
          .item-qty-price {
            color: #333;
          }
          .item-total {
            font-weight: bold;
          }
          .summary {
            margin: 8px 0;
            padding-top: 6px;
            border-top: 1px dashed #000;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: ${paperWidth === '58mm' ? '10px' : '11px'};
          }
          .total-section {
            border-top: 1px solid #000;
            padding-top: 6px;
            margin-top: 6px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }
          .total-label {
            font-weight: bold;
            font-size: ${paperWidth === '58mm' ? '13px' : '15px'};
          }
          .total-amount {
            font-weight: bold;
            font-size: ${paperWidth === '58mm' ? '13px' : '15px'};
          }
          .payment-info {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #000;
            font-size: ${paperWidth === '58mm' ? '10px' : '11px'};
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed #000;
            font-size: ${paperWidth === '58mm' ? '9px' : '10px'};
          }
          .thank-you {
            font-weight: bold;
            font-size: ${paperWidth === '58mm' ? '11px' : '12px'};
            margin-bottom: 4px;
          }
          .barcode {
            text-align: center;
            margin: 8px 0;
            font-family: 'Libre Barcode 128', monospace;
            font-size: ${paperWidth === '58mm' ? '28px' : '32px'};
            letter-spacing: 0;
          }
          @media print {
            body {
              width: ${paperWidth};
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          ${showLogo ? `<div class="logo">🏪</div>` : ''}
          <div class="store-name">${storeName}</div>
          <div class="store-info">${storeAddress}</div>
          <div class="store-info">Telp: ${storePhone}</div>
          ${storeWebsite ? `<div class="store-info">${storeWebsite}</div>` : ''}
        </div>

        <!-- Transaction Info -->
        <div class="transaction-info">
          <div class="info-row">
            <span class="info-label">No:</span>
            <span class="info-value">${transaction.transaksi_id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tanggal:</span>
            <span class="info-value">${formatDateTime(transaction.created_at)}</span>
          </div>
          ${showKasir ? `
          <div class="info-row">
            <span class="info-label">Kasir:</span>
            <span class="info-value">${currentUser}</span>
          </div>
          ` : ''}
        </div>

        <div class="divider"></div>

        <!-- Items List -->
        <div class="items">
          ${items.map((item, index) => `
            <div class="item">
              <div class="item-header">
                <div class="item-name">
                  <span class="item-number">#${index + 1}</span>
                  ${item.nama_produk}
                </div>
              </div>
              <div class="item-detail">
                <span class="item-qty-price">${item.jumlah} x ${formatCurrency(item.harga_satuan)}</span>
                <span class="item-total">${formatCurrency(item.total_harga)}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <!-- Summary -->
        <div class="summary">
          <div class="summary-row">
            <span>Jumlah Item:</span>
            <span><strong>${items.length} produk (${totalItems} pcs)</strong></span>
          </div>
        </div>

        <!-- Total -->
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">TOTAL BAYAR:</span>
            <span class="total-amount">${formatCurrency(transaction.total_harga)}</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Barcode (Transaction ID) -->
        <div class="barcode">${transaction.transaksi_id}</div>

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">TERIMA KASIH</div>
          <div>Selamat Berbelanja Kembali!</div>
          <div style="margin-top: 6px; font-size: ${paperWidth === '58mm' ? '8px' : '9px'};">
            Barang yang sudah dibeli<br>tidak dapat dikembalikan
          </div>
        </div>

        <div style="margin-top: 12px; text-align: center; font-size: ${paperWidth === '58mm' ? '8px' : '9px'};">
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        </div>
      </body>
    </html>
  `;
}

export function printReceipt(transaction: PrintReceiptTransaction): void {
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
    setTimeout(() => {
      printWindow.print();
    }, 250); // Small delay to ensure everything is rendered
    
    // Close window setelah print dialog ditutup
    printWindow.onafterprint = () => {
      setTimeout(() => {
        printWindow.close();
      }, 100);
    };
  };
}

interface PrintReceiptProps {
  transaction: PrintReceiptTransaction;
  autoPrint?: boolean;
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
      <span>🖨️</span>
      <span>Cetak Struk</span>
    </button>
  );
}
