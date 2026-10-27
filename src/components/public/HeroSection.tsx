import React from 'react';
import { ArrowDown, ArrowUpRight, Play, Sparkles } from 'lucide-react';
import { WebsiteSection } from '../../types';
import { normalizeMediaUrl, getVideoEmbedUrl, getDirectVideoUrl } from '../../lib/mediaUtils';

interface HeroSectionProps {
  section?: WebsiteSection;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ section }) => {
  if (section && !section.is_visible) return null;

  const title = section?.title || 'Capturing Meaningful Moments.';
  const subtitle = section?.subtitle || 'AFFRAME Creative Production';
  const description =
    section?.description ||
    'Photography, film, and visual storytelling for moments that matter. Menghadirkan rekaman visual berestetika tinggi yang siap tayang di media sosial dan abadi sepanjang masa.';
  const ctaPrimaryText = section?.cta_primary_text || 'Lihat Paket & Harga';
  const ctaPrimaryUrl = section?.cta_primary_url || '#packages';
  const ctaSecondaryText = section?.cta_secondary_text || 'Konsultasi Project';
  const ctaSecondaryUrl = section?.cta_secondary_url || '#booking';
  const bgUrl =
    section?.background_media_url ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop';
  const bgType = section?.background_type || 'image';
  const overlayOpacity = (section?.overlay_opacity ?? 65) / 100;
  const alignment = section?.text_alignment || 'center';

  const alignClass =
    alignment === 'center'
      ? 'text-center items-center'
      : alignment === 'right'
      ? 'text-right items-end'
      : 'text-left items-start';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background Media */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {bgType === 'video' && bgUrl ? (
          getVideoEmbedUrl(bgUrl) ? (
            <div className="w-full h-full pointer-events-none scale-125">
              <iframe
                src={`${getVideoEmbedUrl(bgUrl)}&controls=0&mute=1&loop=1&playlist=${getVideoEmbedUrl(bgUrl)?.split('/embed/')[1]?.split('?')[0] || ''}`}
                title="Hero Background Video"
                className="w-full h-full object-cover"
                allow="autoplay; encrypted-media"
              />
            </div>
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop"
            >
              <source src={getDirectVideoUrl(bgUrl)} type="video/mp4" />
              <source src={getDirectVideoUrl(bgUrl)} />
            </video>
          )
        ) : (
          <img
            src={normalizeMediaUrl(bgUrl)}
            alt="AFFRAME Background"
            className="w-full h-full object-cover transform scale-105 motion-safe:animate-pulse-slow"
            style={{ objectPosition: section?.focal_point || 'center' }}
            loading="eager"
          />
        )}

        {/* Dynamic Dark Gradient Overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0D] via-transparent to-[#0C0C0D]/70" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className={`flex flex-col ${alignClass} space-y-6 max-w-3xl ${alignment === 'center' ? 'mx-auto' : ''}`}>
          
          {/* Eyebrow badge */}
          {subtitle && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C5A880]/30 bg-[#131316]/70 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#E2D2BC]">
                {subtitle}
              </span>
            </div>
          )}

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-[#F8F6F0] leading-[1.1] text-balance">
            {title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-300 font-light leading-relaxed max-w-2xl font-sans text-balance">
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-wrap gap-4 items-center justify-center">
            {ctaPrimaryText && (
              <a
                href={ctaPrimaryUrl}
                className="inline-flex items-center gap-2.5 bg-[#C5A880] hover:bg-[#B39366] text-[#0C0C0D] px-6 py-3.5 rounded-sm text-xs font-semibold tracking-widest uppercase transition-all duration-200 shadow-xl hover:shadow-[#C5A880]/25 transform hover:-translate-y-0.5"
              >
                <span>{ctaPrimaryText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}

            {ctaSecondaryText && (
              <a
                href={ctaSecondaryUrl}
                className="inline-flex items-center gap-2.5 border border-zinc-400/40 hover:border-[#C5A880] text-[#F8F6F0] hover:text-[#C5A880] bg-[#131316]/50 hover:bg-[#131316]/80 backdrop-blur-md px-6 py-3.5 rounded-sm text-xs font-medium tracking-widest uppercase transition-all duration-200"
              >
                <span>{ctaSecondaryText}</span>
              </a>
            )}
          </div>

          {/* Highlights pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
              Surabaya • Gresik • Lamongan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
              Cinematic Storytelling
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
              Social Media Ready
            </span>
          </div>

        </div>
      </div>

      {/* Subtle Scroll Down Prompt */}
      <a
        href="#selected_works"
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center text-zinc-400 hover:text-[#C5A880] transition-colors group"
        aria-label="Scroll to selected works"
      >
        <span className="text-[10px] tracking-[0.25em] uppercase font-light mb-1.5 group-hover:tracking-[0.3em] transition-all">
          Scroll
        </span>
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </a>
    </section>
  );
};
