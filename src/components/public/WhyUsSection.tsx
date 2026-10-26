import React, { useState, useEffect } from 'react';
import { Sparkles, Share2, Video, Zap, ShieldCheck, Camera, Film, Heart } from 'lucide-react';
import { BenefitItem, WebsiteSection } from '../../types';
import { api } from '../../lib/api';

interface WhyUsSectionProps {
  section?: WebsiteSection;
}

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-6 h-6 text-[#C5A880]" />,
  Share2: <Share2 className="w-6 h-6 text-[#C5A880]" />,
  Video: <Video className="w-6 h-6 text-[#C5A880]" />,
  Zap: <Zap className="w-6 h-6 text-[#C5A880]" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-[#C5A880]" />,
  Camera: <Camera className="w-6 h-6 text-[#C5A880]" />,
  Film: <Film className="w-6 h-6 text-[#C5A880]" />,
  Heart: <Heart className="w-6 h-6 text-[#C5A880]" />,
};

export const WhyUsSection: React.FC<WhyUsSectionProps> = ({ section }) => {
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBenefits = React.useCallback(async () => {
    try {
      const res = await api.get<{ benefits: BenefitItem[] }>('/content/benefits');
      setBenefits(res.benefits || []);
    } catch (err) {
      console.error('Failed to load benefits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBenefits();
  }, [loadBenefits]);

  if (section && !section.is_visible) return null;

  return (
    <section id="why_us" className="pt-14 pb-20 bg-[#0C0C0D] relative border-t border-[#24242A]/60 scroll-mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-sans font-semibold">
            {section?.subtitle || 'Standar Kualitas'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#F8F6F0] font-light">
            {section?.title || 'Kenapa Kami?'}
          </h2>
          <p className="text-sm text-zinc-400">
            {section?.description ||
              '5 Keunggulan khas yang membuat dokumentasi momen bersama AF Frame begitu berkesan, estetik, dan bernilai tinggi.'}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((benefit, idx) => (
            <div
              key={benefit.id}
              className={`p-8 bg-[#131316] border border-[#24242A] rounded-sm hover:border-[#C5A880]/50 transition-all duration-300 relative group ${
                idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-sm bg-[#1A1A1E] border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-[#C5A880]/60 transition-colors">
                {iconMap[benefit.icon_name] || <Sparkles className="w-6 h-6 text-[#C5A880]" />}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="font-serif text-sm text-[#C5A880] font-semibold">0{idx + 1}.</span>
                <h3 className="font-serif text-2xl text-[#F8F6F0] group-hover:text-[#C5A880] transition-colors">
                  {benefit.title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
