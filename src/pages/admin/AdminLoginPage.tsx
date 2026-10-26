import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@afframe.com');
  const [password, setPassword] = useState('Afframe2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090A] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        
        {/* Brand Logo & Heading */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Link to="/" className="inline-flex items-center justify-center group">
            <BrandLogo size="lg" />
          </Link>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-sans font-medium px-2.5 py-0.5 bg-[#141418] border border-[#26262D] rounded">
            Admin Control Panel CMS
          </span>
        </div>

        {/* Login Form Box */}
        <div className="bg-[#121215] border border-[#24242A] p-8 rounded-sm shadow-2xl space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Masuk ke Panel Administrasi</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Akses terproteksi khusus pengelola website AF Frame.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@afframe.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#18181C] border border-[#28282F] rounded-sm text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#18181C] border border-[#28282F] rounded-sm text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-sm bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick credential reminder for initial setup */}
          <div className="p-3 bg-[#18181D] border border-zinc-800 rounded-sm text-[11px] text-zinc-400 space-y-1">
            <span className="text-[#C5A880] font-semibold block">Akun Awal Administrator:</span>
            <div>Email: <code className="text-zinc-300">admin@afframe.com</code></div>
            <div>Password: <code className="text-zinc-300">Afframe2026!</code></div>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs text-zinc-500 hover:text-[#C5A880] transition-colors">
            ← Kembali ke Website Utama
          </Link>
        </div>

      </div>
    </div>
  );
};
