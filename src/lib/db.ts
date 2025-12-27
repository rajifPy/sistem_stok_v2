// In-memory database (tidak perlu Supabase)
export interface Product {
  id: string;
  barcode_id: string;
  nama_produk: string;
  kategori: string;
  stok: number;
  harga_modal: number;
  harga_jual: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  transaksi_id: string;
  barcode_id: string;
  nama_produk: string;
  jumlah: number;
  harga_satuan: number;
  total_harga: number;
  keuntungan: number;
  created_at: string;
}

// Fake data storage
let products: Product[] = [
  {
    id: '1',
    barcode_id: 'BRK001',
    nama_produk: 'Aqua 600ml',
    kategori: 'Minuman',
    stok: 100,
    harga_modal: 2500,
    harga_jual: 3000,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    barcode_id: 'BRK002',
    nama_produk: 'Indomie Goreng',
    kategori: 'Makanan',
    stok: 75,
    harga_modal: 2800,
    harga_jual: 3500,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    barcode_id: 'BRK003',
    nama_produk: 'Pulpen',
    kategori: 'Alat Tulis',
    stok: 50,
    harga_modal: 1500,
    harga_jual: 2000,
    created_at: new Date().toISOString(),
  },
];

let transactions: Transaction[] = [];

// API functions
export const supabase = {
  from: (table: string) => ({
    select: (fields = '*') => ({
      eq: (field: string, value: any) => ({
        single: async () => {
          if (table === 'products') {
            const product = products.find((p: any) => p[field] === value);
            return { data: product, error: product ? null : { message: 'Not found' } };
          }
          return { data: null, error: null };
        },
      }),
      order: (field: string, options?: any) => ({
        limit: (num: number) => ({
          single: async () => {
            if (table === 'transactions') {
              const sorted = [...transactions].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              return { data: sorted[0] || null, error: null };
            }
            return { data: null, error: null };
          },
        }),
        then: async (resolve: any) => {
          if (table === 'products') {
            resolve({ data: products, error: null });
          } else if (table === 'transactions') {
            const sorted = [...transactions].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            resolve({ data: sorted, error: null });
          }
        },
      }),
      then: async (resolve: any) => {
        if (table === 'products') {
          resolve({ data: products, error: null });
        } else if (table === 'transactions') {
          resolve({ data: transactions, error: null });
        }
      },
    }),
    insert: (data: any[]) => ({
      select: () => ({
        single: async () => {
          if (table === 'products') {
            const newProduct = {
              ...data[0],
              id: String(Date.now()),
              created_at: new Date().toISOString(),
            };
            products.push(newProduct);
            return { data: newProduct, error: null };
          } else if (table === 'transactions') {
            const newTrans = {
              ...data[0],
              id: String(Date.now()),
              created_at: new Date().toISOString(),
            };
            transactions.push(newTrans);
            return { data: newTrans, error: null };
          }
          return { data: null, error: null };
        },
      }),
    }),
    update: (data: any) => ({
      eq: (field: string, value: any) => ({
        select: () => ({
          single: async () => {
            if (table === 'products') {
              const index = products.findIndex((p: any) => p[field] === value);
              if (index !== -1) {
                products[index] = { ...products[index], ...data };
                return { data: products[index], error: null };
              }
            }
            return { data: null, error: { message: 'Not found' } };
          },
        }),
        then: async (resolve: any) => {
          if (table === 'products') {
            const index = products.findIndex((p: any) => p[field] === value);
            if (index !== -1) {
              products[index] = { ...products[index], ...data };
              resolve({ error: null });
            }
          }
        },
      }),
    }),
    delete: () => ({
      eq: (field: string, value: any) => ({
        then: async (resolve: any) => {
          if (table === 'products') {
            products = products.filter((p: any) => p[field] !== value);
            resolve({ error: null });
          } else if (table === 'transactions') {
            transactions = transactions.filter((t: any) => t[field] !== value);
            resolve({ error: null });
          }
        },
      }),
    }),
  }),
};