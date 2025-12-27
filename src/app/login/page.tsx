'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple auth (username: admin, password: admin123)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              🏪
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Kantin Sekolah</h1>
            <p className="text-white/80">Sistem POS Modern</p>
          </div>

          {/* Form */}
          <div className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/20 border border-red-400/50 text-white p-4 rounded-xl">
                  {error}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="text-white/90 text-sm font-medium block mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/60"
                    placeholder="Masukkan username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-white/90 text-sm font-medium block mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/60"
                    placeholder="Masukkan password"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/70 text-sm text-center mb-2 font-semibold">
                Demo Credentials
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                  <span className="text-white/70">Username:</span>
                  <code className="text-white font-mono font-semibold">admin</code>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg">
                  <span className="text-white/70">Password:</span>
                  <code className="text-white font-mono font-semibold">admin123</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          © 2024 Kantin Sekolah
        </p>
      </div>
    </div>
  );
}