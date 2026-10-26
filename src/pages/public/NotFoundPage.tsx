import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-32 px-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 rounded-full border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] mx-auto bg-[#131316]">
            <span className="font-serif text-2xl font-semibold">404</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl text-[#F8F6F0]">Halaman Tidak Ditemukan</h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Halaman yang Anda tuju mungkin telah dipindahkan, diubah, atau tidak lagi tersedia.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#C5A880] text-[#0C0C0D] text-xs uppercase tracking-wider font-semibold hover:bg-[#B39366] transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
