import React, { useState } from 'react';
import { UserCheck, Lock, Check, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminAccountManager: React.FC = () => {
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Kata sandi baru minimal harus 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccessMsg('Kata sandi berhasil diperbarui dengan aman!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah kata sandi. Periksa kata sandi saat ini.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
            Pengaturan Akun Administrator
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola profil administrator dan perbarui kata sandi akses CMS secara berkala demi keamanan.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded bg-red-950/60 border border-red-700 text-red-200 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Account Info Card */}
      <div className="p-5 bg-[#121215] border border-[#24242A] rounded-sm space-y-3 text-xs">
        <h2 className="font-serif text-base text-white font-medium border-b border-zinc-800 pb-2">
          Informasi Akun Aktif
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-zinc-500 block">Username</span>
            <span className="font-semibold text-white">{user?.username || 'admin'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Email Terdaftar</span>
            <span className="font-semibold text-white">{user?.email || 'admin@afframe.com'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Hak Akses</span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1C1C22] text-[#C5A880] border border-[#C5A880]/30 inline-block mt-0.5">
              {user?.role || 'superadmin'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handleSubmit} className="p-5 bg-[#121215] border border-[#24242A] rounded-sm space-y-4 text-xs">
        <h2 className="font-serif text-base text-white font-medium border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-[#C5A880]" />
          <span>Perbarui Kata Sandi</span>
        </h2>

        <div>
          <label className="text-zinc-400 block mb-1">Kata Sandi Saat Ini *</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        <div>
          <label className="text-zinc-400 block mb-1">Kata Sandi Baru (Min. 8 Karakter) *</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        <div>
          <label className="text-zinc-400 block mb-1">Konfirmasi Kata Sandi Baru *</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-[#18181D] border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#C5A880] text-[#0C0C0D] font-semibold rounded text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Ubah Kata Sandi'}
          </button>
        </div>
      </form>
    </div>
  );
};
