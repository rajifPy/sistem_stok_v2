'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));

    if (form.username === 'admin' && form.password === 'admin123') {
      sessionStorage.setItem('auth', 'true');
      sessionStorage.setItem('username', form.username);
      router.push('/dashboard');
    } else {
      setError('Username atau password salah');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center border-b border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-4xl">
              🏪
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Kantin POS</h1>
            <p className="text-gray-600">Sistem Point of Sale Modern</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Username */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Masukkan username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-gray-700 text-sm font-semibold block mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Masukkan password"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Login
                  </>
                )}
              </button>
            </form>

            {/* Demo Info */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-gray-700 text-sm font-semibold mb-3 text-center">
                Demo Credentials
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg">
                  <span className="text-gray-600">Username:</span>
                  <code className="text-blue-600 font-mono font-semibold">admin</code>
                </div>
                <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg">
                  <span className="text-gray-600">Password:</span>
                  <code className="text-blue-600 font-mono font-semibold">admin123</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          © 2024 Kantin POS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
