import React from 'react';
import { Navbar } from '../../components/public/Navbar';
import { Footer } from '../../components/public/Footer';
import { BookingFormSection } from '../../components/public/BookingFormSection';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { InstagramIcon } from '../../components/common/InstagramIcon';
import { useSite } from '../../context/SiteContext';

export const ContactPage: React.FC = () => {
  const { settings } = useSite();

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-[#E4E4E7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          
          <div className="max-w-3xl space-y-3 mb-12">
            <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
              Hubungi Kami
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl text-[#F8F6F0] font-light">
              Konsultasi & Reservasi Jadwal
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light font-sans">
              Tim AFFRAME siap mendengarkan konsep acara Anda, mendiskusikan ketersediaan tanggal, dan menyiapkan paket dokumentasi terbaik.
            </p>
          </div>

          {/* Quick contact cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <a
              href={settings.whatsapp_url || 'https://wa.me/6285755152579'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-[#131316] border border-[#24242A] rounded-sm hover:border-[#C5A880]/60 transition-colors group block"
            >
              <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880] mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#C5A880] transition-colors">
                WhatsApp Official
              </h3>
              <p className="text-xs text-zinc-400 mb-2">{settings.whatsapp_number || '085755152579'}</p>
              <span className="text-[11px] text-[#C5A880] uppercase tracking-wider font-medium">Chat Langsung →</span>
            </a>

            <a
              href={settings.instagram_url || 'https://www.instagram.com/_afframe/'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-[#131316] border border-[#24242A] rounded-sm hover:border-[#C5A880]/60 transition-colors group block"
            >
              <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880] mb-4">
                <InstagramIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-[#C5A880] transition-colors">
                Instagram Feed & Reels
              </h3>
              <p className="text-xs text-zinc-400 mb-2">{settings.instagram_handle || '@_afframe'}</p>
              <span className="text-[11px] text-[#C5A880] uppercase tracking-wider font-medium">Kunjungi Profil →</span>
            </a>

            <div className="p-6 bg-[#131316] border border-[#24242A] rounded-sm">
              <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880] mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Wilayah Operasional
              </h3>
              <p className="text-xs text-zinc-400 mb-2">{settings.address || 'Lamongan, Gresik, Surabaya'}</p>
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Jawa Timur, Indonesia</span>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <BookingFormSection />
      </main>

      <Footer />
    </div>
  );
};
