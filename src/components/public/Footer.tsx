import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  MapPin,
  Mail,
  ArrowUp,
  ShieldCheck,
  Clock,
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
import { InstagramIcon } from '../common/InstagramIcon';
import { useSite } from '../../context/SiteContext';
import { Service } from '../../types';
import { api } from '../../lib/api';

export const Footer: React.FC = () => {
  const { settings } = useSite();
  const location = useLocation();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    api.get<{ services: Service[] }>('/services')
      .then(res => {
        if (res.services && res.services.length > 0) {
          setServices(res.services);
        }
      })
      .catch(() => {});
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnchorClick = (e: React.MouseEvent, hashId: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el =
        document.getElementById(hashId) ||
        (hashId === 'booking' ? document.getElementById('booking-form') : null);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${hashId}`);
      }
    } else {
      e.preventDefault();
      navigate(`/#${hashId}`);
    }
  };

  const whatsappNumber = settings.whatsapp_number || '085755152579';
  const whatsappUrl =
    settings.whatsapp_url || `https://wa.me/62${whatsappNumber.replace(/^0/, '')}`;
  const instagramHandle = settings.instagram_handle || '@_afframe';
  const instagramUrl = settings.instagram_url || 'https://www.instagram.com/_afframe/';
  const emailAddress = settings.email || 'afframe.production@gmail.com';
  const studioAddress = settings.address || 'Lamongan, Gresik, Surabaya & Sekitarnya, Jawa Timur';

  return (
    <footer className="bg-[#070708] border-t border-[#1F1F24] text-zinc-400 text-sm relative">
      {/* Top Trust & Value Strip */}
      <div className="border-b border-[#1A1A20] bg-[#0A0A0D]/70 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-xs text-zinc-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Natural & Authentic</span>
                <span className="text-[11px] text-zinc-500">Momen murni tanpa kaku</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Google Drive Cloud</span>
                <span className="text-[11px] text-zinc-500">File asli & edit aman 30 hari</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Fast Turnaround</span>
                <span className="text-[11px] text-zinc-500">Same-day preview & tepat waktu</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">S&K Transparan</span>
                <span className="text-[11px] text-zinc-500">7 Pasal resmi katalog</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#1C1C22]">
          
          {/* Column 1 & 2: Brand Identity & Story */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              to="/"
              onClick={e => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  scrollToTop();
                }
              }}
              className="inline-flex items-center gap-3 group"
            >
              {settings.logo_light || settings.logo_primary ? (
                <img
                  src={settings.logo_light || settings.logo_primary}
                  alt={settings.brand_name || 'AF Frame'}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm border border-[#C5A880]/60 flex items-center justify-center bg-[#131316] group-hover:border-[#C5A880] transition-colors shadow-sm overflow-hidden">
                    {settings.logo_monogram ? (
                      <img src={settings.logo_monogram} alt="Monogram" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="font-serif text-xl font-bold tracking-wider text-[#F8F6F0]">
                        {settings.brand_name ? settings.brand_name.slice(0, 2).toUpperCase() : 'AF'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-2xl tracking-[0.2em] font-bold text-[#F8F6F0] leading-none group-hover:text-[#C5A880] transition-colors">
                      {settings.brand_name || 'AF FRAME'}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.28em] text-[#C5A880] font-sans mt-0.5 font-medium">
                      {settings.tagline || 'Photography & Cinematic Production'}
                    </span>
                  </div>
                </div>
              )}
            </Link>

            <p className="font-serif italic text-zinc-200 text-lg leading-snug">
              "{settings.tagline || 'Capturing Meaningful Moments.'}"
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              {settings.brand_description ||
                'AF Frame adalah layanan content creator dan dokumentasi profesional yang berfokus pada mengabadikan momen berharga dalam foto resolusi tinggi, video cinematic storytelling, dan konten siap tayang di media sosial.'}
            </p>

            {/* Social & Contact Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-zinc-800 bg-[#121215] text-zinc-300 hover:text-white hover:border-[#C5A880] hover:bg-[#1A1A20] transition-all text-xs"
                title="Instagram @_afframe"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{instagramHandle}</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-zinc-800 bg-[#121215] text-zinc-300 hover:text-white hover:border-[#C5A880] hover:bg-[#1A1A20] transition-all text-xs"
                title="WhatsApp AF Frame"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chat WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Column 3: Navigasi Cepat (Eksplorasi) */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-200 mb-4 font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
              <span>Eksplorasi</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/"
                  onClick={e => {
                    if (location.pathname === '/') {
                      e.preventDefault();
                      scrollToTop();
                    }
                  }}
                  className="text-zinc-400 hover:text-[#C5A880] transition-colors"
                >
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="text-zinc-400 hover:text-[#C5A880] transition-colors">
                  Portofolio Dokumentasi
                </Link>
              </li>
              <li>
                <a
                  href="/#packages"
                  onClick={e => handleAnchorClick(e, 'packages')}
                  className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                >
                  Pilihan Paket & Investasi
                </a>
              </li>
              <li>
                <a
                  href="/#about"
                  onClick={e => handleAnchorClick(e, 'about')}
                  className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                >
                  Tentang AF Frame
                </a>
              </li>
              <li>
                <a
                  href="/#why_us"
                  onClick={e => handleAnchorClick(e, 'why_us')}
                  className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                >
                  Kenapa AF Frame?
                </a>
              </li>
              <li>
                <a
                  href="/#service_areas"
                  onClick={e => handleAnchorClick(e, 'service_areas')}
                  className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                >
                  Jangkauan Wilayah
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  onClick={e => handleAnchorClick(e, 'faq')}
                  className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                >
                  Pertanyaan Umum (FAQ)
                </a>
              </li>
              <li>
                <a
                  href="/#booking"
                  onClick={e => handleAnchorClick(e, 'booking')}
                  className="text-[#C5A880] hover:underline font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Reservasi Jadwal Acara</span>
                  <span>→</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Layanan Resmi */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-200 mb-4 font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
              <span>Layanan Resmi</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {services.length > 0 ? (
                services.map(svc => (
                  <li key={svc.id}>
                    <a
                      href="/#packages"
                      onClick={e => handleAnchorClick(e, 'packages')}
                      className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                    >
                      {svc.name}
                    </a>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <a
                      href="/#packages"
                      onClick={e => handleAnchorClick(e, 'packages')}
                      className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                    >
                      Graduation Photography & Video
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#packages"
                      onClick={e => handleAnchorClick(e, 'packages')}
                      className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                    >
                      Wedding & Gathering Event
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#packages"
                      onClick={e => handleAnchorClick(e, 'packages')}
                      className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                    >
                      Creative Content & Short Film
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#packages"
                      onClick={e => handleAnchorClick(e, 'packages')}
                      className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                    >
                      Personal Branding Content
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#packages"
                      onClick={e => handleAnchorClick(e, 'packages')}
                      className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                    >
                      Corporate Event Profesional
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#packages"
                      onClick={e => handleAnchorClick(e, 'packages')}
                      className="text-zinc-400 hover:text-[#C5A880] transition-colors cursor-pointer"
                    >
                      Tour & Travel Documentation
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 5: Kontak & Legalitas (Strictly No CMS Link) */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-200 mb-4 font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
              <span>Kontak & Legalitas</span>
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <span className="leading-relaxed text-zinc-300">{studioAddress}</span>
              </li>

              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C5A880] shrink-0" />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-[#C5A880] transition-colors font-mono"
                >
                  {whatsappNumber}
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C5A880] shrink-0" />
                <a
                  href={`mailto:${emailAddress}`}
                  className="text-zinc-300 hover:text-[#C5A880] transition-colors"
                >
                  {emailAddress}
                </a>
              </li>

              <li className="flex items-center gap-2.5 text-[11px] text-zinc-500">
                <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>Konsultasi: Setiap Hari (08.00 - 21.00 WIB)</span>
              </li>

              <li className="pt-3 border-t border-[#1C1C22] flex flex-col gap-2">
                <Link to="/terms" className="text-zinc-400 hover:text-[#C5A880] transition-colors">
                  Syarat & Ketentuan (7 Pasal)
                </Link>
                <Link to="/privacy" className="text-zinc-400 hover:text-[#C5A880] transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Coverage, & Scroll to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p className="text-center sm:text-left">
            {settings.footer_copyright || '© 2026 AF Frame. All rights reserved. Capturing Meaningful Moments.'}
          </p>

          <div className="flex items-center gap-5">
            <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-sans">
              Lamongan • Gresik • Surabaya
            </span>

            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141418] border border-zinc-800 hover:border-[#C5A880] text-zinc-400 hover:text-[#C5A880] transition-all cursor-pointer text-[11px]"
              title="Kembali ke bagian atas halaman"
            >
              <span>Atas</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
