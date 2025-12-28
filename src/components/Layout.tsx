// src/components/Layout.tsx - Enhanced Responsive Layout
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, Camera, FileText, LogOut, Menu, X, BarChart3, Settings, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Produk', icon: Package },
  { href: '/scan', label: 'Scan', icon: Camera },
  { href: '/transactions', label: 'Transaksi', icon: FileText },
  { href: '/reports', label: 'Laporan', icon: BarChart3 },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('Admin');

  useEffect(() => {
    const auth = sessionStorage.getItem('auth');
    const user = sessionStorage.getItem('username');
    if (auth !== 'true') router.push('/login');
    if (user) setUsername(user);
  }, [router]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = () => {
    if (confirm('Yakin ingin logout?')) {
      sessionStorage.clear();
      router.push('/login');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Button - Fixed position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 active:scale-95"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} className="text-gray-700" /> : <Menu size={24} className="text-gray-700" />}
      </button>

      {/* Page Title for Mobile - Fixed position */}
      <div className="lg:hidden fixed top-4 left-20 right-4 z-40 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3">
        <h1 className="text-sm font-bold text-gray-900 truncate">
          {navItems.find(item => item.href === pathname)?.label || 'Kantin POS'}
        </h1>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 sm:w-80 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo - Fixed height */}
        <div className="h-20 sm:h-24 px-6 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
            🏪
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Kantin POS</h2>
            <p className="text-xs text-gray-500">Sistem Modern</p>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 px-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                    transition-all duration-200 relative overflow-hidden
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r" />
                    )}
                    <div className={`
                      p-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }
                    `}>
                      <Icon size={20} className="flex-shrink-0" />
                    </div>
                    <span className={`font-semibold text-sm sm:text-base ${isActive ? 'text-blue-600' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                  {isActive && (
                    <ChevronRight size={18} className="text-blue-600 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Stats - Optional, shows on larger screens */}
          <div className="mt-6 hidden sm:block">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-900 mb-2">💡 Tips</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Gunakan keyboard shortcut untuk navigasi lebih cepat!
              </p>
            </div>
          </div>
        </nav>

        {/* User Section - Fixed at bottom */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md text-lg">
              {username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Add padding top on mobile to account for fixed header */}
        <div className="min-h-screen pt-20 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
