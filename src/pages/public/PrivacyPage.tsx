import React from 'react';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export const PrivacyPage: React.FC = () => {
  const { settings } = useSite();

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
              Privasi & Keamanan Data
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light">
              Kebijakan Privasi AFFRAME
            </h1>
            <p className="text-sm text-zinc-400">
              Terakhir diperbarui: 2026. AFFRAME berkomitmen menjaga kerahasiaan dan privasi data setiap klien kami.
            </p>
          </div>

          <div className="space-y-8 text-zinc-300 text-sm leading-relaxed font-sans border-t border-zinc-800 pt-8">
            <section className="space-y-3">
              <h2 className="font-serif text-2xl text-[#F8F6F0]">1. Data yang Kami Kumpulkan</h2>
              <p>
                Ketika Anda mengisi formulir reservasi atau menghubungi kami, kami mengumpulkan data yang relevan seperti nama lengkap, nomor WhatsApp, alamat email, akun media sosial, nama perusahaan, tanggal acara, serta detail lokasi kegiatan.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl text-[#F8F6F0]">2. Penggunaan Data Klien</h2>
              <p>
                Informasi yang dikumpulkan digunakan secara eksklusif untuk kepentingan koordinasi jadwal tim, penawaran harga, pembuatan invoice, dan konfirmasi sesi dokumentasi resmi. Kami tidak pernah menjual atau membagikan kontak pribadi klien kepada pihak ketiga mana pun tanpa persetujuan Anda.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl text-[#F8F6F0]">3. Penggunaan Materi Portofolio</h2>
              <p>
                Sesuai dengan Syarat & Ketentuan AFFRAME, hasil dokumentasi foto dan video yang diproduksi dapat digunakan oleh AFFRAME sebagai materi portofolio, promosi website, serta publikasi di media sosial resmi kami (@_afframe). Klien yang memiliki permohonan privasi khusus atau NDA (Non-Disclosure Agreement) dapat mendiskusikannya sebelum pembayaran uang muka diselesaikan.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl text-[#F8F6F0]">4. Penyimpanan & Keamanan File</h2>
              <p>
                Semua file dokumentasi dikirimkan melalui tautan aman Google Drive dengan durasi penyimpanan sesuai ketentuan paket (umumnya aktif selama 1 bulan). Klien sangat disarankan untuk segera mengunduh dan mencadangkan file ke perangkat pribadi.
              </p>
            </section>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
