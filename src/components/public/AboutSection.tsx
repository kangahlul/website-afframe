import React from 'react';
import { ArrowUpRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { WebsiteSection } from '../../types';
import { normalizeMediaUrl } from '../../lib/mediaUtils';

interface AboutSectionProps {
  section?: WebsiteSection;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ section }) => {
  if (section && !section.is_visible) return null;

  const title = section?.title || 'Tentang Kami';
  const subtitle = section?.subtitle || 'Cerita di Balik Lensa AF Frame';
  const description =
    section?.description ||
    'AF Frame adalah layanan content creator dan dokumentasi moment yang berfokus pada mengabadikan momen spesial dalam bentuk foto, video cinematic, dan konten media sosial. Dari perayaan personal hingga kebutuhan dokumentasi perusahaan, setiap karya menjadi bagian dari cerita yang layak dikenang.';

  const rawBgUrl =
    section?.background_media_url ||
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop';
  const bgUrl = normalizeMediaUrl(rawBgUrl);

  return (
    <section id="about" className="pt-14 pb-20 bg-[#09090A] relative border-t border-[#24242A]/60 overflow-hidden scroll-mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-[#24242A] shadow-2xl">
              <img
                src={bgUrl}
                alt="Tentang AF Frame"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-sm bg-[#131316]/90 backdrop-blur-md border border-white/10">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
                  Filosofi Karya
                </span>
                <p className="font-serif italic text-sm text-[#F8F6F0] mt-1">
                  "Menghargai setiap detik berharga dan menjadikannya karya visual yang hidup selamanya."
                </p>
              </div>
            </div>

            {/* Subtle decorative border element */}
            <div className="absolute -top-3 -left-3 w-24 h-24 border-t-2 border-l-2 border-[#C5A880]/40 -z-10" />
            <div className="absolute -bottom-3 -right-3 w-24 h-24 border-b-2 border-r-2 border-[#C5A880]/40 -z-10" />
          </div>

          {/* Right Column: Storytelling Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
                {subtitle}
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light leading-tight">
                {title}
              </h2>
            </div>

            <p className="text-base sm:text-lg text-zinc-300 font-light leading-relaxed font-sans">
              {description}
            </p>

            {/* Specialization List according to catalog page 2 */}
            <div className="pt-4 border-t border-zinc-800/80">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-4 block">
                Fokus Dokumentasi & Produksi:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
                  <span>Graduation Photography & Videography</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
                  <span>Wedding, Gathering & Engagement</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
                  <span>Creative Content, Cinematic & Short Film</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
                  <span>Personal Branding Content</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
                  <span>Corporate Event Documentation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
                  <span>Tour & Travel Documentation</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <a
                href="#packages"
                className="inline-flex items-center gap-2 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] px-5 py-2.5 rounded-sm text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                <span>Lihat Pilihan Paket</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="#booking"
                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-5 py-2.5 rounded-sm text-xs font-medium tracking-wider uppercase transition-colors"
              >
                <span>Konsultasikan Acara Anda</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
